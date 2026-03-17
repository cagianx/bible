---
sidebar_position: 7
---

# Step 7 — Piano e Stime

Il piano trasforma l'analisi in lavoro pianificabile: task concreti, dipendenze esplicite, stime separate per componente. L'obiettivo è che lo sprint possa partire senza blocchi nascosti.

## Breakdown per componente

Le stime si fanno separate per componente, non aggregate. La suddivisione naturale è:

| Componente | Contenuto |
|---|---|
| **Dominio e modellazione** | entity, [migration](../../glossario#migration), configurazioni EF |
| **Business logic** | [casi d'uso](../../glossario#caso-duso), servizi di dominio, test di integrazione inclusi |
| **UI** | interfaccia utente |
| **Sviluppi trasversali** | infrastruttura, configurazione, pipeline, integrazioni esterne |

Tenerle separate serve a rendere possibile il parallelismo: una volta che il dominio è stabile, business logic e UI possono procedere in parallelo nello stesso sprint. Una stima aggregata nasconde queste dipendenze.

## Dipendenze

Per ogni task, identificare:
- quali task devono essere completati prima che possa iniziare
- quali task può sbloccare una volta completato
- se ci sono dipendenze esterne al team

Le dipendenze bloccanti vanno risolte o escalate prima che lo sprint inizi — non si scopre a metà sprint che un task è bloccato su qualcos'altro.

## Spike

Se esiste un'incertezza tecnica significativa — una libreria mai usata, un'integrazione non documentata, un comportamento del sistema non chiaro — si pianifica uno **[spike](../../glossario#spike)**: un task a tempo fisso per esplorare e produrre una risposta, non un'implementazione. Uno spike ha una durata massima e un output atteso (documento, prototipo, decisione).

## Rischi

Per ogni rischio identificato:
- **probabilità** — alta, media, bassa
- **impatto** — cosa succede se si realizza
- **mitigazione** — cosa si fa per ridurre probabilità o impatto

Un rischio non gestito è una sorpresa programmata.

## Criterio di completamento

Il piano è pianificabile in sprint senza blocchi nascosti. Le dipendenze sono esplicite. I rischi hanno una mitigazione o sono stati accettati consapevolmente.

---

**Prossimo step:** [Step 8 — Handoff](08-handoff.md)
