---
sidebar_position: 9
description: Librerie per la gestione di code e job in .NET — Hangfire e Quartz.NET a confronto.
---

# Librerie per code e job

Quando i job devono sopravvivere al riavvio del processo o richiedono scheduling avanzato, si usano librerie dedicate. Le due scelte principali nell'ecosistema .NET sono Hangfire e Quartz.NET.

## Hangfire

Hangfire persiste i job su database (SQL Server, PostgreSQL, Redis, altri) e li esegue tramite un server in background. Offre un'interfaccia web di monitoraggio.

### Dipendenze

```bash
dotnet add package Hangfire.AspNetCore
dotnet add package Hangfire.PostgreSql    # o Hangfire.SqlServer, Hangfire.Redis.StackExchange
```

### Configurazione

```csharp
// Program.cs
builder.Services.AddHangfire(config =>
    config
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UsePostgreSqlStorage(o =>
            o.UseNpgsqlConnection(builder.Configuration.GetConnectionString("Hangfire"))));

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = 5;
    options.Queues = ["critical", "default"];
});

// Dashboard (solo ambienti non-produzione, o con autenticazione)
app.UseHangfireDashboard("/hangfire");
```

### Tipi di job

```csharp
// Fire-and-forget — eseguito una volta, subito
BackgroundJob.Enqueue<InviaEmail>(x => x.ExecuteAsync(emailId));

// Ritardato — eseguito dopo un intervallo
BackgroundJob.Schedule<InviaReminderEmail>(
    x => x.ExecuteAsync(ordineId),
    TimeSpan.FromHours(24));

// Ricorrente — eseguito secondo uno schedule cron
RecurringJob.AddOrUpdate<SincronizzaPrezzi>(
    "sincronizza-prezzi",
    x => x.ExecuteAsync(),
    Cron.Hourly);

// Continuazione — eseguito al completamento di un altro job
var jobId = BackgroundJob.Enqueue<GeneraFattura>(x => x.ExecuteAsync(ordineId));
BackgroundJob.ContinueJobWith<InviaFattura>(jobId, x => x.ExecuteAsync(ordineId));
```

### Classi job con DI

I job sono classi normali con dipendenze iniettate dal container:

```csharp
public class SincronizzaPrezzi
{
    private readonly AppDbContext _db;
    private readonly ICatalogoPrezziClient _catalogo;
    private readonly ILogger<SincronizzaPrezzi> _logger;

    public SincronizzaPrezzi(
        AppDbContext db,
        ICatalogoPrezziClient catalogo,
        ILogger<SincronizzaPrezzi> logger)
    {
        _db = db;
        _catalogo = catalogo;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Avvio sincronizzazione prezzi");

        var prezzi = await _catalogo.GetPrezziAsync();

        foreach (var prezzo in prezzi)
        {
            var prodotto = await _db.Prodotti.FindAsync(prezzo.ProdottoId);
            if (prodotto is not null)
                prodotto.AggiornaPrezzzo(prezzo.Valore);
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Sincronizzati {Count} prezzi", prezzi.Count);
    }
}
```

## Quartz.NET

Quartz.NET è più orientato al job scheduling complesso. Offre trigger avanzati, supporto al clustering e separazione esplicita tra job (cosa fare) e trigger (quando farlo).

### Dipendenze

```bash
dotnet add package Quartz.AspNetCore
dotnet add package Quartz.Extensions.Hosting
dotnet add package Quartz.Serialization.Json
```

### Configurazione

```csharp
// Program.cs
builder.Services.AddQuartz(q =>
{
    q.UseMicrosoftDependencyInjectionJobFactory();

    // Job + Trigger nello stesso blocco
    var jobKey = new JobKey("sincronizza-prezzi");

    q.AddJob<SincronizzaPrezziJob>(opts => opts.WithIdentity(jobKey));

    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithIdentity("sincronizza-prezzi-trigger")
        .WithCronSchedule("0 0 * * * ?"));  // ogni ora
});

builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);
```

### Implementazione di un job

```csharp
public class SincronizzaPrezziJob : IJob
{
    private readonly AppDbContext _db;
    private readonly ICatalogoPrezziClient _catalogo;
    private readonly ILogger<SincronizzaPrezziJob> _logger;

    public SincronizzaPrezziJob(
        AppDbContext db,
        ICatalogoPrezziClient catalogo,
        ILogger<SincronizzaPrezziJob> logger)
    {
        _db = db;
        _catalogo = catalogo;
        _logger = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        _logger.LogInformation("Avvio sincronizzazione prezzi");

        var prezzi = await _catalogo.GetPrezziAsync(context.CancellationToken);

        foreach (var prezzo in prezzi)
        {
            var prodotto = await _db.Prodotti.FindAsync(prezzo.ProdottoId);
            if (prodotto is not null)
                prodotto.AggiornaPrezzzo(prezzo.Valore);
        }

        await _db.SaveChangesAsync(context.CancellationToken);
    }
}
```

## Confronto

| Caratteristica | Hangfire | Quartz.NET |
|---|---|---|
| Persistenza | ✅ Database | ✅ Database (opzionale) |
| Dashboard web | ✅ Integrata | ❌ (tool esterni) |
| Fire-and-forget | ✅ Nativo | ❌ (workaround) |
| Continuazioni | ✅ Nativo | ❌ |
| Cron scheduling | ✅ | ✅ |
| Clustering | ✅ | ✅ |
| Separazione job/trigger | ❌ | ✅ |
| Complessità | Bassa | Media |

**Hangfire** è preferibile per job semplici, fire-and-forget e quando si vuole una dashboard senza configurazioni aggiuntive.

**Quartz.NET** è preferibile per scheduling complesso, clustering avanzato o quando la separazione esplicita tra job e trigger è importante.

Per code in-process senza persistenza, vedi [08-code-native](08-code-native.md).

