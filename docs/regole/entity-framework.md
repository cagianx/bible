---
sidebar_position: 2
---

# Entity Framework e Modello di Dominio

## Database

Il database di riferimento è **PostgreSQL**. Entity Framework astrae buona parte delle differenze tra motori, ma le scelte di modellazione — indici, constraint, tipi di colonna — vanno fatte tenendo presente il motore reale in uso.

La scelta del database è meno vincolante di un tempo grazie a EF, ma non è irrilevante: comportamenti specifici del motore (locking, transazioni, full-text search, tipi JSON) emergono nei test di integrazione e in produzione, non nel codice applicativo.

## Code First, sempre

Entity Framework si usa esclusivamente in modalità **Code First**. Il database non è la fonte di verità: lo è il codice.

Questo non è una preferenza tecnica — è una conseguenza diretta di come si lavora in questo progetto:

- il modello di dominio è definito in C# e versionato in git
- le migration tracciano l'evoluzione dello schema nel tempo, commit per commit
- nessuno tocca il database a mano: ogni modifica passa da una migration
- non esiste schema "fuori dal repo": tutto ciò che è in produzione è ricostruibile dai sorgenti

Database First e scaffolding inverso non si usano. Invertono il flusso di controllo e rompono il principio che il codice è la fonte di verità.

## Le entity class come documentazione

Le entity class sono la documentazione primaria del modello di dominio. Una classe ben scritta racconta:

- quali concetti esistono nel sistema
- come sono collegati tra loro
- quali vincoli li governano

```csharp
// Il nome segue l'Ubiquitous Language — mai abbreviazioni, mai traduzioni
public class Ordine
{
    public int Id { get; private set; }

    // Il tipo racconta il vincolo: non può essere null, non può essere vuoto
    public required string Numero { get; init; }

    public DateTime DataCreazione { get; private set; }

    // La relazione è esplicita nel modello, non implicita nello schema
    public int ClienteId { get; private set; }
    public Cliente Cliente { get; private set; } = null!;

    public IReadOnlyCollection<RigaOrdine> Righe => _righe.AsReadOnly();
    private readonly List<RigaOrdine> _righe = [];
}
```

I commenti XML (`///`) si usano solo dove il significato del campo non è ovvio dal nome e dal tipo. Non si commentano proprietà auto-esplicative.

## Configurazione con Fluent API

Le configurazioni di EF vanno in classi `IEntityTypeConfiguration<T>` separate, non tramite Data Annotations sulle entity. Questo mantiene le entity class pulite e concentra la configurazione EF in un unico posto.

```csharp
public class OrdineConfiguration : IEntityTypeConfiguration<Ordine>
{
    public void Configure(EntityTypeBuilder<Ordine> builder)
    {
        builder.HasKey(o => o.Id);

        builder.Property(o => o.Numero)
            .IsRequired()
            .HasMaxLength(20);

        // Indici dichiarati qui, con motivazione esplicita
        // Clustered index implicito sull'Id — supporta le query per chiave primaria
        // Indice su Numero per ricerche frequenti dall'interfaccia utente
        builder.HasIndex(o => o.Numero).IsUnique();

        builder.HasOne(o => o.Cliente)
            .WithMany(c => c.Ordini)
            .HasForeignKey(o => o.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

## Migration come storia del dominio

Ogni migration corrisponde a una decisione sul dominio. Il nome della migration deve essere descrittivo:

```
AddOrdineTable
AddNumeroIndexOnOrdine
RenameStatoToStatoOrdine
AddVincoloClienteNonEliminabile
```

Non si usano nomi generici come `Update1`, `Fix`, `Migration20240315`. Chi legge la storia delle migration deve capire come si è evoluto il dominio senza aprire i file.

**Le migration non si modificano dopo il push.** Se una migration è già arrivata su `main`, si crea una nuova migration correttiva — non si tocca quella esistente.

### Il database si aggiorna prima del software

In sistemi in produzione, il database viene sempre aggiornato **prima** del software. Questo impone una regola non negoziabile: ogni migration deve essere **retrocompatibile** — il software nella versione precedente deve continuare a funzionare con il database nella versione nuova, entro limiti ragionevoli.

Questa è la ragione concreta per cui nel dominio non si rinomina e non si cambia significato a nulla: si aggiunge e si depreca. Una colonna rinominata rompe il software vecchio che la referenzia ancora con il nome originale. Una colonna aggiunta con un default non lo rompe.

Il processo di deploy in sistemi senza downtime è sempre:

```
1. applica migration (retrocompatibile con il software attuale)
2. deploya il nuovo software
3. (eventualmente) rimuovi ciò che era deprecato in una migration successiva
```

**Quando la retrocompatibilità non è possibile** — rinomina che non può essere evitata, cambio di tipo, rimozione di colonna usata dal software corrente — si tratta di un **breaking change**. Richiede una strategia esplicita per minimizzare il downtime: tipicamente si introduce uno stato intermedio in cui entrambe le versioni del software possono coesistere, oppure si accetta una finestra di downtime pianificata e comunicata.

Un breaking change non è una cosa che si scopre al deploy: emerge dall'analisi tecnica e viene gestito come tale fin dall'inizio. Vedi [`processi/analisi-tecnica`](../processi/analisi-tecnica.md).

### Quando applicare le migration

Non esiste un'unica risposta: dipende dal grado di confidenza, dalla complessità della migration e dal contesto.

**Applicazione automatica allo startup** — accettabile quando le migration sono semplici, additive e reversibili. L'applicazione si occupa di portare il database all'ultima versione prima di avviarsi. Va gestita esplicitamente, con retry e logging strutturato in caso di fallimento, perché è uno dei pochi punti dove ha senso intercettare eccezioni infrastrutturali (vedi [`regole/gestione-errori`](gestione-errori.md)).

**Applicazione manuale prima del deploy** — necessaria quando la migration è complessa, distruttiva, o tocca tabelle grandi con rischio di lock prolungati. In questi casi il controllo umano prima dell'esecuzione riduce il rischio di incidenti in produzione.

La scelta si fa migration per migration, valutando: cosa cambia, quanto è reversibile, quanto dura, quali tabelle tocca.

## Nomenclatura

I nomi delle entity, delle proprietà e delle navigation property seguono l'Ubiquitous Language definito in [`regole/dominio`](dominio.md). Non si traduce, non si abbrevia, non si usano nomi tecnici dove esistono nomi di dominio.

## Repository pattern: non serve

Con Entity Framework il Repository pattern è ridondante. `DbSet<T>` è già un repository: espone query, filtraggio, aggiunta e rimozione di entità. `DbContext` è già una Unit of Work: traccia i cambiamenti e li persiste atomicamente con `SaveChanges()`.

Aggiungere un layer di repository sopra EF non aggiunge astrazione utile — aggiunge interfacce da mantenere, codice da scrivere e un indirezione che non porta valore. Il `DbContext` si inietta direttamente dove serve.

```csharp
// Inutile: repository che non aggiunge nulla
public class OrdineRepository : IOrdineRepository
{
    private readonly AppDbContext _db;
    public Task<Ordine?> GetByIdAsync(int id) => _db.Ordini.FindAsync(id).AsTask();
}

// Corretto: DbContext iniettato direttamente
public class CreaOrdine
{
    private readonly AppDbContext _db;

    public async Task<Result<Ordine>> ExecuteAsync(CreaOrdineCommand command)
    {
        // ...
        _db.Ordini.Add(ordine);
        await _db.SaveChangesAsync();
        return Result<Ordine>.Ok(ordine);
    }
}
```

L'unico motivo valido per introdurre un'astrazione sul database è se il progetto deve realmente supportare più motori in modo intercambiabile — caso raro e che va valutato concretamente, non per anticipazione.

## ACID e transazioni

EF eredita le garanzie ACID del database sottostante. `SaveChanges()` wrappa tutte le modifiche pendenti in una singola transazione: o vanno a buon fine tutte, o nessuna.

- **Atomicità** — più operazioni in un `SaveChanges()` sono un'unità indivisibile
- **Consistenza** — i constraint e le foreign key definiti nel modello vengono verificati al commit
- **Isolamento** — le transazioni concorrenti non si interferiscono secondo il livello di isolamento configurato
- **Durabilità** — una volta confermata, la transazione sopravvive a crash e riavvii

Quando un'operazione richiede più `SaveChanges()` distinti che devono essere atomici, si usa una transazione esplicita:

```csharp
await using var transaction = await _db.Database.BeginTransactionAsync();
try
{
    // prima operazione
    await _db.SaveChangesAsync();

    // seconda operazione
    await _db.SaveChangesAsync();

    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```

Le transazioni esplicite si usano solo quando necessario. Ogni `SaveChanges()` singolo è già transazionale per default.

## Unit of Work e casi d'uso

La chiamata a `SaveChanges()` non è un dettaglio implementativo — è una responsabilità esplicita. Va fatta una distinzione netta:

**I servizi di dominio non chiamano `SaveChanges()`.** Operano sul contesto EF, aggiungono o modificano entità, ma non persistono. Partecipano alla Unit of Work senza chiuderla. Questo li rende componibili: più servizi possono collaborare all'interno della stessa transazione senza saperlo l'uno dell'altro.

**Il caso d'uso chiama `SaveChanges()`.** È il caso d'uso — e solo lui — che conosce il perimetro completo dell'operazione e decide quando è il momento di persistere. Può orchestrare più servizi e sa che tutte le loro modifiche verranno salvate atomicamente.

```csharp
// Servizio di dominio: non chiama SaveChanges
public class GestoreScorte
{
    private readonly AppDbContext _db;

    public async Task ScalaAsync(int prodottoId, int quantita)
    {
        var prodotto = await _db.Prodotti.FindAsync(prodottoId);
        prodotto!.ScalaScorte(quantita);
        // nessun SaveChanges — partecipa alla UoW del caso d'uso
    }
}

// Caso d'uso: orchestra e persiste
public class ConfermaOrdine : ICasoD'Uso<ConfermaOrdineCommand>
{
    private readonly AppDbContext _db;
    private readonly GestoreScorte _scorte;

    public async Task<Result> ExecuteAsync(ConfermaOrdineCommand command)
    {
        var ordine = await _db.Ordini.FindAsync(command.OrdineId);
        ordine!.Conferma();

        await _scorte.ScalaAsync(/* ... */);

        await _db.SaveChangesAsync(); // unico punto di persistenza
        return Result.Ok();
    }
}
```

### Interfaccia formale per i casi d'uso

Le classi che implementano un caso d'uso si riconoscono formalmente implementando un'interfaccia marker. Questo le rende identificabili a colpo d'occhio, registrabili automaticamente nel container DI e testabili in modo uniforme.

```csharp
// Interfaccia marker per casi d'uso
public interface ICasoD'Uso<TCommand>
{
    Task<Result> ExecuteAsync(TCommand command);
}

public interface ICasoD'Uso<TCommand, TResult>
{
    Task<Result<TResult>> ExecuteAsync(TCommand command);
}
```

Tutto ciò che implementa `ICasoD'Uso` è un caso d'uso. Tutto il resto è un servizio che partecipa alla Unit of Work.

## IA e generazione di codice

Quando documentazione e modello EF coesistono nel repository, l'IA ha tutto il contesto necessario per:

- **generare test di integrazione** a partire dalle entity e dai casi d'uso documentati
- **scaffoldare i casi d'uso** — command/query handler, endpoint, validatori — rispettando il modello
- **verificare la coerenza** tra documentazione e implementazione
- **suggerire migration** quando il modello cambia

Questo rende il modello EF non solo codice funzionante, ma una specifica eseguibile del dominio.