# ADR-001: Clean Architecture + Modular Monolith

## Status
Accepted

## Context
Precisamos de uma arquitetura que:
- Separe claramente responsabilidades (domínio, aplicação, infraestrutura, apresentação)
- Permita evolução para microsserviços no futuro
- Seja testável e manutenível
- Suporte múltiplos módulos de negócio (12 previstos)
- Facilite onboarding de novos desenvolvedores

## Decision
Adotar **Clean Architecture** organizada como **Modular Monolith**:

```
src/
├── CicloHelper.Domain          # Camada mais interna (regras de negócio puras)
├── CicloHelper.Application     # Casos de uso, orquestração
├── CicloHelper.Infrastructure  # Implementações técnicas (EF Core, SQL, etc.)
├── CicloHelper.API             # Apresentação HTTP (Controllers, Middleware)
├── CicloHelper.Contracts       # DTOs públicos da API
└── CicloHelper.Web             # Frontend React (fora da solução .NET)
```

**Regras de dependência** (Dependency Rule):
- Domain → **nada** (apenas .NET BCL)
- Application → Domain
- Infrastructure → Domain + Application
- API → Application + Infrastructure + Domain + Contracts
- Contracts → **nada** (apenas .NET BCL)
- Web → API (via HTTP)

## Alternatives Considered

### 1. Layered Architecture (Tradicional)
- **Prós**: Simples, familiar
- **Contras**: Acoplamento forte, Domain depende de Infrastructure (DbContext), difícil testar

### 2. Microsserviços desde o início
- **Prós**: Escalabilidade independente, deploy isolado
- **Contras**: Complexidade operacional enorme, over-engineering para MVP, latência de rede, transações distribuídas

### 3. Vertical Slice Architecture
- **Prós**: Features isoladas, baixo acoplamento
- **Contras**: Duplicação de código transversal (auth, logging, validation), menos familiar para time

## Consequences

### Positivas
- ✅ Testabilidade: Domain e Application puros, fáceis de testar unitariamente
- ✅ Flexibilidade: Trocar Infrastructure (ex: EF Core → Dapper) sem tocar Domain/Application
- ✅ Evolução: Módulos podem ser extraídos para microsserviços no futuro
- ✅ Clareza: Responsabilidades bem definidas
- ✅ Onboarding: Estrutura padrão da indústria

### Negativas
- ⚠️ Mais projetos iniciais (7 projetos .NET)
- ⚠️ Boilerplate para novos módulos
- ⚠️ Requer disciplina para não violar Dependency Rule

### Mitigações
- Templates para novos módulos (script futuro)
- Analyzers para detectar violações de dependência
- Code review obrigatório

## Related
- ADR-003: EF Core como ORM
- ADR-004: MediatR para CQRS
- ADR-007: Soft Delete + Audit Fields
