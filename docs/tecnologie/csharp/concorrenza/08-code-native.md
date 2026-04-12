---
sidebar_position: 8
description: Code di lavoro native in .NET — Queue, ConcurrentQueue e Channel per comunicazione produttore/consumatore.
---

# Code native .NET

.NET offre strutture dati native per la gestione di code in-process. Sono la scelta giusta quando la comunicazione avviene all'interno dello stesso processo, senza la complessità di un broker esterno.

## Queue\<T\> — coda FIFO non thread-safe

`Queue<T>` implementa una coda FIFO semplice. Non è thread-safe: va usata solo in scenari single-thread o protetta con lock espliciti.

```csharp
var queue = new Queue<string>();

queue.Enqueue("primo");
queue.Enqueue("secondo");
queue.Enqueue("terzo");

while (queue.TryDequeue(out var item))
{
    Console.WriteLine(item); // primo, secondo, terzo
}
```

`TryDequeue` è preferibile a `Dequeue` perché non lancia eccezione se la coda è vuota.

## ConcurrentQueue\<T\> — coda thread-safe

`ConcurrentQueue<T>` è la variante thread-safe di `Queue<T>`. Più thread possono accodare e togliere elementi senza lock espliciti:

```csharp
var queue = new ConcurrentQueue<OrdineEvent>();

// Thread produttore
queue.Enqueue(new OrdineEvent(ordineId, "Confermato"));

// Thread consumatore
if (queue.TryDequeue(out var evt))
{
    await ProcessEventAsync(evt);
}
```

`ConcurrentQueue<T>` è adatta per scenari semplici produttore/consumatore, ma non offre meccanismi di attesa bloccante (il consumatore deve fare polling). Per questo si preferisce `Channel<T>`.

## Channel\<T\> — produttore/consumatore asincrono

`System.Threading.Channels.Channel<T>` è la soluzione moderna per la comunicazione asincrona produttore/consumatore. Supporta backpressure, è completamente asincrona e integra nativamente con `async`/`await`.

### Channel non limitato

```csharp
var channel = Channel.CreateUnbounded<OrdineEvent>();

// Produttore
await channel.Writer.WriteAsync(new OrdineEvent(ordineId, "Pagato"));

// Consumatore (in background)
await foreach (var evt in channel.Reader.ReadAllAsync(cancellationToken))
{
    await ProcessEventAsync(evt);
}
```

### Channel limitato (con backpressure)

```csharp
var channel = Channel.CreateBounded<OrdineEvent>(new BoundedChannelOptions(100)
{
    FullMode = BoundedChannelFullMode.Wait   // il produttore aspetta se la coda è piena
});
```

`BoundedChannelFullMode` ha altre opzioni:

| Valore | Comportamento |
|---|---|
| `Wait` | Il produttore aspetta (backpressure) |
| `DropWrite` | Il messaggio nuovo viene scartato |
| `DropOldest` | Il messaggio più vecchio viene scartato |
| `DropNewest` | Il messaggio più nuovo viene scartato |

### Integrazione con IHostedService

Il pattern classico è un `BackgroundService` che consuma il channel:

```csharp
public class OrdineEventProcessor : BackgroundService
{
    private readonly ChannelReader<OrdineEvent> _reader;
    private readonly ILogger<OrdineEventProcessor> _logger;

    public OrdineEventProcessor(
        ChannelReader<OrdineEvent> reader,
        ILogger<OrdineEventProcessor> logger)
    {
        _reader = reader;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var evt in _reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await ProcessAsync(evt, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Errore elaborazione evento {TipoEvento} per ordine {OrdineId}",
                    evt.Tipo, evt.OrdineId);
            }
        }
    }

    private Task ProcessAsync(OrdineEvent evt, CancellationToken ct)
    {
        // logica di elaborazione
        return Task.CompletedTask;
    }
}
```

```csharp
// Program.cs — registrazione
var channel = Channel.CreateBounded<OrdineEvent>(100);

builder.Services.AddSingleton(channel.Writer);
builder.Services.AddSingleton(channel.Reader);
builder.Services.AddHostedService<OrdineEventProcessor>();
```

Il produttore (es. un controller o un use case) inietta `ChannelWriter<OrdineEvent>` e scrive senza sapere nulla del consumatore.

## Confronto

| Struttura | Thread-safe | Asincrona | Backpressure | Scenari |
|---|---|---|---|---|
| `Queue<T>` | ❌ | ❌ | ❌ | Single-thread, struttura interna |
| `ConcurrentQueue<T>` | ✅ | ❌ | ❌ | Multi-thread, polling |
| `Channel<T>` | ✅ | ✅ | ✅ | Produttore/consumatore in-process |

Per code distribuite o persistenti (messaggi che sopravvivono al riavvio del processo) si usano librerie dedicate. Vedi [09-librerie-code](09-librerie-code.md).

