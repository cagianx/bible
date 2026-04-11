---
sidebar_position: 6
description: Osservabilità in ASP.NET Core con OpenTelemetry — trace, metriche e log.
---

# Osservabilità (OpenTelemetry)

OpenTelemetry (OTel) è lo standard aperto per raccogliere trace, metriche e log. In ASP.NET Core si integra tramite i pacchetti `OpenTelemetry.*` e si esporta verso qualsiasi backend compatibile (Jaeger, Zipkin, Tempo, OTLP).

## Dipendenze

```bash
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Instrumentation.AspNetCore
dotnet add package OpenTelemetry.Instrumentation.Http
dotnet add package OpenTelemetry.Instrumentation.EntityFrameworkCore
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol   # OTLP (Grafana, Jaeger...)
dotnet add package OpenTelemetry.Exporter.Console                  # debug locale
```

## Configurazione base

```csharp
// Program.cs
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .SetResourceBuilder(ResourceBuilder.CreateDefault()
            .AddService(serviceName: "NomeSoluzione", serviceVersion: "1.0.0"))
        .AddAspNetCoreInstrumentation(o =>
        {
            o.RecordException = true;
            o.Filter = ctx => ctx.Request.Path != "/health";
        })
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation(o =>
        {
            o.SetDbStatementForText = true;   // logga la query SQL
        })
        .AddOtlpExporter(o =>
        {
            o.Endpoint = new Uri(builder.Configuration["Otel:Endpoint"]!);
        }))
    .WithMetrics(metrics => metrics
        .SetResourceBuilder(ResourceBuilder.CreateDefault()
            .AddService("NomeSoluzione"))
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddOtlpExporter());
```

## Trace custom

Si creano span custom per operazioni di dominio rilevanti:

```csharp
public class CreaOrdine
{
    private static readonly ActivitySource _activity = new("NomeSoluzione.Ordini");

    private readonly AppDbContext _db;

    public CreaOrdine(AppDbContext db) => _db = db;

    public async Task<Result<OrdineId>> ExecuteAsync(CreaOrdineCommand command)
    {
        using var span = _activity.StartActivity("CreaOrdine");
        span?.SetTag("cliente.id", command.ClienteId.ToString());
        span?.SetTag("ordine.righe", command.Righe.Count);

        try
        {
            var ordine = new Ordine(command.ClienteId, command.Righe);
            _db.Ordini.Add(ordine);
            await _db.SaveChangesAsync();

            span?.SetTag("ordine.id", ordine.Id.ToString());
            span?.SetStatus(ActivityStatusCode.Ok);

            return Result.Ok(ordine.Id);
        }
        catch (Exception ex)
        {
            span?.SetStatus(ActivityStatusCode.Error, ex.Message);
            span?.RecordException(ex);
            throw;
        }
    }
}
```

Registrare il sorgente:

```csharp
.AddSource("NomeSoluzione.Ordini")
```

## Metriche custom

```csharp
public class OrdiniMetrics
{
    private readonly Counter<long> _ordiniCreati;
    private readonly Histogram<double> _tempoElaborazione;

    public OrdiniMetrics(IMeterFactory meterFactory)
    {
        var meter = meterFactory.Create("NomeSoluzione.Ordini");
        _ordiniCreati = meter.CreateCounter<long>("ordini.creati");
        _tempoElaborazione = meter.CreateHistogram<double>(
            "ordini.tempo_elaborazione_ms",
            unit: "ms");
    }

    public void OrdineCreato(string categoria) =>
        _ordiniCreati.Add(1, new KeyValuePair<string, object?>("categoria", categoria));

    public void RegistraElaborazione(double ms) =>
        _tempoElaborazione.Record(ms);
}

// Registrazione
builder.Services.AddSingleton<OrdiniMetrics>();
```

## Health checks

```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database")
    .AddUrlGroup(new Uri("https://servizio-esterno.com/health"), "servizio-esterno");

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

## Configurazione OTLP via appsettings

```json
{
  "Otel": {
    "Endpoint": "http://localhost:4317",
    "ServiceName": "NomeSoluzione"
  }
}
```

## Grafana / Tempo / Loki (stack open source)

Per un ambiente di osservabilità completo in locale con docker compose:

```yaml
services:
  tempo:
    image: grafana/tempo:latest
    ports: ["3200:3200", "4317:4317"]

  loki:
    image: grafana/loki:latest
    ports: ["3100:3100"]

  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
```

I log Serilog si inviano a Loki tramite `Serilog.Sinks.Grafana.Loki`, le trace a Tempo tramite OTLP, le metriche a Prometheus o direttamente a Grafana Mimir.
