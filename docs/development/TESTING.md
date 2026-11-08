# Guia de Testes - CicloHelper

## 🎯 Estratégia de Testes

### Pirâmide de Testes
```
         /\
        /  \  E2E / Contract Tests (poucos, críticos, lentos)
       /____\
      /      \  Integration Tests (médios, fluxos reais)
     /________\
    /          \  Unit Tests (muitos, rápidos, isolados)
   /____________\
```

### Metas de Cobertura
| Camada | Cobertura Mínima | Meta |
|--------|-----------------|------|
| Domain | 100% | Regras de negócio críticas |
| Application | 90% | Use cases, validators, handlers |
| Infrastructure | 70% | Repositories, configs (com DB real) |
| API | 60% | Controllers, middleware, filters |
| Frontend | 80% | Components, hooks, utils |

---

## 🧪 Testes Unitários (Backend)

### Stack
- **xUnit** - Test framework
- **FluentAssertions** - Assertions legíveis
- **Moq** - Mocking
- **AutoFixture** (opcional) - Test data generation

### Estrutura
```
tests/CicloHelper.Tests.Unit/
├── Domain/
│   ├── Entities/
│   │   └── CycleTests.cs
│   ├── ValueObjects/
│   │   └── CycleDateTests.cs
│   └── Events/
│       └── DomainEventTests.cs
├── Application/
│   ├── Features/
│   │   └── MenstrualTracking/
│   │       ├── Commands/
│   │       │   └── CreateCycleHandlerTests.cs
│   │       ├── Queries/
│   │       │   └── GetCycleHandlerTests.cs
│   │       └── Validators/
│   │           └── CreateCycleValidatorTests.cs
│   └── Behaviors/
│       └── ValidationBehaviorTests.cs
└── Infrastructure/
    └── Persistence/
        └── CycleConfigurationTests.cs
```

### Padrão AAA (Arrange-Act-Assert)
```csharp
// tests/CicloHelper.Tests.Unit/Domain/Entities/CycleTests.cs
public class CycleTests
{
    [Fact]
    public void Create_ValidParameters_ReturnsCycleWithActiveStatus()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var startDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-5));
        var length = 28;

        // Act
        var cycle = Cycle.Create(userId, startDate, length);

        // Assert
        cycle.Should().NotBeNull();
        cycle.Id.Should().NotBeEmpty();
        cycle.UserId.Should().Be(userId);
        cycle.StartDate.Should().Be(startDate);
        cycle.Length.Should().Be(length);
        cycle.Status.Should().Be(CycleStatus.Active);
        cycle.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(1));
        cycle.DomainEvents.Should().ContainSingle(e => e is CycleCreatedEvent);
    }

    [Theory]
    [InlineData(20)]  // Muito curto
    [InlineData(46)]  // Muito longo
    public void Create_InvalidLength_ThrowsArgumentException(int invalidLength)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var startDate = DateOnly.FromDateTime(DateTime.Today);

        // Act
        var act = () => Cycle.Create(userId, startDate, invalidLength);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*length*");
    }
}
```

### Testando Handlers (Application)
```csharp
// tests/CicloHelper.Tests.Unit/Application/Features/MenstrualTracking/Commands/CreateCycleHandlerTests.cs
public class CreateCycleHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly CreateCycleHandler _handler;

    public CreateCycleHandlerTests()
    {
        _contextMock = new Mock<IApplicationDbContext>();
        _handler = new CreateCycleHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_AddsCycleAndReturnsId()
    {
        // Arrange
        var command = new CreateCycleCommand(
            UserId: Guid.NewGuid(),
            StartDate: DateOnly.FromDateTime(DateTime.Today.AddDays(-3)),
            Length: 28);

        var cyclesDbSet = new List<Cycle>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.Cycles).Returns(cyclesDbSet.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        _contextMock.Verify(c => c.Cycles.Add(It.Is<Cycle>(cy => 
            cy.UserId == command.UserId && 
            cy.Length == command.Length)), Times.Once);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

// Helper para DbSet mock
public static class MockExtensions
{
    public static Mock<DbSet<T>> BuildMockDbSet<T>(this IQueryable<T> source) where T : class
    {
        var mockSet = new Mock<DbSet<T>>();
        mockSet.As<IQueryable<T>>().Setup(m => m.Provider).Returns(source.Provider);
        mockSet.As<IQueryable<T>>().Setup(m => m.Expression).Returns(source.Expression);
        mockSet.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(source.ElementType);
        mockSet.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(source.GetEnumerator());
        return mockSet;
    }
}
```

### Testando Validators
```csharp
// tests/CicloHelper.Tests.Unit/Application/Features/MenstrualTracking/Validators/CreateCycleValidatorTests.cs
public class CreateCycleValidatorTests
{
    private readonly CreateCycleValidator _validator = new();

    [Fact]
    public void Validate_ValidRequest_Passes()
    {
        var request = new CreateCycleCommand(
            UserId: Guid.NewGuid(),
            StartDate: DateOnly.FromDateTime(DateTime.Today),
            Length: 28);

        var result = _validator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validate_EmptyUserId_Fails(int _)
    {
        var request = new CreateCycleCommand(
            UserId: Guid.Empty,
            StartDate: DateOnly.FromDateTime(DateTime.Today),
            Length: 28);

        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.UserId);
    }
}
```

---

## 🔗 Testes de Integração (Backend)

### Stack
- **Testcontainers** - SQL Server real em container
- **WebApplicationFactory** - Host da API em memória
- **xUnit** + **FluentAssertions**

### Estrutura
```
tests/CicloHelper.Tests.Integration/
├── Fixtures/
│   ├── DatabaseFixture.cs        # Container SQL Server compartilhado
│   └── ApiFactory.cs             # WebApplicationFactory customizada
├── API/
│   ├── CyclesControllerTests.cs
│   └── HealthCheckTests.cs
└── Persistence/
    └── RepositoryTests.cs
```

### DatabaseFixture (Testcontainers)
```csharp
// tests/CicloHelper.Tests.Integration/Fixtures/DatabaseFixture.cs
public class DatabaseFixture : IAsyncLifetime
{
    private readonly MsSqlContainer _container = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .WithPassword("CicloHelper@2026!")
        .WithEnvironment("ACCEPT_EULA", "Y")
        .WithEnvironment("MSSQL_PID", "Developer")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        // Aplicar migrations
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(ConnectionString)
            .Options;
        using var context = new ApplicationDbContext(options);
        await context.Database.MigrateAsync();
    }

    public async Task DisposeAsync() => await _container.DisposeAsync();
}
```

### ApiFactory
```csharp
// tests/CicloHelper.Tests.Integration/Fixtures/ApiFactory.cs
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly DatabaseFixture _dbFixture = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove DbContext registration
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor != null) services.Remove(descriptor);

            // Add test DbContext
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(_dbFixture.ConnectionString));
        });
    }

    public async Task InitializeAsync() => await _dbFixture.InitializeAsync();
    public new async Task DisposeAsync() => await _dbFixture.DisposeAsync();
}
```

### Testes de Controller
```csharp
// tests/CicloHelper.Tests.Integration/API/CyclesControllerTests.cs
public class CyclesControllerTests : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client;
    private readonly ApiFactory _factory;

    public CyclesControllerTests(ApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateCycle_ValidRequest_ReturnsCreated()
    {
        // Arrange
        var request = new CreateCycleRequest(
            StartDate: DateOnly.FromDateTime(DateTime.Today.AddDays(-2)),
            Length: 28);

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/cycles", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var location = response.Headers.Location?.ToString();
        location.Should().NotBeNull();
        location.Should().MatchRegex(@"/api/v1/cycles/[0-9a-f-]{36}");
    }

    [Fact]
    public async Task GetCycle_ExistingId_ReturnsCycle()
    {
        // Arrange - create first
        var createResponse = await _client.PostAsJsonAsync("/api/v1/cycles", new CreateCycleRequest(
            StartDate: DateOnly.FromDateTime(DateTime.Today.AddDays(-5)),
            Length: 30));
        var location = createResponse.Headers.Location!;

        // Act
        var response = await _client.GetAsync(location);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var cycle = await response.Content.ReadFromJsonAsync<CycleResponse>();
        cycle.Should().NotBeNull();
        cycle!.Length.Should().Be(30);
    }
}
```

### Isolamento de Dados (Transaction Rollback)
```csharp
// Para testes que modificam dados - usar transação com rollback
public class IsolatedTestBase : IAsyncLifetime
{
    private readonly ApiFactory _factory;
    private readonly IServiceScope _scope;
    private readonly ApplicationDbContext _context;
    private readonly IDbContextTransaction _transaction;

    public IsolatedTestBase(ApiFactory factory)
    {
        _factory = factory;
        _scope = factory.Services.CreateScope();
        _context = _scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        _transaction = _context.Database.BeginTransaction();
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await _transaction.RollbackAsync();
        await _transaction.DisposeAsync();
        _scope.Dispose();
    }
}
```

---

## 🌐 Testes Frontend

### Stack
- **Vitest** - Test runner
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking
- **@testing-library/user-event** - User interactions

### Configuração (vitest.config.ts)
```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/", "src/main.tsx", "src/vite-env.d.ts"]
    }
  }
});
```

### Setup (src/test/setup.ts)
```typescript
// src/test/setup.ts
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock matchMedia (usado por alguns componentes)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Testes de Componente
```tsx
// src/components/ui/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies variant classes", () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-primary");

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-error");
  });

  it("shows loading state", () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toContainHTML("svg"); // Spinner
  });
});
```

### Testes de Hook (React Query)
```tsx
// src/features/menstrual-tracking/hooks/useCycles.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCycles } from "./useCycles";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  http.get("*/api/v1/cycles", () => HttpResponse.json([
    { id: "1", startDate: "2026-01-01", length: 28, status: "Active" }
  ]))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useCycles", () => {
  it("fetches cycles", async () => {
    const { result } = renderHook(() => useCycles(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].length).toBe(28);
  });
});
```

---

## 📊 Cobertura de Código

### Backend
```bash
# Gerar relatório
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage

# ReportGenerator (instalar: dotnet tool install -g dotnet-reportgenerator-globaltool)
reportgenerator \
  -reports:"./coverage/**/coverage.opencover.xml" \
  -targetdir:"./coverage-report" \
  -reporttypes:"Html;Cobertura;Badges"

# Abrir relatório
start ./coverage-report/index.html
```

### Frontend
```bash
cd src/CicloHelper.Web
npm run test -- --coverage
# Abre coverage/index.html
```

### Thresholds (CI)
```yaml
# .github/workflows/ci.yml
- name: Check coverage
  run: |
    dotnet tool install -g dotnet-reportgenerator-globaltool
    reportgenerator -reports:"**/coverage.opencover.xml" -targetdir:"coveragereport" -reporttypes:"Cobertura"
    # Verificar thresholds via script ou action
```

---

## 🚀 Executando Testes

```bash
# Todos
dotnet test

# Apenas unitários
dotnet test tests/CicloHelper.Tests.Unit

# Apenas integração
dotnet test tests/CicloHelper.Tests.Integration

# Com cobertura
dotnet test --collect:"XPlat Code Coverage"

# Filtrar por nome
dotnet test --filter "FullyQualifiedName~CycleTests"
dotnet test --filter "Category=Unit"

# Verboso
dotnet test --logger "console;verbosity=detailed"

# Frontend
cd src/CicloHelper.Web
npm run test
npm run test -- --coverage
npm run test -- --watch  # Watch mode
```

---

## ✅ Checklist de Qualidade

### Para Cada Nova Feature
- [ ] Testes unitários para Domain (entidades, VOs, regras)
- [ ] Testes unitários para Application (handlers, validators)
- [ ] Testes de integração para fluxo completo (API → DB)
- [ ] Testes de componente frontend (se UI nova)
- [ ] Cobertura ≥ 80% no código novo
- [ ] Testes passam no CI

### Para Bug Fixes
- [ ] Teste de regressão (reproduz bug antes do fix)
- [ ] Teste passa após fix
- [ ] Adicionado ao suite para não regressar
