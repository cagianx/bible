---
sidebar_position: 5
description: Tecniche per integrare questa guida in un progetto come knowledge base per gli agenti IA — sottomodulo git, riferimenti da CLAUDE.md, glossario condiviso.
---

# Uso con IA

Questa guida è scritta per essere letta sia da persone sia da agenti IA. Il formato (Markdown, Mermaid, struttura piatta) è grep-abile, versionabile e si presta a essere incluso direttamente nel contesto di un agente.

Non è una documentazione progettuale: descrive un punto di vista sullo sviluppo software. Per usarla in un progetto reale come knowledge base dell'IA, servono alcune tecniche di integrazione.

## Sottomodulo git

Si aggiunge MyDocs al progetto come submodule, **pinnato a un tag preciso**:

```bash
git submodule add https://github.com/cagianx/my-docs.git my-docs
cd my-docs && git checkout v0.1.19 && cd ..
git add . && git commit -m "chore: add my-docs v0.1.19 as submodule"
```

Il submodule offre tre garanzie:

- **Versionato** — il commit del progetto registra esattamente quale revisione di MyDocs è in vigore in quel momento
- **Riproducibile** — chiunque cloni il progetto con `--recurse-submodules` ottiene la stessa documentazione che aveva l'IA quando ha generato il codice
- **Aggiornabile su richiesta** — il bump è un atto esplicito, non una deriva silenziosa

Si evitano alternative come copia manuale, fork senza tracciamento o link a sito esterno: tutte rendono opaca la versione effettiva in uso.

## Riferimenti puntuali da CLAUDE.md

Un link generico a MyDocs è poco utile. L'agente IA va indirizzato alle sezioni rilevanti per il progetto specifico — quelle restanti rimangono disponibili ma non in primo piano.

Esempio per un progetto C# / Entity Framework:

```markdown
# Knowledge base

Questo progetto segue le convenzioni in `my-docs/`. Riferimenti principali:

- Modellazione dominio → `my-docs/docs/regole/dominio.md`
- Entity Framework → `my-docs/docs/regole/entity-framework.md`
- Architettura solution → `my-docs/docs/regole/architettura.md`
- Test → `my-docs/docs/regole/testing.md`
- Git e commit → `my-docs/docs/regole/git.md`
- Glossario → `my-docs/docs/glossario.md`

Per cercare altri concetti, partire da `my-docs/docs/indice-analitico.md`.
```

Lo stesso vale per `AGENTS.md` o per i file equivalenti di altri agenti. Un progetto frontend Angular avrà riferimenti diversi rispetto a un'API .NET — il file di configurazione dell'IA è lo strato che adatta MyDocs al contesto.

## Glossario come ubiquitous language

Il glossario (`my-docs/docs/glossario.md`) definisce i termini tecnici e di dominio. Adottarli nel progetto — nei nomi delle classi, nei commit, nelle PR, nel codice — produce coerenza tra documentazione e implementazione.

L'IA, leggendo gli stessi termini in entrambi i contesti, riconosce i concetti senza ambiguità: `IUseCase`, `Result<T>`, `DbContext`, `feature flag` significano la stessa cosa in MyDocs e nel progetto. Si evitano sinonimi, traduzioni casuali, abbreviazioni private.

Quando il dominio del progetto introduce termini propri, vanno aggiunti al glossario del progetto (non di MyDocs) e referenziati con la stessa disciplina.

## Indice analitico come entry point per le ricerche

Per cercare un concetto in MyDocs, l'IA dovrebbe partire da `my-docs/docs/indice-analitico.md` — non con un grep cieco. L'indice mappa ogni concetto alla pagina dove è trattato per esteso, riducendo i falsi positivi e accelerando la navigazione.

Va istruito esplicitamente nel CLAUDE.md, altrimenti l'agente farà ricerche full-text inefficienti.

## Markdown e Mermaid come formato IA-native

Tutto il contenuto è testo:

- **Markdown** per la prosa e la struttura — diff-abile, grep-abile, leggibile riga per riga
- **Mermaid** per i diagrammi — è codice, non un'immagine

Si evitano: screenshot, PDF, wiki esterne, presentazioni, audio. Tutti formati che l'IA non può leggere o aggiornare nello stesso commit del codice.

Vedi anche [`regole/documentazione`](regole/documentazione.md).

## Aggiornamento del submodule come commit dedicato

Il bump della versione di MyDocs è un atto tracciato, non una modifica accodata:

```bash
cd my-docs && git checkout v0.1.20 && cd ..
git add my-docs
git commit -m "chore(my-docs): bump to v0.1.20"
```

Si evita di mescolare il bump con altre modifiche: se una regola cambia, ce ne si accorge prima che inquini un commit di feature. La review del diff (`git diff` sul submodule) è una buona occasione per allineare il progetto alle eventuali nuove indicazioni.

## Riferimenti nei commit e nelle PR

Quando l'IA applica una regola di MyDocs, citarla nel commit o nella PR rende esplicito il *perché*:

```
feat(ordini): use Result<T> for command outcomes

Vedi my-docs/docs/regole/gestione-errori.md.
```

Per chi legge la storia del progetto, il riferimento è un puntatore al ragionamento — non si rincorrono motivazioni ricostruite a posteriori. Per l'IA, è un esempio in più di come collegare codice e documentazione.
