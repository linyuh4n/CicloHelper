# Guia de Desenvolvimento - CicloHelper

## 🚀 Quick Start

```bash
# 1. Subir infraestrutura
docker compose -f docker/docker-compose.yml up -d

# 2. Aplicar migrations
dotnet ef database update -p src/CicloHelper.Infrastructure -s src/CicloHelper.API

# 3. Rodar API
cd src/CicloHelper.API && dotnet run

# 4. Rodar Frontend (novo terminal)
cd src/CicloHelper.Web && npm run dev
```

## 📁 Estrutura de Pastas

### Backend (src/)
```
src/
├── CicloHelper.Domain/           # 🟢 Pure - Zero deps externas
│   ├── Entities/
│   ├── ValueObjects/
│   ├── Enums/
│   ├── Events/
│   └── Interfaces/               # Repository interfaces
│
├── CicloHelper.Application/      # 🟡 Use Cases - Depende de Domain
│   ├── Common/                   # ICommand, IQuery, Handlers base
│   ├── Features/                 # Por módulo/feature
│   │   ├── MenstrualTracking/
│   │   │   ├── Commands/
│   │   │   ├── Queries/
│   │   │   ├── Handlers/
│   │   │   ├── Validators/
│   │   │   └── DTOs/
│   │   └── ...
│   ├── Behaviors/                # MediatR Pipeline Behaviors
│   ├── Interfaces/               # Ports (IEmailService, etc.)
│   └── DependencyInjection.cs
│
├── CicloHelper.Infrastructure/   # 🔴 Implementações - Depende de App + Domain
│   ├── Persistence/
│   │   ├── Configurations/       # IEntityTypeConfiguration
│   │   ├── Repositories/
│   │   ├── ApplicationDbContext.cs
│   │   └── IApplicationDbContext.cs
│   ├── Services/                 # External services (Email, Storage, Crypto)
│   ├── Identity/                 # Auth, Tokens, OIDC
│   ├── Encryption/               # Crypto services (futuro)
│   └── DependencyInjection.cs
│
├── CicloHelper.API/              # 🔵 Presentation - Composition Root
│   ├── Controllers/              # Thin controllers
│   ├── Middleware/               # CorrelationId, ExceptionHandling, Validation
│   ├── Filters/                  # Action filters
│   ├── Extensions/               # Service collection extensions
│   ├── Program.cs                # Entry point
│   └── appsettings*.json
│
├── CicloHelper.Contracts/        # 📄 Public API Contracts
│   ├── Requests/
│   ├── Responses/
│   ├── DTOs/
│   └── Enums/
│
└── CicloHelper.Web/              # 🌐 Frontend React
    ├── src/
    │   ├── components/
    │   │   ├── ui/               # Base components (Button, Input, Card)
    │   │   ├── layout/           # Header, Footer, Sidebar
    │   │   └── features/         # Feature-specific components
    │   ├── features/             # Feature modules (React Query, Zustand)
    │   │   ├── auth/
    │   │   ├── menstrual-tracking/
    │   │   ├── diary/
    │   │   └── ...
    │   ├── hooks/                # Custom hooks
    │   ├── lib/                  # Utilities, API client
    │   ├── styles/               # Global styles, Tailwind
    │   ├── types/                # TypeScript types (shared com Contracts)
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

### Tests (tests/)
```
tests/
├── CicloHelper.Tests.Unit/       # Unit tests (xUnit, Moq, FluentAssertions)
│   ├── Domain/
│   ├── Application/
│   └── Infrastructure/
│
└── CicloHelper.Tests.Integration/ # Integration tests (Testcontainers)
    ├── API/
    ├── Persistence/
    └── Fixtures/
```

### Docs (docs/)
```
docs/
├── architecture/
│   ├── ARCHITECTURE.md
│   └── adrs/
│       ├── ADR-001-*.md
│       └── ...
└── development/
    ├── DEVELOPMENT.md
    ├── ENVIRONMENT.md
    ├── MIGRATIONS.md
    ├── TESTING.md
    └── CI_CD.md
```

## 🔧 Comandos Úteis

### .NET
```bash
# Build
dotnet build
dotnet build -c Release

# Restore
dotnet restore

# Test
dotnet test
dotnet test --filter "FullyQualifiedName~Unit"
dotnet test --filter "FullyQualifiedName~Integration"
dotnet test --collect:"XPlat Code Coverage"

# Format
dotnet format
dotnet format --verify-no-changes

# EF Core
dotnet ef migrations add NomeMigracao -p src/CicloHelper.Infrastructure -s src/CicloHelper.API
dotnet ef database update -p src/CicloHelper.Infrastructure -s src/CicloHelper.API
dotnet ef database update 0 -p src/CicloHelper.Infrastructure -s src/CicloHelper.API  # Rollback all
dotnet ef migrations remove -p src/CicloHelper.Infrastructure -s src/CicloHelper.API  # Remove last
dotnet ef migrations list -p src/CicloHelper.Infrastructure -s src/CicloHelper.API

# Outdated packages
dotnet list package --outdated
dotnet list package --vulnerable

# Publish
dotnet publish src/CicloHelper.API -c Release -o ./publish
```

### Frontend
```bash
cd src/CicloHelper.Web

# Install
npm install

# Dev
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

### Docker
```bash
# Subir apenas DB
docker compose -f docker/docker-compose.yml up -d sqlserver

# Logs
docker compose -f docker/docker-compose.yml logs -f sqlserver

# Parar
docker compose -f docker/docker-compose.yml down

# Parar + remover volumes (CUIDADO: apaga dados)
docker compose -f docker/docker-compose.yml down -v

# Build imagem API
docker build -f src/CicloHelper.API/Dockerfile -t ciclohelper-api .
```

## 🎯 Padrões de Desenvolvimento

### Criando Nova Feature (Backend)

1. **Domain** - Entidades, Value Objects, Events
```csharp
// src/CicloHelper.Domain/Entities/Cycle.cs
public sealed class Cycle : BaseEntity {
    public Guid UserId { get; private set; }
    public DateOnly StartDate { get; private set; }
    public int Length { get; private set; }
    public CycleStatus Status { get; private set; }
    
    private Cycle() {} // EF Core
    
    public static Cycle Create(Guid userId, DateOnly startDate, int length) {
        var cycle = new Cycle {
            UserId = userId,
            StartDate = startDate,
            Length = length,
            Status = CycleStatus.Active
        };
        cycle.AddDomainEvent(new CycleCreatedEvent(cycle.Id, userId));
        return cycle;
    }
}
```

2. **Application** - Command/Query + Handler + Validator
```csharp
// src/CicloHelper.Application/Features/MenstrualTracking/Commands/CreateCycleCommand.cs
public record CreateCycleCommand(Guid UserId, DateOnly StartDate, int Length) : ICommand<Guid>;

public class CreateCycleCommandValidator : AbstractValidator<CreateCycleCommand> {
    public CreateCycleCommandValidator() {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.StartDate).NotEmpty().LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today));
        RuleFor(x => x.Length).InclusiveBetween(21, 45);
    }
}

public class CreateCycleHandler : ICommandHandler<CreateCycleCommand, Guid> {
    private readonly IApplicationDbContext _context;
    
    public CreateCycleHandler(IApplicationDbContext context) => _context = context;
    
    public async Task<Guid> Handle(CreateCycleCommand cmd, CancellationToken ct) {
        var cycle = Cycle.Create(cmd.UserId, cmd.StartDate, cmd.Length);
        _context.Cycles.Add(cycle);
        await _context.SaveChangesAsync(ct);
        return cycle.Id;
    }
}
```

3. **Infrastructure** - Repository (se necessário) + Configuration
```csharp
// src/CicloHelper.Infrastructure/Persistence/Configurations/CycleConfiguration.cs
public class CycleConfiguration : IEntityTypeConfiguration<Cycle> {
    public void Configure(EntityTypeBuilder<Cycle> builder) {
        builder.ToTable("Cycles");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.UserId).IsRequired();
        builder.Property(c => c.StartDate).HasConversion<DateOnlyConverter>().HasColumnType("date").IsRequired();
        builder.Property(c => c.Length).IsRequired();
        builder.HasIndex(c => new { c.UserId, c.StartDate }).IsUnique().HasFilter("[IsDeleted] = 0");
    }
}
```

4. **Contracts** - Request/Response DTOs
```csharp
// src/CicloHelper.Contracts/Requests/CreateCycleRequest.cs
public sealed record CreateCycleRequest(
    [Required] DateOnly StartDate,
    [Range(21, 45)] int Length
);

// src/CicloHelper.Contracts/Responses/CycleResponse.cs
public sealed record CycleResponse(
    Guid Id,
    DateOnly StartDate,
    int Length,
    CycleStatus Status,
    DateTimeOffset CreatedAt
);
```

5. **API** - Controller
```csharp
// src/CicloHelper.API/Controllers/CyclesController.cs
[ApiController]
[Route("api/v1/[controller]")]
[Authorize] // Futuro
public sealed class CyclesController : ControllerBase {
    private readonly IMediator _mediator;
    
    public CyclesController(IMediator mediator) => _mediator = mediator;
    
    [HttpPost]
    [ProducesResponseType(typeof(CreateCycleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCycleRequest request, CancellationToken ct) {
        var command = new CreateCycleCommand(UserId, request.StartDate, request.Length); // UserId do claim
        var cycleId = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = cycleId }, new CreateCycleResponse(cycleId));
    }
}
```

### Criando Novo Componente (Frontend)

```tsx
// src/CicloHelper.Web/src/components/ui/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, children, className = "", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-primary text-white hover:bg-primary-hover focus:ring-primary",
      secondary: "bg-secondary text-white hover:bg-secondary-hover focus:ring-secondary",
      outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
      destructive: "bg-error text-white hover:bg-red-600 focus:ring-error"
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2"
    };
    
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
```

## 🔒 Segurança no Desenvolvimento

### Secrets Locais
```bash
# User Secrets (não comitar!)
cd src/CicloHelper.API
dotnet user-secrets init
dotnet user-secrets set "Authentication:Google:ClientId" "xxx"
dotnet user-secrets set "Authentication:Google:ClientSecret" "xxx"
dotnet user-secrets set "Authentication:Apple:ClientId" "xxx"
dotnet user-secrets set "Authentication:Apple:ClientSecret" "xxx"
```

### Checklist Antes de Commit
- [ ] `dotnet format --verify-no-changes`
- [ ] `dotnet build` (sem warnings novos)
- [ ] `dotnet test` (todos passam)
- [ ] `npm run lint` (frontend)
- [ ] `npm run build` (frontend)
- [ ] Testes para código novo
- [ ] Documentação atualizada (se API pública mudou)
- [ ] ADR criado (se decisão arquitetural)

## 🐛 Debugging

### API Logs
```bash
# Structured logs no console (desenvolvimento)
# Arquivos em: src/CicloHelper.API/logs/ciclohelper-YYYYMMDD.log
```

### Frontend
- React DevTools
- TanStack Query DevTools (disponível em dev)
- Network tab (inspecionar chamadas API)

### Database
```bash
# Conectar no SQL Server local
# Server: localhost,1433
# User: sa
# Password: CicloHelper@2026!
# Database: CicloHelper (criado pela migration)
```

## 📚 Recursos
- [Arquitetura](docs/architecture/ARCHITECTURE.md)
- [ADRs](docs/architecture/adrs/)
- [Environment Setup](docs/development/ENVIRONMENT.md)
- [Migrations](docs/development/MIGRATIONS.md)
- [Testing](docs/development/TESTING.md)
