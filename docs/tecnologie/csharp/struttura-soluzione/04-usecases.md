---
sidebar_position: 4
description: Livello UseCases tra Core e i progetti di alto livello — comandi completi che chiudono la unit of work con SaveChanges e applicano il Result pattern.
---

# UseCases (Comandi)

## Perché un livello tra Core e Api

I servizi di Core (domain service, regole, validazioni) **non chiamano `SaveChanges`**. Modificano entità, eseguono logica di dominio, ma non chiudono la unit of work. La chiusura della transazione è una responsabilità di livello superiore.

Senza un livello intermedio, `SaveChanges` finisce nelle action dei controller. Il controller diventa orchestratore di dominio, persistenza e HTTP nello stesso punto — tre responsabilità in una.

Il livello **UseCases** (o **Commands**) impacchetta i servizi di Core in comandi completi: ricevono un input, orchestrano la logica di Core, chiudono la transazione, restituiscono un `Result`. I progetti di alto livello (Api, Console, Worker) chiamano i comandi e basta.

## Cosa contiene

- I **comandi** completi: un'operazione utente di dominio, dall'input al risultato finale.
- La chiusura della **unit of work** (`SaveChanges` / `SaveChangesAsync`).
- L'interfaccia comune dei comandi (`IUseCase<TCommand, TResult>`).

I DTO di input/output e `Result<T>` vengono da [Models](07-models.md).

## Dove vive

Spesso è una **sottocartella di Core**:

```
src/core/
├── core.csproj
├── Ordini/
│   ├── Ordine.cs                    # Entity
│   ├── OrdineStato.cs               # Enum di dominio
│   └── GestoreScorte.cs             # Domain service
├── Clienti/
│   └── Cliente.cs
└── UseCases/                        # i comandi vivono qui
    ├── Ordini/
    │   ├── CreaOrdine.cs
    │   └── ConfermaOrdine.cs
    ├── Clienti/
    │   └── RegistraCliente.cs
    └── Shared/
        └── IUseCase.cs
```

In questa configurazione, il namespace `NomeSoluzione.Core.UseCases.*` distingue chiaramente i comandi dal resto di Core.

Quando UseCases cresce abbastanza da meritare un'identità propria, diventa un **progetto first-class**:

```
src/
├── core/
│   └── core.csproj                  # NomeSoluzione.Core
├── usecases/
│   └── usecases.csproj              # NomeSoluzione.UseCases
└── api/
    └── api.csproj
```

UseCases dipende **solo** da Core. Non vede Api, Console o altri progetti di alto livello.

## Pattern d'uso

Il comando orchestra Core e chiude la transazione:

```csharp
// usecases — comando completo: orchestrazione + SaveChanges + Result
// CreaOrdineDto e Result<T> vengono da Models, Ordine viene da Db
public class CreaOrdine : IUseCase<CreaOrdineDto, Result<Guid>>
{
    private readonly AppDbContext _db;
    private readonly GestoreScorte _scorte;

    public async Task<Result<Guid>> ExecuteAsync(CreaOrdineDto cmd, CancellationToken ct)
    {
        var verifica = _scorte.Verifica(cmd.Righe);
        if (verifica.IsFailure)
            return Result.Failure<Guid>(verifica.Errore);

        var ordine = Ordine.Crea(cmd.ClienteId, cmd.Righe);
        _db.Ordini.Add(ordine);
        await _db.SaveChangesAsync(ct);

        return Result.Success(ordine.Id);
    }
}
```

Il controller chiama il comando e restituisce la risposta — niente `SaveChanges`, niente logica di dominio:

```csharp
[HttpPost]
public async Task<IActionResult> Crea(CreaOrdineDto cmd, CreaOrdine useCase, CancellationToken ct)
{
    var risultato = await useCase.ExecuteAsync(cmd, ct);
    return risultato.IsSuccess
        ? Ok(risultato.Value)
        : BadRequest(risultato.Errore);
}
```

❌ Da evitare: chiamare `SaveChanges` nel controller o in un domain service di Core. Il controller orchestra HTTP, il domain service orchestra dominio — la transazione è del comando.
