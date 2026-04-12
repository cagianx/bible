---
sidebar_position: 1
description: Test di integrazione in .NET con NUnit, database PostgreSQL usa e getta, clone da template e FluentAssertions.
---

# Setup — database usa e getta

## Perché test di integrazione

I test unitari verificano la logica isolata; i test di integrazione verificano che la logica funzioni con il database reale. Sono quelli che trovano i problemi che contano: query N+1, constraint violati, migration incomplete, comportamenti LINQ non traducibili in SQL.

Il database usato nei test è **PostgreSQL**, lo stesso motore di produzione. SQLite in-memory è più veloce ma non si comporta come PostgreSQL su tipi, constraint, case sensitivity e molte funzioni SQL.

## Pattern: clone da template, drop dopo ogni test

Ogni test riceve un database dedicato clonato istantaneamente da un template, e lo distrugge al termine. Il template viene creato una volta sola per sessione di test (o riutilizzato se già esiste) applicando le migration su un DB vuoto.

```
[OneTimeSetUp]  → crea il template se non esiste (migration applicate una volta)
[SetUp]         → clona il template → DB del test, crea il DbContext
test A          → chiama la logica, verifica il risultato
[TearDown]      → droppa il DB del test
test B          → clona il template → nuovo DB, ...
[TearDown]      → droppa il DB del test
```

Il clone di un database in PostgreSQL (`CREATE DATABASE ... TEMPLATE ...`) è un'operazione istantanea: copia i metadati del template senza copiare fisicamente i file. I dati del template (un DB vuoto con le migration applicate) vengono ereditati dal clone, che poi è completamente indipendente.

### Invalidazione della cache tramite nome migration

Il template viene nominato con il nome dell'ultima migration applicata: `testdb_template_{NomeUltimaMigration}`. Se le migration cambiano, il nome cambia, il vecchio template non viene trovato e ne viene creato uno nuovo. I vecchi template si possono rimuovere manualmente o con uno script di cleanup.

## Classe base

```csharp
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using Npgsql;

[TestFixture]
public abstract class IntegrationTestBase
{
    private static string? _templateDbName;
    private string _testDbName = null!;

    protected AppDbContext Db { get; private set; } = null!;

    // Sovrascrivere per aggiungere seed data prima di ogni test
    protected virtual Task SeedAsync(AppDbContext db) => Task.CompletedTask;

    private static string MasterCs =>
        Environment.GetEnvironmentVariable("TEST_DB_CONNECTION")
        ?? "Host=localhost;Username=postgres;Password=secret";

    [OneTimeSetUp]
    public async Task PrepareTemplate()
    {
        if (_templateDbName is not null)
            return; // già preparato da un'altra fixture nella stessa sessione

        // Ricava il nome dell'ultima migration dall'assembly (non richiede connessione)
        var dummyOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql($"{MasterCs};Database=postgres")
            .Options;
        await using var dummyCtx = new AppDbContext(dummyOptions);
        var lastMigration = dummyCtx.Database.GetMigrations().Last();
        _templateDbName = $"testdb_template_{lastMigration.ToLowerInvariant()}";

        // Controlla se il template esiste già (cache valida)
        await using var conn = new NpgsqlConnection($"{MasterCs};Database=postgres");
        await conn.OpenAsync();

        await using var checkCmd = conn.CreateCommand();
        checkCmd.CommandText = "SELECT 1 FROM pg_database WHERE datname = $1";
        checkCmd.Parameters.AddWithValue(_templateDbName);
        var exists = await checkCmd.ExecuteScalarAsync() is not null;
        if (exists)
            return;

        // Crea il template e applica le migration
        await using var createCmd = conn.CreateCommand();
        createCmd.CommandText = $"CREATE DATABASE \"{_templateDbName}\"";
        await createCmd.ExecuteNonQueryAsync();

        var templateOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql($"{MasterCs};Database={_templateDbName}")
            .Options;
        await using var templateCtx = new AppDbContext(templateOptions);
        await templateCtx.Database.MigrateAsync();

        // Svuota il connection pool: CREATE DATABASE ... TEMPLATE richiede
        // che il template non abbia connessioni attive
        await NpgsqlConnection.ClearAllPoolsAsync();
    }

    [SetUp]
    public async Task CreateTestDatabase()
    {
        _testDbName = $"testdb_{Guid.NewGuid():N}";

        await using var conn = new NpgsqlConnection($"{MasterCs};Database=postgres");
        await conn.OpenAsync();

        // Clone istantaneo del template
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"CREATE DATABASE \"{_testDbName}\" TEMPLATE \"{_templateDbName}\"";
        await cmd.ExecuteNonQueryAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql($"{MasterCs};Database={_testDbName}")
            .Options;
        Db = new AppDbContext(options);

        await SeedAsync(Db);
    }

    [TearDown]
    public async Task DropTestDatabase()
    {
        await Db.DisposeAsync();
        await NpgsqlConnection.ClearAllPoolsAsync();

        await using var conn = new NpgsqlConnection($"{MasterCs};Database=postgres");
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"DROP DATABASE IF EXISTS \"{_testDbName}\" WITH (FORCE)";
        await cmd.ExecuteNonQueryAsync();
    }
}
```

`DROP DATABASE ... WITH (FORCE)` (PostgreSQL 13+) termina le connessioni attive prima di droppare, rendendo superflua la query `pg_terminate_backend`.

## Esempio di test

```csharp
[TestFixture]
public class CreaOrdineTests : IntegrationTestBase
{
    protected override async Task SeedAsync(AppDbContext db)
    {
        db.Clienti.Add(new Cliente { Id = 1, Nome = "Acme Srl", Email = "acme@example.com" });
        await db.SaveChangesAsync();
    }

    [Test]
    public async Task Esegui_con_dati_validi_crea_ordine()
    {
        // Arrange
        var useCase = new CreaOrdine(Db);
        var command = new CreaOrdineCommand(ClienteId: 1, Importo: 250.00m);

        // Act
        var result = await useCase.ExecuteAsync(command);

        // Assert
        result.IsSuccess.Should().BeTrue();

        var ordine = await Db.Ordini.SingleAsync();
        ordine.ClienteId.Should().Be(1);
        ordine.Importo.Should().Be(250.00m);
        ordine.Stato.Should().Be(StatoOrdine.InAttesa);
    }

    [Test]
    public async Task Esegui_con_cliente_inesistente_fallisce()
    {
        var useCase = new CreaOrdine(Db);
        var command = new CreaOrdineCommand(ClienteId: 999, Importo: 100m);

        var result = await useCase.ExecuteAsync(command);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Cliente non trovato.");
    }
}
```

I test chiamano direttamente il use case con il `DbContext` reale. Nessun mock. L'obiettivo è verificare che la logica funzioni con PostgreSQL, non che "il metodo è stato chiamato".

## FluentAssertions

FluentAssertions rende le asserzioni leggibili e i messaggi di errore descrittivi:

```csharp
// Valori semplici
result.IsSuccess.Should().BeTrue();
ordine.Stato.Should().Be(StatoOrdine.Confermato);
ordine.DataCreazione.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

// Collezioni
ordine.Righe.Should().HaveCount(3);
ordine.Righe.Should().AllSatisfy(r => r.Importo.Should().BeGreaterThan(0));
ordine.Righe.Select(r => r.ProdottoId).Should().BeEquivalentTo([1, 2, 3]);

// Eccezioni
var act = async () => await useCase.ExecuteAsync(commandNonValido);
await act.Should().ThrowAsync<InvalidOperationException>()
    .WithMessage("*importo*");

// Oggetti (confronto per valore)
risposta.Should().BeEquivalentTo(atteso, options => options.Excluding(x => x.Id));
```

## NUnit e parallelismo

I test all'interno della stessa fixture girano in sequenza — è il default di NUnit ed è quello che si vuole, perché condividerebbero `SeedAsync`.

Fixture diverse possono girare in parallelo: ciascuna ha il proprio database dedicato e clona lo stesso template in modo indipendente.

```csharp
// Per abilitare il parallelismo tra fixture
[assembly: Parallelizable(ParallelScope.Fixtures)]
```
