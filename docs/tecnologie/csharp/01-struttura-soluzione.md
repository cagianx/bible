---
sidebar_position: 1
description: Struttura ideale di una solution .NET, convenzioni di naming e organizzazione AI-friendly.
---

# Struttura della Solution

## Struttura minima

```
NomeSoluzione/
├── NomeSoluzione.sln
├── src/
│   ├── NomeSoluzione.Core/          # Business logic, entità, interfacce
│   ├── NomeSoluzione.Db/            # EF DbContext, migration, configurazioni
│   └── NomeSoluzione.Api/           # ASP.NET Core — entry point HTTP
└── tests/
    └── NomeSoluzione.Tests/         # Test di integrazione
```

Ogni progetto aggiuntivo (Worker, Console, Job) segue lo stesso schema: dipende da `Core`, non da `Db` direttamente salvo necessità.

## Dipendenze

```
Api  ──▶  Core  ◀──  Db
Tests ──▶ Core
Tests ──▶ Db
```

`Core` non dipende da nessuno. `Db` dipende da `Core` (implementa le sue interfacce). `Api` dipende da `Core` e registra le dipendenze concrete via DI.

## Organizzazione interna di Core

Si organizza per **dominio**, non per tipo tecnico (Screaming Architecture):

```
NomeSoluzione.Core/
├── Ordini/
│   ├── Ordine.cs                    # Entity
│   ├── OrdineStato.cs               # Enum di dominio
│   ├── CreaOrdine.cs                # IUseCase
│   ├── ConfermaOrdine.cs            # IUseCase
│   └── GestoreScorte.cs             # Domain service
├── Clienti/
│   ├── Cliente.cs
│   └── RegistraCliente.cs
└── Shared/
    ├── IUseCase.cs
    └── Result.cs
```

❌ Da evitare:
```
Core/
├── Services/
├── Repositories/
└── Models/
```

## Convenzioni AI-friendly

Una solution ben strutturata è leggibile non solo dagli sviluppatori ma anche dall'IA che ci lavora. Le convenzioni che seguono massimizzano la comprensibilità contestuale senza richiedere spiegazioni aggiuntive.

### Naming esplicito

I nomi descrivono l'intenzione, non il tipo:

```csharp
// ✅ Il nome dice cosa fa
public class CreaOrdine : IUseCase<CreaOrdineCommand, OrdineId> { }
public class ConfermaOrdine : IUseCase<ConfermaOrdineCommand> { }
public class GestoreScorte { }

// ❌ Il nome dice cosa è, non cosa fa
public class OrdineService { }
public class OrdineManager { }
```

### Un file, una responsabilità

Ogni file contiene una sola classe. Il nome del file coincide con il nome della classe.

```
CreaOrdine.cs        → class CreaOrdine
OrdineStato.cs       → enum OrdineStato
CreaOrdineCommand.cs → record CreaOrdineCommand
```

### Record per comandi e DTO

I comandi e i DTO si esprimono come `record`, immutabili per costruzione:

```csharp
public record CreaOrdineCommand(Guid ClienteId, IReadOnlyList<RigaOrdine> Righe);
public record RigaOrdine(Guid ProdottoId, int Quantita);
```

### Interfacce solo dove necessario

Un'interfaccia si introduce quando serve sostituibilità reale (test, implementazioni multiple). Non si crea un'interfaccia per ogni classe per abitudine:

```csharp
// ✅ Interfaccia che ha senso: più implementazioni possibili
public interface IEmailSender { Task SendAsync(Email email); }

// ❌ Interfaccia inutile: esiste solo GestoreScorte
public interface IGestoreScorte { }
public class GestoreScorte : IGestoreScorte { }
```

### Program.cs minimal

`Program.cs` registra le dipendenze e avvia l'app. Non contiene logica:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, cfg) => cfg.ReadFrom.Configuration(ctx.Configuration));

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<CreaOrdine>();
builder.Services.AddScoped<ConfermaOrdine>();
builder.Services.AddScoped<GestoreScorte>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

Per solution con molte dipendenze, si usano extension method per raggruppare le registrazioni:

```csharp
// Infrastructure/ServiceCollectionExtensions.cs
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDomainServices(this IServiceCollection services)
    {
        services.AddScoped<CreaOrdine>();
        services.AddScoped<ConfermaOrdine>();
        services.AddScoped<GestoreScorte>();
        return services;
    }
}
```
