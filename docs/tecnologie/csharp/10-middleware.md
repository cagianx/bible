---
sidebar_position: 10
description: Middleware custom in ASP.NET Core — quando usarlo, come scriverlo e come registrarlo nella pipeline.
---

# Middleware custom

Il middleware è il meccanismo di ASP.NET Core per intercettare ogni richiesta HTTP in ingresso e ogni risposta in uscita. Si compone in una pipeline: ogni middleware può elaborare la request, passarla al successivo con `next()`, e poi elaborare la response al ritorno.

## Quando usare il middleware

Il middleware è appropriato per responsabilità **trasversali** che riguardano ogni request, indipendentemente dall'endpoint:

- Autenticazione e autorizzazione
- Logging delle request HTTP
- Gestione globale delle eccezioni non catturate
- Compressione, CORS, HTTPS redirect
- Rate limiting
- Aggiunta di header personalizzati

Per responsabilità che riguardano solo i controller MVC (es. validazione modello, logging di azioni specifiche) si preferiscono i [filter](11-action-filter.md).

## Struttura base

```csharp
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public CorrelationIdMiddleware(
        RequestDelegate next,
        ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Elaborazione della request (prima di next)
        var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault()
            ?? Guid.NewGuid().ToString();

        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers["X-Correlation-ID"] = correlationId;

        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId
        }))
        {
            // Passo al middleware successivo
            await _next(context);
        }

        // Elaborazione della response (dopo next)
    }
}
```

Le dipendenze con ciclo di vita **singleton o transient** si iniettano nel costruttore. Le dipendenze **scoped** (es. `DbContext`) si iniettano nel metodo `InvokeAsync`:

```csharp
public async Task InvokeAsync(HttpContext context, AppDbContext db)
{
    // db è scoped — ricreato per ogni request
    await _next(context);
}
```

## Registrazione

```csharp
// Program.cs
app.UseMiddleware<CorrelationIdMiddleware>();
```

Oppure con un extension method per una registrazione più pulita:

```csharp
public static class CorrelationIdMiddlewareExtensions
{
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder app)
        => app.UseMiddleware<CorrelationIdMiddleware>();
}

// Program.cs
app.UseCorrelationId();
```

## Ordine nella pipeline

L'ordine di registrazione è l'ordine di esecuzione. La pipeline di ASP.NET Core ha un ordine standard da rispettare:

```csharp
app.UseExceptionHandler("/error");    // 1 — deve essere il primo per catturare tutto
app.UseHttpsRedirection();            // 2
app.UseCorrelationId();               // 3 — custom, prima dell'autenticazione
app.UseAuthentication();              // 4
app.UseAuthorization();               // 5
app.MapControllers();                 // 6 — endpoint
```

Il middleware registrato prima vede la request per primo e la response per ultimo (struttura a cipolla).

## Gestione globale delle eccezioni

Il pattern raccomandato per la gestione centralizzata degli errori è `IExceptionHandler` (ASP.NET Core 8+) o `UseExceptionHandler`. Per la gestione tramite filter, vedi [13-exception-filter](13-exception-filter.md).

```csharp
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception,
            "Eccezione non gestita per {Method} {Path}",
            context.Request.Method, context.Request.Path);

        var problemDetails = new ProblemDetails
        {
            Status = exception switch
            {
                KeyNotFoundException => StatusCodes.Status404NotFound,
                UnauthorizedAccessException => StatusCodes.Status403Forbidden,
                _ => StatusCodes.Status500InternalServerError
            },
            Title = "Si è verificato un errore.",
            Detail = exception.Message
        };

        context.Response.StatusCode = problemDetails.Status!.Value;
        await context.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
```

```csharp
// Program.cs
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

app.UseExceptionHandler();
```

## Short-circuit (interruzione della pipeline)

Un middleware può interrompere la pipeline senza chiamare `next`, rispondendo direttamente:

```csharp
public async Task InvokeAsync(HttpContext context)
{
    if (!context.Request.Headers.ContainsKey("X-API-Key"))
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsJsonAsync(new { error = "API key mancante" });
        return;   // pipeline interrotta: next non viene chiamato
    }

    await _next(context);
}
```

