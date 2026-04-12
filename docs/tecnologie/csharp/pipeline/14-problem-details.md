---
sidebar_position: 14
description: RFC 9457 Problem Details — standard per le risposte di errore strutturate nelle API HTTP.
---

# Problem Details (RFC 9457)

RFC 9457 standardizza il formato delle risposte di errore nelle API HTTP tramite il media type `application/problem+json`. ASP.NET Core offre il tipo `ProblemDetails` e `ProblemDetailsOptions` per implementare questo standard in modo coerente.

Lo standard garantisce che i client ricevano errori in un formato prevedibile, senza sorprese nella struttura della risposta.

## Struttura base

```json
{
  "type": "https://example.com/problems/out-of-credit",
  "title": "Credito insufficiente",
  "status": 402,
  "detail": "L'account 12345 non ha credito sufficiente per eseguire l'operazione.",
  "instance": "/accounts/12345/msgs/abc",
  "balance": 30,
  "accounts": ["/accounts/12345", "/accounts/67890"]
}
```

| Campo | Obbligatorio | Descrizione |
|---|---|---|
| `type` | No | URI che identifica il tipo di problema (es. namespace univoco) |
| `title` | No | Titolo leggibile breve del problema |
| `status` | No | HTTP status code (duplicato da quello della response) |
| `detail` | No | Descrizione specifica del problema per questo caso |
| `instance` | No | URI che identifica l'istanza specifica del problema (es. il path della richiesta) |
| Campi custom | No | Proprietà aggiuntive rilevanti al tipo di errore |

## Configurazione in ASP.NET Core

ASP.NET Core offre `AddProblemDetails()` per configurare il comportamento globale:

```csharp
// Program.cs
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        var httpContext = context.HttpContext;
        var exception = context.Exception;

        context.ProblemDetails.Instance = $"{httpContext.Request.Method} {httpContext.Request.Path}";

        if (exception is ValidationException validationEx)
        {
            context.ProblemDetails.Type = "https://api.example.com/problems/validation-error";
            context.ProblemDetails.Title = "Errore di validazione";
            context.ProblemDetails.Extensions["errors"] = validationEx.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());
        }
        else if (exception is KeyNotFoundException)
        {
            context.ProblemDetails.Type = "https://api.example.com/problems/not-found";
            context.ProblemDetails.Title = "Risorsa non trovata";
            context.ProblemDetails.Status = StatusCodes.Status404NotFound;
        }
        else if (exception is null)
        {
            // Eccezione non gestita e non nota
            context.ProblemDetails.Type = "https://api.example.com/problems/internal-error";
            context.ProblemDetails.Title = "Errore interno del server";
        }
    };
});

app.UseExceptionHandler();
app.UseProblemDetails();
```

## Exception Handler personalizzato

Per un controllo ancora maggiore, si implementa `IExceptionHandler`:

```csharp
public class ProblemDetailsExceptionHandler : IExceptionHandler
{
    private readonly ILogger<ProblemDetailsExceptionHandler> _logger;

    public ProblemDetailsExceptionHandler(ILogger<ProblemDetailsExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Eccezione non gestita");

        var problemDetails = new ProblemDetails
        {
            Type = GetProblemType(exception),
            Title = GetTitle(exception),
            Status = GetStatusCode(exception),
            Detail = exception.Message,
            Instance = $"{httpContext.Request.Method} {httpContext.Request.Path}"
        };

        // Aggiungi proprietà custom in base al tipo di eccezione
        if (exception is ValidationException validationEx)
        {
            problemDetails.Extensions["errors"] = validationEx.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());
        }

        httpContext.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }

    private static string GetProblemType(Exception ex) => ex switch
    {
        ValidationException => "https://api.example.com/problems/validation-error",
        KeyNotFoundException => "https://api.example.com/problems/not-found",
        UnauthorizedAccessException => "https://api.example.com/problems/unauthorized",
        _ => "https://api.example.com/problems/internal-error"
    };

    private static string GetTitle(Exception ex) => ex switch
    {
        ValidationException => "Errore di validazione",
        KeyNotFoundException => "Risorsa non trovata",
        UnauthorizedAccessException => "Non autorizzato",
        _ => "Errore interno del server"
    };

    private static int GetStatusCode(Exception ex) => ex switch
    {
        ValidationException => StatusCodes.Status422UnprocessableEntity,
        KeyNotFoundException => StatusCodes.Status404NotFound,
        UnauthorizedAccessException => StatusCodes.Status403Forbidden,
        _ => StatusCodes.Status500InternalServerError
    };
}
```

```csharp
// Program.cs
builder.Services.AddExceptionHandler<ProblemDetailsExceptionHandler>();
app.UseExceptionHandler();
```

## Validation Problem Details

ASP.NET Core offre `ValidationProblemDetails` per errori di validazione:

```csharp
[ApiController]
[Route("api/ordini")]
public class OrdiniController : ControllerBase
{
    [HttpPost]
    public IActionResult Crea([FromBody] CreaOrdineRequest request)
    {
        // Validazione manuale
        var errors = new Dictionary<string, string[]>();

        if (request.Quantita <= 0)
            errors["quantita"] = ["La quantità deve essere maggiore di 0"];

        if (string.IsNullOrWhiteSpace(request.Note) && request.Note!.Length > 500)
            errors["note"] = ["Le note non possono superare 500 caratteri"];

        if (errors.Count > 0)
        {
            return UnprocessableEntity(new ValidationProblemDetails(errors)
            {
                Type = "https://api.example.com/problems/validation-error",
                Title = "Uno o più campi non sono validi"
            });
        }

        // ... resto della logica
        return Ok();
    }
}
```

## ModelState e validazione automatica

ASP.NET Core valida automaticamente il modello prima che l'action venga eseguita. Se il modello non è valido, `ModelState` contiene gli errori. È buona pratica controllare `ModelState` e restituire una risposta standardizzata:

```csharp
[ApiController]
[Route("api/ordini")]
public class OrdiniController : ControllerBase
{
    [HttpPost]
    public IActionResult Crea([FromBody] CreaOrdineRequest request)
    {
        // Validazione del modello — se non valido, ModelState contiene gli errori
        if (!ModelState.IsValid)
        {
            // BadRequest automaticamente restituisce 400 con ValidationProblemDetails
            return BadRequest(ModelState);
        }

        // Se arriviamo qui, il modello è garantito valido
        // ... resto della logica
        return CreatedAtAction(nameof(GetById), new { id = ordine.Id }, ordine);
    }
}
```

### Filter globale per ModelState

È meglio automatizzare il controllo di `ModelState` tramite un **action filter** registrato globalmente, così non devi ripeterlo in ogni action:

```csharp
public class ValidazioneModelloFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            // Estrai gli errori da ModelState e trasformali in ValidationProblemDetails
            var errors = new Dictionary<string, string[]>();

            foreach (var modelState in context.ModelState.Values)
            {
                foreach (var error in modelState.Errors)
                {
                    var key = context.ModelState.Keys.FirstOrDefault(
                        k => context.ModelState[k] == modelState) ?? "unknown";

                    if (!errors.ContainsKey(key))
                        errors[key] = [];

                    errors[key] = errors[key]
                        .Append(error.ErrorMessage)
                        .ToArray();
                }
            }

            context.Result = new BadRequestObjectResult(
                new ValidationProblemDetails(errors)
                {
                    Type = "https://api.example.com/problems/validation-error",
                    Title = "Uno o più campi non sono validi"
                });
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}
```

Registra il filter globalmente:

```csharp
// Program.cs
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidazioneModelloFilter>();
});
```

Con il filter, le action diventano più leggere:

```csharp
[HttpPost]
public IActionResult Crea([FromBody] CreaOrdineRequest request)
{
    // ModelState è garantito valido qui — il filter ha già controllato
    // ... logica direttamente senza controlli di validazione
    return CreatedAtAction(nameof(GetById), new { id = ordine.Id }, ordine);
}
```

### Struttura della risposta 400 Bad Request

Quando `ModelState` non è valido, la risposta è un `ValidationProblemDetails`:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "quantita": [
      "The field Quantita must be between 1 and 999.",
      "La quantità deve essere positiva"
    ],
    "clienteId": [
      "The ClienteId field is required."
    ]
  }
}
```

I singoli errori per campo si trovano nella proprietà `errors` (non `extensions`).

### Data Annotations per la validazione

Usa le Data Annotations sul modello per la validazione dichiarativa:

```csharp
public record CreaOrdineRequest
{
    [Required(ErrorMessage = "Il cliente è obbligatorio")]
    public Guid ClienteId { get; init; }

    [Range(1, 999, ErrorMessage = "La quantità deve essere tra 1 e 999")]
    public int Quantita { get; init; }

    [StringLength(500, ErrorMessage = "Le note non possono superare 500 caratteri")]
    public string? Note { get; init; }

    [EmailAddress(ErrorMessage = "Email non valida")]
    public string? EmailContatto { get; init; }
}
```

ASP.NET Core valida automaticamente questi vincoli e popola `ModelState` senza alcun codice aggiuntivo nell'action.

### Validazione custom con IValidatableObject

Per logica che coinvolge più campi, implementa `IValidatableObject`:

```csharp
public record CreaOrdineRequest : IValidatableObject
{
    public Guid ClienteId { get; init; }
    public int Quantita { get; init; }
    public DateTime DataConsegna { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (DataConsegna < DateTime.UtcNow.AddDays(1))
            yield return new ValidationResult(
                "La data di consegna deve essere almeno domani",
                new[] { nameof(DataConsegna) });

        if (ClienteId == Guid.Empty)
            yield return new ValidationResult(
                "Il cliente è obbligatorio",
                new[] { nameof(ClienteId) });
    }
}
```

I `ValidationResult` restituiti si aggiungono automaticamente a `ModelState`.

## Confronto con le vecchie abitudini

| Approccio | Problema |
|---|---|
| ❌ `{ "error": "qualcosa è andato male" }` | Generico, non strutturato, difficile per i client |
| ❌ `{ "code": "ERR_001", "message": "..." }` | Proprietario, non è uno standard, client confuso |
| ✅ `{ "type": "...", "title": "...", "status": 422, "detail": "..." }` | Standard RFC 9457, prevedibile, documentato |

## Best practices

1. **Sempre usare `type` per identificare la categoria di errore**, non il testo di `title`:
   ```json
   {
     "type": "https://api.example.com/problems/rate-limit-exceeded",
     "title": "Limite di rate raggiunto"
   }
   ```
   Il client può verificare `type` per reazioni programmatiche (retry, exponential backoff, ecc.).

2. **`instance` dev'essere l'URL della richiesta fallita**, così il client sa su cosa stava lavorando:
   ```json
   "instance": "POST /api/ordini"
   ```

3. **Usa `status` coerente con lo HTTP status code della response**.

4. **Campi custom in `extensions`**, non al livello top-level:
   ```json
   {
     "type": "...",
     "title": "...",
     "extensions": {
       "balance": 30,
       "errors": { "quantita": ["..."] }
     }
   }
   ```

5. **Documento il tuo catalogo di `type`** in una pagina dedicata (es. `/docs/api/error-codes`), così i client sanno cosa aspettarsi.

Vedi anche: [regole/gestione-errori](../../../regole/gestione-errori.md) · [13-exception-filter](13-exception-filter.md) · [10-middleware](10-middleware.md).


