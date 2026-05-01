---
sidebar_position: 1
description: Struttura fisica della solution .NET — cartelle, .sln, .csproj e convenzioni di naming per assembly e namespace.
---

# Struttura fisica

## Struttura minima

```
NomeSoluzione/                           ← root del repository
├── .git/
├── NomeSoluzione.sln
├── CLAUDE.md                            # istruzioni per l'IA
├── README.md
├── src/
│   ├── models/
│   │   └── models.csproj                # DTO, enum di dominio, Result&lt;T&gt;
│   ├── db/
│   │   └── db.csproj                    # DbContext, entità, Fluent API, migration
│   ├── core/
│   │   └── core.csproj                  # domain service, validator, use case, DI per dominio
│   └── api/
│       └── api.csproj                   # ASP.NET Core — entry point HTTP
├── integrations/
│   ├── email/
│   │   └── email.csproj                 # client SMTP — implementa IEmailSender
│   └── pdf/
│       └── pdf.csproj                   # generatore PDF — implementa IPdfGenerator
└── tests/
    └── integration/
        └── integration.csproj           # test di integrazione
```

La root del repository coincide con la cartella che contiene il `.sln`. È qui che va la cartella `.git` e tutti i file di configurazione del progetto: `README.md`, `CLAUDE.md`, `agents.md`, `.gitignore`, `.editorconfig` e simili. Tenerli in sotto-cartelle li rende invisibili agli strumenti che operano dalla root (editor, agenti IA, CI).

Le cartelle e i `.csproj` usano nomi semplici e standard (`core`, `api`, `db`). Il nome della solution è già visibile nell'IDE — ripeterlo in ogni progetto è ridondante.

Ogni progetto aggiuntivo (Worker, Console, Job) segue lo stesso schema: dipende da `Core`, non da `Db` direttamente salvo necessità.

## Naming

Il nome del `.csproj` è semplice. Assembly e namespace invece riportano il nome completo della solution come prefisso: sono riferimenti esterni che devono essere univoci e riconoscibili fuori dal contesto IDE (log, NuGet, referenze cross-solution).

```
cartella          →  api/
.csproj (file)    →  api/api.csproj
nome in .sln/IDE  →  api
assembly          →  NomeSoluzione.Api.dll
namespace         →  NomeSoluzione.Api.*
```

Poiché il nome del file non corrisponde al namespace voluto, `AssemblyName` e `RootNamespace` vanno impostati esplicitamente nel `.csproj`:

```xml
<!-- src/api/api.csproj -->
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <AssemblyName>NomeSoluzione.Api</AssemblyName>
    <RootNamespace>NomeSoluzione.Api</RootNamespace>
  </PropertyGroup>
</Project>
```

Nomi di cartella/progetto standard: `core`, `api`, `db`, `webui`, `console`, `worker`, `tests`.

❌ Da evitare:

```xml
<!-- api/NomeSoluzione.Api.csproj — ripete il nome della solution nel file -->
<!-- api/api.csproj senza AssemblyName/RootNamespace — namespace risultante: api.* -->
```
