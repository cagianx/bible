---
sidebar_position: 6
---

# Step 6 — Requisiti Non Funzionali

I requisiti non funzionali ([NFR](../../glossario#nfr)) sono i requisiti impliciti che nessuno scrive nell'[analisi funzionale](../../glossario#analisi-funzionale) ma che, se ignorati, mandano in produzione un sistema che non funziona nel mondo reale. Vanno resi espliciti qui, con metriche verificabili.

## Aree da coprire

### Performance

- Tempi di risposta attesi (p50, p95, p99)
- Volumi: quante operazioni al giorno, quante in contemporanea
- Picchi: ci sono momenti della giornata o eventi che moltiplicano il carico?
- Dimensione dei dataset: query su tabelle con 1.000 righe o 10.000.000?

### Sicurezza

- Ruoli e permessi: chi può fare cosa
- Dati sensibili: cosa va cifrato, cosa va mascherato nei log
- Superfici di attacco: input da validare, upload, chiamate esterne

### Tracciabilità e audit

- Cosa deve essere loggato per compliance o diagnostica
- Chi ha fatto cosa e quando — se richiesto, va progettato nel modello dati fin dall'inizio
- Retention dei log

### Resilienza

- Retry: operazioni che possono essere ritentate automaticamente
- [Idempotenza](../../glossario#idempotenza): operazioni che devono dare lo stesso risultato se ripetute
- Fallback: cosa fa il sistema se una dipendenza non risponde
- Degradazione controllata: il sistema può funzionare in modo ridotto?

### Compatibilità

- Versioni client supportate
- Backward compatibility con sistemi dipendenti
- Finestre di deprecazione

## Criterio di completamento

Ogni NFR ha una metrica verificabile e un responsabile tecnico. Non esistono NFR vaghi come "deve essere veloce" o "deve essere sicuro" — ogni requisito ha un numero o un comportamento osservabile.

---

**Prossimo step:** [Step 7 — Piano e Stime](07-piano.md)
