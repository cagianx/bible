---
sidebar_position: 9
---

# Ambienti e Deploy

## Container-first

Tutto il sistema è progettato per girare in container. Non è un dettaglio infrastrutturale — è un vincolo di progettazione che si rispetta fin dal primo giorno di sviluppo.

La conseguenza diretta è che ogni sviluppatore può farsi girare l'intero stack in locale, autonomamente, senza dipendere da ambienti condivisi o configurazioni manuali. Se per avviare il sistema in locale serve qualcosa che non è nel repository, c'è qualcosa che non va.

## Ambienti

### Locale

Ogni sviluppatore ha il proprio ambiente completo. Database, servizi dipendenti, tutto gira in container — tipicamente orchestrati con `docker compose`.

L'obiettivo è che l'avvio sia triviale:

```bash
docker compose up
```

Non ci sono configurazioni manuali, non ci sono prerequisiti impliciti, non ci sono servizi che "si assume siano già running". Se serve, si documenta in [`regole/ambiente-di-sviluppo`](ambiente-di-sviluppo.md).

### Staging

Lo staging è il primo ambiente aggiornato quando si stacca una versione dal trunk. Riceve ogni release prima che arrivi in produzione ed è l'ambiente dove si verifica che tutto funzioni nel contesto reale — infrastruttura reale, dati reali o realistici, integrazioni reali.

**Staging non è opzionale.** Una versione non arriva in produzione senza passare per staging.

### Produzione

L'ambiente di produzione riceve solo versioni già validate in staging. Il percorso è sempre `trunk → staging → produzione`, mai diretto.

## Versionamento e deploy

Ogni deploy corrisponde a una versione tracciabile — un tag git. Non si deploya codice non taggato in staging o produzione. Il tag è l'unico riferimento non ambiguo che collega un ambiente a uno stato preciso dei sorgenti.

Vedi [`regole/versionamento`](versionamento.md) per il workflow di rilascio.