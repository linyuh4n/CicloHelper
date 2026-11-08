# ADR-002: .NET 10 + C# 13

## Status
Accepted

## Context
Precisamos definir a versão do .NET e C# para o projeto. O projeto é novo (greenfield) e queremos usar recursos modernos.

## Decision
Usar **.NET 10** (Preview/RC na data de início) com **C# 13** (LangVersion: latest).

### Recursos principais que vamos usar:
- **Primary constructors** em classes/records
- **Collection expressions** (`[]`, `[..]`)
- **Inline arrays** (para performance)
- **Ref struct enhancements**
- **Params collections**
- **Aliases de tuplas** nomeadas
- **File-scoped namespaces** (padrão)
- **Required members** (`required` keyword)
- **Generic math** (interfaces numéricas)
- **Pattern matching** avançado

## Alternatives Considered

### .NET 8 (LTS)
- **Prós**: Suporte longo (até Nov 2026), estável, ampla adoção
- **Contras**: Recursos mais limitados, C# 12

### .NET 9 (STS - Nov 2024)
- **Prós**: Recursos modernos, suporte até May 2025
- **Contras**: Suporte curto, migração necessária em breve

### .NET 10 (Preview/RC - Nov 2025)
- **Prós**: Últimos recursos, C# 13, performance melhorada, suporte LTS a partir de Nov 2025
- **Contras**: Pode ter breaking changes em preview/RC

## Consequences

### Positivas
- ✅ Acesso a recursos modernos de linguagem
- ✅ Performance melhorada (AOT, trimming, GC)
- ✅ Suporte LTS a partir de Nov 2025 (3 anos)
- ✅ Alinhado com roadmap Microsoft
- ✅ Atrai desenvolvedores (tech stack moderno)

### Negativas
- ⚠️ Tooling pode ter bugs em preview/RC
- ⚠️ Algumas libs podem não ter suporte oficial ainda
- ⚠️ Breaking changes possíveis até RTM

### Mitigações
- Pin versions em `Directory.Packages.props`
- Testes de integração em CI
- Monitorar anúncios Microsoft
- Fallback para .NET 9 se necessário

## Related
- ADR-010: Centralized Package Management
