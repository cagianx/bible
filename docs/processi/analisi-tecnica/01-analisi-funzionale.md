---
sidebar_position: 1
---

# Step 1 — Analisi Funzionale

Il punto di partenza è sempre l'analisi funzionale. Prima di ragionare su come costruire qualcosa, bisogna capire con precisione **cosa cambia rispetto all'esistente** e perché.

Questo step non produce ancora scelte tecniche: produce chiarezza. Tutto ciò che rimane ambiguo qui si trasformerà in un bug o in un rework più avanti.

## Cosa fare

### Collegare ogni [caso d'uso](../../glossario#caso-duso) a un obiettivo di business

Ogni funzionalità deve avere una ragione esistenziale chiara. Se non si riesce a collegare un caso d'uso a un obiettivo concreto, è un segnale che non è ancora abbastanza compreso — o che non dovrebbe essere sviluppato.

### Costruire la matrice dei casi d'uso

Per ogni caso d'uso, compilare:

| Campo | Domanda |
|---|---|
| **Input** | cosa riceve il sistema? |
| **Output** | cosa restituisce o produce? |
| **Regole di business** | quali vincoli devono essere rispettati? |
| **Eccezioni** | cosa può andare storto? come si gestisce? |
| **Dati coinvolti** | quali entità vengono lette o modificate? |

### Evidenziare le ambiguità

Le assunzioni non dichiarate sono una delle principali fonti di regressione. Ogni punto ambiguo va segnalato esplicitamente con una domanda aperta, un owner e una data di validazione attesa.

Non si va avanti con assunzioni: si aspetta la risposta o si documenta esplicitamente l'assunzione fatta e il rischio che comporta.

## Prerequisito: caso d'uso realistico

Ogni sviluppo deve essere supportato da uno scenario concreto che giustifichi il lavoro. Sviluppare funzionalità senza un caso d'uso reale è una fonte di complessità inutile e di codice che nessuno userà.

### Priorità

Non tutto ciò che emerge dall'analisi ha la stessa importanza. L'implementazione deve essere guidata dal **caso d'uso principale** — quello più frequente e rappresentativo del valore che il sistema deve offrire.

I casi eccezionali vanno riconosciuti e documentati, ma non devono pilotare le scelte architetturali. Costruire il sistema attorno a uno scenario raro produce complessità sproporzionata e penalizza il percorso normale.

> Ottimizza per il caso comune, gestisci il caso eccezionale senza che diventi il centro del design.

## Criterio di completamento

I casi d'uso sono comprensibili da un developer esterno senza chiedere chiarimenti informali. Tutte le ambiguità sono state risolte o documentate esplicitamente come rischio.

---

**Prossimo step:** [Step 2 — Perimetro](02-perimetro.md)
