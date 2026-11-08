# ADR-005: Problem Details (RFC 9457) para Erros da API

## Status
Accepted

## Context
Precisamos de um formato padronizado para respostas de erro HTTP que seja:
- Interoperável (padrão IETF)
- Máquina-legível (clients podem parsear)
- Extensível
- Compatível com ferramentas existentes

## Decision
Adotar **RFC 9457 (Problem Details for HTTP APIs)** como formato padrão para **todas** as respostas de erro (4xx, 5xx).

### Implementação
```csharp
// Program.cs
builder.Services.AddProblemDetails(options => {
    options.CustomizeProblemDetails = ctx => {
        ctx.ProblemDetails.Instance = ctx.HttpContext.Request.Path;
        ctx.ProblemDetails.Extensions["traceId"] = Activity.Current?.Id ?? ctx.HttpContext.TraceIdentifier;
    };
});

// ValidationFilter (ModelState → ProblemDetails)
var problemDetails = new ProblemDetails {
    Type = "https://tools.ietf.org/html/rfc9457",
    Title = "Erro de validação",
    Status = StatusCodes.Status400BadRequest,
    Detail = "Um ou mais erros de validação ocorreram.",
    Instance = context.HttpContext.Request.Path,
    Extensions = new Dictionary<string, object?> {
        ["errors"] = errors,  // Dictionary<string, string[]>
        ["traceId"] = context.HttpContext.TraceIdentifier
    }
};

// ExceptionHandlingMiddleware (unhandled exceptions)
var problemDetails = new ProblemDetails {
    Type = "https://tools.ietf.org/html/rfc9457",
    Title = "Ocorreu um erro interno",
    Status = StatusCodes.Status500InternalServerError,
    Instance = context.Request.Path,
    Extensions = new Dictionary<string, object?> {
        ["traceId"] = traceId,
        ["correlationId"] = correlationId
    }
};
```

### Tipos de Erro Personalizados (Extensões)
```csharp
// 404 Not Found
new ProblemDetails {
    Type = "https://ciclohelper.app/errors/not-found",
    Title = "Recurso não encontrado",
    Status = 404,
    Detail = "O ciclo com ID {id} não foi encontrado.",
    Extensions = { ["resourceType"] = "Cycle", ["resourceId"] = id }
}

// 403 Forbidden (Authorization)
new ProblemDetails {
    Type = "https://ciclohelper.app/errors/forbidden",
    Title = "Acesso negado",
    Status = 403,
    Detail = "Você não tem permissão para acessar este recurso.",
    Extensions = { ["requiredPolicy"] = "Cycle.Read" }
}

// 409 Conflict (Business Rule)
new ProblemDetails {
    Type = "https://ciclohelper.app/errors/conflict",
    Title = "Conflito de negócio",
    Status = 409,
    Detail = "Já existe um ciclo ativo para este período.",
    Extensions = { ["conflictField"] = "startDate" }
}
```

## Alternatives Considered

### Custom Error Format
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }
```
- **Prós**: Controle total
- **Contras**: Não interoperável, clients customizados, sem tooling

### RFC 7807 (Problem Details for HTTP APIs - anterior ao 9457)
- **Prós**: Similar
- **Contras**: RFC 9457 é a versão atualizada (2023), preferir padrão vigente

## Consequences

### Positivas
- ✅ Padrão IETF amplamente suportado
- ✅ Clients genéricos podem tratar erros (ex: `fetch` interceptors)
- ✅ Swagger/OpenAPI documenta automaticamente
- ✅ Extensível via `Extensions` dictionary
- ✅ `traceId`/`correlationId` para debugging distribuído
- ✅ Validação (400) e exceções (500) usam mesmo formato

### Negativas
- ⚠️ Mais verbose que formatos simples
- ⚠️ Requer middleware customizado para unificar

### Mitigações
- Middleware centralizado (`ExceptionHandlingMiddleware`, `ValidationFilter`)
- Helper methods para criar ProblemDetails comuns
- Testes de contrato para formato de erro

## Related
- ADR-001: Clean Architecture (Middleware na API layer)
- ADR-004: MediatR (ValidationBehavior → ProblemDetails)
