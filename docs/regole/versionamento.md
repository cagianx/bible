---
sidebar_position: 2
description: Semantic versioning, pride versioning e strategie di versionamento adottate da software noti.
---

# Versionamento

## Semantic Versioning

**Semantic Versioning** (semver) è lo schema `MAJOR.MINOR.PATCH`, dove ogni segmento comunica l'impatto della modifica:

| Segmento | Quando si incrementa | Gli altri segmenti |
|----------|---------------------|--------------------|
| `MAJOR`  | Breaking change: si rompe la compatibilità con versioni precedenti | `MINOR` e `PATCH` tornano a 0 |
| `MINOR`  | Nuova funzionalità retrocompatibile | `PATCH` torna a 0 |
| `PATCH`  | Bug fix o correzione retrocompatibile | — |

Esempi pratici:

- Rinominare un campo in un'API pubblica → `MAJOR`
- Aggiungere un nuovo endpoint → `MINOR`
- Correggere un comportamento scorretto che non rompe contratti esistenti → `PATCH`

### Versioni di pre-release

La specifica semver prevede suffissi per versioni non stabili: `1.0.0-alpha.1`, `1.0.0-beta.3`, `1.0.0-rc.1`. Comunicano che il software non è ancora production-ready e che l'API potrebbe cambiare prima del rilascio finale.

### La versione `0.x.y`

Finché la versione MAJOR è `0`, l'API pubblica è considerata instabile: qualsiasi modifica può avvenire senza rispettare la retrocompatibilità. È lo spazio sicuro per l'iterazione rapida prima di un primo rilascio stabile.

---

## Pride versioning

Il *pride versioning* è il vizio di gonfiare i numeri di versione per ragioni di immagine anziché per rispecchiare l'entità reale delle modifiche.

Forme comuni:

- **Salto strategico**: passare direttamente alla `v2.0` perché "suona più maturo", anche se la modifica è retrocompatibile e meriterebbe al massimo un `MINOR`.
- **Numero tondo come milestone marketing**: rilasciare la `v10.0` in coincidenza di un anniversario o annuncio, indipendentemente dal contenuto tecnico.
- **Reset di credibilità**: azzerare il MAJOR dopo una riscrittura interna che non cambia i contratti pubblici, per segnalare "ora è serio".

Il problema non è estetico: la versione è un contratto comunicativo con chi usa il software. Un MAJOR bump falso genera falsa attesa di breaking changes; un MINOR eccessivo oscura cosa è davvero cambiato. Chi si affida al versioning per automatizzare aggiornamenti (dependency managers, CI) subisce conseguenze concrete.

Il bump di versione deve riflettere l'entità reale della modifica. Sempre.

---

## Strategie di versionamento nel software noto

Diversi progetti hanno adottato schemi alternativi o ibridi rispetto al semver classico, ciascuno per ragioni specifiche. Conoscerli aiuta a scegliere consapevolmente.

### Home Assistant — CalVer `YYYY.MM.patch`

Home Assistant usa il **calendar versioning**: `2024.1.0`, `2024.3.5`, `2025.1.0`.

Il numero di versione riflette *quando* è stato rilasciato, non *quanto è cambiato*. Il progetto pubblica un rilascio mensile ricco di nuove funzionalità e breaking changes, quindi un MAJOR semver avrebbe significato ricominciare da `v1` ogni mese. CalVer comunica immediatamente l'età del software installato: vedere `2022.6.3` su un sistema di produzione segnala subito che è vecchio di anni.

Punto di forza: orientamento temporale immediato, ciclo di rilascio prevedibile.
Punto debole: non comunica nulla sull'impatto delle modifiche — ogni aggiornamento mensile può contenere breaking changes.

### JetBrains — `YYYY.N` con ciclo annuale

JetBrains usa lo schema `ANNO.INDICE_RILASCIO`: IntelliJ IDEA `2024.1`, `2024.2`, `2024.3`.

L'anno è il contesto temporale; l'indice crescente indica il numero di rilascio major nell'anno. Non c'è un PATCH visibile nel nome del prodotto (le patch di manutenzione sono distribuite come update silenziosi). I rilasci major avvengono tre o quattro volte l'anno con cadenza prevedibile.

Punto di forza: gli utenti sanno immediatamente in quale "generazione" si trovano e si orientano nella documentazione.
Punto debole: l'assenza di un segmento patch nel nome rende opaca la manutenzione; le versioni minori non esistono come concetto pubblico.

### Angular — SemVer con release train semestrale

Angular segue il semver formale ma con una disciplina di rilascio rigida: un nuovo MAJOR ogni sei mesi, con deprecazioni annunciate con almeno una versione di anticipo.

Il MAJOR bump non indica necessariamente un salto tecnologico radicale, ma scandisce il ciclo di supporto (LTS, active, end-of-life). La prevedibilità del calendario è prioritaria rispetto alla semantica del numero: gli utenti sanno che Angular 18 arriverà a maggio e che Angular 16 raggiungerà l'end-of-life esattamente 18 mesi dopo il rilascio.

Punto di forza: comunicazione del ciclo di vita cristallina, planning degli aggiornamenti facilissimo.
Punto debole: il MAJOR perde parzialmente il suo significato di "breaking change imminente" — può indicare semplicemente "nuovo ciclo".

### .NET — versione intera con LTS/STS

.NET usa un numero intero crescente: .NET 6, 7, 8, 9, 10. Un rilascio all'anno, ogni novembre.

I rilasci pari (`6`, `8`, `10`) sono **LTS** (Long Term Support, tre anni); i dispari (`7`, `9`) sono **STS** (Standard Term Support, diciotto mesi). Non esiste un MINOR pubblicamente significativo: le patch di sicurezza e bug fix vengono distribuite come `8.0.x`.

Punto di forza: semplicità massima — il numero dice solo "quanto è recente". Il suffisso LTS/STS aggiunge l'informazione sul ciclo di vita senza complicare lo schema.
Punto debole: nessuna informazione sull'entità delle modifiche; breaking changes esistono (ogni major può romper qualcosa) ma non sono segnalate dallo schema numerico.

---

## Regole

Queste regole si applicano indipendentemente dalla strategia di versionamento scelta.

1. **Scegliere una strategia e mantenerla.** Cambiare schema di versionamento a metà progetto genera confusione, rompe automazioni e mina la fiducia di chi dipende dal software. La scelta va fatta prima del primo rilascio pubblico; se si cambia, va comunicato esplicitamente e documentato.

2. **La versione installata deve essere sempre visibile.** Ogni istanza del software deve rendere immediatamente identificabile la propria versione, senza dover accedere a file di configurazione o log. È il primo strumento di diagnosi quando si segnala un problema.

3. **Ogni binario installato deve essere riconducibile senza ambiguità a un commit git.** Ad ogni versione corrisponde un tag. Non si effettua un rilascio senza taggare il commit. Recuperare i sorgenti esatti a partire dal numero di versione installato deve essere un'operazione immediata — in un bugfix urgente in produzione, ogni minuto speso a capire "quale codice gira là" è un minuto perso.
