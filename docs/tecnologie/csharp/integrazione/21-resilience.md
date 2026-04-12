---
sidebar_position: 21
description: Resilienza delle chiamate HTTP in ASP.NET Core — retry, circuit breaker e timeout con Microsoft.Extensions.Http.Resilience e Polly.
---

# Resilienza

Qualsiasi chiamata a un servizio esterno può fallire: timeout, errori transienti, sovraccarico temporaneo. Senza resilienza, un singolo servizio lento o instabile può bloccare a cascata tutta l'applicazione.

## Microsoft.Extensions.Http.Resilience

Da .NET 8, il pacchetto `Microsoft.Extensions.Http.Resilience` (built on Polly v8) è il modo standard per aggiungere resilienza a `IHttpClientFactory`. Non richiede configurazione manuale di Polly.

```bash
dotnet add package Microsoft.Extensions.Http.Resilience
```

## Standard resilience handler

La configurazione predefinita include retry con backoff esponenziale, circuit breaker e timeout. Copre il 90% dei casi senza customizzazione:

```csharp
builder.Services
    .AddHttpClient<PagamentiClient>(client =>
    {
        client.BaseAddress = new Uri("https://api.pagamenti.internal/");
    })
    .AddStandardResilienceHandler();
```

Il pipeline standard include in ordine:
1. **Retry totale** — timeout complessivo per tutti i tentativi
2. **Retry** — fino a 3 tentativi con backoff esponenziale e jitter
3. **Circuit breaker** — apre il circuito se il tasso di errori supera la soglia
4. **Attempt timeout** — timeout per ogni singolo tentativo

## Configurazione personalizzata

```csharp
builder.Services
    .AddHttpClient<PagamentiClient>(client =>
    {
        client.BaseAddress = new Uri("https://api.pagamenti.internal/");
    })
    .AddResilienceHandler("pagamenti", pipeline =>
    {
        pipeline.AddRetry(new HttpRetryStrategyOptions
        {
            MaxRetryAttempts = 3,
            Delay = TimeSpan.FromMilliseconds(200),
            BackoffType = DelayBackoffType.Exponential,
            UseJitter = true,
            ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                .Handle<HttpRequestException>()
                .HandleResult(r => r.StatusCode == HttpStatusCode.ServiceUnavailable)
                .HandleResult(r => r.StatusCode == HttpStatusCode.TooManyRequests)
        });

        pipeline.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
        {
            SamplingDuration = TimeSpan.FromSeconds(10),
            MinimumThroughput = 5,
            FailureRatio = 0.5,        // apre se >50% fallisce
            BreakDuration = TimeSpan.FromSeconds(30)
        });

        pipeline.AddTimeout(TimeSpan.FromSeconds(5));
    });
```

## I tre pattern

### Retry

Riprova automaticamente in caso di errori transitori. Utile per errori di rete momentanei o risposte `503`.

Il **jitter** aggiunge un piccolo delay casuale al backoff: evita che più client sincronizzati colpiscano il servizio tutti insieme dopo un'interruzione (thundering herd).

Non va usato su operazioni non idempotenti senza cautela: una chiamata di pagamento ritentata più volte può addebitare più volte. In questi casi si delega la retry al layer di idempotenza del servizio ricevente.

### Circuit breaker

Dopo un certo numero di errori consecutivi, il circuito si **apre**: le chiamate successive falliscono immediatamente senza nemmeno tentare la connessione. Dopo un timeout il circuito va in **half-open**: lascia passare una chiamata di prova. Se va a buon fine, si chiude; altrimenti rimane aperto.

```
Closed ──── troppi errori ────► Open
  ▲                               │
  │                        timeout scaduto
  │                               │
  └───── prova riuscita ─── Half-Open
```

Protegge il servizio chiamato dal sovraccarico durante il recovery, e libera rapidamente i thread del chiamante anziché tenerli bloccati su connessioni destinate a fallire.

### Timeout

Imposta un limite alla durata di ogni chiamata. Senza timeout, un servizio lento tiene occupato un thread indefinitamente. Si distingue tra:

- **Attempt timeout** — timeout per ogni singolo tentativo
- **Total timeout** — timeout complessivo inclusi i retry

Il total timeout deve essere maggiore di `attempt_timeout × max_tentativi`.

## Cosa non proteggere con retry

- Risposte `4xx` (eccetto `429 Too Many Requests`): indicano un errore del chiamante, non del servizio. Ritentare non cambierà il risultato.
- Operazioni con effetti collaterali non idempotenti senza coordinazione con il server.
