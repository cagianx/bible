---
sidebar_position: 11
description: Action filter in ASP.NET Core MVC — IActionFilter e IAsyncActionFilter per logica trasversale sui controller.
---

# Action Filter

Gli action filter intercettano l'esecuzione di un'action MVC prima e dopo la sua chiamata. Sono il posto giusto per logica trasversale che riguarda specifici controller o action: validazione del modello, logging dell'azione, trasformazione del risultato.

La differenza con il [middleware](10-middleware.md) è il contesto: i filter hanno accesso agli argomenti dell'action, al risultato, al controller — informazioni non disponibili nel middleware.

## IActionFilter (sincrono)

```csharp
public class ValidazioneModelloFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        // Eseguito PRIMA dell'action
        if (!context.ModelState.IsValid)
        {
            context.Result = new UnprocessableEntityObjectResult(
                new ValidationProblemDetails(context.ModelState));
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // Eseguito DOPO l'action (anche se ha lanciato eccezione)
    }
}
```

## IAsyncActionFilter (asincrono)

```csharp
public class AuditFilter : IAsyncActionFilter
{
    private readonly ILogger<AuditFilter> _logger;

    public AuditFilter(ILogger<AuditFilter> logger)
    {
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        var actionName = context.ActionDescriptor.DisplayName;
        var userId = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        _logger.LogInformation(
            "Avvio {ActionName} da utente {UserId}", actionName, userId);

        var sw = Stopwatch.StartNew();

        // Esegue l'action (e i filter successivi nella catena)
        var executedContext = await next();

        sw.Stop();

        if (executedContext.Exception is not null)
        {
            _logger.LogError(executedContext.Exception,
                "Errore in {ActionName} dopo {ElapsedMs}ms", actionName, sw.ElapsedMilliseconds);
        }
        else
        {
            _logger.LogInformation(
                "Completato {ActionName} in {ElapsedMs}ms", actionName, sw.ElapsedMilliseconds);
        }
    }
}
```

## Registrazione

### Globale (tutti i controller)

```csharp
// Program.cs
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidazioneModelloFilter>();
    options.Filters.Add<AuditFilter>();
});
```

### Tramite attributo (singolo controller o action)

```csharp
[ApiController]
[Route("api/ordini")]
[ServiceFilter(typeof(AuditFilter))]     // inietta le dipendenze dal container
public class OrdiniController : ControllerBase
{
    [HttpPost]
    [ServiceFilter(typeof(ValidazioneModelloFilter))]
    public async Task<IActionResult> Crea([FromBody] CreaOrdineRequest request)
    {
        // ...
    }
}
```

`ServiceFilter` è necessario quando il filter ha dipendenze iniettate. `TypeFilter` è l'alternativa quando si vogliono passare argomenti al costruttore.

### Registrazione nel container

I filter con dipendenze vanno registrati nel DI container:

```csharp
builder.Services.AddScoped<AuditFilter>();
builder.Services.AddScoped<ValidazioneModelloFilter>();
```

## Cortocircuito dell'action

Impostando `context.Result` in `OnActionExecuting` (o prima di `await next()` nella versione asincrona), l'action non viene eseguita:

```csharp
public void OnActionExecuting(ActionExecutingContext context)
{
    if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
    {
        context.Result = new UnauthorizedResult();
        // L'action non viene eseguita
    }
}
```

## Ordine di esecuzione dei filter

ASP.NET Core esegue i filter in un ordine preciso:

```
Authorization filter → Resource filter → Action filter → Result filter → Exception filter
```

All'interno dello stesso tipo, l'ordine dipende dalla registrazione. Si può controllare con la proprietà `Order`:

```csharp
builder.Services.AddControllers(options =>
{
    options.Filters.Add<AuditFilter>(order: 1);
    options.Filters.Add<ValidazioneModelloFilter>(order: 2);
});
```

Il filter con `Order` più basso esegue prima nella fase "before" e dopo nella fase "after".

## Filter vs Middleware: quando scegliere

| Scenario | Filter | Middleware |
|---|---|---|
| Accesso agli argomenti dell'action | ✅ | ❌ |
| Accesso al risultato dell'action | ✅ | ❌ |
| Logica su ogni request HTTP | ❌ | ✅ |
| Logica su specifici controller | ✅ | ❌ |
| Dipendenze scoped (es. DbContext) | ✅ | Con `InvokeAsync` |

