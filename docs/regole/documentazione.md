e---
sidebar_position: 4
---

# Documentazione Tecnica

## Documentazione vicina al codice

La documentazione tecnica vive nel repository, accanto ai sorgenti. Non in un wiki esterno, non in un documento condiviso, non in una confluence abbandonata.

Questo non è solo una questione di ordine: è una scelta architetturale. Quando docs e codice condividono lo stesso repository:

- ogni modifica al codice può aggiornare la documentazione nello stesso commit
- la storia del progetto è unica e coerente — `git log` racconta entrambe le cose
- la documentazione non diventa mai obsoleta per abbandono, perché è parte del lavoro normale
- l'IA può leggere entrambi i livelli e tenere sincronizzati codice e documentazione

## Documentazione e IA

Avere documentazione e sorgenti nello stesso contesto abilita un ciclo virtuoso:

- l'IA può generare codice **a partire dalla documentazione**
- l'IA può aggiornare la documentazione **a partire dalle modifiche al codice**
- nessuno dei due può divergere silenziosamente dall'altro

Questo cambia il modo in cui si scrive documentazione: non è più un documento statico scritto una volta, ma una specifica viva che si evolve con il sistema.

### Il codice come documentazione

In alcuni casi il codice *è* la documentazione — non una sua rappresentazione, ma la fonte di verità stessa. Il modello di dominio scritto in C# con Entity Framework Code First ne è l'esempio più diretto: le entity class, le configurazioni Fluent API e le migration raccontano esattamente com'è fatto il dominio, con tutti i vincoli e le relazioni, in un formato che è allo stesso tempo leggibile da un developer, eseguibile dal runtime e interpretabile dall'IA.

Quando un'IA ha accesso a quel codice insieme alla documentazione, può generare test di integrazione, scaffoldare nuovi casi d'uso e verificare la coerenza tra le due rappresentazioni. Vedi [`regole/entity-framework`](entity-framework.md).

## Regole

**La documentazione è parte del ticket.** Una feature non è completa se non include l'aggiornamento alla documentazione pertinente. Non si chiude un task con "aggiornerò la doc dopo".

**Se la doc non è aggiornabile, il design è sbagliato.** Se descrivere una cosa è difficile, probabilmente quella cosa è troppo complessa o mal strutturata. La difficoltà di documentare è un segnale di design.

**Non si documenta l'ovvio.** La documentazione descrive *perché* le cose sono fatte in un certo modo, non *cosa* fa il codice. Il codice ben scritto si spiega da solo; la documentazione aggiunge il contesto che il codice non può contenere.

**I diagrammi sono codice.** I diagrammi si scrivono in Mermaid o in formato testuale, mai come immagini. Un'immagine non è versionabile, non è modificabile, non è leggibile dall'IA.

## Struttura

```
docs/
  regole/       # principi e vincoli permanenti del sistema
  processi/     # come si lavora — analisi, sviluppo, review
```

Le **regole** cambiano raramente e hanno impatto trasversale. I **processi** descrivono il flusso di lavoro e possono evolversi con il team.