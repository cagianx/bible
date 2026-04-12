---
sidebar_position: 19
description: Background service in ASP.NET Core — IHostedService, BackgroundService, worker pattern e graceful shutdown.
---

# Background services

Un background service è un componente che gira in background per tutta la vita dell'applicazione, in parallelo con la gestione delle richieste HTTP. Casi d'uso tipici: consumare una coda di messaggi, inviare notifiche in batch, eseguire pulizie periodiche.

## IHostedService vs BackgroundService

`IHostedService` è l'interfaccia base: richiede l'implementazione di `StartAsync` e `StopAsync`.

`BackgroundService` è la classe astratta che implementa `IHostedService` e gestisce il loop di esecuzione: basta implementare `ExecuteAsync`.

In quasi tutti i casi si estende `BackgroundService`.

## Pattern base

```csharp
public class EmailWorker : BackgroundService
{
    private readonly ILogger<EmailWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public EmailWorker(
        ILogger<EmailWorker> logger,
        IServiceScopeFactory _scopeFactory)
    {
        _logger = logger;
        this._scopeFactory = _scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailWorker avviato.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ElaboraEmailInAttesaAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // shutdown richiesto, uscita pulita
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Errore durante l'elaborazione delle email.");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }

        _logger.LogInformation("EmailWorker fermato.");
    }

    private async Task ElaboraEmailInAttesaAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var email = await db.EmailInAttesa
            .Where(e => !e.Inviata)
            .FirstOrDefaultAsync(ct);

        if (email is null)
        {
            await Task.Delay(TimeSpan.FromSeconds(10), ct);
            return;
        }

        // ... invio email ...

        email.Inviata = true;
        await db.SaveChangesAsync(ct);
    }
}
```

Il `DbContext` è scoped, ma `BackgroundService` è singleton. Si usa sempre `IServiceScopeFactory` per creare uno scope per ogni unità di lavoro. Vedi [16-dependency-injection](../fondamentali/16-dependency-injection.md).

Registrazione:

```csharp
builder.Services.AddHostedService<EmailWorker>();
```

## Integrazione con Channel\<T\>

Il pattern più efficiente per produttori/consumatori interni è affidare la coda a un `Channel<T>` singleton e far leggere il worker da quel canale. Niente polling sul database, latenza minima.

```csharp
// Registrazione del canale come singleton
builder.Services.AddSingleton(_ =>
    Channel.CreateBounded<EmailMessage>(new BoundedChannelOptions(1000)
    {
        FullMode = BoundedChannelFullMode.Wait
    }));
```

```csharp
public class EmailWorker : BackgroundService
{
    private readonly ChannelReader<EmailMessage> _reader;

    public EmailWorker(Channel<EmailMessage> channel)
    {
        _reader = channel.Reader;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var messaggio in _reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await InviaAsync(messaggio, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Errore invio email a {Destinatario}", messaggio.Destinatario);
            }
        }
    }
}
```

`ReadAllAsync` attende nuovi messaggi senza polling e rispetta il `CancellationToken`: quando il token viene annullato allo shutdown, il `foreach` termina pulitamente. Vedi [08-code-native](08-code-native.md) per i dettagli sui channel.

## Graceful shutdown

ASP.NET Core invia il `CancellationToken` di stop quando l'applicazione riceve il segnale di shutdown (SIGTERM, Ctrl+C). Il worker deve terminare il lavoro corrente entro il timeout di shutdown (default: 30 secondi) e uscire.

```csharp
// Program.cs — aumentare il timeout se il worker ha operazioni lunghe
builder.Services.Configure<HostOptions>(options =>
{
    options.ShutdownTimeout = TimeSpan.FromSeconds(60);
});
```

Non bloccare `ExecuteAsync` ignorando il token: il processo viene terminato forzatamente allo scadere del timeout, con possibile perdita di dati.

## Esecuzione periodica

Per task che girano a intervalli fissi, il pattern è `await Task.Delay` alla fine di ogni ciclo:

```csharp
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        await PulisciSessioniScaduteAsync(stoppingToken);
        await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
    }
}
```

Per scheduling più complesso (cron expression, orari fissi) si valuta Quartz.NET. Vedi [09-librerie-code](09-librerie-code.md).
