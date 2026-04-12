---
sidebar_position: 1
description: Pattern per i test di integrazione — database usa e getta, clone da template PostgreSQL e scope DI per ogni test.
---

# Pattern: template e scope

## Perché test di integrazione

I test unitari verificano la logica isolata; i test di integrazione verificano che la logica funzioni con il database reale. Sono quelli che trovano i problemi che contano: query N+1, constraint violati, migration incomplete, comportamenti LINQ non traducibili in SQL.

Il database usato nei test è **PostgreSQL**, lo stesso motore di produzione. SQLite in-memory è più veloce ma non si comporta come PostgreSQL su tipi, constraint, case sensitivity e molte funzioni SQL.

## Database usa e getta con clone da template

Ogni test riceve un database PostgreSQL dedicato, clonato istantaneamente da un template, e lo distrugge al termine. Il template viene creato una volta sola per sessione di test applicando le migration su un DB vuoto.

```
[OneTimeSetUp]  → crea il template se non esiste (migration applicate una volta sola)
[SetUp]         → clona il template → DB del test
                  costruisce il ServiceProvider con la connection string del DB di test
                  crea lo scope → servizi disponibili tramite Get<T>()
test            → risolve servizi dallo scope, chiama logica, verifica
[TearDown]      → droppa lo scope e il provider, droppa il DB del test
```

Il clone in PostgreSQL (`CREATE DATABASE ... TEMPLATE ...`) è un'operazione istantanea: copia i metadati senza copiare fisicamente i dati. Il template è un DB vuoto con le migration applicate.

### Invalidazione del template via nome migration

Il template è nominato con il nome dell'ultima migration: `testdb_template_{NomeUltimaMigration}`. Se le migration cambiano, il nome cambia e il template viene ricreato automaticamente. I vecchi template si rimuovono manualmente.

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

    // Sovrascrivere per usare una fonte diversa (es. Testcontainers — vedi 03-testcontainers)
    protected virtual string MasterConnectionString =>
        Environment.GetEnvironmentVariable("TEST_DB_CONNECTION")
        ?? "Host=localhost;Username=postgres;Password=secret";

    // ── Template ────────────────────────────────────────────────────────────

    [OneTimeSetUp]
    public async Task PrepareTemplate()
    {
        if (_templateDbName is not null)
            return;

        var dummyOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql($"{MasterConnectionString};Database=postgres")
            .Options;
        await using var dummyCtx = new AppDbContext(dummyOptions);
        var lastMigration = dummyCtx.Database.GetMigrations().Last();
        _templateDbName = $"testdb_template_{lastMigration.ToLowerInvariant()}";

        await using var conn = new NpgsqlConnection($"{MasterConnectionString};Database=postgres");
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
            .UseNpgsql($"{MasterConnectionString};Database={_templateDbName}")
            .Options;
        await using var templateCtx = new AppDbContext(templateOptions);
        await templateCtx.Database.MigrateAsync();

        await NpgsqlConnection.ClearAllPoolsAsync();
    }

    // ── Per ogni test ────────────────────────────────────────────────────────

    [SetUp]
    public async Task CreateTestScope()
    {
        _testDbName = $"testdb_{Guid.NewGuid():N}";

        await using var conn = new NpgsqlConnection($"{MasterConnectionString};Database=postgres");
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"CREATE DATABASE \"{_testDbName}\" TEMPLATE \"{_templateDbName}\"";
        await cmd.ExecuteNonQueryAsync();

        var services = new ServiceCollection();
        ConfigureServices(services, $"{MasterConnectionString};Database={_testDbName}");
        _provider = services.BuildServiceProvider(validateScopes: true);
        _scope = _provider.CreateScope();

        await SeedAsync(Db);
    }

    [TearDown]
    public async Task DropTestScope()
    {
        _scope.Dispose();
        await _provider.DisposeAsync();
        await NpgsqlConnection.ClearAllPoolsAsync();

        await using var conn = new NpgsqlConnection($"{MasterConnectionString};Database=postgres");
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

        services.AddScoped<ICreaOrdine, CreaOrdine>();
        services.AddScoped<IGestoreScorte, GestoreScorte>();
        services.AddScoped<IInviaNotifica, InviaNotifica>();
        // ... stesse registrazioni di Program.cs
    }
}
```
