---
sidebar_position: 20
description: Caching in ASP.NET Core — IMemoryCache, IDistributedCache, output caching e strategie di invalidazione.
---

# Caching

Il caching riduce latenza e carico su database o servizi esterni memorizzando temporaneamente il risultato di operazioni costose. Va usato con consapevolezza: aggiunge complessità e introduce la possibilità di servire dati stantii.

## IMemoryCache

Cache in memoria del processo. Adatta per dati condivisi tra richieste, non condivisi tra istanze. Se si scala su più pod, ogni istanza ha la propria cache indipendente.

```csharp
// Program.cs
builder.Services.AddMemoryCache();
```

```csharp
public class CategorieService
{
    private readonly IMemoryCache _cache;
    private readonly AppDbContext _db;

    public CategorieService(IMemoryCache cache, AppDbContext db)
    {
        _cache = cache;
        _db = db;
    }

    public async Task<List<Categoria>> GetCategorieAsync(CancellationToken ct)
    {
        return await _cache.GetOrCreateAsync("categorie", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
            entry.SlidingExpiration = TimeSpan.FromMinutes(2);
            entry.Size = 1; // richiesto se si imposta un size limit sul cache

            return await _db.Categorie.ToListAsync(ct);
        }) ?? [];
    }
}
```

`AbsoluteExpiration` — scade comunque dopo N tempo, anche se usata di frequente.
`SlidingExpiration` — ogni accesso rinnova il timer; scade solo se inutilizzata per N tempo.
Si possono usare entrambe: la sliding evita cache calde inutili, l'absolute garantisce un refresh periodico.

### Size limit

Senza un limite, la cache cresce senza controllo fino a pressione di memoria. Si imposta un limite in `AddMemoryCache` e si assegna una dimensione a ogni entry:

```csharp
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1024; // unità arbitrarie, coerenti con entry.Size
});
```

## IDistributedCache

Cache condivisa tra istanze, tipicamente Redis. L'interfaccia lavora con `byte[]`; in pratica si serializza in JSON.

```csharp
// Program.cs
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "myapp:";
});
```

```csharp
public async Task<Utente?> GetUtenteAsync(int id, CancellationToken ct)
{
    var key = $"utente:{id}";

    var cached = await _cache.GetStringAsync(key, ct);
    if (cached is not null)
        return JsonSerializer.Deserialize<Utente>(cached);

    var utente = await _db.Utenti.FindAsync([id], ct);
    if (utente is null)
        return null;

    var options = new DistributedCacheEntryOptions
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
    };
    await _cache.SetStringAsync(key, JsonSerializer.Serialize(utente), options, ct);

    return utente;
}
```

### Invalidazione esplicita

Quando i dati cambiano, la cache va invalidata per evitare di servire valori stantii:

```csharp
public async Task AggiornaUtenteAsync(Utente utente, CancellationToken ct)
{
    _db.Utenti.Update(utente);
    await _db.SaveChangesAsync(ct);
    await _cache.RemoveAsync($"utente:{utente.Id}", ct);
}
```

## Output caching (ASP.NET Core 7+)

L'output caching memorizza la risposta HTTP completa di un endpoint. È la forma di caching con meno codice: non serve toccare la logica, si decora l'endpoint.

```csharp
// Program.cs
builder.Services.AddOutputCache(options =>
{
    options.AddPolicy("breve", policy => policy.Expire(TimeSpan.FromSeconds(30)));
    options.AddPolicy("lungo", policy => policy.Expire(TimeSpan.FromMinutes(10)));
});

app.UseOutputCache();
```

```csharp
[HttpGet]
[OutputCache(PolicyName = "lungo")]
public async Task<IActionResult> GetCatalogo(CancellationToken ct)
{
    var catalogo = await _db.Prodotti.ToListAsync(ct);
    return Ok(catalogo);
}
```

L'output caching non è adatto per endpoint che restituiscono dati personalizzati per utente (richiede vary-by) o che hanno effetti collaterali.

## Cosa non mettere in cache

- Dati che cambiano frequentemente e dove la coerenza è critica (saldi, disponibilità in tempo reale).
- Risultati di operazioni di scrittura: la cache va invalidata, non aggiornata ottimisticamente.
- Dati sensibili senza considerare la condivisione tra utenti: una cache mal configurata può restituire dati di un altro utente.
