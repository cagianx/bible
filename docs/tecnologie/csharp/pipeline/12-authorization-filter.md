---
sidebar_position: 12
description: Authorization filter in ASP.NET Core MVC — IAuthorizationFilter per logica di autorizzazione custom sui controller.
---

# Authorization Filter

Gli authorization filter sono il primo tipo di filter eseguito nella pipeline MVC, prima degli action filter e dell'esecuzione dell'action stessa. Servono a implementare logica di autorizzazione custom che va oltre le policy dichiarative standard di ASP.NET Core.

Per l'autorizzazione basata su ruoli, claim o policy standard, si preferisce sempre il sistema integrato di ASP.NET Core (`[Authorize]`, `IAuthorizationService`, policy). L'authorization filter custom è giustificato quando la logica dipende da dati dinamici o da contesto non accessibile tramite le policy standard.

## IAuthorizationFilter (sincrono)

```csharp
public class ApiKeyAuthorizationFilter : IAuthorizationFilter
{
    private readonly IApiKeyValidator _validator;

    public ApiKeyAuthorizationFilter(IApiKeyValidator validator)
    {
        _validator = validator;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var apiKey = context.HttpContext.Request.Headers["X-API-Key"].FirstOrDefault();

        if (string.IsNullOrEmpty(apiKey) || !_validator.IsValid(apiKey))
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                error = "API key non valida o mancante."
            });
        }
        // Se context.Result non viene impostato, l'esecuzione prosegue
    }
}
```

## IAsyncAuthorizationFilter (asincrono)

```csharp
public class TenantAuthorizationFilter : IAsyncAuthorizationFilter
{
    private readonly AppDbContext _db;

    public TenantAuthorizationFilter(AppDbContext db)
    {
        _db = db;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var tenantId = context.HttpContext.User.FindFirst("tenant_id")?.Value;

        if (string.IsNullOrEmpty(tenantId))
        {
            context.Result = new ForbidResult();
            return;
        }

        var tenant = await _db.Tenants.FindAsync(Guid.Parse(tenantId));

        if (tenant is null || !tenant.IsAttivo)
        {
            context.Result = new ForbidResult();
        }
    }
}
```

## Registrazione

### Globale

```csharp
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ApiKeyAuthorizationFilter>();
});

builder.Services.AddScoped<ApiKeyAuthorizationFilter>();
```

### Tramite attributo su controller o action

```csharp
[ApiController]
[Route("api/webhooks")]
[ServiceFilter(typeof(ApiKeyAuthorizationFilter))]
public class WebhookController : ControllerBase
{
    // ...
}
```

### Come attributo standalone

Per creare un attributo riutilizzabile, si implementa sia il filter che l'attributo:

```csharp
public class RequireApiKeyAttribute : Attribute, IFilterFactory
{
    public bool IsReusable => false;

    public IFilterMetadata CreateInstance(IServiceProvider serviceProvider)
        => serviceProvider.GetRequiredService<ApiKeyAuthorizationFilter>();
}
```

```csharp
[RequireApiKey]
[HttpPost("ricevi")]
public async Task<IActionResult> RiceviWebhook([FromBody] WebhookPayload payload)
{
    // ...
}
```

## Interazione con [AllowAnonymous]

Il filter custom non vede automaticamente `[AllowAnonymous]`. Se si vuole rispettare il comportamento standard, occorre controllarlo esplicitamente:

```csharp
public void OnAuthorization(AuthorizationFilterContext context)
{
    // Rispetta [AllowAnonymous]
    if (context.ActionDescriptor.EndpointMetadata
            .OfType<IAllowAnonymous>().Any())
        return;

    var apiKey = context.HttpContext.Request.Headers["X-API-Key"].FirstOrDefault();

    if (!_validator.IsValid(apiKey))
        context.Result = new UnauthorizedResult();
}
```

## Posizione nella pipeline

Gli authorization filter si eseguono **prima** di tutti gli altri filter:

```
[Authorization filter]  ←  qui
     ↓
Resource filter
     ↓
Action filter
     ↓
Result filter
```

Questo significa che non si deve fare affidamento su valori prodotti da altri filter (es. argomenti dell'action elaborati da resource filter) perché non sono ancora disponibili.

## Quando non usare l'authorization filter

- **Autenticazione** (chi sei) — va gestita nell'autenticazione di ASP.NET Core, non nel filter.
- **Policy dichiarative semplici** — `[Authorize(Roles = "Admin")]` o `[Authorize(Policy = "RequireAdmin")]` sono più espressive e testabili.
- **Logica che dipende dagli argomenti dell'action** — in quel caso è più adatto un action filter, che ha accesso agli argomenti.

