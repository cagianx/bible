---
sidebar_position: 6
---

# Git

## Commit

Ogni commit deve rappresentare **un'unità logica di lavoro** — una modifica coerente e completa, non un salvataggio intermedio. La storia di un repository è documentazione: deve essere leggibile da chiunque debba capire come è arrivato a quello stato.

### Formato dei messaggi

Si usa **Conventional Commits**:

```
<type>(<scope>): <descrizione breve>
```

Tipi comuni:

| Tipo | Quando usarlo |
|------|---------------|
| `feat` | nuova funzionalità |
| `fix` | bug fix |
| `chore` | task di manutenzione (dipendenze, config, release) |
| `docs` | solo documentazione |
| `refactor` | refactoring senza cambi di comportamento |
| `test` | aggiunta o modifica di test |
| `perf` | miglioramento di performance |

La descrizione è in minuscolo, al presente, senza punto finale: `feat(auth): add jwt refresh token`, non `Added JWT refresh token.`

### Regole

**Un commit, una cosa.** Non si mischiano refactoring e nuove feature nello stesso commit. Se stai aggiungendo una funzionalità e trovi un bug da correggere, sono due commit separati.

**Il messaggio descrive il perché, non il cosa.** `fix: prevent race condition in payment processing` è meglio di `fix: add mutex lock`. Il diff mostra già cosa è cambiato.

**Non si committa codice che non compila.** La storia deve essere in uno stato funzionante a ogni commit, non solo alla fine.

## Branch

Si tende al **trunk-based development**: il lavoro confluisce direttamente su `main`, che rappresenta sempre uno stato rilasciabile.

I branch, se usati, hanno vita breve — ore, al massimo qualche giorno. Un branch che vive settimane accumula conflitti, diverge dal trunk e diventa costoso da integrare. Se una funzionalità richiede tempo, non si tiene in un branch: si integra su `main` nascosta da un feature flag.

L'unica eccezione sono i **branch di manutenzione** per versioni in produzione che devono ricevere fix senza includere lo sviluppo corrente:

```
release/1.2.x
hotfix/1.2.1
```

## Feature flag

I feature flag sono lo strumento che rende possibile il trunk-based development. Permettono di integrare codice incompleto su `main` senza esporlo agli utenti, mantenendo il trunk sempre deployabile.

Un flag può essere semplice come una variabile di configurazione:

```csharp
if (_featureFlags.IsEnabled("nuova-funzionalita"))
{
    // codice in sviluppo
}
```

**I flag non sono permanenti.** Ogni flag ha una data di scadenza implicita: quando la funzionalità è completa e stabile, il flag si rimuove e il codice condizionale diventa il percorso unico. Flag abbandonati che nessuno rimuove sono debito tecnico.

## Pull Request

Le PR sono uno strumento di revisione, non un obbligo. Hanno un costo reale: richiedono persone disponibili a fare review o automatismi (CI, IA) che le gestiscano. In team piccoli o con trunk-based development maturo, push diretti su `main` con CI solida possono essere più efficienti.

Quando si usano le PR:

- il titolo segue le convenzioni dei commit
- la descrizione spiega cosa cambia e perché — non riscrive il diff
- la CI deve essere verde prima del merge
- la PR è piccola: oltre 400 righe di diff è probabile che possa essere spezzata

## Cosa non si fa

- **Force push su `main`** — mai, per nessun motivo
- **Commit di credenziali, segreti o file di ambiente** — vanno in `.gitignore` prima che accada
- **`--no-verify`** — i pre-commit hook esistono per un motivo; si bypassano solo in casi eccezionali espliciti, mai per abitudine
- **Merge di branch con CI rotta** — se i test falliscono, si risolve prima di procedere