# Configuração de Ambiente - CicloHelper

## 🖥️ Pré-requisitos

### Obrigatórios
| Ferramenta | Versão | Instalação |
|------------|--------|------------|
| .NET SDK | 10.0 (Preview/RC) | [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/10.0) |
| Node.js | 20+ LTS | [nodejs.org](https://nodejs.org/) ou `winget install OpenJS.NodeJS` |
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Git | 2.40+ | [git-scm.com](https://git-scm.com/) |

### Recomendados (IDE)
| IDE | Extensões Essenciais |
|-----|---------------------|
| VS Code | C# Dev Kit, ESLint/Oxlint, Tailwind CSS IntelliSense, Error Lens, GitLens |
| JetBrains Rider | Built-in (recomendado para .NET) |

### Opcionais
- **SQL Server Management Studio** / **Azure Data Studio** - Para inspecionar DB
- **Postman** / **Bruno** - Para testar API
- **Redis CLI** - Para cache/session (produção)

---

## ⚙️ Configuração Inicial

### 1. Clone e Setup
```bash
git clone https://github.com/seu-org/CicloHelper.git
cd CicloHelper
```

### 2. Variáveis de Ambiente (Backend)

#### Development (User Secrets)
```bash
cd src/CicloHelper.API
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost,1433;Database=CicloHelper;User=sa;Password=CicloHelper@2026!;TrustServerCertificate=True;"
dotnet user-secrets set "Authentication:Google:ClientId" "SEU_GOOGLE_CLIENT_ID"
dotnet user-secrets set "Authentication:Google:ClientSecret" "SEU_GOOGLE_CLIENT_SECRET"
dotnet user-secrets set "Authentication:Apple:ClientId" "SEU_APPLE_CLIENT_ID"
dotnet user-secrets set "Authentication:Apple:ClientSecret" "SEU_APPLE_CLIENT_SECRET"
dotnet user-secrets set "Authentication:Apple:KeyId" "SEU_KEY_ID"
dotnet user-secrets set "Authentication:Apple:TeamId" "SEU_TEAM_ID"
```

#### appsettings.Development.json (Não sensíveis)
```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.AspNetCore": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      { "Name": "Console" },
      { "Name": "File", "Args": { "path": "logs/ciclohelper-.log", "rollingInterval": "Day" } }
    ]
  },
  "AllowedHosts": "*",
  "Cors": {
    "DevelopmentOrigins": ["http://localhost:5173", "https://localhost:5173"]
  }
}
```

### 3. Variáveis de Ambiente (Frontend)

#### .env.development (src/CicloHelper.Web/)
```env
VITE_API_BASE_URL=https://localhost:7001/api/v1
VITE_APP_NAME=CicloHelper
VITE_APP_VERSION=1.0.0-dev
```

#### .env.production (Não comitar - usar CI/CD secrets)
```env
VITE_API_BASE_URL=https://api.ciclohelper.app/api/v1
VITE_APP_NAME=CicloHelper
VITE_APP_VERSION=1.0.0
```

---

## 🐳 Docker - Banco de Dados Local

### Docker Compose (docker/docker-compose.yml)
```yaml
version: '3.8'

services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: ciclohelper-sqlserver
    environment:
      ACCEPT_EULA: 'Y'
      SA_PASSWORD: 'CicloHelper@2026!'
      MSSQL_PID: 'Developer'
    ports:
      - '1433:1433'
    volumes:
      - sqlserver_data:/var/opt/mssql
    healthcheck:
      test: /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P 'CicloHelper@2026!' -Q 'SELECT 1' || exit 1
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
    networks:
      - ciclohelper-network

volumes:
  sqlserver_data:

networks:
  ciclohelper-network:
    driver: bridge
```

### Comandos Docker
```bash
# Subir
docker compose -f docker/docker-compose.yml up -d

# Ver status
docker compose -f docker/docker-compose.yml ps

# Logs
docker compose -f docker/docker-compose.yml logs -f sqlserver

# Parar
docker compose -f docker/docker-compose.yml down

# Reset completo (APAGA DADOS)
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

### Conexão ao SQL Server
| Parâmetro | Valor |
|-----------|-------|
| Server | `localhost,1433` |
| Authentication | SQL Server Authentication |
| Login | `sa` |
| Password | `CicloHelper@2026!` |
| Database | `CicloHelper` (criado via migration) |
| Trust Server Certificate | `True` |

---

## 🔐 Provedores de Identidade (OIDC)

### Google OAuth 2.0
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie projeto ou selecione existente
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth Client ID**
4. Application Type: **Web Application**
5. Authorized Redirect URIs:
   - `https://localhost:7001/signin-oidc` (dev)
   - `https://api.ciclohelper.app/signin-oidc` (prod)
6. Copie **Client ID** e **Client Secret** para User Secrets

### Apple Sign In
1. Acesse [Apple Developer](https://developer.apple.com/)
2. **Certificates, Identifiers & Profiles** → **Identifiers** → **+**
3. **Services IDs** → Configure **Sign In with Apple**
4. **Domains**: `localhost` (dev), `ciclohelper.app` (prod)
5. **Return URLs**: `https://localhost:7001/signin-oidc`, `https://api.ciclohelper.app/signin-oidc`
6. **Keys** → Create Key → **Sign In with Apple** → Download `.p8`
7. Configure no `appsettings.json` / User Secrets:
   - `ClientId`: Service ID (ex: `com.ciclohelper.web`)
   - `TeamId`: Seu Team ID
   - `KeyId`: Key ID da `.p8`
   - `ClientSecret`: JWT gerado com a `.p8` (ver `AspNet.Security.OAuth.Apple` docs)

---

## 🛠️ Configuração da IDE

### VS Code (settings.json)
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "csharp.formatOnSave": true,
  "omnisharp.enableRoslynAnalyzers": true,
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.exclude": {
    "**/bin": true,
    "**/obj": true,
    "**/node_modules": true,
    "**/dist": true
  }
}
```

### JetBrains Rider
- **Settings** → **Build, Execution, Deployment** → **Toolset and Build** → **Use .NET SDK 10.0**
- **Editor** → **Inspections** → **C#** → Enable **SonarAnalyzer** e **StyleCop**
- **Languages & Frameworks** → **TypeScript** → Enable **Oxlint**

---

## ✅ Verificação do Ambiente

```bash
# Verificar versões
dotnet --version          # Deve ser 10.0.x
node --version            # Deve ser 20+
npm --version             # Deve ser 10+
docker --version          # Deve ser 27+
git --version             # Deve ser 2.40+

# Verificar Docker rodando
docker ps                 # Deve mostrar container sqlserver healthy

# Verificar build
dotnet build              # Sucesso
cd src/CicloHelper.Web && npm run build  # Sucesso

# Verificar testes
dotnet test               # 2 passed (unit + integration placeholders)
```

---

## 🔧 Troubleshooting

### Docker não inicia
```bash
# Windows: Verificar WSL 2
wsl --status
wsl --update

# Reset Docker Desktop
# Settings → Troubleshoot → Reset to factory defaults
```

### SQL Server connection refused
```bash
# Verificar container
docker ps -a | findstr sqlserver

# Ver logs
docker logs ciclohelper-sqlserver

# Aguardar health check (pode levar 30-60s na primeira vez)
```

### .NET SDK não encontrado
```bash
# Verificar instalação
dotnet --list-sdks

# Se múltiplas versões, criar global.json na raiz:
echo '{"sdk": {"version": "10.0.100", "rollForward": "latestFeature"}}' > global.json
```

### Node modules issues
```bash
cd src/CicloHelper.Web
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Portas em conflito
| Porta | Serviço | Conflito Comum |
|-------|---------|----------------|
| 1433 | SQL Server | Outro SQL Server local |
| 5173 | Vite Dev | Outro projeto Vite |
| 7001 | API HTTPS | Outro ASP.NET Core |
| 5001 | API HTTP | Outro ASP.NET Core |

```bash
# Verificar portas em uso (Windows)
netstat -ano | findstr :1433
netstat -ano | findstr :5173
netstat -ano | findstr :7001

# Matar processo (substitua PID)
taskkill /PID <PID> /F
```

---

## 📝 Checklist de Onboarding

- [ ] .NET 10 SDK instalado
- [ ] Node.js 20+ instalado
- [ ] Docker Desktop rodando
- [ ] Repositório clonado
- [ ] `docker compose -f docker/docker-compose.yml up -d` executado
- [ ] Container `ciclohelper-sqlserver` com status `healthy`
- [ ] `dotnet ef database update` executado
- [ ] `dotnet run` em `src/CicloHelper.API` → Swagger abre em https://localhost:7001/swagger
- [ ] `npm install` em `src/CicloHelper.Web`
- [ ] `npm run dev` → Frontend abre em http://localhost:5173
- [ ] Health check `https://localhost:7001/health` retorna `Healthy`
- [ ] User Secrets configurados (Google/Apple OAuth)
- [ ] IDE configurado com extensões
- [ ] `dotnet test` passa
- [ ] `npm run build` passa
