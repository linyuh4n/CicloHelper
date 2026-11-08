# ADR-006: BFF Pattern para Autenticação

## Status
Accepted

## Context
O CicloHelper lida com dados de saúde sensíveis (menstrual, reprodutiva). A arquitetura de autenticação deve:
- **Nunca** expor tokens ao frontend (localStorage, sessionStorage, JS accessível)
- Proteger contra XSS (token roubo via script malicioso)
- Proteger contra CSRF
- Suportar provedores sociais (Google, Apple) via OIDC
- Permitir logout global e revogação de refresh tokens

## Decision
Implementar **Backend-for-Frontend (BFF) Pattern** com **Session Cookie** gerenciada pelo ASP.NET Core.

### Arquitetura
```
┌─────────────┐     HTTPS + Cookies      ┌─────────────┐     OIDC/Tokens     ┌──────────────┐
│   Browser   │ ◄──────────────────────► │  CicloHelper  │ ◄──────────────► │  Identity    │
│  (React)    │   HttpOnly, Secure,      │     API       │   Access Token   │  Providers   │
│             │   SameSite=Strict        │   (BFF)       │   Refresh Token  │  (Google,    │
└─────────────┘                          └─────────────┘                  │  Apple)      │
                                              │                            └──────────────┘
                                              ▼
                                    ┌─────────────────┐
                                    │  Token Storage  │
                                    │  (Server-side)  │
                                    │  - Distributed  │
                                    │    Cache/Redis  │
                                    │  - Encrypted    │
                                    └─────────────────┘
```

### Fluxo de Login
1. Frontend redireciona para `/api/v1/auth/login?provider=google`
2. API inicia challenge OIDC → Redireciona para Google/Apple
3. Callback OIDC → `/api/v1/auth/callback`
4. API troca `code` por `access_token` + `refresh_token`
5. **Tokens armazenados server-side** (encrypted, keyed by userId)
6. API cria **session cookie** (`ciclohelper_session`) HttpOnly, Secure, SameSite=Strict
7. API redireciona para frontend (`/dashboard`)

### Fluxo de Requisição Autenticada
1. Browser envia cookie automaticamente
2. Middleware valida session → recupera `access_token` do store
3. `access_token` injetado no `HttpContext` / `HttpClient` para chamadas downstream
4. Se `access_token` expirado → usa `refresh_token` silenciosamente
5. Se `refresh_token` expirado/revogado → 401 + limpa cookie

### Logout
1. Frontend chama `POST /api/v1/auth/logout`
2. API revoga `refresh_token` no provedor (se suportado)
3. Remove tokens do store server-side
4. Limpa cookie (`Set-Cookie: ciclohelper_session=; Max-Age=0; ...`)
5. Retorna 200

### Configuração de Cookie
```csharp
builder.Services.AddAuthentication(options => {
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = "oidc";
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options => {
    options.Cookie.Name = "ciclohelper_session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.Path = "/";
    options.ExpireTimeSpan = TimeSpan.FromMinutes(15); // Access token lifetime
    options.SlidingExpiration = true;
    options.Events.OnRedirectToLogin = ctx => {
        ctx.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
})
.AddOpenIdConnect("oidc", options => { /* Google/Apple config */ });
```

## Alternatives Considered

### JWT em localStorage + Refresh em HttpOnly Cookie
- **Prós**: Simples, stateless
- **Contras**: **Vulnerável a XSS** (token acessível via JS), não atende requisitos de segurança

### JWT em HttpOnly Cookie (Access + Refresh)
- **Prós**: Tokens não acessíveis via JS
- **Contras**: Cookies grandes (header size), CSRF risk (mitigado com SameSite=Strict), refresh token rotation complexo

### Session Server-side (Tradicional) + BFF
- **Prós**: Tokens nunca no cliente, controle total, revogação imediata
- **Contras**: Stateful (precisa distributed cache), mais complexo

## Consequences

### Positivas
- ✅ **Tokens nunca no browser** (XSS-proof)
- ✅ **HttpOnly + Secure + SameSite=Strict** (CSRF mitigado)
- ✅ **Refresh Token Rotation** server-side
- ✅ **Revogação imediata** (logout, security events)
- ✅ **Auditoria** de login/logout/token refresh
- ✅ **Múltiplos provedores** (Google, Apple) abstraídos

### Negativas
- ⚠️ **Stateful** - precisa distributed cache (Redis) em produção
- ⚠️ **Latência** extra (cookie validation + token lookup)
- ⚠️ **Complexidade** de implementação

### Mitigações
- In-memory cache para desenvolvimento (DistributedCache)
- Redis/Azure Cache for Redis em produção
- Métricas de latência de auth
- Documentação detalhada (ADR separado para implementação)

## Related
- ADR-008: Criptografia de dados sensíveis
- ADR-009: LGPD / Crypto-shredding
