# ADR-008: DateOnly para Datas de Calendário, DateTimeOffset para Instantes

## Status
Accepted

## Context
O domínio menstrual trabalha intensamente com datas:
- Início/fim de menstruação (datas de calendário)
- Previsões de próximas menstruações
- Janela fértil (datas)
- Ciclos (duração em dias)
- Sintomas/diário (por data)
- Relatórios por período

Precisamos evitar bugs clássicos de timezone em datas de calendário.

## Decision
**Regra de Ouro**: **NUNCA** converter `DateOnly` para UTC ou `DateTimeOffset`. Use o tipo correto para cada caso.

| Cenário | Tipo .NET | SQL Server | Exemplo |
|---------|-----------|------------|---------|
| Data de calendário (sem hora) | `DateOnly` | `DATE` | Início menstruação: `2026-01-15` |
| Data de calendário (fim) | `DateOnly` | `DATE` | Fim menstruação: `2026-01-19` |
| Previsão de data | `DateOnly` | `DATE` | Próxima menstruação: `2026-02-12` |
| Janela fértil | `DateOnly` | `DATE` | Início: `2026-01-28`, Fim: `2026-02-03` |
| Instante (auditoria) | `DateTimeOffset` | `DATETIMEOFFSET` | `CreatedAt: 2026-01-15T14:30:00-03:00` |
| Instante (evento) | `DateTimeOffset` | `DATETIMEOFFSET` | `SymptomRecordedAt: 2026-01-15T08:15:00-03:00` |
| Agendamento futuro (instante) | `DateTimeOffset` | `DATETIMEOFFSET` | `NotificationScheduledAt` |

### Timezone Padrão
- **IANA**: `America/Sao_Paulo`
- **Windows**: `E. South America Standard Time`
- Armazenar **sempre em UTC** (`DateTimeOffset.UtcNow`) para instantes
- Converter para timezone do usuário **apenas na apresentação** (frontend)

### Conversões Permitidas
```csharp
// ✅ DateOnly → DateTimeOffset (início do dia no timezone do usuário)
var startOfDay = dateOnly.ToDateTime(TimeOnly.MinValue); // local
var startOfDayUtc = TimeZoneInfo.ConvertTimeToUtc(startOfDay, tz); // UTC

// ✅ DateTimeOffset → DateOnly (data no timezone do usuário)
var dateOnly = dateTimeOffset.InTimeZone(tz).DateOnly;

// ❌ NUNCA FAZER
var utc = DateTime.SpecifyKind(dateOnly.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc); // BUG: muda o dia!
var dto = new DateTimeOffset(dateOnly); // BUG: assume meia-noite UTC!
```

### Value Objects de Domínio
```csharp
public readonly record struct CycleDate(DateOnly Value) {
    public static CycleDate Today => new(DateOnly.FromDateTime(DateTime.Now)); // Cuidado: server timezone!
    public static CycleDate FromDateTimeOffset(DateTimeOffset dto, TimeZoneInfo tz) 
        => new(dto.InTimeZone(tz).DateOnly);
    
    public DateTimeOffset ToStartOfDay(TimeZoneInfo tz) 
        => TimeZoneInfo.ConvertTimeToUtc(Value.ToDateTime(TimeOnly.MinValue), tz);
    
    public DateTimeOffset ToEndOfDay(TimeZoneInfo tz) 
        => TimeZoneInfo.ConvertTimeToUtc(Value.ToDateTime(TimeOnly.MaxValue), tz);
}

public readonly record struct CycleLength(int Days) {
    public CycleDate AddTo(CycleDate start, TimeZoneInfo tz) 
        => new(start.Value.AddDays(Days));
}
```

## Alternatives Considered

### Tudo DateTime/DateTimeOffset (UTC)
- **Prós**: Uniforme
- **Contras**: **Bugs de timezone** (meia-noite UTC ≠ meia-noite local), dia muda em DST

### Tudo DateOnly
- **Prós**: Sem timezone issues
- **Contras**: Não captura "quando exatamente" (auditoria, ordering de eventos simultâneos)

### String ISO 8601
- **Prós**: Explícito
- **Contras**: Sem type safety, parsing overhead, sem operações de data

## Consequences

### Positivas
- ✅ **Zero bugs de timezone** em datas de calendário
- ✅ **Type safety**: Compiler impede conversões perigosas
- ✅ **Semântica clara**: `DateOnly` = "dia", `DateTimeOffset` = "instante"
- ✅ **Performance**: `DATE` < `DATETIMEOFFSET` no SQL
- ✅ **DST-safe**: Mudança de horário de verão não afeta datas de calendário

### Negativas
- ⚠️ **Dois tipos** para aprender
- ⚠️ **Conversões explícitas** necessárias na boundary (API ↔ Domain)
- ⚠️ **EF Core**: Precisa `ValueConverter` para `DateOnly` ↔ `DATE`

### Mitigações
- Value Objects (`CycleDate`, `CycleLength`) encapsulam lógica
- Extension methods para conversões seguras
- Analyzers/custom rules para detectar uso incorreto
- Documentação e code review focado

## Related
- ADR-003: EF Core (ValueConverters)
- ADR-007: Soft Delete + Audit (DateTimeOffset para auditoria)
