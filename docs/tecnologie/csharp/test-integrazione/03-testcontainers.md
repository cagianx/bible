---
sidebar_position: 3
description: Testcontainers — avviare PostgreSQL in Docker per i test di integrazione senza dipendenze locali.
---

# Testcontainers

## Cos'è Testcontainers

Testcontainers è una libreria che avvia container Docker direttamente dal codice di test. Per i test di integrazione con PostgreSQL, sostituisce la dipendenza da un'istanza locale con un container effimero: avviato prima dei test, distrutto alla fine.

Vantaggi rispetto a un PostgreSQL locale:
- nessuna installazione locale richiesta (CI inclusa)
- versione di PostgreSQL dichiarata nel codice e riproducibile
- nessun conflitto di porte o stato residuo tra sessioni

Svantaggio: richiede Docker in esecuzione sulla macchina di sviluppo e in CI. Il primo avvio scarica l'immagine — le esecuzioni successive usano la cache locale.

## Installazione

```bash
dotnet add package Testcontainers.PostgreSql
```

## Avvio del container a livello di assembly

Il container si avvia una volta sola per l'intera sessione di test tramite `[SetUpFixture]`, che NUnit esegue una volta prima di qualsiasi fixture nell'assembly.

```csharp
using NUnit.Framework;
using Testcontainers.PostgreSql;

[SetUpFixture]
public class TestEnvironment
{
    private static PostgreSqlContainer? _container;

    public static string ConnectionString => _container!.GetConnectionString();

    [OneTimeSetUp]
    public async Task StartPostgres()
    {
        _container = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase("postgres")
            .WithUsername("postgres")
            .WithPassword("secret")
            .Build();

        await _container.StartAsync();
    }

    [OneTimeTearDown]
    public async Task StopPostgres()
    {
        await _container!.DisposeAsync();
    }
}
```

## Integrazione con la classe base

La classe base descritta in [01-pattern](01-pattern.md) espone `MasterConnectionString` come proprietà virtuale. Per usare Testcontainers basta estenderla e sovrascrivere quella proprietà — tutto il resto (template, clone, scope DI) rimane invariato.

```csharp
public abstract class ContainerIntegrationTestBase : IntegrationTestBase
{
    // Sostituisce la connection string locale con quella del container
    protected override string MasterConnectionString =>
        TestEnvironment.ConnectionString;
}
```

Le suite di test ereditano da `ContainerIntegrationTestBase` invece di `IntegrationTestBase`:

```csharp
[TestFixture]
public class CreaOrdineTests : ContainerIntegrationTestBase
{
    private ICreaOrdine CreaOrdine => Get<ICreaOrdine>();

    [Test]
    public async Task Esegui_con_dati_validi_crea_ordine()
    {
        var result = await CreaOrdine.ExecuteAsync(new CreaOrdineCommand(ClienteId: 1, Importo: 250.00m));
        result.IsSuccess.Should().BeTrue();
    }
}
```

## Confronto

|  | PostgreSQL locale | Testcontainers |
|--|-------------------|----------------|
| Setup sviluppatore | installazione manuale | solo Docker |
| Versione PostgreSQL | dipende dall'installazione | dichiarata nel codice |
| CI | configurazione aggiuntiva | Docker già disponibile |
| Velocità primo avvio | immediata | pull immagine (una tantum) |
| Velocità esecuzioni successive | immediata | ~2-3s avvio container |
| Isolamento tra sessioni | dipende dalla configurazione | completo |

In progetti con CI e più sviluppatori, Testcontainers riduce il costo di setup e garantisce che l'ambiente di test sia identico ovunque. In progetti personali o con un singolo sviluppatore, un PostgreSQL locale è più semplice e più veloce.
