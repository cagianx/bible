---
sidebar_position: 5
description: Logging in ASP.NET Core con ILogger, Serilog e i sink più comuni.
---

# Logging

Il logging in ASP.NET Core si basa sull'astrazione `Microsoft.Extensions.Logging`. Serilog è il backend raccomandato: ricco di sink, configurabile da `appsettings.json`, e supporta log strutturati nativamente.

Vedi anche: [regole/logging](../../regole/logging.md).

## Dipendenze

```bash
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Settings.Configuration
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File
dotnet add package Serilog.Sinks.Seq              # opzionale, sviluppo locale
dotnet add package Serilog.Sinks.ApplicationInsights  # opzionale, Azure
```

## Configurazione in Program.cs

```csharp
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));
```

Tutta la configurazione vive in `appsettings.json` — nessun hardcoding nel codice:

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.EntityFrameworkCore": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      { "Name": "Console" },
      {
        "Name": "File",
        "Args": {
          "path": "logs/app-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30
        }
      }
    ],
    "Enrich": ["FromLogContext", "WithMachineName", "WithThreadId"]
  }
}
```

## Utilizzo con ILogger\<T\>

```csharp
public class CreaOrdine
{
    private readonly ILogger<CreaOrdine> _logger;
    private readonly AppDbContext _db;

    public CreaOrdine(ILogger<CreaOrdine> logger, AppDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    public async Task<Result<OrdineId>> ExecuteAsync(CreaOrdineCommand command)
    {
        _logger.LogInformation(
            "Creazione ordine per cliente {ClienteId} con {NumeroRighe} righe",
            command.ClienteId, command.Righe.Count);

        try
        {
            // ...
            _logger.LogInformation("Ordine {OrdineId} creato", ordine.Id);
            return Result.Ok(ordine.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Errore durante la creazione dell'ordine per cliente {ClienteId}",
                command.ClienteId);
            throw;
        }
    }
}
```

## Log strutturati: la regola fondamentale

I valori si passano come parametri, mai con interpolazione di stringa:

```csharp
// ✅ Log strutturato — il valore è una proprietà ricercabile
_logger.LogInformation("Ordine {OrdineId} confermato per {ClienteId}", ordineId, clienteId);

// ❌ Interpolazione — perde la struttura, alloca inutilmente
_logger.LogInformation($"Ordine {ordineId} confermato per {clienteId}");
```

## Decorare le eccezioni per troubleshooting

Catturare e rethrow con contesto aggiunto è buona pratica quando si vuole arricchire l'eccezione con informazioni di dominio:

```csharp
catch (DbUpdateException ex)
{
    throw new InvalidOperationException(
        $"Errore nel salvataggio dell'ordine per cliente {command.ClienteId}. " +
        $"Righe: {command.Righe.Count}", ex);
}
```

## Log request/response con middleware

Per loggare le richieste HTTP in ingresso:

```csharp
// Program.cs
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate =
        "HTTP {RequestMethod} {RequestPath} risposto {StatusCode} in {Elapsed:0.0000}ms";

    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent);
        diagnosticContext.Set("RemoteIP", httpContext.Connection.RemoteIpAddress);
        diagnosticContext.Set("UserId",
            httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
    };
});
```

## Sink comuni

### Seq (sviluppo locale)

```json
{
  "WriteTo": [
    {
      "Name": "Seq",
      "Args": { "serverUrl": "http://localhost:5341" }
    }
  ]
}
```

### Application Insights (Azure)

```bash
dotnet add package Serilog.Sinks.ApplicationInsights
```

```json
{
  "WriteTo": [
    {
      "Name": "ApplicationInsights",
      "Args": {
        "connectionString": "InstrumentationKey=...",
        "telemetryConverter": "Serilog.Sinks.ApplicationInsights.TelemetryConverters.TraceTelemetryConverter, Serilog.Sinks.ApplicationInsights"
      }
    }
  ]
}
```

### OpenTelemetry (OTLP)

```bash
dotnet add package Serilog.Sinks.OpenTelemetry
```

```json
{
  "WriteTo": [
    {
      "Name": "OpenTelemetry",
      "Args": {
        "endpoint": "http://localhost:4317",
        "protocol": "Grpc"
      }
    }
  ]
}
```

## Livelli in produzione

In produzione si innalza il livello minimo a `Warning` per ridurre il volume, lasciando `Information` solo per i componenti critici:

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Warning",
      "Override": {
        "NomeSoluzione": "Information"
      }
    }
  }
}
```
