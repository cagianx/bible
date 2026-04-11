---
sidebar_position: 4
description: Feature flag in ASP.NET Core con Microsoft.FeatureManagement.
---

# Feature Flags

La libreria `Microsoft.FeatureManagement` integra i feature flag con il sistema di configurazione di ASP.NET Core. I flag si attivano e disattivano senza deploy, modificando solo la configurazione.

## Installazione

```bash
dotnet add package Microsoft.FeatureManagement.AspNetCore
```

## Configurazione

```csharp
// Program.cs
builder.Services.AddFeatureManagement();
```

I flag si definiscono in `appsettings.json`:

```json
{
  "FeatureManagement": {
    "NuovoCheckout": true,
    "ExportCsv": false,
    "BetaDashboard": true
  }
}
```

## Utilizzo nel codice

### In un use case o service

```csharp
public class CreaOrdine
{
    private readonly IFeatureManager _features;
    private readonly AppDbContext _db;

    public CreaOrdine(IFeatureManager features, AppDbContext db)
    {
        _features = features;
        _db = db;
    }

    public async Task<Result<OrdineId>> ExecuteAsync(CreaOrdineCommand command)
    {
        if (await _features.IsEnabledAsync("NuovoCheckout"))
        {
            // percorso nuovo
        }
        else
        {
            // percorso legacy
        }
    }
}
```

### In un controller

```csharp
[ApiController]
[Route("api/[controller]")]
public class ReportController : ControllerBase
{
    private readonly IFeatureManager _features;

    public ReportController(IFeatureManager features)
    {
        _features = features;
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        if (!await _features.IsEnabledAsync("ExportCsv"))
            return NotFound();

        // ...
    }
}
```

### Tramite attributo su controller o action

```csharp
[FeatureGate("BetaDashboard")]
[HttpGet("dashboard/beta")]
public IActionResult BetaDashboard() => Ok();
```

Se il flag è disabilitato, l'endpoint risponde `404`. Il comportamento si personalizza:

```csharp
builder.Services.AddFeatureManagement()
    .UseDisabledFeaturesHandler(new RedirectDisabledFeatureHandler("/"));
```

## Flag con filtri

I flag possono essere condizionali — attivi solo per certi utenti, percentuali di traffico, orari.

### Percentuale di rollout

```json
{
  "FeatureManagement": {
    "NuovaUI": {
      "EnabledFor": [
        {
          "Name": "Percentage",
          "Parameters": { "Value": 20 }
        }
      ]
    }
  }
}
```

### Finestra temporale

```json
{
  "FeatureManagement": {
    "PromoNatale": {
      "EnabledFor": [
        {
          "Name": "TimeWindow",
          "Parameters": {
            "Start": "2024-12-20T00:00:00",
            "End":   "2024-12-26T23:59:59"
          }
        }
      ]
    }
  }
}
```

### Filtro custom per utente

```csharp
[FilterAlias("UtenteBeta")]
public class UtenteBetaFilter : IFeatureFilter
{
    private readonly IHttpContextAccessor _httpContext;

    public UtenteBetaFilter(IHttpContextAccessor httpContext)
    {
        _httpContext = httpContext;
    }

    public Task<bool> EvaluateAsync(FeatureFilterEvaluationContext context)
    {
        var utente = _httpContext.HttpContext?.User.FindFirst(ClaimTypes.Email)?.Value;
        var isBeta = utente?.EndsWith("@beta.example.com") ?? false;
        return Task.FromResult(isBeta);
    }
}

// Registrazione
builder.Services.AddFeatureManagement()
    .AddFeatureFilter<UtenteBetaFilter>();
```

```json
{
  "FeatureManagement": {
    "FunzionalitaBeta": {
      "EnabledFor": [{ "Name": "UtenteBeta" }]
    }
  }
}
```

## Flag nel database

Per flag che cambiano frequentemente senza riavvio, si implementa un provider custom su `IConfiguration` o si usa direttamente `IFeatureDefinitionProvider`:

```csharp
public class DbFeatureDefinitionProvider : IFeatureDefinitionProvider
{
    private readonly AppDbContext _db;

    public DbFeatureDefinitionProvider(AppDbContext db) => _db = db;

    public async IAsyncEnumerable<FeatureDefinition> GetAllFeatureDefinitionsAsync()
    {
        var flags = await _db.FeatureFlags.ToListAsync();
        foreach (var flag in flags)
            yield return new FeatureDefinition { Name = flag.Nome };
    }

    public async Task<FeatureDefinition?> GetFeatureDefinitionAsync(string featureName)
    {
        var flag = await _db.FeatureFlags.FindAsync(featureName);
        return flag is null ? null : new FeatureDefinition { Name = flag.Nome };
    }
}
```
