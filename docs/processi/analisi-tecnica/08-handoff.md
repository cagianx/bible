---
sidebar_position: 8
---

# Step 8 — Handoff

L'handoff è il momento in cui l'analisi tecnica diventa sviluppo. Non è un passaggio formale — è una verifica che tutto ciò che serve per iniziare a scrivere codice sia effettivamente disponibile.

## Output attesi

Un'analisi tecnica completa produce:

1. **Architettura e scelte tecnologiche** — componenti, pattern, alternative scartate e motivazioni
2. **Modello dati** — entità, relazioni, vincoli, stati, indici e strategia di migrazione
3. **Contratti delle interfacce** — API, eventi, integrazioni esterne e regole di versionamento
4. **Flussi critici** — sequenze passo-passo dei percorsi core, incluse eccezioni ed error handling
5. **Requisiti non funzionali** — performance, sicurezza, availability, audit, compliance
6. **Piano e stime** — task separati per componente, dipendenze, rischi e [spike](../../glossario#spike)
7. **Test strategy** — cosa testare, a quale livello, criteri di accettazione

Non tutti gli output hanno lo stesso peso per ogni sviluppo: un task puramente di dominio non richiede una sezione contratti elaborata. Si produce ciò che è rilevante.

## Criteri di qualità

L'analisi è pronta per lo sviluppo se un developer esterno al team può:

- capire cosa costruire senza chiedere chiarimenti continui
- sapere dove mettere il codice — moduli e responsabilità sono chiari
- conoscere il modello dati e i contratti da rispettare
- sapere come testare e cosa monitorare in produzione

Se uno di questi punti non è soddisfatto, l'analisi non è completa.

## Checklist prima di iniziare lo sviluppo

- [ ] Nessuna ambiguità aperta nell'[analisi funzionale](../../glossario#analisi-funzionale)
- [ ] Perimetro definito — noto cosa è nuovo, cosa cambia, cosa potrebbe rompersi
- [ ] Modello dati rivisto e approvato dalla figura preposta
- [ ] [Breaking changes](../../glossario#breaking-change) comunicati ai team dipendenti
- [ ] Contratti definiti e condivisi con chi li consumerà
- [ ] Piano con task e dipendenze esplicite
- [ ] Test strategy chiara — si sa già cosa testare e come

## Collegamento allo sviluppo

Una volta superata la checklist, lo sviluppo segue il processo descritto in [`processi/sviluppo`](../sviluppo/index.md): prima il dominio e i test di integrazione, poi la business logic, poi la UI.
