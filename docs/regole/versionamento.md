---
sidebar_position: 2
---

# Versionamento

## Semantic Versioning

Si usa **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

- `PATCH` — bug fix, correzioni di testo, aggiornamenti minori
- `MINOR` — nuove funzionalità o contenuti, compatibili con quanto già esistente
- `MAJOR` — cambiamenti che rompono la compatibilità o ristrutturazioni significative

Il bump di versione deve riflettere l'entità reale della modifica. Non esiste il pride versioning.

## Regole

1. **La versione installata deve essere sempre visibile.** Ogni istanza del software deve rendere immediatamente identificabile la propria versione, senza dover accedere a file di configurazione o log. Questo è il primo strumento di diagnosi quando si segnala un problema.

2. **Ogni versione deve essere tracciabile in modo non ambiguo sui sorgenti.** Ad ogni versione corrisponde un tag git `vX.Y.Z`. Non si effettua un rilascio senza taggare il commit. Il tag è l'unico riferimento affidabile per risalire all'esatto stato del codice di una versione in produzione.

## Workflow di rilascio

1. Aggiornare `version` in `package.json`
2. Commit: `git commit -m "chore: release vX.Y.Z"`
3. Tag: `git tag vX.Y.Z`
4. Push: `git push && git push --tags`
