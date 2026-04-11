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

