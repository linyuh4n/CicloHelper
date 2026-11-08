# ADR-004: MediatR para CQRS

## Status
Accepted

## Context
Precisamos implementar CQRS (Command Query Responsibility Segregation) para separar operações de escrita (Commands) de leitura (Queries), facilitando testes, validação e autorização.

## Decision
Usar **MediatR 12** como mediator in-process para dispatch de Commands, Queries e Domain Events.

### Estrutura
```csharp
// Application/Common
public interface ICommand : IRequest { }
public interface ICommand<TResponse> : IRequest<TResponse> { }
public interface IQuery<TResponse> : IRequest<TResponse> { }

public interface ICommandHandler<TCommand> : IRequestHandler<TCommand> where TCommand : ICommand { }
public interface ICommandHandler<TCommand, TResponse> : IRequestHandler<TCommand, TResponse> where TCommand : ICommand<TResponse> { }
public interface IQueryHandler<TQuery, TResponse> : IRequestHandler<TQuery, TResponse> where TQuery : IQuery<TResponse> { }

// Uso
public record CreateCycleCommand(DateOnly StartDate, int Length) : ICommand<Guid>;
public class CreateCycleHandler : ICommandHandler<CreateCycleCommand, Guid> { ... }

public record GetCycleQuery(Guid Id) : IQuery<CycleDto>;
public class GetCycleHandler : IQueryHandler<GetCycleQuery, CycleDto> { ... }
```

### Pipeline Behaviors (ordem)
1. **ValidationBehavior** - FluentValidation (falha rápido)
2. **AuthorizationBehavior** - Políticas de autorização
3. **LoggingBehavior** - Log request/response (sem PII)
4. **PerformanceBehavior** - Métricas de latência
5. **TransactionBehavior** - `DbContext` transaction (apenas Commands)
6. **DomainEventDispatchBehavior** - Publica Domain Events após sucesso

### Domain Events
- Entidades herdam `BaseEntity` com `AddDomainEvent()`
- `IDomainEventDispatcher` dispara eventos após `SaveChanges`
- Handlers de Domain Event são `INotificationHandler<TEvent>`

## Alternatives Considered

### MediatR vs Custom Mediator
- **MediatR**: Maduro, amplamente usado, behaviors built-in, DI integration
- **Custom**: Controle total, mas reinventar roda

### MediatR vs Brighter/Paramore
- **Brighter**: Mais recursos (outbox, scheduling), mas mais complexo
- **MediatR**: Simples, foco no in-process, suficiente para modular monolith

### CQRS vs CRUD Services
- **CRUD Services**: Simples para casos triviais
- **CQRS**: Melhor para domínio complexo, validação, autorização, auditoria

## Consequences

### Positivas
- ✅ Separação clara: Commands (write) vs Queries (read)
- ✅ Validação centralizada via pipeline behavior
- ✅ Autorização centralizada
- ✅ Testabilidade: Handlers isolados, fáceis de mockar
- ✅ Domain Events: Desacoplamento de side effects
- ✅ Open/Closed: Novos handlers sem modificar existentes

### Negativas
- ⚠️ Indireção extra (handler → mediator → handler)
- ⚠️ Debugging: Stack trace mais longa
- ⚠️ Overhead mínimo de reflection (negligível)

### Mitigações
- Source Generator do MediatR (reduz reflection)
- Naming conventions claras (`*Command`, `*Handler`)
- Documentation de fluxos principais

## Related
- ADR-001: Clean Architecture
- ADR-003: EF Core (TransactionBehavior)
