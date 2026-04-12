---
sidebar_position: 2
description: Switch expression e pattern matching in C# per codice conciso e senza ambiguità.
---

# Switch Expression e Pattern Matching

C# 8+ introduce le **switch expression** come alternativa compatta alle switch statement. Combinato con il pattern matching, produce codice leggibile, esaustivo e senza stati impossibili.

## Switch expression base

```csharp
// ❌ Switch statement classico
string descrizione;
switch (stato)
{
    case OrdineStato.Bozza:
        descrizione = "In lavorazione";
        break;
    case OrdineStato.Confermato:
        descrizione = "Confermato";
        break;
    case OrdineStato.Spedito:
        descrizione = "In consegna";
        break;
    default:
        throw new ArgumentOutOfRangeException(nameof(stato));
}

// ✅ Switch expression
string descrizione = stato switch
{
    OrdineStato.Bozza      => "In lavorazione",
    OrdineStato.Confermato => "Confermato",
    OrdineStato.Spedito    => "In consegna",
    _ => throw new ArgumentOutOfRangeException(nameof(stato))
};
```

## Assegnazione da switch expression

La switch expression è un'espressione: produce un valore e si assegna direttamente.

```csharp
decimal sconto = categoriaCliente switch
{
    CategoriaCliente.Standard  => 0m,
    CategoriaCliente.Premium   => 0.10m,
    CategoriaCliente.Corporate => 0.20m,
    _ => throw new ArgumentOutOfRangeException(nameof(categoriaCliente))
};

var endpoint = ambiente switch
{
    Ambiente.Local   => "http://localhost:5000",
    Ambiente.Staging => "https://staging.example.com",
    Ambiente.Prod    => "https://example.com",
    _ => throw new ArgumentOutOfRangeException(nameof(ambiente))
};
```

## Pattern matching su tipo

```csharp
decimal CalcolaIva(Prodotto prodotto) => prodotto switch
{
    ProdottoAlimentare  => prodotto.Prezzo * 0.04m,
    ProdottoFarmaceutico => prodotto.Prezzo * 0.10m,
    ProdottoElettronico  => prodotto.Prezzo * 0.22m,
    _ => prodotto.Prezzo * 0.22m
};
```

## Pattern matching con condizioni (when)

```csharp
string Classifica(int punteggio) => punteggio switch
{
    >= 90 => "Eccellente",
    >= 70 => "Buono",
    >= 50 => "Sufficiente",
    _     => "Insufficiente"
};

decimal CalcolaSpedizione(Ordine ordine) => ordine switch
{
    { Totale: >= 50 }                          => 0m,
    { Destinazione: Destinazione.Italia }      => 4.90m,
    { Destinazione: Destinazione.Europa }      => 9.90m,
    _                                          => 19.90m
};
```

## Pattern matching su tuple

Utile per combinare più valori in una sola espressione:

```csharp
string DescriviTransizione(OrdineStato da, OrdineStato a) => (da, a) switch
{
    (OrdineStato.Bozza, OrdineStato.Confermato)   => "Ordine confermato",
    (OrdineStato.Confermato, OrdineStato.Spedito) => "Ordine spedito",
    (OrdineStato.Spedito, OrdineStato.Consegnato) => "Ordine consegnato",
    (OrdineStato.Confermato, OrdineStato.Annullato) => "Ordine annullato",
    _ => throw new InvalidOperationException($"Transizione {da} → {a} non ammessa")
};
```

## Uso nel Result pattern

```csharp
IActionResult ToActionResult(Result result) => result switch
{
    { IsSuccess: true }                     => Ok(),
    { Error: NotFoundError e }              => NotFound(e.Message),
    { Error: ValidationError e }            => BadRequest(e.Message),
    { Error: UnauthorizedError }            => Unauthorized(),
    _                                       => StatusCode(500)
};

IActionResult ToActionResult<T>(Result<T> result) => result switch
{
    { IsSuccess: true, Value: var v }       => Ok(v),
    { Error: NotFoundError e }              => NotFound(e.Message),
    { Error: ValidationError e }            => BadRequest(e.Message),
    _                                       => StatusCode(500)
};
```

## Esaustività

Il compilatore avvisa se un enum non è coperto completamente. Il pattern `_` come fallback su un enum è un segnale che si vuole gestire esplicitamente i casi futuri — usare `throw` come default, non un valore silenzioso:

```csharp
// ❌ Silenzioso: nasconde il caso non gestito
string label = stato switch
{
    OrdineStato.Bozza => "Bozza",
    _ => ""               // nuovo stato aggiunto? nessun errore, stringa vuota
};

// ✅ Esplicito: il compilatore o il runtime segnalano il caso mancante
string label = stato switch
{
    OrdineStato.Bozza      => "Bozza",
    OrdineStato.Confermato => "Confermato",
    _ => throw new ArgumentOutOfRangeException(nameof(stato), stato, null)
};
```
