---
sidebar_position: 13
description: Exception filter in ASP.NET Core MVC — IExceptionFilter e IAsyncExceptionFilter per la gestione centralizzata degli errori nei controller.
---

# Exception Filter

Gli exception filter intercettano le eccezioni non gestite lanciate da action, action filter e result filter. Sono il meccanismo MVC per centralizzare la gestione degli errori a livello di controller, con accesso al contesto dell'action (routing, argomenti, controller).

Per la gestione a livello di intera pipeline HTTP (inclusi middleware, endpoint non-MVC), si usa invece `IExceptionHandler` o `UseExceptionHandler`. Vedi [10-middleware](10-middleware.md).

## IExceptionFilter (sincrono)

```csharp
public class DomainExceptionFilter : IExceptionFilter
{
    private readonly ILogger<DomainExceptionFilter> _logger;

    public DomainExceptionFilter(ILogger<DomainExceptionFilter> logger)
    {
        _logger = logger;
    }

    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not DomainException domainEx)
            return;  // non gestita: lascia propagare agli altri handler

        _logger.LogWarning(domainEx,
            "Eccezione di dominio in {ActionName}: {Message}",
            context.ActionDescriptor.DisplayName,
            domainEx.Message);

        context.Result = new UnprocessableEntityObjectResult(new ProblemDetails
        {
            Status = StatusCodes.Status422UnprocessableEntity,
            Title = "Regola di dominio violata.",
            Detail = domainEx.Message
        });

        context.ExceptionHandled = true;  // impedisce la propagazione
    }
}
```

## IAsyncExceptionFilter (asincrono)

```csharp
public class ValidationExceptionFilter : IAsyncExceptionFilter
{
    private readonly ILogger<ValidationExceptionFilter> _logger;

    public ValidationExceptionFilter(ILogger<ValidationExceptionFilter> logger)
    {
        _logger = logger;
    }

    public async Task OnExceptionAsync(ExceptionContext context)
    {
        if (context.Exception is not ValidationException validationEx)
            return;

        _logger.LogInformation(
            "Errore di validazione in {ActionName}",
            context.ActionDescriptor.DisplayName);

        // Operazione asincrona (es. lookup su DB per messaggi localizzati)
        var errors = await MapValidationErrorsAsync(validationEx);

        context.Result = new BadRequestObjectResult(new ValidationProblemDetails(errors));
        context.ExceptionHandled = true;
    }

    private Task<Dictionary<string, string[]>> MapValidationErrorsAsync(
        ValidationException ex)
    {
        var errors = ex.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray());

        return Task.FromResult(errors);
    }
}
```

## Registrazione

### Globale

```csharp
// Program.cs
builder.Services.AddControllers(options =>
{
    options.Filters.Add<DomainExceptionFilter>();
    options.Filters.Add<ValidationExceptionFilter>();
});

builder.Services.AddScoped<DomainExceptionFilter>();
builder.Services.AddScoped<ValidationExceptionFilter>();
```

### Tramite attributo

```csharp
[ApiController]
[Route("api/ordini")]
[ServiceFilter(typeof(DomainExceptionFilter))]
public class OrdiniController : ControllerBase { }
```

## Catena di exception filter

Se più exception filter sono registrati, vengono eseguiti in ordine. Il primo che imposta `context.ExceptionHandled = true` interrompe la catena. Questo permette di avere filter specializzati per tipo di eccezione:

```csharp
builder.Services.AddControllers(options =>
{
    // Ordine: prima il più specifico, poi il generico
    options.Filters.Add<ValidationExceptionFilter>(order: 1);
    options.Filters.Add<DomainExceptionFilter>(order: 2);
    options.Filters.Add<GenericExceptionFilter>(order: 3);
});
```

## Limiti degli exception filter

Gli exception filter MVC **non intercettano** eccezioni lanciate da:

- Middleware (prima che la request raggiunga MVC)
- Filter di autorizzazione (`IAuthorizationFilter`)
- Filter di risorse (`IResourceFilter`)
- Routing e model binding (in certi scenari)

Per questi casi si usa `UseExceptionHandler` o `IExceptionHandler`. La strategia raccomandata è combinare i due approcci:

```csharp
// Program.cs
app.UseExceptionHandler();   // cattura tutto ciò che sfugge a MVC

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// Nei controller: exception filter per tipi di eccezione di dominio specifici
builder.Services.AddControllers(options =>
{
    options.Filters.Add<DomainExceptionFilter>();
});
```

## ExceptionHandled e propagazione

| `context.ExceptionHandled` | `context.Result` | Comportamento |
|---|---|---|
| `false` | non impostato | Eccezione si propaga al livello superiore |
| `true` | impostato | Risposta gestita, pipeline termina normalmente |
| `true` | non impostato | Eccezione soppressa, risposta vuota 200 (da evitare) |

Impostare sempre sia `Result` che `ExceptionHandled = true` quando si gestisce un'eccezione.

