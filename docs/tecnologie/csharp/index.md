---
sidebar_position: 1
description: Regole e convenzioni per C# e ASP.NET Core.
---

# C# / ASP.NET Core

Convenzioni, pattern e riferimenti tecnici per lo sviluppo con C# e ASP.NET Core.

## Contenuto

1. [Struttura della solution](01-struttura-soluzione.md) — organizzazione dei progetti, naming, Program.cs minimal
2. [Switch expression e pattern matching](02-switch-assignment.md) — switch expression, pattern matching, when guard
3. [Rate limiting](03-rate-limiter.md) — `Microsoft.AspNetCore.RateLimiting`, policy, sliding window
4. [Feature flag](04-feature-flags.md) — `Microsoft.FeatureManagement`, flag condizionali, targeting
5. [Logging](05-logging.md) — `ILogger<T>`, Serilog, sink, log strutturati
6. [Osservabilità](06-osservabilita.md) — OpenTelemetry, trace, metriche, health checks
7. [Configurazione tipizzata](07-configuration.md) — `IOptions<T>`, `IOptionsMonitor<T>`, validazione
8. [Code native .NET](08-code-native.md) — `Queue<T>`, `ConcurrentQueue<T>`, `Channel<T>`
9. [Librerie per code e job](09-librerie-code.md) — Hangfire, Quartz.NET
10. [Middleware custom](10-middleware.md) — pipeline, `RequestDelegate`, gestione errori globale
11. [Action filter](11-action-filter.md) — `IActionFilter`, `IAsyncActionFilter`
12. [Authorization filter](12-authorization-filter.md) — `IAuthorizationFilter`, API key, tenant
13. [Exception filter](13-exception-filter.md) — `IExceptionFilter`, `IAsyncExceptionFilter`
14. [Problem Details (RFC 9457)](14-problem-details.md) — errori strutturati, `ProblemDetails`, `ValidationProblemDetails`
15. [Async / Await](15-async.md) — throughput nelle Web API, `CancellationToken`, anti-pattern
16. [Dependency Injection](16-dependency-injection.md) — lifetimes, captive dependency, keyed services
17. [HttpClient / IHttpClientFactory](17-httpclient.md) — typed client, DelegatingHandler, socket exhaustion
18. [Validazione](18-validation.md) — DataAnnotations, FluentValidation, ValidationProblemDetails
19. [Background services](19-background-services.md) — `BackgroundService`, worker pattern, graceful shutdown
20. [Caching](20-caching.md) — `IMemoryCache`, `IDistributedCache`, output caching
21. [Resilienza](21-resilience.md) — retry, circuit breaker, timeout con `Microsoft.Extensions.Http.Resilience`
22. [Records e immutabilità](22-records.md) — `record`, `with` expression, DTO e value object

