---
sidebar_position: 1
---

# Step 1 — Dominio

Il dominio si tocca per primo. Le entity, le migration e i vincoli del database sono la fondamenta su cui poggia tutto il resto — business logic e UI dipendono da questa stabilità.

## Cosa fare

### 1. Apportare le modifiche al dominio

Implementare le entity e le configurazioni EF emerse dalla modellazione in analisi tecnica. Seguire le regole descritte in [`regole/entity-framework`](../../regole/entity-framework.md) e [`regole/dominio`](../../regole/dominio.md):

- nomi dall'[Ubiquitous Language](../../glossario#ubiquitous-language), senza abbreviazioni né traduzioni
- constraint e chiavi esterne dichiarati nel modello, non gestiti applicativamente
- [migration](../../glossario#migration) con nome descrittivo che racconta la decisione di dominio
- nessuna rinomina, nessuna rimozione — solo aggiunte e deprecazioni

### 2. Scrivere il primo test di integrazione

Appena il dominio è definito, si scrive almeno un test di integrazione che verifichi il funzionamento base. Non deve coprire tutta la business logic — quella viene nel passo successivo — ma deve garantire che il modello sia corretto: che le migration vengano applicate, che i constraint funzionino, che le relazioni siano navigabili.

```csharp
[Fact]
public async Task CreaOrdine_PersistsCorrectly()
{
    // Arrange: database reale con migration applicate
    await using var context = CreateDbContext();
    var cliente = new Cliente { Nome = "Acme Srl" };
    context.Clienti.Add(cliente);
    await context.SaveChangesAsync();

    // Act
    var ordine = new Ordine { ClienteId = cliente.Id, Numero = "ORD-001" };
    context.Ordini.Add(ordine);
    await context.SaveChangesAsync();

    // Assert
    var saved = await context.Ordini.FindAsync(ordine.Id);
    Assert.NotNull(saved);
    Assert.Equal("ORD-001", saved!.Numero);
}
```

### 3. Verificare che i test esistenti non si rompano

Le modifiche al dominio non devono rompere i test preesistenti. La CI lo verifica automaticamente, ma è buona pratica girare la suite localmente prima di aprire un commit — specialmente se si toccano entità con molte dipendenze.

## Quando il dominio è stabile

Il dominio è stabile quando:
- le migration sono applicate e i test di dominio passano
- nessun test preesistente è rotto
- le [breaking changes](../../glossario#breaking-change), se presenti, sono state comunicate

Da questo momento business logic e UI possono procedere in parallelo.

---

**Prossimo step:** [Step 2 — Business Logic](02-business-logic.md)
