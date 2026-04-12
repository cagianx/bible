---
sidebar_position: 2
description: IQueryable vs List in Entity Framework Core — esecuzione differita, materializzazione, AsNoTracking e N+1.
---

# IQueryable vs List

## Esecuzione differita

`IQueryable<T>` non contiene dati: contiene un **expression tree** che EF traduce in SQL. La query viene eseguita sul database solo quando si materializza il risultato, cioè quando si chiama `.ToList()`, `.FirstOrDefault()`, `.Count()`, `.Any()`, si itera con `foreach`, o si usa `await` con le varianti async.

```csharp
// Nessuna query eseguita ancora
IQueryable<Ordine> query = _db.Ordini.Where(o => o.ClienteId == clienteId);

// Nessuna query ancora — si sta componendo
query = query.OrderByDescending(o => o.DataCreazione);

// Query eseguita qui: SELECT ... FROM ordini WHERE cliente_id = @p0 ORDER BY data_creazione DESC LIMIT 10
var risultati = await query.Take(10).ToListAsync(ct);
```

Questo significa che aggiungere filtri, ordinamenti e limiti prima di materializzare produce una singola query efficiente, non query multiple o filtraggio in memoria.

## Cosa succede con List

Chiamare `.ToList()` o `.ToListAsync()` prima di completare la composizione porta tutti i dati in memoria e le operazioni successive vengono eseguite in C#, non in SQL:

```csharp
// ❌ Carica TUTTI gli ordini del cliente in memoria, poi filtra in C#
var ordini = await _db.Ordini
    .Where(o => o.ClienteId == clienteId)
    .ToListAsync(ct);                         // query eseguita qui — dati già in memoria

var recenti = ordini.Where(o => o.DataCreazione > DateTime.Today.AddDays(-30)); // in memoria

// ✅ Filtra in SQL, porta in memoria solo i risultati necessari
var recenti = await _db.Ordini
    .Where(o => o.ClienteId == clienteId)
    .Where(o => o.DataCreazione > DateTime.Today.AddDays(-30))
    .ToListAsync(ct);
```

## Il problema N+1

Il problema N+1 è la causa più comune di performance degradate con EF. Emerge quando si carica una lista di entità e poi si accede a una navigation property per ciascuna — producendo una query per ogni elemento.

```csharp
// ❌ N+1: 1 query per gli ordini + N query per il cliente di ciascun ordine
var ordini = await _db.Ordini.ToListAsync(ct);
foreach (var ordine in ordini)
{
    Console.WriteLine(ordine.Cliente.Nome); // lazy loading: 1 query per ordine
}
```

**Soluzione 1 — eager loading con `Include`:** carica le relazioni in anticipo in una join:

```csharp
// ✅ 1 sola query con JOIN
var ordini = await _db.Ordini
    .Include(o => o.Cliente)
    .ToListAsync(ct);
```

**Soluzione 2 — proiezione:** seleziona solo i campi necessari, evitando di caricare entity complete:

```csharp
// ✅ 1 sola query, solo i campi necessari
var riepilogo = await _db.Ordini
    .Select(o => new OrdineRiepilogo(o.Id, o.Numero, o.Cliente.Nome, o.DataCreazione))
    .ToListAsync(ct);
```

La proiezione è spesso preferibile a `Include`: carica meno dati, non traccia le entità, e rende esplicito quali dati servono.

## AsNoTracking

Per default EF traccia ogni entità caricata nel change tracker: confronta lo stato iniziale con quello finale a `SaveChanges()`. Per le query in sola lettura, questo tracking è inutile e ha un costo.

```csharp
// ✅ Query di sola lettura — nessun tracking
var prodotti = await _db.Prodotti
    .AsNoTracking()
    .Where(p => p.Attivo)
    .ToListAsync(ct);
```

`AsNoTracking()` riduce l'allocazione di memoria e il tempo di elaborazione. Va usato sistematicamente per tutte le query che non richiedono modifiche alle entità caricate.

Con `Select`, `AsNoTracking` è ridondante: EF non traccia mai i risultati proiettati, perché non sono entity. Chiamarlo non causa errori, ma non fa nulla.

```csharp
// ❌ AsNoTracking inutile — Select non produce entity tracciate
var dto = await _db.Ordini
    .AsNoTracking()
    .Select(o => new OrdineDto(o.Id, o.Numero))
    .ToListAsync(ct);

// ✅ Basta Select
var dto = await _db.Ordini
    .Select(o => new OrdineDto(o.Id, o.Numero))
    .ToListAsync(ct);
```

`AsNoTrackingWithIdentityResolution()` è utile quando la query include `Include` e potrebbero esserci entità duplicate nel grafo: mantiene un'identità consistente senza tracking completo.

## IQueryable come parametro o ritorno

Restituire `IQueryable<T>` da metodi interni è il pattern preferito per i servizi che operano sullo stesso `DbContext`: permette al chiamante di comporre filtri, ordinamenti e proiezioni aggiuntivi prima della materializzazione, producendo un'unica query efficiente invece di query multiple o filtraggio in memoria.

```csharp
// ✅ Il chiamante compone liberamente — una sola query SQL alla fine
public IQueryable<Ordine> GetOrdiniAttivi()
    => _db.Ordini.Where(o => o.Attivo);

// Nel caso d'uso:
var ordiniRecenti = await _servizio.GetOrdiniAttivi()
    .Where(o => o.DataCreazione > DateTime.UtcNow.AddDays(-30))
    .OrderByDescending(o => o.DataCreazione)
    .Select(o => new OrdineDto(o.Id, o.Numero, o.DataCreazione))
    .ToListAsync(ct);
```

La materializzazione rimane responsabilità del caso d'uso, che conosce il contesto completo: quali filtri applicare, se serve paginazione, quale proiezione è necessaria.

Questo pattern funziona finché il `DbContext` è vivo al momento della materializzazione — condizione sempre vera nei servizi scoped a una richiesta HTTP. Restituire `IQueryable` oltre il confine del processo o verso layer che non condividono il `DbContext` rimane un errore.

Fanno eccezione i metodi privati interni a un caso d'uso, dove la composizione controllata ha senso e il `DbContext` è garantito essere ancora vivo.
