---
sidebar_position: 5
description: Convenzioni per una solution .NET leggibile da sviluppatori e agenti IA — naming esplicito, un file per classe, record per comandi e DTO, interfacce solo dove necessario, Program.cs minimal.
---

# Convenzioni

Una solution ben strutturata è leggibile non solo dagli sviluppatori ma anche dall'IA che ci lavora. Le convenzioni che seguono massimizzano la comprensibilità contestuale senza richiedere spiegazioni aggiuntive.

## Naming esplicito

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

## Un file, una responsabilità

Ogni file contiene una sola classe. Il nome del file coincide con il nome della classe.

```
CreaOrdine.cs        → class CreaOrdine
OrdineStato.cs       → enum OrdineStato
CreaOrdineCommand.cs → record CreaOrdineCommand
```

## Record per comandi e DTO

I comandi e i DTO si esprimono come `record`, immutabili per costruzione:

```csharp
public record CreaOrdineCommand(Guid ClienteId, IReadOnlyList<RigaOrdine> Righe);
public record RigaOrdine(Guid ProdottoId, int Quantita);
```

## Interfacce solo dove necessario

Un'interfaccia si introduce quando serve sostituibilità reale (test, implementazioni multiple). Non si crea un'interfaccia per ogni classe per abitudine:

```csharp
// ✅ Interfaccia che ha senso: più implementazioni possibili
public interface IEmailSender { Task SendAsync(Email email); }

// ❌ Interfaccia inutile: esiste solo GestoreScorte
public interface IGestoreScorte { }
public class GestoreScorte : IGestoreScorte { }
```

## Program.cs minimal

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
