---
sidebar_position: 0
---

# Principi

Le regole di questo documento non sono arbitrarie. Derivano da principi consolidati che l'industria del software ha affinato in decenni. Conoscere i principi aiuta a capire le regole — e a estenderle correttamente nei casi che le regole non coprono esplicitamente.

## Filosofia Unix

La filosofia Unix nasce negli anni '70 nei laboratori Bell e si riduce a tre idee:

1. **Scrivi programmi che fanno una cosa sola e la fanno bene**
2. **Scrivi programmi che collaborano tra loro**
3. **Usa interfacce semplici e universali**

Cinquant'anni dopo, questi principi descrivono ancora come si scrive software manutenibile.

### Connessioni con questo progetto

**Una cosa sola, fatta bene** — ogni caso d'uso è una classe separata: `CreaOrdine`, `AnnullaOrdine`, `RegistraCliente`. Ognuna ha un nome che dice esattamente cosa fa e non fa altro. È la stessa idea applicata all'architettura in [`regole/architettura`](architettura.md) sotto il nome di Screaming Architecture.

**Collaborare senza accoppiamento** — i servizi di dominio operano sul `DbContext` senza chiamare `SaveChanges()`. Non sanno chi li invoca né quante altre modifiche stanno avvenendo in parallelo nella stessa transazione. Collaborano senza dipendere l'uno dall'altro. Il caso d'uso coordina senza che i pezzi si conoscano. Vedi [`regole/entity-framework`](entity-framework.md).

**Interfacce semplici e componibili** — il Result pattern è un'interfaccia universale tra componenti: ogni operazione restituisce successo o fallimento, e i risultati si compongono in sequenza. Così come i comandi Unix si concatenano con `|`, i casi d'uso si compongono controllando il Result a ogni step. Vedi [`regole/gestione-errori`](gestione-errori.md).

---

## Principi SOLID

I principi SOLID, formulati da Robert Martin, descrivono come strutturare il codice orientato agli oggetti per renderlo manutenibile nel tempo.

### S — Single Responsibility

> Una classe deve avere un solo motivo per cambiare.

Una classe che fa troppe cose cambia per troppi motivi — ogni nuova richiesta tocca lo stesso file, ogni modifica rischia di rompere qualcosa di non correlato.

**Nel progetto:** la separazione tra Core, Db e Api non è solo organizzativa — è l'applicazione di SRP a livello architetturale. Core cambia quando cambia la business logic. Db cambia quando cambia la persistenza. Api cambia quando cambia il contratto HTTP. Motivi di cambiamento distinti, componenti distinti.

A livello di classe: `CreaOrdine` ha un solo motivo per cambiare — la logica di creazione di un ordine. Non gestisce anche la fatturazione, non invia email. Vedi [`regole/architettura`](architettura.md).

### O — Open/Closed

> Il software deve essere aperto all'estensione e chiuso alla modifica.

Aggiungere comportamento non deve richiedere di modificare ciò che già funziona.

**Nel progetto:** nel dominio non si rinomina e non si cambia il significato a nulla — si aggiunge e si depreca. Le migration sul database seguono lo stesso principio: si aggiungono colonne, si aggiungono tabelle. Il database preesistente resta intatto e retrocompatibile. I feature flag permettono di estendere il comportamento del sistema senza toccare il percorso principale. Vedi [`regole/dominio`](dominio.md) e [`regole/git`](git.md).

### L — Liskov Substitution

> I sottotipi devono essere sostituibili ai loro tipi base senza alterare il comportamento del programma.

Se il codice dipende da un'astrazione, qualsiasi implementazione concreta deve funzionare al suo posto.

**Nel progetto:** il codice dipende da `ILogger<T>`, non da Serilog. Serilog può essere sostituito con qualsiasi altra implementazione — incluso un logger di test — senza modificare una riga di codice applicativo. Nei test di integrazione, il provider EF può essere SQLite invece di PostgreSQL per i test che non verificano comportamenti specifici del motore. Vedi [`regole/logging`](logging.md).

### I — Interface Segregation

> È meglio avere molte interfacce specifiche che una sola interfaccia generale.

Un componente non deve dipendere da metodi che non usa.

**Nel progetto:** `IUseCase<TCommand>` e `IUseCase<TCommand, TResult>` sono due interfacce distinte — non una sola con parametri opzionali. `ILogger<T>` espone solo ciò che serve per loggare: il codice applicativo non conosce i sink, i formatter, la configurazione di Serilog. L'autenticazione ASP.NET Core permette di configurare schemi separati per contesti diversi: JWT per le API, cookie per il pannello admin, senza che si inquinino a vicenda. Vedi [`regole/autenticazione`](autenticazione.md).

### D — Dependency Inversion

> I moduli di alto livello non devono dipendere da quelli di basso livello. Entrambi devono dipendere da astrazioni.

La logica di business non deve conoscere i dettagli implementativi dell'infrastruttura.

**Nel progetto:** Core non referenzia Entity Framework, non conosce PostgreSQL, non sa nulla di HTTP. Le dipendenze puntano verso il centro — verso il dominio — non verso l'esterno. Db dipende da Core, non il contrario. Il Core riceve l'utente autenticato come parametro esplicito: non legge l'`HttpContext`, non conosce ASP.NET Core. Vedi [`regole/architettura`](architettura.md) e [`regole/autenticazione`](autenticazione.md).

---

## Il filo comune

Unix e SOLID convergono sulla stessa intuizione: **il software complesso si governa tenendo le parti piccole, focalizzate e indipendenti**. La complessità non si elimina — si distribuisce in unità che la contengono senza propagarla.

Ogni regola di questo progetto è, in fondo, un'applicazione concreta di questa intuizione a un contesto specifico.