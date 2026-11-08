# ADR-010: Centralized Package Management (Directory.Packages.props)

## Status
Accepted

## Context
Projeto com 7 projetos .NET + múltiplos projetos de teste. Gerenciar versões de pacotes NuGet individualmente em cada `.csproj` leva a:
- Inconsistência de versões
- Dificuldade de atualização
- Conflitos de dependência transitiva
- Duplicação

## Decision
Usar **Central Package Management (CPM)** via `Directory.Packages.props` na raiz da solution.

### Configuração
```xml
<!-- Directory.Packages.props -->
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
    <CentralPackageTransitivePinningEnabled>true</CentralPackageTransitivePinningEnabled>
    <TargetFramework>net10.0</TargetFramework>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <WarningsNotAsErrors>CS1591;CS8618;CS8600;CS8602;CS8603;CS8604;CS8619;CS8625;CS8714;CS8765;CS8767;CS8981;NU1902;NU1903</WarningsNotAsErrors>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <NoWarn>$(NoWarn);1591</NoWarn>
    <EnableNETAnalyzers>true</EnableNETAnalyzers>
    <AnalysisLevel>latest</AnalysisLevel>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  </PropertyGroup>

  <ItemGroup>
    <!-- Versões pinadas -->
    <PackageVersion Include="Microsoft.EntityFrameworkCore" Version="9.0.2" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.2" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore.Tools" Version="9.0.2" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore.Design" Version="9.0.2" />
    <PackageVersion Include="Microsoft.AspNetCore.OpenApi" Version="9.0.2" />
    <PackageVersion Include="Swashbuckle.AspNetCore" Version="7.2.0" />
    <PackageVersion Include="FluentValidation" Version="11.11.0" />
    <PackageVersion Include="FluentValidation.DependencyInjectionExtensions" Version="11.11.0" />
    <PackageVersion Include="MediatR" Version="12.4.1" />
    <PackageVersion Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.2" />
    <PackageVersion Include="Microsoft.AspNetCore.Authentication.Google" Version="9.0.2" />
    <PackageVersion Include="AspNet.Security.OAuth.Apple" Version="9.1.0" />
    <PackageVersion Include="Serilog.AspNetCore" Version="8.0.2" />
    <PackageVersion Include="Serilog.Sinks.Console" Version="6.0.0" />
    <PackageVersion Include="Serilog.Sinks.File" Version="6.0.0" />
    <PackageVersion Include="Serilog.Expressions" Version="4.0.0" />
    <PackageVersion Include="Dapper" Version="2.1.66" />
    <PackageVersion Include="Microsoft.Data.SqlClient" Version="6.0.1" />
    <PackageVersion Include="xunit" Version="2.9.2" />
    <PackageVersion Include="xunit.runner.visualstudio" Version="2.8.2" />
    <PackageVersion Include="FluentAssertions" Version="6.12.2" />
    <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.13.0" />
    <PackageVersion Include="Moq" Version="4.20.72" />
    <PackageVersion Include="Microsoft.AspNetCore.Mvc.Testing" Version="9.0.2" />
    <PackageVersion Include="Testcontainers" Version="3.10.0" />
    <PackageVersion Include="Testcontainers.MsSql" Version="3.10.0" />
    <PackageVersion Include="coverlet.collector" Version="6.0.2" />
    <PackageVersion Include="ReportGenerator" Version="5.4.6" />
    <PackageVersion Include="SonarAnalyzer.CSharp" Version="10.2.0.106107" />
    <PackageVersion Include="StyleCop.Analyzers" Version="1.1.118" />
    <PackageVersion Include="Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore" Version="9.0.2" />
  </ItemGroup>

  <PropertyGroup Condition=" '$(Configuration)' == 'Debug' ">
    <DefineConstants>DEBUG;TRACE</DefineConstants>
  </PropertyGroup>

  <PropertyGroup Condition=" '$(Configuration)' == 'Release' ">
    <DefineConstants>TRACE</DefineConstants>
    <DebugType>portable</DebugType>
    <DebugSymbols>true</DebugSymbols>
  </PropertyGroup>
</Project>
```

### Uso nos .csproj
```xml
<!-- src/CicloHelper.API/CicloHelper.API.csproj -->
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <NoWarn>$(NoWarn);1591</NoWarn>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\CicloHelper.Domain\CicloHelper.Domain.csproj" />
    <ProjectReference Include="..\CicloHelper.Application\CicloHelper.Application.csproj" />
    <ProjectReference Include="..\CicloHelper.Infrastructure\CicloHelper.Infrastructure.csproj" />
    <ProjectReference Include="..\CicloHelper.Contracts\CicloHelper.Contracts.csproj" />
    <!-- Sem Version - vem do Directory.Packages.props -->
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" />
    <PackageReference Include="Swashbuckle.AspNetCore" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.Google" />
    <PackageReference Include="AspNet.Security.OAuth.Apple" />
    <PackageReference Include="Serilog.AspNetCore" />
    <PackageReference Include="Serilog.Sinks.Console" />
    <PackageReference Include="Serilog.Sinks.File" />
    <PackageReference Include="Serilog.Expressions" />
  </ItemGroup>
</Project>
```

### Override de Versão (Quando Necessário)
```xml
<PackageReference Include="SomePackage" Version="1.2.3" />  <!-- Override local -->
<!-- Ou -->
<PackageReference Include="SomePackage" Version="$(CustomVersion)" />  <!-- Via property -->
```

## Alternatives Considered

### PackageReference em cada .csproj (Tradicional)
- **Prós**: Isolamento total por projeto
- **Contras**: Duplicação, drift de versões, conflitos transitivos, manutenção manual

### Directory.Build.props (MSBuild Properties)
- **Prós**: Compartilha properties MSBuild
- **Contras**: Não gerencia versões de pacote NuGet (apenas properties)

### NuGet.config com repositoryPath
- **Prós**: Cache compartilhado
- **Contras**: Não define versões, apenas source/cache location

## Consequences

### Positivas
- ✅ **Single Source of Truth**: Uma versão por pacote
- ✅ **Atualização atômica**: Muda em um lugar, propaga para todos
- ✅ **Transitive Pinning**: Evita "dependency hell" (versões flutuantes)
- ✅ **Consistência**: Mesma versão em todos os projetos
- ✅ **Auditabilidade**: Fácil revisar dependências (um arquivo)
- ✅ **CI/CD**: `dotnet outdated` / `dotnet list package --vulnerable` funciona globalmente
- ✅ **IDE Support**: Rider/VS Code mostram versões centralizadas

### Negativas
- ⚠️ **Override mais verboso** (precisa especificar Version explicitamente)
- ⚠️ **Menos flexibilidade** por projeto (mitigado: overrides permitidos)
- ⚠️ **Curva de aprendizado** para time novo

### Mitigações
- Documentar padrão no CONTRIBUTING.md
- Scripts de automação para updates (`dotnet package update`)
- Dependabot configurado para `Directory.Packages.props`

## Related
- ADR-002: .NET 10 + C# 13 (TargetFramework centralizado)
- ADR-001: Clean Architecture (múltiplos projetos)
