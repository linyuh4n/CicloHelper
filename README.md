# CicloHelper

Aplicação web para acompanhamento do ciclo menstrual, bem-estar, diário pessoal, nutrição e exercícios.

## 📋 Visão Geral

O CicloHelper é uma plataforma completa desenvolvida com foco em **privacidade**, **segurança** e **experiência do usuário**. Construída como um **Modular Monolith** com Clean Architecture, preparada para evoluir para um SaaS escalável.

## 🏗️ Arquitetura

```
CicloHelper/
├── src/
│   ├── CicloHelper.Domain          # Entidades, Value Objects, Domain Events
│   ├── CicloHelper.Application     # Use Cases, Commands, Queries, Validators
│   ├── CicloHelper.Infrastructure  # EF Core, SQL Server, External Services
│   ├── CicloHelper.API             # ASP.NET Core Web API, Controllers, Middleware
│   ├── CicloHelper.Contracts       # DTOs, Requests, Responses (Public API Contracts)
│   └── CicloHelper.Web             # React + TypeScript + Vite + Tailwind CSS
├── tests/
│   ├── CicloHelper.Tests.Unit      # Testes unitários (xUnit, FluentAssertions, Moq)
│   └── CicloHelper.Tests.Integration # Testes de integração (Testcontainers)
├── docker/
│   └── docker-compose.yml          # SQL Server 2022 para desenvolvimento
├── docs/
│   ├── architecture/               # Documentação de arquitetura (ADRs)
│   └── development/                # Guias de desenvolvimento
├── .github/
│   └── workflows/                  # GitHub Actions CI/CD
├── Directory.Packages.props        # Centralized Package Management
├── .editorconfig                   # Configuração de estilo de código
├── .gitignore
├── CicloHelper.slnx                # Solution file
└── README.md
```

## 🛠️ Stack Tecnológica

### Backend
- **.NET 10** (Preview)
- **ASP.NET Core Web API**
- **Entity Framework Core 9** + SQL Server
- **Dapper** (quando necessário)
- **MediatR** (CQRS)
- **FluentValidation**
- **Serilog** (Structured Logging)
- **Swashbuckle** (Swagger/OpenAPI)
- **Problem Details** (RFC 9457)
- **Health Checks**

### Frontend
- **React 19** + **TypeScript**
- **Vite 8** (Build tool)
- **Tailwind CSS v4** (Styling)
- **TanStack Query** (Server State)
- **Zustand** (Client State)
- **React Hook Form** + **Zod** (Forms & Validation)
- **Lucide React** (Icons)
- **Recharts** (Charts)

### Infraestrutura & Qualidade
- **Docker Compose** (Local SQL Server)
- **GitHub Actions** (CI/CD)
- **SonarCloud** (Code Quality)
- **Dependabot** (Dependency Updates)
- **CodeQL** (Security Analysis)
- **Secret Scanning**

## 🚀 Como Executar Localmente

### Pré-requisitos
- .NET 10 SDK
- Node.js 20+
- Docker Desktop
- Git

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/CicloHelper.git
cd CicloHelper
```

### 2. Subir o banco de dados (SQL Server)
```bash
docker compose -f docker/docker-compose.yml up -d
```

Aguarde o health check passar (container `ciclohelper-sqlserver` com status `healthy`).

### 3. Aplicar migrations
```bash
dotnet ef database update -p src/CicloHelper.Infrastructure -s src/CicloHelper.API
```

### 4. Executar a API
```bash
cd src/CicloHelper.API
dotnet run
```

A API estará disponível em:
- **HTTPS**: https://localhost:7001
- **Swagger**: https://localhost:7001/swagger
- **Health Check**: https://localhost:7001/health

### 5. Executar o Frontend
```bash
cd src/CicloHelper.Web
npm install
npm run dev
```

O frontend estará disponível em: http://localhost:5173

## 🧪 Testes

### Testes Unitários
```bash
dotnet test tests/CicloHelper.Tests.Unit
```

### Testes de Integração
```bash
dotnet test tests/CicloHelper.Tests.Integration
```

### Todos os testes
```bash
dotnet test
```

### Cobertura de código
```bash
dotnet test --collect:"XPlat Code Coverage" -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=opencover
reportgenerator -reports:"**/coverage.opencover.xml" -targetdir:"coverage-report" -reporttypes:Html
```

## 📦 Build de Produção

### Backend
```bash
dotnet publish src/CicloHelper.API -c Release -o ./publish
```

### Frontend
```bash
cd src/CicloHelper.Web
npm run build
# Output em dist/
```

## 🔐 Segurança e Privacidade

- **Privacy by Design** e **Privacy by Default**
- **BFF Pattern**: Tokens de autenticação nunca chegam ao frontend
- **Cookies HttpOnly + Secure + SameSite=Strict**
- **Criptografia de aplicação** para dados sensíveis (AES-256-GCM)
- **Envelope Encryption** com DEK por usuário e KEK no Azure Key Vault
- **Soft Delete** + **Audit Fields** em todas as entidades
- **Nenhum dado sensível em logs** (PII, saúde menstrual, reprodutiva)
- **LGPD Compliant**: Direito ao esquecimento (crypto-shredding)

## 📚 Documentação

- [Arquitetura](docs/architecture/ARCHITECTURE.md)
- [ADRs - Decisões Arquiteturais](docs/architecture/adrs/)
- [Guia de Desenvolvimento](docs/development/DEVELOPMENT.md)
- [Configuração de Ambiente](docs/development/ENVIRONMENT.md)
- [Migrations](docs/development/MIGRATIONS.md)
- [Testes](docs/development/TESTING.md)

## 🤝 Contribuindo

Leia nosso [Guia de Contribuição](CONTRIBUTING.md) para detalhes sobre:
- Código de conduta
- Processo de Pull Request
- Padrões de commit (Conventional Commits)
- Style guide
- Como reportar bugs

## 📄 Licença

Proprietary - Todos os direitos reservados.

## 📞 Contato

- Email: suporte@ciclohelper.app
- Issues: GitHub Issues
