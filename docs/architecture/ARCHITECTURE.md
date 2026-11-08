# Arquitetura do CicloHelper

## Visão Geral

O CicloHelper segue uma **Clean Architecture** organizada como **Modular Monolith**, preparada para evoluir para microsserviços no futuro.

## Princípios Arquiteturais

1. **Separação de Responsabilidades**: Camadas bem definidas com dependências unidirecionais
2. **Dependency Rule**: Camadas internas não conhecem camadas externas
3. **Domain-Driven Design**: Modelo de domínio rico no centro
4. **CQRS**: Separação de Commands (escrita) e Queries (leitura)
5. **Privacy by Design**: Segurança e privacidade como requisitos arquiteturais
6. **Observabilidade**: Logging estruturado, Health Checks, Correlation ID

## Estrutura de Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                      CicloHelper.API                         │
│  Controllers | Middleware | DI | Swagger | Problem Details  │
└─────────────────────────────┬───────────────────────────────┘
                              │ Depende de
┌─────────────────────────────▼───────────────────────────────┐
│                    CicloHelper.Application                   │
│  Use Cases | Commands/Queries | Handlers | Validators       │
│  Interfaces (Ports) | Authorization | Domain Events        │
└─────────────────────────────┬───────────────────────────────┘
                              │ Depende de
┌─────────────────────────────▼───────────────────────────────┐
│                      CicloHelper.Domain                      │
│  Entities | Value Objects | Enums | Domain Events           │
│  Business Rules | Domain Services | Repository Interfaces  │
└─────────────────────────────┬───────────────────────────────┘
                              ▲ Implementa
┌─────────────────────────────┴───────────────────────────────┐
│                   CicloHelper.Infrastructure                 │
│  EF Core | SQL Server | Repositories | External Services   │
│  Migrations | Health Checks | Logging | Encryption         │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           CicloHelper.Contracts   CicloHelper.Tests
           (Public API DTOs)       (Unit + Integration)
```

## Projetos

### CicloHelper.Domain
**Responsabilidade**: Núcleo do domínio, regras de negócio puras.

- **Entidades**: `BaseEntity` (Id, CreatedAt, UpdatedAt, DeletedAt, IsDeleted, DomainEvents)
- **Value Objects**: Implementação base com igualdade estrutural
- **Domain Events**: `IDomainEvent`, `DomainEvent` (record), `IDomainEventDispatcher`
- **Enums**: Tipos de domínio
- **Interfaces de Repositório**: Contratos (não implementações)

### CicloHelper.Application
**Responsabilidade**: Casos de uso, orquestração, validação.

- **Commands/Queries**: `ICommand`, `ICommand<TResponse>`, `IQuery<TResponse>`
- **Handlers**: `ICommandHandler`, `IQueryHandler` (via MediatR)
- **Validação**: FluentValidation integrado ao pipeline MediatR
- **Autorização**: Políticas em nível de aplicação
- **Interfaces (Ports)**: `IApplicationDbContext`, `IEmailService`, etc.
- **Domain Event Handlers**: Processamento de eventos de domínio

### CicloHelper.Infrastructure
**Responsabilidade**: Implementações técnicas, persistência, integrações.

- **EF Core**: `ApplicationDbContext` com:
  - Soft Delete global (query filter `IsDeleted == false`)
  - Audit Fields automáticos (CreatedAt, UpdatedAt, DeletedAt)
  - Configurações via `IEntityTypeConfiguration`
- **Repositórios**: Implementações concretas
- **Serviços Externos**: Email, Storage, Identity Providers
- **Criptografia**: Serviços de envelope encryption (futuro)
- **Health Checks**: Database, external services

### CicloHelper.API
**Responsabilidade**: Camada de apresentação HTTP, configuração da aplicação.

- **Program.cs**: Composition root, middleware pipeline
- **Controllers**: Thin controllers, delegam para MediatR
- **Middleware**:
  - `CorrelationIdMiddleware`: X-Correlation-ID header
  - `ExceptionHandlingMiddleware`: Problem Details RFC 9457
  - `ValidationFilter`: Validação de ModelState → Problem Details
- **Swagger/OpenAPI**: Documentação automática
- **Health Checks**: `/health`, `/health/ready`, `/health/live`
- **CORS**: Policy para desenvolvimento
- **Serilog**: Structured logging com correlation ID

### CicloHelper.Contracts
**Responsabilidade**: Contratos públicos da API (DTOs).

- **Requests**: Input DTOs com validação (Data Annotations)
- **Responses**: Output DTOs
- **Enums**: Compartilhados entre frontend e backend
- **Versioning**: Preparado para v1, v2, etc.

## Padrões Implementados

### CQRS com MediatR
```csharp
// Command (escrita)
public record CreateCycleCommand(DateOnly StartDate, int CycleLength) : ICommand<Guid>;

// Query (leitura)
public record GetCycleQuery(Guid Id) : IQuery<CycleDto>;

// Handler
public class CreateCycleHandler : ICommandHandler<CreateCycleCommand, Guid> {
    public async Task<Guid> Handle(CreateCycleCommand request, CancellationToken ct) { ... }
}
```

### Soft Delete + Audit
```csharp
// BaseEntity
public abstract class BaseEntity {
    public Guid Id { get; protected set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; protected set; }
    public DateTimeOffset? DeletedAt { get; protected set; }
    public bool IsDeleted { get; protected set; }
    
    public void SoftDelete() { IsDeleted = true; DeletedAt = DateTimeOffset.UtcNow; }
}

// ApplicationDbContext - SaveChanges intercepta e aplica automaticamente
```

### Problem Details (RFC 9457)
```json
{
  "type": "https://tools.ietf.org/html/rfc9457",
  "title": "Erro de validação",
  "status": 400,
  "detail": "Um ou mais erros de validação ocorreram.",
  "instance": "/api/v1/cycles",
  "traceId": "00-abc123...",
  "errors": {
    "startDate": ["A data de início é obrigatória."]
  }
}
```

### Correlation ID
- Header: `X-Correlation-ID`
- Propagado automaticamente via middleware
- Incluído em logs (Serilog) e respostas de erro
- Gerado se não enviado pelo cliente

## Módulos (Preparados para Futuro)

1. **Identity / Accounts** - Autenticação, autorização, perfis
2. **Menstrual Tracking** - Ciclos, menstruações, sintomas, fluxo
3. **Daily Diary** - Anotações, humor, bem-estar
4. **Cycle Predictions** - Previsões, janela fértil, TPM
5. **Nutrition** - Alimentação, hidratação, suplementos
6. **Exercises** - Treinos, performance, recuperação
7. **Recommendations** - Recomendações personalizadas por fase
8. **Content Management** - Artigos, educativo, FAQ
9. **Reports** - Relatórios, exportação, insights
10. **Privacy / Data Management** - LGPD, exportação, exclusão
11. **Administration** - Painel admin, usuários, métricas
12. **Support** - Help desk, feedback, tickets

## Datas e Timezone

| Tipo | Uso | Armazenamento |
|------|-----|---------------|
| `DateOnly` | Datas de calendário (início ciclo, previsões) | DATE (sem timezone) |
| `DateTimeOffset` | Instantes (created, updated, eventos) | DATETIMEOFFSET (UTC) |

**Timezone padrão**: `America/Sao_Paulo`
- Conversão para UTC apenas em instantes (`DateTimeOffset`)
- **NUNCA** converter `DateOnly` para UTC (altera o dia)

## Segurança

### Autenticação (BFF Pattern)
- **Cookies HttpOnly + Secure + SameSite=Strict**
- **Access Token**: Curto prazo (15 min), apenas no backend
- **Refresh Token**: HttpOnly cookie, rotação, revogação
- **Providers**: Google, Apple (OIDC)
- **Tokens nunca no localStorage/sessionStorage**

### Criptografia (Planejada - ADR Pendente)
- **TLS 1.3** em trânsito
- **TDE** no Azure SQL Database
- **Application Encryption** para dados sensíveis:
  - AES-256-GCM
  - DEK por usuário (Envelope Encryption)
  - KEK no Azure Key Vault (Managed Identity)
  - Nonce único por operação
  - Versionamento criptográfico
  - Rotação de KEK/DEK
  - Crypto-shredding para direito ao esquecimento

### Headers de Segurança
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restritiva
- `Content-Security-Policy` (futuro)

## Observabilidade

### Logging (Serilog)
- **Structured JSON** em produção
- **Console** em desenvolvimento
- **File** rolling daily (30 dias retenção)
- **Correlation ID** em todos os logs
- **Níveis**: Warning+ para Microsoft/System, Information para aplicação
- **Nenhum PII/dado sensível** em logs

### Health Checks
- `/health` - Completo (DB, external services)
- `/health/ready` - Readiness probe (K8s)
- `/health/live` - Liveness probe (K8s)

### Métricas (Futuro)
- Prometheus + Grafana
- Custom metrics por módulo
- Business metrics (usuários ativos, ciclos registrados)

## Deployment

### Desenvolvimento Local
- Docker Compose: SQL Server 2022
- .NET Aspire (futuro)

### Produção (Planejado)
| Componente | Provedor |
|------------|----------|
| Frontend | Vercel |
| Backend | Azure App Service (Linux) |
| Database | Azure SQL Database |
| Files | Azure Blob Storage |
| Secrets | Azure Key Vault |
| Monitoring | Sentry + Application Insights |
| CI/CD | GitHub Actions |

## Decisões Arquiteturais (ADRs)

Veja [docs/architecture/adrs/](adrs/) para decisões documentadas:

- ADR-001: Clean Architecture + Modular Monolith
- ADR-002: .NET 10 + C# 13
- ADR-003: EF Core como ORM principal
- ADR-004: MediatR para CQRS
- ADR-005: Problem Details RFC 9457
- ADR-006: BFF Pattern para Autenticação
- ADR-007: Soft Delete + Audit Fields
- ADR-008: DateOnly para datas de calendário
- ADR-009: Tailwind CSS v4 + CSS Variables
- ADR-010: Centralized Package Management
