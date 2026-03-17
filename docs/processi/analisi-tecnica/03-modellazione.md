---
sidebar_position: 3
---

# Step 3 — Modellazione dei Dati

La modellazione dei dati è lo step più importante dell'analisi tecnica. Un errore qui si propaga in ogni strato del sistema e diventa costoso da correggere. Un modello corretto rende tutto il resto più semplice.

Si modella in due livelli: lo schema del database e i DTO che circolano tra i moduli.

## Schema del database

Lo schema è la fonte di verità del dominio. Si definisce in termini di:

- **Entità e relazioni** — tabelle, chiavi esterne, cardinalità
- **Constraint** — not null, unique, check constraint. L'integrità si garantisce a livello strutturale, non applicativo
- **Stati e transizioni** — se un'entità ha un ciclo di vita, si modellano gli stati ammessi e le transizioni valide
- **Storico e audit** — se serve tracciabilità, si progetta da subito: aggiungere audit in seguito è costoso
- **[Soft delete](../../glossario#soft-delete)** — se le entità non si cancellano fisicamente, si introduce `DeletedAt` fin dall'inizio

### Indici

Gli indici non si aggiungono per abitudine o anticipazione — si ragiona su [casi d'uso](../../glossario#caso-duso) reali.

Il **[clustered index](../../glossario#clustered-index)** non va dimenticato: deve supportare il caso d'uso più generico della tabella, tipicamente la ricerca per chiave primaria. In PostgreSQL corrisponde all'ordinamento fisico implicito per `id`.

Ogni indice aggiuntivo va giustificato da una query concreta: quale caso d'uso lo richiede, con quali volumi attesi.

### Retrocompatibilità

Il database viene aggiornato prima del software in produzione. Ogni modifica deve essere retrocompatibile con il software attualmente in esecuzione. Questo significa:

- si aggiunge, non si rinomina
- si aggiunge, non si rimuove (si depreca)
- le nuove colonne hanno un default o sono nullable

Quando la retrocompatibilità non è possibile, si tratta di un [breaking change](../../glossario#breaking-change) esplicito con strategia di [migrazione](../../glossario#migration). Vedi [`regole/entity-framework`](../../regole/entity-framework.md).

## [DTO](../../glossario#dto)

I [DTO](../../glossario#dto) sono i modelli che i moduli usano per comunicare tra loro — request, response, eventi. Si definiscono in questa fase perché derivano direttamente dal modello dati e dai contratti che si disegneranno nello step successivo.

Un DTO non è mai una copia 1:1 dell'entità del database: espone solo ciò che serve al chiamante, con i nomi che appartengono all'[Ubiquitous Language](../../glossario#ubiquitous-language).

## Criterio di completamento

Il modello dati supporta tutti i casi d'uso identificati senza incoerenze note. Gli indici sono giustificati da query reali. La strategia di [migrazione](../../glossario#migration) è definita.

---

**Prossimo step:** [Step 4 — Contratti](04-contratti.md)
