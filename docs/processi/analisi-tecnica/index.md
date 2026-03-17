---
sidebar_position: 0
---

# Analisi Tecnica

L'[analisi tecnica](../../glossario#analisi-tecnica) traduce l'[analisi funzionale](../../glossario#analisi-funzionale) in una soluzione implementabile, testabile e manutenibile. Non decide solo *cosa* costruire, ma *come* costruirlo in modo chiaro per tutto il team.

## Obiettivi

1. Modellare le entità e definire i moduli necessari
2. Individuare le interfacce software coinvolte
3. Definire il percorso ideale con cui affrontare lo sviluppo

## Il percorso

L'analisi tecnica è un wizard: ogni step produce output che alimenta il successivo.

```
Analisi funzionale → Perimetro → Modellazione → Contratti → Flussi → NFR → Piano → Handoff
```

Ogni step ha un criterio di completamento esplicito. Non si passa al successivo finché il criterio non è soddisfatto.

## FAQ

**L'analisi tecnica si fa sempre?**

No. Si fa per sviluppi rilevanti:
- modifiche al modello dati — qualsiasi cambiamento allo schema del database
- modifiche alle feature — qualsiasi aggiunta o variazione al comportamento esistente
- modifiche infrastrutturali — ambienti, pipeline, dipendenze esterne

Non richiede analisi tecnica: bug fix, correzioni di testo, refactoring interno che non altera comportamento né interfacce.

**Chi la fa?**

Dipende dalle competenze disponibili. Le modifiche al dominio richiedono sempre l'approvazione di qualcuno che sia sia esperto del dominio sia tecnicamente competente — può coincidere con lo sviluppatore, oppure essere un'altra figura o più persone che partecipano alla revisione. Stesso discorso per scelte architetturali o introduzione di librerie esterne. L'indipendenza è preferibile dove possibile, ma non è mai totale.

**Deve seguire un template preciso?**

L'importante è che sia esaustiva nei contenuti. La forma è un nice-to-have: l'IA può migliorare la struttura, aggiungere diagrammi Mermaid, rendere il documento più leggibile. Un documento grezzo ma completo vale infinitamente più di uno ben formattato ma superficiale. Per task piccoli può esserci più analisi che codice — va bene così: l'obiettivo è pensare prima di agire.

**Viene condivisa col team?**

Vivendo nel repository è già condivisa per definizione. C'è però una conseguenza meno ovvia: l'IA che assiste lo sviluppo legge la documentazione preesistente. A parità di strumento e configurazione, tutta la conoscenza accumulata nelle analisi tecniche è disponibile a ogni membro del team automaticamente. La documentazione non è solo memoria storica — è contesto attivo.

**Se durante lo sviluppo emergono cose non previste, si aggiorna?**

Vale il buon senso: si valuta l'impatto. Una piccola deviazione non richiede di riscrivere tutto; una scoperta che cambia il modello o le interfacce merita un aggiornamento. L'IA abbassa il costo di questo lavoro — dato il documento esistente e le modifiche emerse, aggiornarlo è questione di minuti.

**Se l'analisi rivela una complessità inattesa, chi decide come procedere?**

È una questione di organizzazione interna del team: ridurre lo scope, tornare dall'analista funzionale o procedere comunque sono decisioni che dipendono dal contesto, dalle priorità e da chi ha la responsabilità del prodotto. L'analisi tecnica ha il compito di rendere visibile la complessità — la decisione su cosa farne spetta al team.

---

**Inizia da:** [Step 1 — Analisi Funzionale](01-analisi-funzionale.md)
