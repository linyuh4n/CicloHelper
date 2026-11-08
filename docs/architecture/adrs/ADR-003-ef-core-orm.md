# ADR-003: Entity Framework Core como ORM Principal

## Status
Accepted

## Context
Precisamos de um ORM para persistência no SQL Server. Requisitos:
- Produtividade (migrations, LINQ, change tracking)
- Performance aceitável
- Ecossistema maduro
- Suporte a SQL Server nativo

## Decision
Usar **Entity Framework Core 9** como ORM principal, com **Dapper** para queries de leitura complexas/performance-críticas.

### Configuração EF Core
- `ApplicationDbContext` com `DbContextOptions`
- Migrations versionadas em `Infrastructure/Migrations`
- `IEntityTypeConfiguration` para configuração por entidade
- **Soft Delete global** via Query Filter (`IsDeleted == false`)
- **Audit fields automáticos** no `SaveChanges`/`SaveChangesAsync`
- `EnableRetryOnFailure` para resiliência (3 retries, 5s delay)
- `NoTracking` para queries de leitura apenas

### Quando usar Dapper
- Relatórios complexos com múltiplos JOINs
- Queries de leitura em massa (bulk)
- Stored procedures
- Quando EF Core gerar SQL ineficiente (N+1, cartesianos)

## Alternatives Considered

### Dapper Only
- **Prós**: Performance máxima, controle total do SQL
- **Contras**: Boilerplate excessivo, migrations manuais, sem change tracking, propenso a erros

### NHibernate
- **Prós**: Recursos avançados, maturidade
- **Contras**: Curva de aprendizado íngreme, menos suporte .NET moderno, community menor

### Raw ADO.NET
- **Prós**: Controle total
- **Contras**: Produtividade muito baixa, propenso a erros (SQL injection, connection leaks)

## Consequences

### Positivas
- ✅ Produtividade alta para CRUD padrão
- ✅ Migrations versionadas e reversíveis
- ✅ LINQ type-safe
- ✅ Change tracking automático
- ✅ Ecossistema rico (tools, extensions, analyzers)
- ✅ Dapper disponível para casos de performance

### Negativas
- ⚠️ Overhead de change tracking (mitigado com `AsNoTracking()`)
- ⚠️ N+1 queries se não usar `Include()`/`ThenInclude()`
- ⚠️ SQL gerado pode ser verboso

### Mitigações
- Analyzer `Microsoft.EntityFrameworkCore.Analyzers` habilitado
- Code review para queries complexas
- `AsNoTracking()` padrão para queries de leitura
- Profiling em desenvolvimento (EF Core logging)

## Related
- ADR-007: Soft Delete + Audit Fields
- ADR-008: DateOnly para datas de calendário
