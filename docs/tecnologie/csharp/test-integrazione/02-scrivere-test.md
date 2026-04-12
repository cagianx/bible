---
sidebar_position: 2
description: Come scrivere test di integrazione — Get<T>(), SeedAsync, FluentAssertions e parallelismo NUnit.
---

# Scrivere un test

## Struttura di una classe di test

Una classe di test estende `IntegrationTestBase` e dichiara i servizi che usa come proprietà risolte dallo scope. Nessun `new` — i servizi vengono dal container DI, con le stesse dipendenze di produzione.

```csharp
[TestFixture]
public class CreaOrdineTests : IntegrationTestBase
{
    // Ogni accesso risolve il servizio dallo scope del test corrente
    private ICreaOrdine CreaOrdine => Get<ICreaOrdine>();

    [Test]
    public async Task Esegui_con_dati_validi_crea_ordine()
    {
        // Act
        var result = await CreaOrdine.ExecuteAsync(new CreaOrdineCommand(ClienteId: 1, Importo: 250.00m));

        // Assert
        result.IsSuccess.Should().BeTrue();

        var ordine = await Db.Ordini.SingleAsync();
        ordine.ClienteId.Should().Be(1);
        ordine.Importo.Should().Be(250.00m);
        ordine.Stato.Should().Be(StatoOrdine.InAttesa);
    }

    [Test]
    public async Task Esegui_con_cliente_inesistente_fallisce()
    {
        var result = await CreaOrdine.ExecuteAsync(new CreaOrdineCommand(ClienteId: 999, Importo: 100m));

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Cliente non trovato.");
    }
}
```

`Db` e `CreaOrdine` provengono dallo stesso scope: condividono il `DbContext` e le sue transazioni, esattamente come avviene durante una richiesta HTTP in produzione.

## SeedAsync

`SeedAsync` viene chiamato dalla classe base dopo la creazione dello scope, prima di ogni test. Si sovrascrive per inserire i dati che il test presuppone.

```csharp
protected override async Task SeedAsync(AppDbContext db)
{
    db.Clienti.Add(new Cliente { Id = 1, Nome = "Acme Srl", Email = "acme@example.com" });
    db.Prodotti.AddRange(
        new Prodotto { Id = 1, Nome = "Widget A", Prezzo = 10.00m, Scorte = 100 },
        new Prodotto { Id = 2, Nome = "Widget B", Prezzo = 25.00m, Scorte = 50 }
    );
    await db.SaveChangesAsync();
}
```

Poiché ogni test parte da un clone del template vuoto, il seed viene ricreato da zero per ogni test — non c'è mai stato residuo da test precedenti.

## FluentAssertions

FluentAssertions rende le asserzioni leggibili e i messaggi di errore descrittivi.

```csharp
// Valori semplici
result.IsSuccess.Should().BeTrue();
ordine.Stato.Should().Be(StatoOrdine.Confermato);
ordine.DataCreazione.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

// Collezioni
ordine.Righe.Should().HaveCount(3);
ordine.Righe.Should().AllSatisfy(r => r.Importo.Should().BeGreaterThan(0));
ordine.Righe.Select(r => r.ProdottoId).Should().BeEquivalentTo([1, 2, 3]);

// Eccezioni
var act = async () => await CreaOrdine.ExecuteAsync(commandNonValido);
await act.Should().ThrowAsync<InvalidOperationException>()
    .WithMessage("*importo*");

// Oggetti (confronto strutturale, escludendo campi generati)
risposta.Should().BeEquivalentTo(atteso, options => options.Excluding(x => x.Id));
```

## Parallelismo

I test all'interno della stessa fixture girano in sequenza — ogni test ha il suo scope e il suo DB, ma condividono il template.

Fixture diverse possono girare in parallelo: ciascuna ha il proprio DB e il proprio scope. Il template è condiviso in sola lettura — la creazione è idempotente grazie al check sull'esistenza.

```csharp
// AssemblyInfo.cs o in cima a qualsiasi file di test
[assembly: Parallelizable(ParallelScope.Fixtures)]
```
