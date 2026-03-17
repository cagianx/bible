---
sidebar_position: 2
---

# Step 2 — Business Logic

Con il dominio stabile, si implementa la business logic. Ogni [caso d'uso](../../glossario#caso-duso) identificato nell'[analisi tecnica](../../glossario#analisi-tecnica) diventa una classe che implementa [`IUseCase`](../../glossario#iusecase), orchestrando i servizi di dominio e chiudendo la [Unit of Work](../../glossario#unit-of-work) con `SaveChanges()`.

## Codice testabile prima di tutto

Non è obbligatorio scrivere il test prima del codice. È obbligatorio scrivere codice **come se il test dovesse essere scritto** — progettare le dipendenze in modo da poterle controllare, i casi d'errore in modo da poterli riprodurre, i confini in modo da poterli isolare.

Un codice difficile da testare è un codice difficile da capire, da modificare e da mantenere. La difficoltà di scrivere il test è un segnale di design.

## Sviluppo sotto test di integrazione

Tutta la business logic si sviluppa sotto test di integrazione. Si aggiungono test man mano che si implementano i casi d'uso — non alla fine.

Ogni caso d'uso ha almeno un test per il percorso principale e uno per ogni caso eccezionale rilevante. Vedi [`regole/testing`](../../regole/testing.md).

```csharp
[Fact]
public async Task ConfermaOrdine_ScalaLeScorte()
{
    // Arrange
    await using var context = CreateDbContext();
    var ordine = await CreaOrdineConRighe(context);
    var useCase = new ConfermaOrdine(context, new GestoreScorte(context));

    // Act
    var result = await useCase.ExecuteAsync(new ConfermaOrdineCommand(ordine.Id));

    // Assert
    Assert.True(result.IsSuccess);
    var scorte = await context.Scorte.FirstAsync(s => s.ProdottoId == ordine.Righe[0].ProdottoId);
    Assert.Equal(scorteAttese, scorte.Disponibile);
}
```

## Refactoring

Il refactoring è un'attività continua — non ha mai uno spike dedicato. Si fa mentre si lavora, ogni volta che si tocca codice che può essere migliorato.

Se durante lo sviluppo si incontra un'area malmessa che richiederebbe un intervento significativo, si segnala e si decide insieme come procedere: farlo subito, pianificarlo come task separato, o documentarlo come debito tecnico.

**I commit di refactoring non si mescolano mai con i commit di feature.** Sono due cose distinte e devono restare leggibili separatamente nella storia del repository. Un commit che mescola refactoring e nuova funzionalità è impossibile da revisionare e da revertire selettivamente.

```
# Sbagliato
feat(ordini): add conferma ordine and refactor scorte service

# Corretto
refactor(scorte): extract GestoreScorte from OrdineService
feat(ordini): add conferma ordine use case
```

## Criterio di completamento

La business logic è completa quando ogni caso d'uso ha almeno un test per il percorso principale e uno per ogni caso eccezionale rilevante. I test passano. La CI è verde.

---

**Prossimo step:** [Step 3 — Staging e Validazione](03-validazione.md)
