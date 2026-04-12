---
sidebar_position: 1
description: Regole e convenzioni per C# e ASP.NET Core.
---

# C# / ASP.NET Core

Convenzioni, pattern e riferimenti tecnici per lo sviluppo con C# e ASP.NET Core.

## Contenuto

1. [Struttura della solution](fondamentali/01-struttura-soluzione.md) — organizzazione dei progetti, naming, Program.cs minimal
2. [Switch expression e pattern matching](linguaggio/02-switch-assignment.md) — switch expression, pattern matching, when guard
3. [Rate limiting](pipeline/03-rate-limiter.md) — `Microsoft.AspNetCore.RateLimiting`, policy, sliding window
4. [Feature flag](fondamentali/04-feature-flags.md) — `Microsoft.FeatureManagement`, flag condizionali, targeting
5. [Logging](osservabilita/05-logging.md) — `ILogger<T>`, Serilog, sink, log strutturati
6. [Osservabilità](osservabilita/06-osservabilita.md) — OpenTelemetry, trace, metriche, health checks
7. [Configurazione tipizzata](fondamentali/07-configuration.md) — `IOptions<T>`, `IOptionsMonitor<T>`, validazione
8. [Code native .NET](concorrenza/08-code-native.md) — `Queue<T>`, `ConcurrentQueue<T>`, `Channel<T>`
9. [Librerie per code e job](concorrenza/09-librerie-code.md) — Hangfire, Quartz.NET
10. [Middleware custom](pipeline/10-middleware.md) — pipeline, `RequestDelegate`, gestione errori globale
11. [Action filter](pipeline/11-action-filter.md) — `IActionFilter`, `IAsyncActionFilter`
12. [Authorization filter](pipeline/12-authorization-filter.md) — `IAuthorizationFilter`, API key, tenant
13. [Exception filter](pipeline/13-exception-filter.md) — `IExceptionFilter`, `IAsyncExceptionFilter`
14. [Problem Details (RFC 9457)](pipeline/14-problem-details.md) — errori strutturati, `ProblemDetails`, `ValidationProblemDetails`
15. [Async / Await](linguaggio/15-async.md) — throughput nelle Web API, `CancellationToken`, anti-pattern
16. [Dependency Injection](fondamentali/16-dependency-injection.md) — lifetimes, captive dependency, keyed services
17. [HttpClient / IHttpClientFactory](integrazione/17-httpclient.md) — typed client, DelegatingHandler, socket exhaustion
18. [Validazione](pipeline/18-validation.md) — DataAnnotations, FluentValidation, ValidationProblemDetails
19. [Background services](concorrenza/19-background-services.md) — `BackgroundService`, worker pattern, graceful shutdown
20. [Caching](integrazione/20-caching.md) — `IMemoryCache`, `IDistributedCache`, output caching
21. [Resilienza](integrazione/21-resilience.md) — retry, circuit breaker, timeout con `Microsoft.Extensions.Http.Resilience`
22. [Records e immutabilità](linguaggio/22-records.md) — `record`, `with` expression, DTO e value object

