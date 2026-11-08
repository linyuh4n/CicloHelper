# Guia de Migrations - CicloHelper

## 📋 Visão Geral

Migrations do Entity Framework Core versionam o schema do banco de dados. Cada migration representa uma mudança incremental e reversível.

## 🛠️ Comandos Básicos

```bash
# Adicionar nova migration
dotnet ef migrations add NomeDescritivo -p src/CicloHelper.Infrastructure -s src/CicloHelper.API

# Aplicar migrations (update database)
dotnet ef database update -p src/CicloHelper.Infrastructure -s src/CicloHelper.API

# Aplicar migration específica
dotnet ef database update NomeDaMigration -p src/CicloHelper.Infrastructure -s src/CicloHelper.API

# Reverter última migration
dotnet ef database update 0 -p src/CicloHelper.Infrastructure -s src/CicloHelper.API  # Todas
dotnet ef database update MigrationAnterior -p src/CicloHelper.Infrastructure -s src/CicloHelper.API  # Específica

# Remover última migration (se não aplicada)
dotnet ef migrations remove -p src/CicloHelper.Infrastructure -s src/CicloHelper.API

# Listar migrations
dotnet ef migrations list -p src/CicloHelper.Infrastructure -s src/CicloHelper.API

# Gerar SQL script (para review/produção)
dotnet ef migrations script -p src/CicloHelper.Infrastructure -s src/CicloHelper.API -o migration.sql
dotnet ef migrations script FromMigration ToMigration -p src/CicloHelper.Infrastructure -s src/CicloHelper.API -o delta.sql
```

## ✍️ Criando Migrations

### Naming Convention
```
<YYYYMMDD>_<PascalCaseDescription>
```

Exemplos:
- `20260115_CreateCyclesTable`
- `20260120_AddSymptomsToCycle`
- `20260201_CreateNutritionModule`
- `20260215_AddIndexToCyclesUserId`

### Template de Migration
```csharp
// Migrations/20260115_CreateCyclesTable.cs
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CicloHelper.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CreateCyclesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Cycles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Length = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cycles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cycles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cycles_UserId_StartDate",
                table: "Cycles",
                columns: new[] { "UserId", "StartDate" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Cycles_UserId_Status",
                table: "Cycles",
                columns: new[] { "UserId", "Status" },
                filter: "[IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Cycles");
        }
    }
}
```

## 🎯 Boas Práticas

### 1. Uma Migration Por Feature Lógica
```bash
# ✅ Bom - uma feature, uma migration
dotnet ef migrations add CreateMenstrualTrackingTables

# ❌ Ruim - mistura features não relacionadas
dotnet ef migrations add CreateCyclesAndNutritionAndExercises
```

### 2. Sempre Implementar `Down()`
- Migration deve ser **reversível**
- `Down()` deve desfazer exatamente o que `Up()` fez
- Testar rollback localmente antes de commit

### 3. Índices e Constraints
```csharp
// Índice único filtrado (soft delete)
migrationBuilder.CreateIndex(
    name: "IX_Cycles_UserId_StartDate",
    table: "Cycles",
    columns: new[] { "UserId", "StartDate" },
    unique: true,
    filter: "[IsDeleted] = 0");  // SQL Server syntax

// Foreign Key com Restrict (não Cascade Delete)
table.ForeignKey(
    name: "FK_CycleSymptoms_Cycles_CycleId",
    column: x => x.CycleId,
    principalTable: "Cycles",
    principalColumn: "Id",
    onDelete: ReferentialAction.Restrict);
```

### 4. Dados Iniciais (Seed Data)
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Lookup tables / Enum data
    migrationBuilder.InsertData(
        table: "CycleStatuses",
        columns: new[] { "Id", "Name", "Description" },
        values: new object[,]
        {
            { 1, "Active", "Ciclo ativo" },
            { 2, "Completed", "Ciclo finalizado" },
            { 3, "Irregular", "Ciclo irregular" }
        });
}
```

### 5. Value Converters (DateOnly, Enums)
```csharp
// No ApplicationDbContext.OnModelCreating ou IEntityTypeConfiguration
builder.Property(e => e.StartDate)
    .HasConversion(
        v => v.ToDateTime(TimeOnly.MinValue),  // DateOnly -> DateTime (para DATE)
        v => DateOnly.FromDateTime(v))         // DateTime -> DateOnly
    .HasColumnType("date");

builder.Property(e => e.Status)
    .HasConversion<int>();  // Enum -> int
```

## 🔄 Fluxo de Trabalho

### Desenvolvimento Local
```bash
# 1. Fazer alterações no domínio (entidades, configs)
# 2. Gerar migration
dotnet ef migrations add AddCycleSymptoms -p src/CicloHelper.Infrastructure -s src/CicloHelper.API

# 3. Revisar arquivos gerados
#    - Migrations/XXXX_AddCycleSymptoms.cs
#    - Migrations/ApplicationDbContextModelSnapshot.cs

# 4. Aplicar localmente
dotnet ef database update -p src/CicloHelper.Infrastructure -s src/CicloHelper.API

# 5. Testar
dotnet test

# 6. Commit (inclui migration + snapshot)
git add src/CicloHelper.Infrastructure/Migrations/
git commit -m "feat(infra): add cycle symptoms tracking"
```

### Code Review Checklist (Migrations)
- [ ] `Up()` e `Down()` implementados corretamente
- [ ] Índices apropriados (FKs, queries comuns, unique constraints)
- [ ] `filter: "[IsDeleted] = 0"` em índices únicos (soft delete)
- [ ] Foreign Keys com `ReferentialAction.Restrict` (não Cascade)
- [ ] `DateOnly` usa `HasColumnType("date")` + converter
- [ ] Enums usam `HasConversion<int>()`
- [ ] Seed data idempotente (ou em migration separada)
- [ ] Snapshot atualizado (`ApplicationDbContextModelSnapshot.cs`)
- [ ] Nome da migration segue convenção
- [ ] SQL gerado revisado (`dotnet ef migrations script`)

## 🚀 Deploy de Migrations

### Estratégia: Aplicar na Inicialização (Startup)
```csharp
// Program.cs ou extension
public static async Task MigrateDatabaseAsync(this WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        var pending = await dbContext.Database.GetPendingMigrationsAsync();
        if (pending.Any())
        {
            logger.LogInformation("Applying {Count} pending migrations...", pending.Count());
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("Migrations applied successfully");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to apply migrations");
        throw; // Fail fast em produção
    }
}

// Uso
await app.MigrateDatabaseAsync();
app.Run();
```

### Produção: SQL Scripts (Recomendado)
```bash
# Gerar script para DBA revisar/aplicar
dotnet ef migrations script -p src/CicloHelper.Infrastructure -s src/CicloHelper.API -o deploy/migration_20260115.sql

# Script idempotente (verifica se já aplicado)
dotnet ef migrations script --idempotent -p src/CicloHelper.Infrastructure -s src/CicloHelper.API -o deploy/migration_idempotent.sql
```

### Blue/Green / Rolling Deploy
1. **Não** quebrar compatibilidade backward
2. Migration **additive only** (novas tabelas, colunas nullable, índices)
3. **Remover colunas/tabelas** em migration separada (após deploy confirmado)
4. Feature flags para novas funcionalidades

## ⚠️ Cenários Problemáticos

### Renomear Coluna/Tabela
```csharp
// ❌ Não use RenameColumn (perde dados em alguns providers)
// ✅ Use abordagem em 3 steps:

// Migration 1: Add new column
migrationBuilder.AddColumn<string>(name: "NewName", table: "Table", ...);

// Migration 2: Copy data (SQL)
migrationBuilder.Sql("UPDATE [Table] SET [NewName] = [OldName]");

// Migration 3: Drop old column (após deploy confirmado)
migrationBuilder.DropColumn(name: "OldName", table: "Table");
```

### Alterar Tipo de Coluna (Data Loss Risk)
```csharp
// ❌ Alterar INT -> BIGINT direto pode falhar se dados > INT_MAX
// ✅ Abordagem segura:
migrationBuilder.AddColumn<long>(name: "NewId", table: "Table", ...);
migrationBuilder.Sql("UPDATE [Table] SET [NewId] = CAST([OldId] AS BIGINT)");
// Switch app para usar NewId
// Depois: Drop OldId, Rename NewId -> OldId
```

### Remover Tabela/Coluna
```csharp
// ⚠️ NUNCA remova em migration que adiciona feature
// ✅ Separe em duas PRs:
// PR 1: Feature nova + migration additive
// PR 2 (após confirmado): Migration de cleanup (DropTable/DropColumn)
```

## 📚 Referências
- [EF Core Migrations Docs](https://learn.microsoft.com/ef/core/managing-schemas/migrations/)
- [SQL Server Migrations](https://learn.microsoft.com/ef/core/providers/sql-server/migrations)
- [EF Core Tools](https://learn.microsoft.com/ef/core/cli/dotnet)
