---
sidebar_position: 18
description: Validazione dell'input in ASP.NET Core — DataAnnotations, FluentValidation e integrazione con ValidationProblemDetails.
---

# Validazione

La validazione avviene **al confine del sistema**: dove i dati entrano dall'esterno — il controller o il minimal API endpoint. All'interno del dominio i dati sono già considerati validi; ripetere le stesse validazioni nella business logic è codice difensivo da evitare.

## DataAnnotations

Approccio built-in: attributi direttamente sulla classe DTO.

```csharp
public record CreaOrdineRequest
{
    [Required]
    public string ClienteId { get; init; } = "";

    [Range(1, 10_000)]
    public decimal Importo { get; init; }

    [MaxLength(500)]
    public string? Note { get; init; }
}
```

ASP.NET Core valida automaticamente il modello prima di eseguire il controller. Se la validazione fallisce, restituisce `400 Bad Request` con un `ValidationProblemDetails` (RFC 9457) senza che il controller venga mai chiamato.

Adatto per regole semplici su singoli campi. Diventa difficile da gestire con regole condizionali, dipendenze tra campi o messaggi di errore personalizzati.

## FluentValidation

Per regole non banali si usa **FluentValidation**: i validator sono classi separate, testabili indipendentemente, con un'API fluente espressiva.

```csharp
public class CreaOrdineValidator : AbstractValidator<CreaOrdineRequest>
{
    public CreaOrdineValidator()
    {
        RuleFor(x => x.ClienteId)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Importo)
            .GreaterThan(0)
            .LessThanOrEqualTo(10_000)
            .WithMessage("L'importo deve essere tra 0 e 10.000.");

        RuleFor(x => x.DataConsegna)
            .GreaterThan(DateTime.Today)
            .When(x => x.DataConsegna.HasValue)
            .WithMessage("La data di consegna deve essere futura.");
    }
}
```

Registrazione e integrazione con `ModelState`:

```csharp
// Program.cs
builder.Services
    .AddFluentValidationAutoValidation()
    .AddValidatorsFromAssemblyContaining<CreaOrdineValidator>();
```

Con `AddFluentValidationAutoValidation()` la validazione è automatica come con DataAnnotations: il controller non viene eseguito se il modello non è valido, e la risposta è sempre un `ValidationProblemDetails`.

## Risposta di errore

La risposta automatica in caso di validazione fallita segue il formato `ValidationProblemDetails`:

```json
{
  "type": "https://tools.ietf.org/html/rfc9457",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "importo": ["L'importo deve essere tra 0 e 10.000."],
    "clienteId": ["'Cliente Id' must not be empty."]
  }
}
```

Vedi [14-problem-details](14-problem-details.md) per la configurazione del formato degli errori.

## Validazione manuale

Quando si vuole controllare esplicitamente il flusso — ad esempio per restituire un errore di dominio anziché 400 — si inietta il validator e si chiama `ValidateAsync`:

```csharp
[HttpPost]
public async Task<IActionResult> Crea(
    [FromBody] CreaOrdineRequest request,
    [FromServices] IValidator<CreaOrdineRequest> validator,
    CancellationToken ct)
{
    var risultato = await validator.ValidateAsync(request, ct);
    if (!risultato.IsValid)
    {
        risultato.AddToModelState(ModelState, null);
        return ValidationProblem(ModelState);
    }

    var esito = await _useCase.EseguiAsync(request, ct);
    return Ok(esito);
}
```

## DataAnnotations o FluentValidation?

| Caso | Scelta consigliata |
|------|-------------------|
| Regole semplici su singoli campi | DataAnnotations |
| Regole condizionali o tra campi | FluentValidation |
| Messaggi di errore personalizzati | FluentValidation |
| Validazione testabile in isolamento | FluentValidation |
| Progetto già con FluentValidation | FluentValidation (uniformità) |

Non si mischiano i due approcci sullo stesso DTO: si sceglie uno e si mantiene per tutto il progetto.
