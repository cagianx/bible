---
sidebar_position: 4
---

# Step 4 — Contratti

I [contratti](../../glossario#contratto) definiscono come i moduli comunicano tra loro e con il mondo esterno. Un contratto è un accordo: una volta pubblicato, cambiarlo ha un costo. Progettarlo bene fin dall'inizio riduce [breaking changes](../../glossario#breaking-change) futuri.

## Cosa definire per ogni interfaccia

Per ogni endpoint, evento o integrazione:

| Campo | Dettaglio |
|---|---|
| **Schema request** | campi, tipi, vincoli, valori ammessi |
| **Schema response** | struttura, campi opzionali, valori di default |
| **Errori** | codici, messaggi, struttura dell'errore |
| **Validazioni** | cosa viene validato e dove |
| **Autenticazione** | schema richiesto (API key, JWT, cookie…) |
| **Autorizzazione** | ruoli o policy necessari |
| **Versionamento** | come si gestisce l'evoluzione del contratto |
| **[Idempotenza](../../glossario#idempotenza)** | obbligatoria per operazioni critiche — stessa request, stesso risultato |

## Idempotenza

Le operazioni critiche — pagamenti, invio di ordini, operazioni che producono effetti collaterali — devono essere [idempotenti](../../glossario#idempotenza). Il chiamante deve poter ripetere la stessa richiesta in caso di timeout o errore di rete senza produrre effetti duplicati.

L'idempotenza si garantisce tipicamente tramite una chiave idempotency fornita dal chiamante:

```
POST /ordini
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

Il sistema memorizza la chiave e, se riceve la stessa richiesta una seconda volta, restituisce la risposta originale senza rieseguire l'operazione.

## Versionamento dei contratti

I contratti si versionano esplicitamente. Un cambio che rompe la compatibilità non si fa in silenzio: si introduce una nuova versione e si mantiene la vecchia per un periodo di transizione concordato con i team dipendenti.

Strategie comuni:
- **versione nell'URL** — `/api/v2/ordini`
- **versione nell'header** — `API-Version: 2`

La scelta dipende dal contesto, ma la coerenza all'interno dello stesso sistema è più importante della strategia scelta.

## Contratti interni vs esterni

I [contratti](../../glossario#contratto) tra moduli interni allo stesso sistema hanno più flessibilità: possono evolvere con il sistema. I contratti esposti a sistemi esterni o a team separati sono impegni formali — vanno trattati con la stessa cura di un'API pubblica.

## Criterio di completamento

I contratti sono consumabili da un team esterno senza necessità di interpretazioni o chiarimenti informali.

---

**Prossimo step:** [Step 5 — Flussi Critici](05-flussi.md)
