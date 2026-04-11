---
sidebar_position: 99
description: Definizioni dei termini tecnici e di dominio usati nella documentazione.
---

# Glossario

## ACID

Proprietà che garantiscono l'affidabilità delle transazioni database: Atomicità, Consistenza, Isolamento, Durabilità. Entity Framework eredita queste garanzie tramite `SaveChanges()`. Vedi [`regole/entity-framework`](regole/entity-framework.md).

## Analisi funzionale

Documento che descrive *cosa* il sistema deve fare dal punto di vista del business. È il punto di partenza dell'analisi tecnica. Prodotta tipicamente dall'analista funzionale o dal product owner.

## Analisi tecnica

Processo che traduce l'analisi funzionale in una soluzione implementabile: modello dati, contratti, flussi, requisiti non funzionali, piano. Vedi [`processi/analisi-tecnica`](processi/analisi-tecnica/index.md).

## Backpressure

Meccanismo con cui un consumatore segnala al produttore di rallentare perché non riesce a elaborare i messaggi abbastanza velocemente. In .NET si realizza con `Channel<T>` limitato (`BoundedChannelFullMode.Wait`). Vedi [`tecnologie/csharp/08-code-native`](tecnologie/csharp/08-code-native.md).

## Breaking change

Modifica che rompe la compatibilità con quanto già in uso: rinomina di colonne o campi API, rimozione di entità, variazione di comportamento atteso. Richiede comunicazione immediata ai team dipendenti e un bump `MAJOR`. Vedi [`regole/versionamento`](regole/versionamento.md).

## Caso d'uso

Scenario concreto che descrive come un attore interagisce con il sistema per raggiungere un obiettivo. Nel codice, ogni caso d'uso è una classe che implementa `IUseCase`. Deve esistere uno scenario realistico prima di sviluppare qualsiasi funzionalità.

## Clustered index

Indice che determina l'ordinamento fisico dei dati su disco. In PostgreSQL corrisponde implicitamente alla chiave primaria. Va pianificato per supportare il caso d'uso più generico della tabella.

## Code First

Approccio Entity Framework in cui il codice C# è la fonte di verità del modello dati. Il database viene generato e aggiornato a partire dalle entity class e dalle migration. L'opposto (Database First) non si usa. Vedi [`regole/entity-framework`](regole/entity-framework.md).

## Conventional Commits

Convenzione per i messaggi di commit: `<type>(<scope>): <descrizione>`. Tipi comuni: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. Vedi [`regole/git`](regole/git.md).

## Contratto

Accordo formale tra componenti su come comunicano: schema request/response, errori, autenticazione, versionamento. Una volta pubblicato, cambiare un contratto è un breaking change.

## Core

Progetto C# che contiene tutta la business logic, le entity di dominio e le interfacce verso l'esterno. Non dipende da Entity Framework, ASP.NET Core o qualsiasi altro framework infrastrutturale. Vedi [`regole/architettura`](regole/architettura.md).

## DbContext

Classe EF che rappresenta la sessione con il database. Implementa il pattern Unit of Work: traccia le modifiche alle entity e le persiste atomicamente con `SaveChanges()`. Si inietta direttamente nei casi d'uso — non serve un layer repository aggiuntivo.

## Definition of Done

Criteri che un caso d'uso deve soddisfare per essere considerato completato: dominio aggiornato, test verdi, CI verde, deploy in staging, validazione end-to-end approvata. Vedi [`processi/sviluppo/03-validazione`](processi/sviluppo/03-validazione.md).

## DTO

*Data Transfer Object.* Modello usato per trasferire dati tra moduli o attraverso interfacce. Non è mai una copia 1:1 dell'entity del database: espone solo i campi necessari al chiamante, con nomi dall'Ubiquitous Language.

## Authorization filter

Filter MVC eseguito prima di ogni action per verificare se la request è autorizzata. Implementa `IAuthorizationFilter` o `IAsyncAuthorizationFilter`. Adatto a logica di autorizzazione custom che non si esprime con le policy dichiarative standard. Vedi [`tecnologie/csharp/12-authorization-filter`](tecnologie/csharp/12-authorization-filter.md).

## Exception filter

Filter MVC che intercetta le eccezioni non gestite lanciate da action e filter. Consente di centralizzare la gestione degli errori a livello di controller con accesso al contesto MVC. Vedi [`tecnologie/csharp/13-exception-filter`](tecnologie/csharp/13-exception-filter.md).

## Feature flag

Meccanismo che permette di abilitare o disabilitare funzionalità a runtime tramite configurazione, senza deploy. Rende possibile integrare codice incompleto su `main` senza esporlo agli utenti. I flag non sono permanenti: si rimuovono quando la funzionalità è stabile. Vedi [`regole/git`](regole/git.md).

## Fluent API

Metodo di configurazione EF tramite classi `IEntityTypeConfiguration<T>`. Preferito alle Data Annotations perché mantiene le entity class pulite e concentra la configurazione in un unico posto.

## Idempotenza

Proprietà di un'operazione che produce lo stesso risultato indipendentemente da quante volte viene eseguita con gli stessi input. Obbligatoria per operazioni critiche per gestire retry e timeout. Vedi [`processi/analisi-tecnica/04-contratti`](processi/analisi-tecnica/04-contratti.md).

## IOptions\<T\>

Interfaccia ASP.NET Core per accedere alla configurazione tipizzata. Legge il valore una sola volta all'avvio. `IOptionsMonitor<T>` aggiorna il valore automaticamente se `appsettings.json` cambia. `IOptionsSnapshot<T>` ricalcola il valore per ogni request. Vedi [`tecnologie/csharp/07-configuration`](tecnologie/csharp/07-configuration.md).

## IUseCase

Interfaccia marker che identifica formalmente le classi che implementano un caso d'uso. Tutto ciò che implementa `IUseCase` è un caso d'uso; tutto il resto è un servizio che partecipa alla Unit of Work. Vedi [`regole/entity-framework`](regole/entity-framework.md).

## Middleware

Componente della pipeline HTTP di ASP.NET Core che elabora ogni request e response. Si compone in catena: ogni middleware può trasformare la request, passarla al successivo e poi trasformare la response al ritorno. Vedi [`tecnologie/csharp/10-middleware`](tecnologie/csharp/10-middleware.md).

## Migration

File generato da EF che descrive una modifica incrementale allo schema del database. Il nome deve essere descrittivo della decisione di dominio. Le migration non si modificano dopo il push su `main`. Vedi [`regole/entity-framework`](regole/entity-framework.md).

## NFR

*Requisiti Non Funzionali.* Requisiti che descrivono *come* il sistema si comporta: performance, sicurezza, resilienza, tracciabilità, compatibilità. Vanno resi espliciti con metriche verificabili. Vedi [`processi/analisi-tecnica/06-nfr`](processi/analisi-tecnica/06-nfr.md).

## Result pattern

Pattern che incapsula l'esito di un'operazione in un oggetto `Result<T>`, distinguendo esplicitamente successo e fallimento senza usare eccezioni per il controllo del flusso. Vedi [`regole/gestione-errori`](regole/gestione-errori.md).

## Problem Details

Standard RFC 9457 per il formato strutturato di risposte di errore HTTP. Usa il media type `application/problem+json` con campi fissi (`type`, `title`, `status`, `detail`, `instance`) e proprietà custom. ASP.NET Core offre `ProblemDetails` e `ProblemDetailsOptions` per implementarlo. Vedi [`tecnologie/csharp/14-problem-details`](tecnologie/csharp/14-problem-details.md).

## Screaming Architecture

Principio per cui la struttura del codice comunica immediatamente *cosa fa* il sistema. Le cartelle si chiamano `Ordini/`, `Fatturazione/`, non `Services/`, `Repositories/`. Vedi [`regole/architettura`](regole/architettura.md).

## Semantic Versioning

Schema di versioning `MAJOR.MINOR.PATCH`: MAJOR per breaking changes, MINOR per nuove funzionalità retrocompatibili, PATCH per bug fix. Vedi [`regole/versionamento`](regole/versionamento.md).

## Soft delete

Tecnica per non eliminare fisicamente un record, ma marcarlo come eliminato tramite un campo `DeletedAt` nullable. Se è `null` il record è attivo, se ha una data è eliminato. Un singolo campo, zero ambiguità — non si usano combinazioni di campi booleani e date (vedi il tip sulle [combinazioni inconsistenti](processi/analisi-tecnica/03-modellazione.md#principio-dati-duttili-in-fase-di-lettura)). Preserva la storia e la compatibilità con dati storici. Va progettato fin dall'inizio se richiesto.

## Spike

Task a tempo fisso per esplorare un'incertezza tecnica. Produce una risposta (documento, prototipo, decisione), non un'implementazione. Ha una durata massima definita. Vedi [`processi/analisi-tecnica/07-piano`](processi/analisi-tecnica/07-piano.md).

## Staging

Ambiente intermedio tra sviluppo e produzione. Riceve ogni versione prima che arrivi in produzione. La validazione end-to-end avviene qui. Vedi [`regole/ambienti`](regole/ambienti.md).

## Trunk-based development

Strategia di branching in cui tutto il lavoro confluisce direttamente su `main`. I branch, se usati, hanno vita brevissima. Le funzionalità incomplete si nascondono tramite feature flag. Vedi [`regole/git`](regole/git.md).

## Ubiquitous Language

Linguaggio condiviso tra developer, analisti e stakeholder: i nomi del dominio si usano ovunque nel codice, senza sinonimi, abbreviazioni o traduzioni. Vedi [`regole/dominio`](regole/dominio.md).

## Unit of Work

Pattern che raggruppa più operazioni in una singola transazione. In EF, `DbContext` è già una Unit of Work. I servizi di dominio partecipano senza chiuderla — è il caso d'uso che chiama `SaveChanges()`. Vedi [`regole/entity-framework`](regole/entity-framework.md).
