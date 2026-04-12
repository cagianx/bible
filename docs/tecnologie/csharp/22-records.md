---
sidebar_position: 22
description: Records in C# — immutabilità, with expression, DTO e value object.
---

# Records e immutabilità

## Cos'è un record

Un `record` è un tipo reference (come `class`) con semantica di valore: l'uguaglianza è basata sul contenuto, non sull'identità in memoria. Il compilatore genera automaticamente `Equals`, `GetHashCode`, `ToString` e l'operatore `==` confrontando proprietà per proprietà.

```csharp
var a = new Punto(1, 2);
var b = new Punto(1, 2);

Console.WriteLine(a == b); // true — stesse proprietà, istanze diverse
```

Con una `class` normale lo stesso confronto restituisce `false`.

## Sintassi

### Record posizionale

Il modo più compatto. Il compilatore genera il costruttore e le proprietà `init`-only:

```csharp
public record Punto(double X, double Y);

public record CreaOrdineRequest(string ClienteId, decimal Importo, DateTime? DataConsegna);
```

### Record con proprietà esplicite

Quando servono attributi, validazioni o valori di default:

```csharp
public record IndirizzoSpedizione
{
    public required string Via { get; init; }
    public required string Citta { get; init; }
    public string? Cap { get; init; }
    public string Paese { get; init; } = "IT";
}
```

## `with` expression

I record sono immutabili: non si modificano, si copiano con le differenze. L'espressione `with` crea una copia del record con alcuni campi cambiati:

```csharp
var originale = new IndirizzoSpedizione { Via = "Via Roma 1", Citta = "Milano" };
var aggiornato = originale with { Citta = "Torino" };

// originale è invariato
// aggiornato ha Via = "Via Roma 1", Citta = "Torino"
```

Questo pattern elimina intere categorie di bug da mutazione accidentale: si può passare un record a un metodo con la certezza che non verrà modificato.

## record struct

Per tipi piccoli e frequentemente allocati (coordinate, range, chiavi composte) si usa `record struct`: stessa semantica di valore, ma allocato sullo stack anziché sull'heap.

```csharp
public record struct Coordinate(double Lat, double Lon);
```

## Quando usare i record

| Caso d'uso | Record? |
|-----------|---------|
| DTO request/response API | Sì |
| Value object di dominio (Money, Email, Coordinate) | Sì |
| Risultati di query (read model) | Sì |
| Configurazione immutabile | Sì |
| Entity di dominio con identità | No — usare `class` |
| Oggetti con stato mutabile | No — usare `class` |

### DTO immutabili

I DTO di request e response beneficiano dell'immutabilità: una volta deserializzato, il dato non cambia lungo tutta la catena di elaborazione. Non servono setter pubblici, non esistono stati intermedi.

```csharp
// ✅ DTO immutabile con record posizionale
public record CreaUtenteRequest(
    string Nome,
    string Email,
    string Password);

// ✅ Response con record
public record UtenteResponse(
    int Id,
    string Nome,
    string Email,
    DateTime CreatoIl);
```

### Value object di dominio

Un valore come `Email` o `Importo` ha regole di uguaglianza naturali e non ha identità propria: due istanze con lo stesso valore sono intercambiabili. Il `record` modella questo senza boilerplate.

```csharp
public record Email
{
    public string Valore { get; }

    public Email(string valore)
    {
        if (!valore.Contains('@'))
            throw new ArgumentException("Formato email non valido.", nameof(valore));
        Valore = valore.ToLowerInvariant();
    }
}

var a = new Email("user@example.com");
var b = new Email("USER@EXAMPLE.COM");
Console.WriteLine(a == b); // true
```

### Entity: usare class

Le entity hanno identità: due ordini con lo stesso contenuto ma `Id` diverso non sono lo stesso ordine. La semantica per valore del record è sbagliata per questo caso. Si usano `class` normali con l'`Id` come discriminante di uguaglianza.
