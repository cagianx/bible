---
sidebar_position: 3
description: Organizzazione interna del progetto Core secondo Screaming Architecture — cartelle per dominio, domain service, validator e DI extension per ogni dominio.
---

# Organizzazione di Core

Si organizza per **dominio**, non per tipo tecnico (Screaming Architecture):

```
NomeSoluzione.Core/
├── Ordini/
│   ├── GestoreScorte.cs                       # Domain service
│   ├── OrdineValidator.cs                     # Validator
│   └── OrdiniServiceCollectionExtensions.cs   # services.AddOrdini()
├── Clienti/
│   ├── ClienteValidator.cs
│   └── ClientiServiceCollectionExtensions.cs
└── UseCases/                                  # comandi completi — vedi 04-usecases
    ├── Ordini/
    │   ├── CreaOrdine.cs
    │   └── ConfermaOrdine.cs
    ├── Clienti/
    │   └── RegistraCliente.cs
    └── Shared/
        └── IUseCase.cs
```

Ogni cartella di dominio contiene **comportamento**: domain service, validator, e l'extension method che ne registra le dipendenze. Le entità sono in [Db](02-dipendenze.md), i DTO ed enum sono in [Models](07-models.md), i comandi sono in `UseCases/`.

❌ Da evitare:
```
Core/
├── Services/
├── Handlers/
└── Models/
```

Aprire il progetto e vedere `Ordini/`, `Fatturazione/`, `Clienti/` dice immediatamente cosa fa il sistema. Vedere `Services/`, `Handlers/`, `Models/` non dice nulla sul dominio — descrive solo come è costruito tecnicamente.

## DI per dominio

Ogni cartella di dominio espone un extension method che registra tutte le proprie dipendenze:

```csharp
// Core/Ordini/OrdiniServiceCollectionExtensions.cs
public static class OrdiniServiceCollectionExtensions
{
    public static IServiceCollection AddOrdini(this IServiceCollection services)
    {
        services.AddScoped<GestoreScorte>();
        services.AddScoped<CreaOrdine>();
        services.AddScoped<ConfermaOrdine>();
        services.AddScoped<IValidator<CreaOrdineDto>, OrdineValidator>();
        return services;
    }
}
```

Il composition root in Api compone i domini senza conoscerne i dettagli interni:

```csharp
// Api/Program.cs
builder.Services.AddOrdini();
builder.Services.AddClienti();
```

Quando un dominio si sposta o si rimuove, si porta dietro le proprie registrazioni. `Program.cs` resta una sequenza di chiamate ad alto livello.
