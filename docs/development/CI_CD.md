# CI/CD Pipeline - CicloHelper

## 📋 Visão Geral

Pipeline GitHub Actions com validações rigorosas para garantir qualidade e segurança.

## 🔄 Workflows

### 1. CI (Pull Requests)
**Arquivo**: `.github/workflows/ci.yml`
**Trigger**: Push to branches, Pull Requests para `develop` e `main`

```yaml
name: CI

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

env:
  DOTNET_VERSION: "10.0.x"
  NODE_VERSION: "20.x"

jobs:
  # ========================================
  # BACKEND - Build & Test
  # ========================================
  backend-build-test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}
          cache: true
      
      - name: Restore
        run: dotnet restore CicloHelper.slnx
      
      - name: Build
        run: dotnet build CicloHelper.slnx --no-restore -c Release
      
      - name: Format Check
        run: dotnet format --verify-no-changes --verbosity diagnostic
      
      - name: Run Unit Tests
        run: dotnet test tests/CicloHelper.Tests.Unit --no-build -c Release --logger "trx;LogFileName=unit-tests.trx"
      
      - name: Upload Unit Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: unit-test-results
          path: tests/CicloHelper.Tests.Unit/**/*.trx

  # ========================================
  # BACKEND - Integration Tests (Testcontainers)
  # ========================================
  backend-integration-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    services:
      sqlserver:
        image: mcr.microsoft.com/mssql/server:2022-latest
        env:
          ACCEPT_EULA: Y
          SA_PASSWORD: CicloHelper@2026!
          MSSQL_PID: Developer
        ports: [1433:1433]
        options: >-
          --health-cmd "/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P 'CicloHelper@2026!' -Q 'SELECT 1' || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 10
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}
          cache: true
      
      - name: Wait for SQL Server
        run: |
          for i in {1..30}; do
            /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P 'CicloHelper@2026!' -Q "SELECT 1" && break
            sleep 2
          done
      
      - name: Run Integration Tests
        run: dotnet test tests/CicloHelper.Tests.Integration --no-build -c Release --logger "trx;LogFileName=integration-tests.trx"
        env:
          ConnectionStrings__DefaultConnection: "Server=localhost,1433;Database=CicloHelper;User=sa;Password=CicloHelper@2026!;TrustServerCertificate=True;"
      
      - name: Upload Integration Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: integration-test-results
          path: tests/CicloHelper.Tests.Integration/**/*.trx

  # ========================================
  # BACKEND - Security Scan (CodeQL)
  # ========================================
  codeql-analysis:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
      contents: read
    
    strategy:
      matrix:
        language: [csharp]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: +security-and-quality
      
      - name: Build
        run: dotnet build CicloHelper.slnx -c Release
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{ matrix.language }}"

  # ========================================
  # FRONTEND - Build & Test
  # ========================================
  frontend-build-test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    defaults:
      run:
        working-directory: src/CicloHelper.Web
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
          cache-dependency-path: src/CicloHelper.Web/package-lock.json
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type Check
        run: npx tsc --noEmit
      
      - name: Run Tests
        run: npm run test -- --coverage
      
      - name: Build
        run: npm run build
      
      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: src/CicloHelper.Web/dist/
          retention-days: 7

  # ========================================
  # SECURITY - Dependency Scan
  # ========================================
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: "CicloHelper"
          path: "."
          format: "HTML"
          out: "dependency-check-report"
          args: >
            --failOnCVSS 7
            --suppression files: ".github/dependency-check-suppressions.xml"
      
      - name: Upload Dependency Check Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: dependency-check-report
          path: dependency-check-report/

  # ========================================
  # SECRETS - Secret Scanning
  # ========================================
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
          extra_args: --fail --json

  # ========================================
  # DOCKER - Build Validation
  # ========================================
  docker-build:
    runs-on: ubuntu-latest
    needs: [backend-build-test, frontend-build-test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Build API Image
        run: docker build -f src/CicloHelper.API/Dockerfile -t ciclohelper-api:${{ github.sha }} .
      
      - name: Build Web Image
        run: docker build -f src/CicloHelper.Web/Dockerfile -t ciclohelper-web:${{ github.sha }} src/CicloHelper.Web

  # ========================================
  # SUMMARY
  # ========================================
  ci-summary:
    runs-on: ubuntu-latest
    needs: 
      - backend-build-test
      - backend-integration-tests
      - codeql-analysis
      - frontend-build-test
      - dependency-scan
      - secret-scan
      - docker-build
    if: always()
    steps:
      - name: Check Job Status
        run: |
          if ${{ contains(needs.*.result, 'failure') }}; then
            echo "❌ Some jobs failed"
            exit 1
          else
            echo "✅ All CI checks passed"
          fi
```

### 2. CD - Deploy Staging (develop branch)
**Arquivo**: `.github/workflows/cd-staging.yml`
**Trigger**: Push to `develop` (após CI passar)

```yaml
name: CD Staging

on:
  push:
    branches: [develop]

permissions:
  contents: read
  id-token: write

jobs:
  deploy-api-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Build and Push API Image
        run: |
          docker build -f src/CicloHelper.API/Dockerfile -t ${{ secrets.ACR_NAME }}.azurecr.io/ciclohelper-api:${{ github.sha }} .
          az acr login --name ${{ secrets.ACR_NAME }}
          docker push ${{ secrets.ACR_NAME }}.azurecr.io/ciclohelper-api:${{ github.sha }}
      
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: "ciclohelper-api-staging"
          images: ${{ secrets.ACR_NAME }}.azurecr.io/ciclohelper-api:${{ github.sha }}

  deploy-web-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod=false"
        env:
          VITE_API_BASE_URL: "https://ciclohelper-api-staging.azurewebsites.net/api/v1"

  run-migrations-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
      
      - name: Run Migrations
        run: |
          dotnet ef database update \
            -p src/CicloHelper.Infrastructure \
            -s src/CicloHelper.API \
            --connection "${{ secrets.STAGING_CONNECTION_STRING }}"
```

### 3. CD - Deploy Production (main branch / tags)
**Arquivo**: `.github/workflows/cd-production.yml`
**Trigger**: Push to `main`, Release tags (`v*`)

```yaml
name: CD Production

on:
  push:
    branches: [main]
    tags: ["v*"]

permissions:
  contents: read
  id-token: write

jobs:
  # Aprovação manual obrigatória para produção
  approval:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Wait for Approval
        run: echo "Waiting for manual approval..."
        # GitHub Environments com required reviewers

  deploy-api-production:
    needs: approval
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Build and Push API Image
        run: |
          docker build -f src/CicloHelper.API/Dockerfile -t ${{ secrets.ACR_NAME }}.azurecr.io/ciclohelper-api:${{ github.sha }} .
          az acr login --name ${{ secrets.ACR_NAME }}
          docker push ${{ secrets.ACR_NAME }}.azurecr.io/ciclohelper-api:${{ github.sha }}
      
      - name: Deploy to Azure App Service (Blue/Green)
        uses: azure/webapps-deploy@v2
        with:
          app-name: "ciclohelper-api-prod"
          images: ${{ secrets.ACR_NAME }}.azurecr.io/ciclohelper-api:${{ github.sha }}
          slot-name: "staging"  # Deploy to slot first
      
      - name: Swap Slots (Blue/Green)
        run: |
          az webapp deployment slot swap \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --name ciclohelper-api-prod \
            --slot staging \
            --target-slot production

  deploy-web-production:
    needs: approval
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod=true"
        env:
          VITE_API_BASE_URL: "https://api.ciclohelper.app/api/v1"

  run-migrations-production:
    needs: approval
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
      
      - name: Run Migrations (Idempotent Script)
        run: |
          dotnet ef migrations script --idempotent \
            -p src/CicloHelper.Infrastructure \
            -s src/CicloHelper.API \
            -o migration.sql
          # Aplicar via Azure SQL ou manual DBA review
          sqlcmd -S ${{ secrets.PROD_SQL_SERVER }} -d CicloHelper -U ${{ secrets.PROD_SQL_USER }} -P ${{ secrets.PROD_SQL_PASSWORD }} -i migration.sql

  create-release:
    needs: [deploy-api-production, deploy-web-production, run-migrations-production]
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Generate Changelog
        uses: mikepenz/release-changelog-builder-action@v4
        with:
          configuration: ".github/changelog-config.json"
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
          draft: false
          prerelease: false
```

## 🔐 Secrets Necessários (GitHub Settings)

| Secret | Descrição | Onde Usar |
|--------|-----------|-----------|
| `AZURE_CLIENT_ID` | Service Principal Client ID | CD Staging/Prod |
| `AZURE_TENANT_ID` | Azure AD Tenant ID | CD Staging/Prod |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | CD Staging/Prod |
| `ACR_NAME` | Azure Container Registry name | CD Staging/Prod |
| `AZURE_RESOURCE_GROUP` | Resource Group name | CD Prod |
| `VERCEL_TOKEN` | Vercel Access Token | CD Staging/Prod |
| `VERCEL_ORG_ID` | Vercel Organization ID | CD Staging/Prod |
| `VERCEL_PROJECT_ID` | Vercel Project ID | CD Staging/Prod |
| `STAGING_CONNECTION_STRING` | SQL Server Staging | CD Staging |
| `PROD_SQL_SERVER` | Production SQL Server FQDN | CD Prod |
| `PROD_SQL_USER` | Production SQL User | CD Prod |
| `PROD_SQL_PASSWORD` | Production SQL Password | CD Prod |

## 🛡️ Branch Protection Rules

### `main`
- [x] Require PR review (2 approvals)
- [x] Require status checks (all CI jobs)
- [x] Require branches up to date
- [x] Require linear history
- [x] Include administrators
- [x] Restrict pushes to matching branches

### `develop`
- [x] Require PR review (1 approval)
- [x] Require status checks (CI jobs)
- [x] Allow force pushes (for hotfixes)
- [ ] Include administrators

## 📦 Versionamento

### Semantic Versioning
- **MAJOR**: Breaking changes API
- **MINOR**: Novas features backward-compatible
- **PATCH**: Bug fixes

### Tags
```bash
# Criar release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Trigger CD Production workflow
```

### Changelog
- Formato: [Keep a Changelog](https://keepachangelog.com/)
- Gerado automaticamente via `release-changelog-builder-action`

## 🚨 Rollback

### API (Azure App Service - Slots)
```bash
# Swap de volta para slot anterior
az webapp deployment slot swap \
  --resource-group <rg> \
  --name ciclohelper-api-prod \
  --slot staging \
  --target-slot production
```

### Frontend (Vercel)
```bash
# Vercel CLI
vercel rollback <deployment-url> --token $VERCEL_TOKEN

# Ou via Dashboard: Deployments → ... → Promote to Production (anterior)
```

### Database (Migrations)
```bash
# Reverter última migration (se não destrutiva)
dotnet ef database update <PreviousMigration> -p src/CicloHelper.Infrastructure -s src/CicloHelper.API

# Para migrations destrutivas: Restore backup Azure SQL (Point-in-Time Restore)
```

## 📊 Monitoramento Pós-Deploy

### Health Checks
- `GET https://api.ciclohelper.app/health` → 200 Healthy
- `GET https://api.ciclohelper.app/health/ready` → 200 Ready
- `GET https://api.ciclohelper.app/health/live` → 200 Live

### Alertas (Configurar no Azure Monitor / Sentry)
- Error rate > 1% em 5min
- Latency p95 > 2s
- Health check failing
- Deployment failure

### Smoke Tests Pós-Deploy
```bash
# Script de validação rápida
curl -f https://api.ciclohelper.app/health | jq .status
curl -f https://api.ciclohelper.app/api/v1/ping | jq .message
curl -f https://ciclohelper.app | grep -q "CicloHelper"
```

---

## 📚 Referências
- [GitHub Actions Docs](https://docs.github.com/actions)
- [Azure Web Apps Deploy](https://github.com/Azure/webapps-deploy)
- [Vercel Action](https://github.com/amondnet/vercel-action)
- [CodeQL](https://github.com/github/codeql-action)
- [Dependabot](https://docs.github.com/code-security/dependabot)
