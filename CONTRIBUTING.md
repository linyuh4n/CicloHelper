# Guia de Contribuição - CicloHelper

Obrigado por contribuir com o CicloHelper! Este documento define os padrões e processos para manter a qualidade do código e a colaboração eficaz.

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Contribuir](#como-contribuir)
3. [Padrões de Commit](#padrões-de-commit-conventional-commits)
4. [Branching Strategy](#branching-strategy)
5. [Pull Request Process](#pull-request-process)
6. [Code Style](#code-style)
7. [Testes](#testes)
8. [Segurança](#segurança)
9. [Documentação](#documentação)

---

## Código de Conduta

Este projeto adota o [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Ao participar, você concorda em manter um ambiente respeitoso e inclusivo.

**Resumo**:
- Seja respeitoso e construtivo
- Aceite feedback graciosamente
- Foque no que é melhor para o projeto
- Reporte comportamentos inaceitáveis

---

## Como Contribuir

### 1. Issues
- Verifique se já existe issue similar antes de criar
- Use templates: Bug Report, Feature Request, Documentation
- Seja específico: passos para reproduzir, comportamento esperado vs atual

### 2. Fork & Clone
```bash
git clone https://github.com/seu-fork/CicloHelper.git
cd CicloHelper
git remote add upstream https://github.com/original/CicloHelper.git
```

### 3. Branch
```bash
git checkout -b feat/nova-funcionalidade
# ou
git checkout -b fix/correcao-bug
# ou
git checkout -b docs/atualizacao-readme
```

### 4. Desenvolvimento
- Siga os padrões de código
- Escreva testes
- Atualize documentação se necessário
- Commits atômicos e descritivos

### 5. Push & PR
```bash
git push origin feat/nova-funcionalidade
# Abra PR no GitHub
```

---

## Padrões de Commit (Conventional Commits)

Formato: `<tipo>(<escopo>): <descrição>`

### Tipos
| Tipo | Descrição |
|------|-----------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação (sem mudança lógica) |
| `refactor` | Refatoração (sem mudança de comportamento) |
| `perf` | Performance |
| `test` | Testes |
| `chore` | Manutenção (build, deps, tooling) |
| `ci` | CI/CD |
| `security` | Segurança |

### Escopos Sugeridos
- `api`, `domain`, `app`, `infra`, `web`, `tests`, `docs`, `ci`, `deps`

### Exemplos
```
feat(api): adicionar endpoint de health check detalhado
fix(domain): corrigir cálculo de janela fértil em ciclos irregulares
docs(architecture): adicionar ADR-011 sobre criptografia
refactor(infra): extrair repositório base genérico
test(unit): adicionar testes para ValueObject equality
chore(deps): atualizar EF Core para 9.0.3
ci(github): adicionar job de codeql analysis
security(api): implementar rate limiting por IP
```

### Breaking Changes
Adicione `!` após o tipo e `BREAKING CHANGE:` no corpo:
```
feat(api)!: remover endpoint deprecated /api/v1/old-cycles

BREAKING CHANGE: Endpoint removido. Use /api/v1/cycles.
```

---

## Branching Strategy

```
main (protegida, deploy production)
  │
  ├── release/v1.0.0 (stabilização, hotfixes)
  │
  ├── develop (integração contínua, deploy staging)
  │     │
  │     ├── feat/nova-funcionalidade
  │     ├── fix/correcao-bug
  │     └── docs/atualizacao
  │
  └── hotfix/correcao-critica (direto da main)
```

### Regras
- `main`: Apenas via PR aprovado + CI verde + review
- `develop`: Merge automático após CI verde
- `feat/*`, `fix/*`, `docs/*`: Short-lived, rebase frequente
- `release/*`: Code freeze, apenas bugfixes
- `hotfix/*`: Urgência produção, merge em main e develop

---

## Pull Request Process

### Checklist Obrigatório
- [ ] Build passa (`dotnet build` / `npm run build`)
- [ ] Testes passam (`dotnet test` / `npm test`)
- [ ] Lint passa (`dotnet format --verify-no-changes` / `npm run lint`)
- [ ] Cobertura de testes ≥ 80% (novos arquivos)
- [ ] Documentação atualizada (README, ADRs, comments)
- [ ] CHANGELOG.md atualizado (se aplicável)
- [ ] Commits seguem Conventional Commits
- [ ] PR title segue padrão: `<tipo>(<escopo>): <descrição>`

### Template de PR
```markdown
## Summary
Breve descrição do que e por que.

## Linked Work Item(s)
- #123 (issue relacionada)

## Changes
- **Feature/Refactor/Bugfix**: Descrição
- **Affected areas**: Projetos/módulos afetados
- **Config/ENV**: Variáveis novas (se houver)
- **Data/DB**: Migrations? Backfill? Índices?

## Risk & Impact
- **Risk level**: Low / Medium / High
- **User impact**: Descrição
- **Backward compatibility**: Sim/Não + detalhes

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual tests / steps to verify
- [ ] Screenshots (se UI)

## Observability
- Dashboards/alerts touched
- Logs/traces to watch after merge

## Rollout & Rollback
- Rollout plan (feature flags, canary)
- Rollback plan
```

### Reviews
- **Mínimo 1 aprovação** (2 para áreas sensíveis: auth, crypto, payments)
- **Code owners** para camadas críticas
- Resolver todos os comentários antes do merge
- `Squash and merge` (histórico limpo)

---

## Code Style

### C# (.NET)
- **Arquivo**: `.editorconfig` (raiz do repo)
- **Analyzers**: `SonarAnalyzer.CSharp`, `StyleCop.Analyzers`
- **Warnings as Errors**: Sim (exceto lista em `Directory.Packages.props`)
- **Format**: `dotnet format` (inclui whitespace, using, braces)
- **Naming**: PascalCase (tipos, métodos, propriedades), camelCase (parâmetros, campos privados `_campo`)
- **Implicit Usings**: Habilitado
- **Nullable**: Enable (annotations obrigatórias)
- **File-scoped namespaces**: Sim
- **Primary constructors**: Preferidos para records/DTOs
- **Pattern matching**: Preferido sobre `is` + cast

```csharp
// ✅ Bom
public sealed record CreateCycleCommand(DateOnly StartDate, int Length) : ICommand<Guid>;

public async Task<Result<CycleDto>> Handle(CreateCycleCommand cmd, CancellationToken ct)
{
    var cycle = Cycle.Create(cmd.StartDate, cmd.Length);
    await _repository.AddAsync(cycle, ct);
    return cycle.ToDto();
}

// ❌ Evitar
public class CreateCycleCommand : ICommand<Guid>
{
    public DateOnly StartDate { get; set; }
    public int Length { get; set; }
}
```

### TypeScript/React
- **ESLint**: `oxlint` (configuração no `package.json`)
- **Prettier**: Não (usar oxlint + TypeScript)
- **Strict mode**: Habilitado (`strict: true` no tsconfig)
- **No `any`**: Use `unknown` ou tipos específicos
- **Functional components**: Arrow functions + hooks
- **Props interface**: Nome `ComponentNameProps`
- **Barrel exports**: `index.ts` para pastas

```tsx
// ✅ Bom
interface ButtonProps {
  variant: "primary" | "secondary";
  onClick: () => void;
  children: React.ReactNode;
}

export const Button = ({ variant, onClick, children }: ButtonProps) => (
  <button className={`btn btn-${variant}`} onClick={onClick}>
    {children}
  </button>
);
```

### CSS/Tailwind
- **Tailwind v4**: CSS Variables + `@theme`
- **Component classes**: Em `src/index.css` com `@layer components`
- **Sem `@apply` para custom classes** (limitação v4)
- **Mobile-first**: `sm:`, `md:`, `lg:`, `xl:`
- **Design tokens**: Cores, espaçamento, tipografia via CSS Variables

---

## Testes

### Pirâmide de Testes
```
         /\
        /  \  E2E / Integration (poucos, críticos)
       /____\
      /      \  Integration (médios, fluxos principais)
     /________\
    /          \  Unit (muitos, rápidos, isolados)
   /____________\
```

### Backend (xUnit + FluentAssertions + Moq)

#### Unitários
- Um teste por comportamento
- `Arrange-Act-Assert` explícito
- Mock apenas dependências externas (repositórios, services)
- Nomes: `MethodName_Scenario_ExpectedResult`

```csharp
[Fact]
public async Task CreateCycle_ValidCommand_ReturnsCycleId()
{
    // Arrange
    var command = new CreateCycleCommand(DateOnly.FromDateTime(DateTime.Today), 28);
    _repoMock.Setup(r => r.AddAsync(It.IsAny<Cycle>(), It.IsAny<CancellationToken>()))
             .Returns(Task.CompletedTask);

    // Act
    var result = await _handler.Handle(command, CancellationToken.None);

    // Assert
    result.Should().NotBeEmpty();
    _repoMock.Verify(r => r.AddAsync(It.Is<Cycle>(c => c.Length == 28), It.IsAny<CancellationToken>()), Times.Once);
}
```

#### Integração (Testcontainers)
- SQL Server real em container
- `WebApplicationFactory` para API
- Banco isolado por teste (transação + rollback ou database único)

### Frontend (Vitest + React Testing Library)
- Testes de componente: render, interação, snapshot
- Testes de hook: `renderHook`
- Mock de API: MSW (Mock Service Worker)

### Cobertura
- Mínimo **80%** para código novo
- **100%** para domain (regras de negócio)
- Excluir: DTOs, Program.cs, Migrations, Generated code

---

## Segurança

### Reporte de Vulnerabilidades
**NÃO** abra issue pública. Envie para: `security@ciclohelper.app`

### Práticas Obrigatórias
- **NUNCA** commitar secrets (tokens, keys, passwords)
- Use **GitHub Secrets** / Azure Key Vault
- `dotnet user-secrets` para desenvolvimento local
- Validação de entrada **sempre** no backend
- **Parameterized queries** (EF Core/Dapper) - sem concatenação SQL
- **Output encoding** para prevenir XSS
- **CSP Headers** em produção
- **Rate limiting** em endpoints públicos
- **Audit logging** para ações sensíveis

### Dependências
- `Dependabot` configurado (weekly)
- `CodeQL` analysis em todo PR
- `Secret Scanning` habilitado
- Revisar `NU1902`/`NU1903` warnings

---

## Documentação

### Obrigatória para Mudanças
| Mudança | Documentação |
|---------|--------------|
| Nova API | Swagger (XML comments) + README endpoint |
| Nova regra de negócio | ADR + Domain comments |
| Nova migration | `docs/development/MIGRATIONS.md` |
| Nova config/env | `docs/development/ENVIRONMENT.md` |
| Breaking change | CHANGELOG + ADR + Migration guide |
| Nova dependência | Justificativa no PR + license check |

### ADRs (Architecture Decision Records)
- Um ADR por decisão arquitetural significativa
- Template: `docs/architecture/adrs/ADR-XXX-title.md`
- Status: `Proposed` → `Accepted` / `Rejected` / `Superseded`
- Incluir: Contexto, Decisão, Alternativas, Consequências

### Diagrams
- **Mermaid** para diagramas no Markdown
- **PlantUML** para diagramas complexos (arquivos `.puml`)
- Commite junto com a documentação

---

## Ferramentas Recomendadas

### IDE
- **VS Code** + Extensions:
  - C# Dev Kit
  - ESLint / Oxlint
  - Tailwind CSS IntelliSense
  - Error Lens
  - GitLens
- **JetBrains Rider** (alternativa completa)

### CLI
```bash
# .NET
dotnet restore
dotnet build
dotnet test
dotnet format --verify-no-changes
dotnet ef migrations add Nome --project src/CicloHelper.Infrastructure --startup-project src/CicloHelper.API

# Frontend
npm install
npm run dev
npm run build
npm run lint
```

### Git Hooks (Husky - Opcional)
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "dotnet format --verify-no-changes && npm run lint",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

---

## Dúvidas?

- **Issues**: GitHub Issues (templates disponíveis)
- **Discussões**: GitHub Discussions
- **Segurança**: security@ciclohelper.app
- **Geral**: suporte@ciclohelper.app

---

**Obrigado por contribuir!** 💜
