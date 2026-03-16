---
sidebar_position: 2
---

# Sviluppo

## Fase 1: dominio e test di integrazione


La prima fase consiste nel:

1. **Apportare le aggiunte al dominio** necessarie emerse dall'analisi tecnica
2. **Scrivere un test di integrazione** che garantisca il funzionamento base delle modifiche
3. **Verificare che gli altri test non si rompano** — questo dovrebbe essere coperto automaticamente dalla CI

## Fase 2: business logic

La fase successiva consiste nell'abbozzare la business logic. A questo punto i casi d'uso devono essere chiari, e con essi la UI necessaria.

È quindi possibile sviluppare interamente **sotto test di integrazione** tutte le parti di business logic, prima ancora di toccare l'interfaccia utente.

Una volta completata la modellazione del caso d'uso, l'implementazione della **business logic** e della **UI** possono procedere in parallelo.

## Step opzionale: validazione con l'analista funzionale

Al termine dello sviluppo del caso d'uso, è consigliabile condividere i risultati con l'analista funzionale per verificare la correttezza delle logiche introdotte. Questo passaggio permette di intercettare eventuali incomprensioni prima che raggiungano la produzione.
