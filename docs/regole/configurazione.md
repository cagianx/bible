---
sidebar_position: 11
---

# Configurazione

## Principio

La configurazione dell'applicazione vive nel database. L'unica eccezione è la stringa di connessione al database stesso, che per ovvie ragioni non può starci.

Questo approccio centralizza la configurazione in un posto solo, la rende modificabile a runtime senza rideploy e la mantiene versionabile come qualsiasi altro dato del sistema.

## Struttura

Il file `appsettings.json` contiene il minimo indispensabile per avviare l'applicazione:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=myapp;Username=myuser;Password=..."
  }
}
```

Nient'altro. Nessun parametro di business, nessuna soglia, nessuna feature flag, nessuna chiave di servizi esterni.

## Configurazione nel database

Tutto ciò che l'applicazione deve sapere per funzionare — al di là di come connettersi al database — è una riga o un set di righe nel database. Questo include:

- parametri di business (soglie, limiti, valori di default)
- feature flag (vedi [`regole/git`](git.md))
- endpoint e credenziali di servizi esterni
- qualsiasi impostazione che varia tra ambienti o nel tempo

Il modello di configurazione è parte del dominio a tutti gli effetti: va modellato in EF, versionato con le migration e accessibile tramite il `DbContext`.

## Segreti

La stringa di connessione non va mai committata. In sviluppo si usa `dotnet user-secrets` o una variabile d'ambiente locale. In staging e produzione si usa una variabile d'ambiente o un secret manager dell'infrastruttura.

```bash
# Sviluppo locale
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;..."
```

Il file `appsettings.json` committato nel repository non contiene valori reali — solo placeholder o valori di sviluppo non sensibili.