---
sidebar_position: 2
description: Dependency Injection in ASP.NET Core — lifetimes, registrazione, errori tipici e pattern avanzati.
---

# Dependency Injection

ASP.NET Core ha un container DI integrato. Le dipendenze si registrano in `Program.cs` tramite `IServiceCollection` e vengono risolte automaticamente nei costruttori di controller, middleware, use case e qualsiasi classe gestita dal container.

## Lifetimes

Il lifetime determina per quanto tempo il container mantiene in vita un'istanza.

| Lifetime | Durata | Metodo di registrazione |
|----------|--------|------------------------|
| **Singleton** | Per tutta la vita dell'applicazione | `AddSingleton<T>` |
| **Scoped** | Per la durata di una richiesta HTTP | `AddScoped<T>` |
| **Transient** | Una nuova istanza ad ogni risoluzione | `AddTransient<T>` |

```csharp
builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<IOrderUseCase, OrderUseCase>();
builder.Services.AddTransient<IPdfGenerator, PdfGenerator>();
```

### Quando usare quale lifetime

**Singleton** — per servizi stateless, thread-safe, costosi da costruire: cache in memoria, client HTTP (tramite `IHttpClientFactory`), configurazione letta una volta.

**Scoped** — per tutto ciò che deve vivere per la durata di una richiesta: `DbContext`, use case, repository. È il lifetime più comune.

**Transient** — per servizi leggeri e stateless che non devono essere condivisi: validator, helper di trasformazione.

## Il bug del captive dependency

Un singleton non può dipendere da un servizio scoped. Il container risolve le dipendenze del singleton **una volta sola** all'avvio: il servizio scoped viene creato e tenuto vivo per sempre, uscendo dal suo ciclo di vita previsto.

```csharp
// ❌ Singleton che cattura uno scoped — bug sottile
public class NotificationService
{
    private readonly AppDbContext _db; // scoped, ma vive come singleton

    public NotificationService(AppDbContext db) // catturato alla prima risoluzione
    {
        _db = db;
    }
}

builder.Services.AddSingleton<NotificationService>(); // sbagliato
```

ASP.NET Core in modalità development lancia un'eccezione alla prima risoluzione. In produzione il comportamento è indefinito: il `DbContext` catturato può essere già disposed o contenere dati stantii.

**Soluzione**: iniettare `IServiceScopeFactory` e creare uno scope manualmente quando serve un servizio scoped da un singleton.

```csharp
public class NotificationService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public NotificationService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task InviaAsync(int ordineId, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // db è scoped all'interno di questo using
        var ordine = await db.Ordini.FindAsync([ordineId], ct);
        // ...
    }
}
```

## Registrazione con factory

Quando la costruzione di un servizio richiede logica non banale, si usa una factory:

```csharp
builder.Services.AddSingleton<IEmailSender>(sp =>
{
    var config = sp.GetRequiredService<IOptions<EmailOptions>>().Value;
    return config.UseFakeInDev
        ? new FakeEmailSender()
        : new SmtpEmailSender(config.Host, config.Port);
});
```

## Keyed services (.NET 8+)

Con più implementazioni della stessa interfaccia si usano i keyed services per disambiguare senza wrapper artificiali:

```csharp
builder.Services.AddKeyedSingleton<IStorageProvider, LocalStorageProvider>("local");
builder.Services.AddKeyedSingleton<IStorageProvider, AzureBlobProvider>("azure");
```

```csharp
public class UploadService
{
    private readonly IStorageProvider _storage;

    public UploadService([FromKeyedServices("azure")] IStorageProvider storage)
    {
        _storage = storage;
    }
}
```

## Validazione della configurazione del container

In development, la validazione degli scope è attiva per impostazione predefinita. Si può abilitare esplicitamente anche in produzione per intercettare errori di registrazione all'avvio anziché a runtime:

```csharp
builder.Host.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = true;
    options.ValidateOnBuild = true; // verifica al build del container, prima di ricevere richieste
});
```
