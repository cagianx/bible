---
sidebar_position: 3
---

# Ambiente di Sviluppo

## Regola

L'ambiente di sviluppo deve essere facilmente reso operativo. L'ideale è che appena fatto il clone si giri la chiave e tutto si accenda: nessuna configurazione manuale, nessun prerequisito implicito, nessun passaggio non documentato.

Un ambiente difficile da avviare è un costo nascosto: rallenta chi inizia, scoraggia i contributi, e introduce errori dovuti a setup incompleti o divergenti.

## Avvio in tre comandi

```bash
git clone https://github.com/cagianx/my-docs.git
cd my-docs
pnpm install && pnpm start
```

Il sito è disponibile su http://localhost:3000.

## Prerequisiti espliciti

Tutto ciò che è necessario deve essere dichiarato esplicitamente. Attualmente:

- **Node.js** >= 20
- **pnpm** (package manager)

## Regole per chi modifica il progetto

- Se aggiungi un prerequisito, documentalo immediatamente nel README e qui.
- Se aggiungi uno step di setup, automatizzalo oppure documentalo. Mai darlo per scontato.
- Il README è la porta d'ingresso: deve sempre riflettere la realtà.
