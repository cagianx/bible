---
sidebar_position: 3
---

# Step 3 — Staging e Validazione

Il codice non è "fatto" quando i test passano in CI. È fatto quando è stato validato su staging da chi ha prodotto l'analisi funzionale.

## Deploy in staging

Con il [trunk-based development](../../glossario#trunk-based-development) non si aspetta la fine dello sprint per rilasciare. Appena un caso d'uso è completo e integrato su `main`, si stacca una versione e la si porta in [staging](../../glossario#staging). Vedi [`processi/pipeline`](../pipeline.md).

Il criterio è la completezza — non la perfezione. Un caso d'uso completo significa: dominio stabile, business logic testata, CI verde.

## Validazione end-to-end

Chi ha prodotto l'analisi funzionale esegue il test end-to-end in staging. È la persona giusta perché conosce il caso d'uso originale, le regole di business e i casi limite che contano davvero.

Il test end-to-end non è un test automatico — è una verifica umana sul comportamento reale del sistema in un ambiente reale. Intercetta le incomprensioni che i test automatici non possono vedere: flussi che tecnicamente funzionano ma non fanno quello che l'utente si aspetta.

## Esito della validazione

**Approvato** — il caso d'uso è done. Si può procedere con il prossimo o con il rilascio in produzione.

**Richiesta di correzione** — si torna allo step pertinente. Se è un malinteso sulla logica, si torna alla business logic. Se è un problema di modello, si valuta l'impatto e si decide se è una modifica o un nuovo caso d'uso.

**Ambiguità nell'analisi funzionale** — si torna all'analista funzionale per chiarire. Le assunzioni non dichiarate durante l'analisi tecnica si pagano qui.

## [Definition of Done](../../glossario#definition-of-done)

Un caso d'uso è **done** quando:

- [ ] dominio aggiornato e migration applicate
- [ ] business logic implementata con test di integrazione
- [ ] CI verde su `main`
- [ ] deploy in staging effettuato
- [ ] validazione end-to-end approvata da chi ha prodotto l'[analisi funzionale](../../glossario#analisi-funzionale)
