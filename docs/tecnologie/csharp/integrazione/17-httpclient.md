---
sidebar_position: 17
description: HttpClient e IHttpClientFactory in ASP.NET Core — typed client, DelegatingHandler e gestione corretta del ciclo di vita.
---

# HttpClient / IHttpClientFactory

## Il problema con `new HttpClient()`

Istanziare `HttpClient` direttamente con `new` causa due problemi:

**Socket exhaustion** — `HttpClient` non chiude immediatamente i socket TCP alla dispose. Creare e distruggere istanze in rapida successione esaurisce le porte disponibili, causando errori `SocketException` sotto carico.

**DNS stale** — un'istanza singleton condivisa non aggiorna la risoluzione DNS: se l'IP del servizio esterno cambia, il client continua a usare quello vecchio fino al riavvio dell'applicazione.

`IHttpClientFactory` risolve entrambi: gestisce un pool di handler HTTP con rotazione controllata del ciclo di vita, separando il ciclo di vita del client (breve) da quello dell'handler (più lungo, ma rinnovato periodicamente).

## Typed client

Il pattern preferito è il **typed client**: una classe dedicata per ogni API esterna, con le dipendenze iniettate nel costruttore.

```csharp
public class PagamentiClient
{
    private readonly HttpClient _http;

    public PagamentiClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<EsitoPagemento> AutorizzaAsync(
        RichiestaAutorizzazione richiesta,
        CancellationToken ct)
    {
        var response = await _http.PostAsJsonAsync("/autorizza", richiesta, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<EsitoPagemento>(ct)
            ?? throw new InvalidOperationException("Risposta vuota dal servizio pagamenti.");
    }
}
```

Registrazione in `Program.cs`:

```csharp
builder.Services
    .AddHttpClient<PagamentiClient>(client =>
    {
        client.BaseAddress = new Uri("https://api.pagamenti.internal/");
        client.Timeout = TimeSpan.FromSeconds(10);
        client.DefaultRequestHeaders.Add("Accept", "application/json");
    });
```

Il typed client è registrato come **transient**: ogni risoluzione ottiene un'istanza nuova con un `HttpClient` fresco, mentre l'handler sottostante viene riutilizzato dal pool.

## Named client

Quando si hanno molte chiamate sparse che non giustificano una classe dedicata, si usa il named client:

```csharp
builder.Services.AddHttpClient("pagamenti", client =>
{
    client.BaseAddress = new Uri("https://api.pagamenti.internal/");
});
```

```csharp
public class MioServizio
{
    private readonly IHttpClientFactory _factory;

    public MioServizio(IHttpClientFactory factory)
    {
        _factory = factory;
    }

    public async Task EseguiAsync(CancellationToken ct)
    {
        var client = _factory.CreateClient("pagamenti");
        var response = await client.GetAsync("/stato", ct);
        // ...
    }
}
```

Il named client è meno tipizzato del typed client: il nome è una stringa, le opzioni non sono collocate vicino all'uso. Il typed client è preferibile quando il servizio esterno è usato in più punti.

## DelegatingHandler

I `DelegatingHandler` aggiungono comportamento trasversale alla pipeline HTTP del client: autenticazione, logging, retry. Si concatenano e ogni handler chiama il successivo.

```csharp
public class AuthHeaderHandler : DelegatingHandler
{
    private readonly ITokenProvider _tokenProvider;

    public AuthHeaderHandler(ITokenProvider tokenProvider)
    {
        _tokenProvider = tokenProvider;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken ct)
    {
        var token = await _tokenProvider.GetTokenAsync(ct);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await base.SendAsync(request, ct);
    }
}
```

```csharp
builder.Services.AddTransient<AuthHeaderHandler>();

builder.Services
    .AddHttpClient<PagamentiClient>(client =>
    {
        client.BaseAddress = new Uri("https://api.pagamenti.internal/");
    })
    .AddHttpMessageHandler<AuthHeaderHandler>();
```

Per retry e circuit breaker si aggiunge la resilienza direttamente sulla catena del client. Vedi [21-resilience](21-resilience.md).
