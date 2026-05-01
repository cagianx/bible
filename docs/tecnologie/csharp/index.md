---
sidebar_position: 1
description: Regole e convenzioni per C# e ASP.NET Core.
---

# C# / ASP.NET Core

Convenzioni, pattern e riferimenti tecnici per lo sviluppo con C# e ASP.NET Core.

## Contenuto

1. [Switch expression e pattern matching](linguaggio/02-switch-assignment.md) — switch expression, pattern matching, when guard
2. [Rate limiting](pipeline/03-rate-limiter.md) — `Microsoft.AspNetCore.RateLimiting`, policy, sliding window
3. [Feature flag](04-feature-flags.md) — `Microsoft.FeatureManagement`, flag condizionali, targeting
4. [Logging](osservabilita/05-logging.md) — `ILogger<T>`, Serilog, sink, log strutturati
5. [Osservabilità](osservabilita/06-osservabilita.md) — OpenTelemetry, trace, metriche, health checks
6. [Configurazione tipizzata](07-configuration.md) — `IOptions<T>`, `IOptionsMonitor<T>`, validazione
7. [Code native .NET](concorrenza/08-code-native.md) — `Queue<T>`, `ConcurrentQueue<T>`, `Channel<T>`
8. [Librerie per code e job](concorrenza/09-librerie-code.md) — Hangfire, Quartz.NET
9. [Middleware custom](pipeline/10-middleware.md) — pipeline, `RequestDelegate`, gestione errori globale
10. [Action filter](pipeline/11-action-filter.md) — `IActionFilter`, `IAsyncActionFilter`
11. [Authorization filter](pipeline/12-authorization-filter.md) — `IAuthorizationFilter`, API key, tenant
12. [Exception filter](pipeline/13-exception-filter.md) — `IExceptionFilter`, `IAsyncExceptionFilter`
13. [Problem Details (RFC 9457)](pipeline/14-problem-details.md) — errori strutturati, `ProblemDetails`, `ValidationProblemDetails`
14. [Async / Await](linguaggio/15-async.md) — throughput nelle Web API, `CancellationToken`, anti-pattern
15. [Dependency Injection](16-dependency-injection.md) — lifetimes, captive dependency, keyed services
16. [HttpClient / IHttpClientFactory](integrazione/17-httpclient.md) — typed client, DelegatingHandler, socket exhaustion
17. [Validazione](pipeline/18-validation.md) — DataAnnotations, FluentValidation, ValidationProblemDetails
18. [Background services](concorrenza/19-background-services.md) — `BackgroundService`, worker pattern, graceful shutdown
19. [Caching](integrazione/20-caching.md) — `IMemoryCache`, `IDistributedCache`, output caching
20. [Resilienza](integrazione/21-resilience.md) — retry, circuit breaker, timeout con `Microsoft.Extensions.Http.Resilience`
21. [Records e immutabilità](linguaggio/22-records.md) — `record`, `with` expression, DTO e value object

### Struttura della Solution
- [Struttura fisica](struttura-soluzione/01-struttura-fisica.md) — filesystem, .sln, .csproj, naming assembly e namespace
- [Dipendenze tra progetti](struttura-soluzione/02-dipendenze.md) — Core, Db, Api, Tests e direzione delle dipendenze
- [Organizzazione di Core](struttura-soluzione/03-organizzazione-core.md) — Screaming Architecture, dominio vs tipo tecnico
- [UseCases](struttura-soluzione/04-usecases.md) — livello intermedio, comandi completi, SaveChanges, Result pattern
- [Convenzioni](struttura-soluzione/05-convenzioni.md) — naming esplicito, un file per classe, record, interfacce, Program.cs
- [Progetti di integrazione](struttura-soluzione/06-integrazioni.md) — client HTTP/SOAP, librerie esterne, confinamento delle dipendenze
- [Models](struttura-soluzione/07-models.md) — DTO, enum di dominio, Result&lt;T&gt;, tipi condivisi tra progetti

### Entity Framework
- [Code First — Setup e migration](entity-framework/01-code-first.md) — DbContext, registrazione, Fluent API, migration CLI
- [IQueryable vs List](entity-framework/02-queryable-vs-list.md) — esecuzione differita, N+1, AsNoTracking
- [LINQ con Entity Framework](entity-framework/03-linq.md) — proiezioni, paginazione, Include, SQL grezzo

### Test unitari
- [A cosa servono](test-unitari/01-scopo.md) — logica pura, monitoraggio librerie di terze parti, verifica di comportamenti puntuali

### Test di integrazione
- [Pattern: template e scope](test-integrazione/01-pattern.mdx) — classe base NUnit, clone da template, scope DI per test
- [Scrivere un test](test-integrazione/02-scrivere-test.md) — `Get<T>()`, `SeedAsync`, FluentAssertions, parallelismo
- [Testcontainers](test-integrazione/03-testcontainers.md) — PostgreSQL in Docker, nessuna dipendenza locale

