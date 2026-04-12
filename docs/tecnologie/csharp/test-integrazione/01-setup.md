---
sidebar_position: 1
description: Test di integrazione in .NET con NUnit, database PostgreSQL usa e getta, DI scope per test e FluentAssertions.
---

# Setup — database usa e getta

## Perché test di integrazione

I test unitari verificano la logica isolata; i test di integrazione verificano che la logica funzioni con il database reale. Sono quelli che trovano i problemi che contano: query N+1, constraint violati, migration incomplete, comportamenti LINQ non traducibili in SQL.

Il database usato nei test è **PostgreSQL**, lo stesso motore di produzione. SQLite in-memory è più veloce ma non si comporta come PostgreSQL su tipi, constraint, case sensitivity e molte funzioni SQL.

## Pattern

Ogni test riceve:
- un **database PostgreSQL dedicato**, clonato da un template e distrutto al termine
- un **DI scope dedicato**, con tutti i servizi dell'applicazione risolti dal container

```
[OneTimeSetUp]  → crea il template se non esiste (migration applicate una volta)
[SetUp]         → clona il template → DB del test
                  costruisce il ServiceProvider con la connection string del DB di test
                  crea lo scope → servizi disponibili tramite Get<T>()
test A          → risolve servizi dallo scope, chiama logica, verifica
[TearDown]      → droppa lo scope, droppa il DB del test
test B          → ...
```

Il clone in PostgreSQL (`CREATE DATABASE ... TEMPLATE ...`) è istantaneo. I servizi vengono risolti dall'`IServiceScope` senza usare `new` — ogni test vede la stessa composizione del container di produzione.

### Invalidazione del template via nome migration

Il template è nominato con il nome dell'ultima migration: `testdb_template_{NomeUltimaMigration}`. Se le migration cambiano, il nome cambia e il template viene ricreato. I vecchi template si rimuovono manualmente.

## Classe base

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using Npgsql;

[TestFixture]
public abstract class IntegrationTestBase
{
    private static string? _templateDbName;
    private string _testDbName = null!;

    private ServiceProvider _provider = null!;
    private IServiceScope _scope = null!;

    // Risolve un servizio dallo scope del test corrente
    protected T Get<T>() where T : notnull
        => _scope.ServiceProvider.GetRequiredService<T>();

    // Shortcut — il DbContext è il servizio più usato nei test
    protected AppDbContext Db => Get<AppDbContext>();

    // Sovrascrivere per inserire dati iniziali prima di ogni test
    protected virtual Task SeedAsync(AppDbContext db) => Task.CompletedTask;

    private static string MasterCs =>
        Environment.GetEnvironmentVariable("TEST_DB_CONNECTION")
        ?? "Host=localhost;Username=postgres;Password=secret";

    // ── Template ────────────────────────────────────────────────────────────

    [OneTimeSetUp]
    public async Task PrepareTemplate()
    {
        if (_templateDbName is not null)
            return;

        var dummyOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql($"{MasterCs};Database=postgres")
            .Options;
        await using var dummyCtx = new AppDbContext(dummyOptions);
        var lastMigration = dummyCtx.Database.GetMigrations().Last();
        _templateDbName = $"testdb_template_{lastMigration.ToLowerInvariant()}";

        await using var conn = new NpgsqlConnection($"{MasterCs};Database=postgres");
        await conn.OpenAsync();

        await using var checkCmd = conn.CreateCommand();
        checkCmd.CommandText = "SELECT 1 FROM pg_database WHERE datname = $1";
        checkCmd.Parameters.AddWithValue(_templateDbName);
        if (await checkCmd.ExecuteScalarAsync() is not null)
            return;

        await using var createCmd = conn.CreateCommand();
        createCmd.CommandText = $"CREATE DATABASE \"{_templateDbName}\"";
        await createCmd.ExecuteNonQueryAsync();

        var templateOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql($"{MasterCs};Database={_templateDbName}")
            .Options;
        await using var templateCtx = new AppDbContext(templateOptions);
        await templateCtx.Database.MigrateAsync();

        await NpgsqlConnection.ClearAllPoolsAsync();
    }

    // ── Per ogni test ────────────────────────────────────────────────────────

    [SetUp]
    public async Task CreateTestScope()
    {
        // 1. Clona il template in un DB dedicato
        _testDbName = $"testdb_{Guid.NewGuid():N}";

        await using var conn = new NpgsqlConnection($"{MasterCs};Database=postgres");
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"CREATE DATABASE \"{_testDbName}\" TEMPLATE \"{_templateDbName}\"";
        await cmd.ExecuteNonQueryAsync();

        // 2. Costruisce il container puntando al DB del test
        var services = new ServiceCollection();
        ConfigureServices(services, $"{MasterCs};Database={_testDbName}");
        _provider = services.BuildServiceProvider(validateScopes: true);

        // 3. Crea lo scope — da qui i servizi sono disponibili tramite Get<T>()
        _scope = _provider.CreateScope();

        await SeedAsync(Db);
    }

    [TearDown]
    public async Task DropTestScope()
    {
        _scope.Dispose();
        await _provider.DisposeAsync();
        await NpgsqlConnection.ClearAllPoolsAsync();

        await using var conn = new NpgsqlConnection($"{MasterCs};Database=postgres");
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"DROP DATABASE IF EXISTS \"{_testDbName}\" WITH (FORCE)";
        await cmd.ExecuteNonQueryAsync();
    }

    // ── Registrazioni ────────────────────────────────────────────────────────

    // Idealmente questo metodo è condiviso con Program.cs tramite una classe statica
    // (es. ServiceRegistration.Configure(services, connectionString))
    // per evitare che la composizione del container nei test diverga da quella di produzione.
    private static void ConfigureServices(IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(connectionString));

        // Casi d'uso e servizi di dominio — stesse registrazioni di Program.cs
        services.AddScoped<ICreaOrdine, CreaOrdine>();
        services.AddScoped<IGestoreScorte, GestoreScorte>();
        services.AddScoped<IInviaNotifica, InviaNotifica>();
        // ...
    }
}
```

## Esempio di test

I test risolvono i servizi dallo scope tramite `Get<T>()` o proprietà shortcut — nessun `new`:

```csharp
[TestFixture]
public class CreaOrdineTests : IntegrationTestBase
{
    // Shortcut locali — Get<T>() è chiamato a ogni accesso,
    // quindi il servizio viene risolto dallo scope del test corrente
    private ICreaOrdine CreaOrdine => Get<ICreaOrdine>();

    protected override async Task SeedAsync(AppDbContext db)
    {
        db.Clienti.Add(new Cliente { Id = 1, Nome = "Acme Srl", Email = "acme@example.com" });
        await db.SaveChangesAsync();
    }

    [Test]
    public async Task Esegui_con_dati_validi_crea_ordine()
    {
        // Act — nessun 'new CreaOrdine(...)' — viene dal container
        var result = await CreaOrdine.ExecuteAsync(new CreaOrdineCommand(ClienteId: 1, Importo: 250.00m));

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
        var result = await CreaOrdine.ExecuteAsync(new CreaOrdineCommand(ClienteId: 999, Importo: 100m));

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Cliente non trovato.");
    }
}
```

`Db` e `CreaOrdine` provengono dallo stesso scope: condividono il `DbContext` e le sue transazioni, esattamente come avviene in produzione durante una richiesta HTTP.

## FluentAssertions

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
var act = async () => await CreaOrdine.ExecuteAsync(commandNonValido);
await act.Should().ThrowAsync<InvalidOperationException>()
    .WithMessage("*importo*");

// Oggetti (confronto per valore, escludendo campi generati)
risposta.Should().BeEquivalentTo(atteso, options => options.Excluding(x => x.Id));
```

## NUnit e parallelismo

I test all'interno della stessa fixture girano in sequenza — ogni test ha il suo scope e il suo DB, ma condividono il template.

Fixture diverse possono girare in parallelo: ciascuna ha il proprio DB e il proprio scope. Il template è condiviso in sola lettura.

```csharp
[assembly: Parallelizable(ParallelScope.Fixtures)]
```
