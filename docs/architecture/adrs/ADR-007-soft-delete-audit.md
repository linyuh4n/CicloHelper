# ADR-007: Soft Delete + Audit Fields

## Status
Accepted

## Context
Dados de saúde menstrual e reprodutiva são sensíveis e regulados (LGPD). Precisamos:
- **Rastreabilidade**: Quem criou/modificou/excluiu e quando
- **Recuperação**: Undo de exclusão acidental
- **Auditoria**: Trilha completa para compliance
- **Performance**: Queries não retornam dados "excluídos" por padrão

## Decision
Implementar **Soft Delete** + **Audit Fields** em **todas as entidades** via `BaseEntity` e `ApplicationDbContext`.

### BaseEntity
```csharp
public abstract class BaseEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; protected set; }
    public DateTimeOffset? DeletedAt { get; protected set; }
    public bool IsDeleted { get; protected set; }
    
    // Domain Events
    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    internal void SetUpdatedAt() => UpdatedAt = DateTimeOffset.UtcNow;
    
    public void SoftDelete() {
        IsDeleted = true;
        DeletedAt = DateTimeOffset.UtcNow;
        SetUpdatedAt();
        AddDomainEvent(new EntitySoftDeletedEvent(this));
    }
    
    public void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}
```

### ApplicationDbContext - SaveChanges Override
```csharp
public override Task<int> SaveChangesAsync(CancellationToken ct = default) {
    UpdateAuditFields();
    return base.SaveChangesAsync(ct);
}

private void UpdateAuditFields() {
    foreach (var entry in ChangeTracker.Entries<BaseEntity>()) {
        switch (entry.State) {
            case EntityState.Added:
                entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
                break;
            case EntityState.Modified:
                entry.Entity.SetUpdatedAt();
                break;
            case EntityState.Deleted:
                entry.State = EntityState.Modified;  // Intercepta DELETE
                entry.Entity.SoftDelete();           // Marca como excluído
                break;
        }
    }
}
```

### Global Query Filter
```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder) {
    foreach (var entityType in modelBuilder.Model.GetEntityTypes()) {
        if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType)) {
            modelBuilder.Entity(entityType.ClrType)
                .HasQueryFilter(e => !((BaseEntity)e).IsDeleted);
        }
    }
}
```

### Acesso a Dados Excluídos (Quando Necessário)
```csharp
// Apenas para admin/auditoria - uso explícito
var deletedCycles = await _context.Cycles
    .IgnoreQueryFilters()
    .Where(c => c.IsDeleted)
    .ToListAsync();
```

## Alternatives Considered

### Hard Delete + Audit Table
- **Prós**: Simples, tabela principal limpa
- **Contras**: JOINs complexos para auditoria, recuperação difícil, FKs quebram

### Temporal Tables (SQL Server)
- **Prós**: Nativo, automático, point-in-time queries
- **Contras**: Apenas SQL Server, não portável, schema changes complexos, não captura "quem" (apenas "quando")

### Event Sourcing
- **Prós**: Auditoria completa nativa, replay, temporal queries
- **Contras**: Complexidade enorme, over-engineering para MVP, curva de aprendizado

## Consequences

### Positivas
- ✅ **Recuperação simples**: `entity.IsDeleted = false; entity.DeletedAt = null;`
- ✅ **Auditoria automática**: CreatedAt/UpdatedAt/DeletedAt em toda entidade
- ✅ **Queries limpas**: Por padrão não retornam excluídos (Query Filter)
- ✅ **Domain Event**: `EntitySoftDeletedEvent` para side effects (notificações, indexing)
- ✅ **LGPD Compliance**: Base para "direito ao esquecimento" (crypto-shredding futuro)

### Negativas
- ⚠️ **Storage**: Dados excluídos ocupam espaço (mitigado: purge job futuro)
- ⚠️ **Índices**: Query Filter adiciona predicate a todos os índices
- ⚠️ **FKs**: Referências para entidades "excluídas" precisam tratamento

### Mitigações
- Índices filtrados: `CREATE INDEX IX_Cycles_UserId_Active ON Cycles(UserId) WHERE IsDeleted = 0`
- Documentar padrão: `IgnoreQueryFilters()` apenas em admin/auditoria
- Job de purga (futuro): Hard delete após X dias + crypto-shredding

## Related
- ADR-001: Clean Architecture (Domain layer)
- ADR-003: EF Core (Implementation)
- ADR-009: LGPD / Crypto-shredding
