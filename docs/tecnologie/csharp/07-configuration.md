---
sidebar_position: 7
description: Configurazione tipizzata in ASP.NET Core con IOptions, IOptionsMonitor e validazione automatica.
---

# Configurazione tipizzata

ASP.NET Core offre un sistema di configurazione basato su `IOptions<T>` che trasforma le sezioni di `appsettings.json` in oggetti C# tipizzati. L'obiettivo è eliminare le stringhe magiche e rendere esplicite le dipendenze dalla configurazione.

## Pattern base: IOptions\<T\>

```csharp
// Options class
public class EmailOptions
{
    public const string SectionName = "Email";

    public string SmtpHost { get; init; } = string.Empty;
    public int SmtpPort { get; init; } = 587;
    public string SenderAddress { get; init; } = string.Empty;
    public string SenderName { get; init; } = string.Empty;
}
```

```json
// appsettings.json
{
  "Email": {
    "SmtpHost": "smtp.example.com",
    "SmtpPort": 587,
    "SenderAddress": "noreply@example.com",
    "SenderName": "Example App"
  }
}
```

```csharp
// Program.cs — registrazione
builder.Services.Configure<EmailOptions>(
    builder.Configuration.GetSection(EmailOptions.SectionName));
```

```csharp
// Utilizzo nel servizio
public class EmailSender
{
    private readonly EmailOptions _options;

    public EmailSender(IOptions<EmailOptions> options)
    {
        _options = options.Value;
    }
}
```

## IOptionsMonitor\<T\> — configurazione hot-reload

`IOptions<T>` legge la configurazione una sola volta all'avvio. `IOptionsMonitor<T>` ricarica il valore ogni volta che `appsettings.json` cambia su disco:

```csharp
public class FeatureSwitchService
{
    private readonly IOptionsMonitor<FeatureSwitchOptions> _monitor;

    public FeatureSwitchService(IOptionsMonitor<FeatureSwitchOptions> monitor)
    {
        _monitor = monitor;
    }

    public bool IsEnabled(string feature) =>
        _monitor.CurrentValue.EnabledFeatures.Contains(feature);
}
```

`IOptionsSnapshot<T>` è una via di mezzo: ricalcola il valore per ogni request HTTP (scoped), ma non notifica in tempo reale come `IOptionsMonitor<T>`.

| Interfaccia | Ciclo di vita | Quando ricaricare |
|---|---|---|
| `IOptions<T>` | Singleton | Mai — valore fisso all'avvio |
| `IOptionsSnapshot<T>` | Scoped | Ad ogni request |
| `IOptionsMonitor<T>` | Singleton | Quando il file cambia su disco |

## Validazione con DataAnnotations

```csharp
using System.ComponentModel.DataAnnotations;

public class EmailOptions
{
    public const string SectionName = "Email";

    [Required]
    public string SmtpHost { get; init; } = string.Empty;

    [Range(1, 65535)]
    public int SmtpPort { get; init; } = 587;

    [Required, EmailAddress]
    public string SenderAddress { get; init; } = string.Empty;
}
```

```csharp
// Program.cs — validazione attivata esplicitamente
builder.Services
    .AddOptions<EmailOptions>()
    .BindConfiguration(EmailOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();  // fallisce al boot se la configurazione non è valida
```

`ValidateOnStart()` fa fallire l'avvio dell'applicazione se le opzioni non passano la validazione — invece di fallire alla prima request. È il comportamento preferito: meglio un avvio che fallisce subito che un errore silenzioso in produzione.

## Validazione custom con IValidateOptions

Per regole più complesse che coinvolgono più campi:

```csharp
public class EmailOptionsValidator : IValidateOptions<EmailOptions>
{
    public ValidateOptionsResult Validate(string? name, EmailOptions options)
    {
        var errors = new List<string>();

        if (options.SmtpPort == 465 && !options.UseSsl)
            errors.Add("La porta 465 richiede SSL abilitato.");

        if (options.SenderAddress == options.ReplyToAddress)
            errors.Add("SenderAddress e ReplyToAddress non possono coincidere.");

        return errors.Count > 0
            ? ValidateOptionsResult.Fail(errors)
            : ValidateOptionsResult.Success;
    }
}

// Registrazione
builder.Services.AddSingleton<IValidateOptions<EmailOptions>, EmailOptionsValidator>();
```

## Configurazione per ambiente

Si usa il meccanismo di override di ASP.NET Core: `appsettings.Production.json` sovrascrive i valori di `appsettings.json`:

```json
// appsettings.Development.json
{
  "Email": {
    "SmtpHost": "localhost",
    "SmtpPort": 1025
  }
}
```

```json
// appsettings.Production.json
{
  "Email": {
    "SmtpHost": "smtp.sendgrid.net",
    "SmtpPort": 587
  }
}
```

I segreti (password, connection string, API key) non vanno mai in `appsettings.json`. Si usano variabili d'ambiente o un secret manager. Vedi [regole/configurazione](../../regole/configurazione.md).

## Organizzazione consigliata

Ogni sezione di configurazione ha la sua classe `Options` nella stessa cartella del servizio che la usa:

```
NomeSoluzione.Api/
├── Email/
│   ├── EmailSender.cs
│   └── EmailOptions.cs
├── Storage/
│   ├── BlobStorageService.cs
│   └── BlobStorageOptions.cs
```

La costante `SectionName` nella classe `Options` evita stringhe duplicate tra registrazione e `appsettings.json`.

