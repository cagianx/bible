---
sidebar_position: 2
---

# Step 2 — Perimetro

Con i casi d'uso chiari, il passo successivo è mappare esattamente cosa tocca questo sviluppo: quali moduli, quali interfacce, quali dati. Il perimetro definisce i confini del lavoro e identifica i rischi di regressione.

## Classificare le modifiche

Ogni elemento coinvolto rientra in una di tre categorie:

**Pezzi nuovi** — funzionalità, componenti o flussi completamente nuovi. Non esistono precedenti: richiedono progettazione da zero e attenzione particolare alla modellazione, perché gli errori qui non hanno storia da cui imparare.

**Modifiche** — cambiamenti a comportamenti o componenti esistenti che non alterano le interfacce pubbliche. Chi dipende da questi componenti non se ne accorge. Richiedono comunque analisi delle regressioni potenziali.

**[Breaking changes](../../glossario#breaking-change)** — modifiche che rompono la compatibilità con quanto già in uso: cambi di contratto API, rimozione di campi, variazioni nel comportamento atteso. Richiedono coordinamento immediato con i team dipendenti e una strategia di migrazione. Vanno portati all'attenzione di tutti il prima possibile — non sono necessariamente una cattiva notizia, ma nessuno deve esserne sorpreso. Il versioning renderà il cambiamento ufficiale con un bump `MAJOR`. Vedi [`regole/versionamento`](../../regole/versionamento.md).

## Identificare i sotto-moduli coinvolti

Un'unica feature tocca raramente un solo modulo. In questa fase si mappano tutti i sotto-moduli del sistema che vengono sfiorati dallo sviluppo — anche indirettamente — per capire dove cercare regressioni.

```
Feature X
  ├── Modulo Ordini        → modifica diretta
  ├── Modulo Fatturazione  → modifica indiretta (dipende da Ordini)
  └── Modulo Notifiche     → invariato, ma da verificare
```

## Individuare le interfacce software coinvolte

Per ogni modulo identificato, elencare le interfacce che cambiano:
- endpoint API esposti o consumati
- eventi pubblicati o sottoscritti
- job e processi schedulati
- integrazioni con sistemi esterni

Questo è il momento in cui si scopre se ci sono dipendenze nascoste o [contratti](../../glossario#contratto) impliciti mai documentati.

## Criterio di completamento

Il perimetro è definito quando si sa con precisione: cosa è nuovo, cosa cambia, cosa potrebbe rompersi e chi dipende da cosa.

---

**Prossimo step:** [Step 3 — Modellazione dei Dati](03-modellazione.md)
