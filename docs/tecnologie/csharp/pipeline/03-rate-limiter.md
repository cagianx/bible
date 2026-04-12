---
sidebar_position: 3
description: Rate limiting in ASP.NET Core con Microsoft.AspNetCore.RateLimiting.
---

# Rate Limiter

ASP.NET Core 7+ include `Microsoft.AspNetCore.RateLimiting`, middleware nativo per limitare il numero di richieste. Non richiede librerie esterne.

## Algoritmi disponibili

| Algoritmo | Comportamento |
|---|---|
| **Fixed Window** | N richieste per finestra temporale fissa |
| **Sliding Window** | N richieste in una finestra mobile |
| **Token Bucket** | Token consumati ad ogni richiesta, rigenerati nel tempo |
| **Concurrency** | N richieste simultanee massime |

## Configurazione base (Fixed Window)

```csharp
// Program.cs
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("api", o =>
    {
        o.PermitLimit = 100;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 10;
    });
});

var app = builder.Build();
app.UseRateLimiter();
```

## Sliding Window

Distribuisce i permessi in segmenti all'interno della finestra:

```csharp
options.AddSlidingWindowLimiter("sliding", o =>
{
    o.PermitLimit = 100;
    o.Window = TimeSpan.FromMinutes(1);
    o.SegmentsPerWindow = 6;        // finestra divisa in segmenti da 10s
    o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    o.QueueLimit = 5;
});
```

## Token Bucket

Adatto per burst controllati: si accumulano token fino a un massimo, si consumano ad ogni richiesta:

```csharp
options.AddTokenBucketLimiter("bucket", o =>
{
    o.TokenLimit = 100;
    o.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
    o.TokensPerPeriod = 20;
    o.AutoReplenishment = true;
    o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    o.QueueLimit = 5;
});
```

## Concurrency

Limita le richieste simultanee, non il throughput nel tempo:

```csharp
options.AddConcurrencyLimiter("concurrency", o =>
{
    o.PermitLimit = 10;
    o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    o.QueueLimit = 5;
});
```

## Applicare a controller o endpoint

```csharp
// A livello di controller
[EnableRateLimiting("api")]
[ApiController]
[Route("api/[controller]")]
public class OrdiniController : ControllerBase { }

// A livello di singolo endpoint
app.MapGet("/api/prodotti", GetProdotti)
   .RequireRateLimiting("api");

// Disabilitare su un endpoint specifico (override del controller)
[DisableRateLimiting]
[HttpGet("health")]
public IActionResult Health() => Ok();
```

## Rate limiting per utente

Il caso più comune in produzione: limite per utente autenticato, non globale:

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("per-utente", context =>
    {
        var utente = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return utente is not null
            ? RateLimitPartition.GetFixedWindowLimiter(utente, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            })
            : RateLimitPartition.GetFixedWindowLimiter("anonimo", _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });
});
```

## Gestire il rifiuto

```csharp
options.OnRejected = async (context, cancellationToken) =>
{
    context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

    if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
    {
        context.HttpContext.Response.Headers.RetryAfter =
            ((int)retryAfter.TotalSeconds).ToString();
    }

    await context.HttpContext.Response.WriteAsync(
        "Troppe richieste. Riprova tra poco.", cancellationToken);
};
```
