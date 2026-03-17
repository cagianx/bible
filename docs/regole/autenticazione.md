---
sidebar_position: 10
---

# Autenticazione e Autorizzazione

## Principio

Si usano esclusivamente tecnologie standard e i middleware autenticativi e autorizzativi nativi di ASP.NET Core. Nessuna implementazione custom di meccanismi di sicurezza.

La sicurezza non è un campo in cui reinventare la ruota paga. Le astrazioni di ASP.NET Core sono consolidate, testate e manutenute. Qualsiasi deviazione introduce superficie di attacco e complessità non necessaria.

## Meccanismi supportati

I meccanismi di autenticazione si scelgono in base al contesto. Tutti si configurano tramite il sistema di autenticazione di ASP.NET Core (`AddAuthentication`, `AddAuthorization`):

| Meccanismo | Quando usarlo |
|---|---|
| **API Key** | integrazioni machine-to-machine semplici, senza scadenza gestita |
| **Bearer Token** | API chiamate da client che gestiscono il token |
| **JWT** | token stateless con claim incorporati, adatto per microservizi |
| **Cookie** | applicazioni web con sessione lato server |
| **SSO / OAuth2 / OIDC** | autenticazione delegata a identity provider esterno |

È possibile configurare più schemi di autenticazione contemporaneamente — per esempio JWT per le API e cookie per il pannello di amministrazione.

## Regole

**Non si implementa autenticazione custom.** Niente middleware scritti a mano per validare token, niente logica di sessione proprietaria. Si usa ciò che il framework fornisce.

**L'autorizzazione si dichiara, non si programma.** Si usano le policy e gli attribute di ASP.NET Core (`[Authorize]`, `[Authorize(Policy = "...")]`). La logica di autorizzazione complessa va in `IAuthorizationHandler`, non sparsa nei controller o nei casi d'uso.

**I segreti non stanno nel codice.** API key, certificati, client secret vanno in variabili d'ambiente o in un secret manager. Mai in `appsettings.json` committato.

**Il Core non conosce l'autenticazione.** Le informazioni sull'utente autenticato (id, ruoli, claim) arrivano al caso d'uso come parametri espliciti, non letti direttamente dall'`HttpContext`. Il Core non dipende da ASP.NET Core.