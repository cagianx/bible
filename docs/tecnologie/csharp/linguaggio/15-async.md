---
sidebar_position: 15
description: Programmazione asincrona in C# — async/await, benefici sul throughput nelle Web API, CancellationToken e anti-pattern da evitare.
---

# Async / Await

## Il problema: thread bloccati

ASP.NET Core gestisce le richieste HTTP usando un pool di thread. Quando un thread elabora una richiesta, se chiama un'operazione di I/O in modo sincrono — lettura da database, chiamata HTTP esterna, scrittura su disco — **resta bloccato ad aspettare** che l'operazione finisca. Non fa nulla di utile, eppure occupa una risorsa.

Con un pool da 100 thread e richieste che attendono mediamente 200 ms di I/O, il server si satura velocemente anche con un carico moderato.

## La soluzione: async/await

Con `async`/`await`, quando si incontra un'operazione di I/O il thread viene **rilasciato al pool** e può servire altre richieste. Quando l'operazione completa, il runtime riprende l'esecuzione su un thread disponibile.

```
Sync:    thread ──── [attende DB 200ms] ──────────────── risponde
                      bloccato, inutilizzabile

Async:   thread ──── [avvia query] ──> rilasciato al pool
                                            (serve altre request)
                                    <── riprende ──── risponde
```

Il thread non aspetta: lavora. Il throughput aumenta perché lo stesso numero di thread riesce a gestire molte più richieste concorrenti.

## Esempio in una Web API

```csharp
// ❌ Sincrono — il thread è bloccato per tutta la durata della query
[HttpGet("{id}")]
public IActionResult GetOrdine(int id)
{
    var ordine = _db.Ordini.FirstOrDefault(o => o.Id == id); // blocca
    if (ordine is null)
        return NotFound();
    return Ok(ordine);
}

// ✅ Asincrono — il thread è libero mentre il DB lavora
[HttpGet("{id}")]
public async Task<IActionResult> GetOrdine(int id, CancellationToken ct)
{
    var ordine = await _db.Ordini.FirstOrDefaultAsync(o => o.Id == id, ct);
    if (ordine is null)
        return NotFound();
    return Ok(ordine);
}
```

## I/O-bound vs CPU-bound

`async`/`await` porta benefici reali solo per operazioni **I/O-bound**: database, HTTP, file system, code di messaggi. Il thread aspetta una risorsa esterna — liberarlo ha senso.

Per operazioni **CPU-bound** (calcoli pesanti, elaborazione immagini) il thread è occupato a lavorare, non ad aspettare. In quel caso async non aumenta il throughput: si valuta `Task.Run` per spostare il lavoro su un thread in background, ma è una scelta separata.

| Tipo di operazione | `async/await` utile? |
|--------------------|----------------------|
| Query database (EF Core, Dapper) | Sì |
| Chiamate HTTP (`HttpClient`) | Sì |
| Lettura/scrittura file | Sì |
| Calcoli in memoria | No |
| Serializzazione JSON | No |

## CancellationToken

Il `CancellationToken` propaga la cancellazione lungo tutta la catena asincrona. In ASP.NET Core, il token legato alla richiesta HTTP si annulla automaticamente se il client chiude la connessione.

```csharp
// Il token viene passato automaticamente da ASP.NET Core
[HttpGet]
public async Task<IActionResult> GetOrdini(CancellationToken ct)
{
    var ordini = await _db.Ordini
        .Where(o => o.Attivo)
        .ToListAsync(ct); // interrompe la query se il client si disconnette

    return Ok(ordini);
}
```

Si passa il token a ogni chiamata asincrona lungo la catena: dal controller al use case, dal use case al repository o a `HttpClient`. Ignorarlo significa continuare a lavorare — e consumare risorse — anche quando la risposta non arriverà mai a nessuno.

## Async all the way down

L'asincronia deve propagarsi lungo tutto lo stack. Chiamare codice asincrono da codice sincrono con `.Result` o `.Wait()` blocca il thread esattamente come prima, annullando ogni beneficio.

```csharp
// ❌ Blocca il thread, rischio deadlock
var ordine = _db.Ordini.FirstOrDefaultAsync(o => o.Id == id).Result;

// ✅ Propagare sempre async
var ordine = await _db.Ordini.FirstOrDefaultAsync(o => o.Id == id, ct);
```

La regola è semplice: se un metodo chiama `await`, deve essere `async`. Se il metodo che lo chiama usa `await`, deve essere `async`. E così via fino al punto di ingresso — che in ASP.NET Core è già asincrono per design.

## Anti-pattern da evitare

**`async void`** — i metodi `async void` non sono awaitable: le eccezioni non vengono catturate dal chiamante e possono far crashare il processo. Si usa esclusivamente per event handler dove la firma è imposta dal framework.

```csharp
// ❌ Eccezione ingestibile
private async void CaricaDati() { ... }

// ✅
private async Task CaricaDatiAsync() { ... }
```

**Fire and forget senza supervisione** — avviare un `Task` senza await e senza gestione degli errori significa perdere eccezioni in silenzio.

```csharp
// ❌ Eventuali eccezioni spariscono
_ = InviaEmailAsync(utente);

// ✅ Se serve fire-and-forget, usare un canale o un background service dedicato
// (vedi 08-code-native.md e 09-librerie-code.md)
```

**`Task.Delay` come sleep sincrono** — `Thread.Sleep` blocca il thread; `await Task.Delay` lo rilascia. In contesti async si usa sempre il secondo.

```csharp
// ❌ Blocca il thread
Thread.Sleep(1000);

// ✅ Rilascia il thread
await Task.Delay(1000, ct);
```

## `ValueTask<T>`

`ValueTask<T>` è un'alternativa a `Task<T>` ottimizzata per i casi in cui l'operazione **completa spesso in modo sincrono** — ad esempio una cache in memoria che quasi sempre risponde senza I/O. Evita l'allocazione heap di `Task` in quel caso frequente.

```csharp
public async ValueTask<Ordine?> GetDaCacheAsync(int id, CancellationToken ct)
{
    if (_cache.TryGetValue(id, out var cached))
        return cached; // sincrono, nessuna allocazione

    return await _db.Ordini.FirstOrDefaultAsync(o => o.Id == id, ct);
}
```

Non va usato per default al posto di `Task<T>`: il risparmio è reale solo quando la via sincrona è il caso comune e misurabile. Nei controller e use case standard si usa `Task<T>`.
