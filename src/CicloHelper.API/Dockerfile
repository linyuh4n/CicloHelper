# Multi-stage build para CicloHelper.API
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Desabilitar fallback package folder (evita erro com path do Windows)
ENV NUGET_FALLBACK_PACKAGES=""
ENV NUGET_PACKAGES="/root/.nuget/packages"

# Remover config global do NuGet que pode ter paths do Windows
RUN rm -f /root/.nuget/NuGet/NuGet.Config /etc/nuget.config /usr/share/nuget.config 2>/dev/null || true

# Criar NuGet.config local limpo
RUN mkdir -p /root/.nuget/NuGet && \
    printf "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<configuration>\n  <config>\n    <add key=\"globalPackagesFolder\" value=\"/root/.nuget/packages\" />\n  </config>\n  <packageSources>\n    <clear />\n    <add key=\"nuget.org\" value=\"https://api.nuget.org/v3/index.json\" />\n  </packageSources>\n  <packageSourceMapping>\n    <packageSource key=\"nuget.org\">\n      <package pattern=\"*\" />\n    </packageSource>\n  </packageSourceMapping>\n</configuration>\n" > /root/.nuget/NuGet/NuGet.Config

# Copiar solution e props para cache de restore
COPY CicloHelper.slnx .
COPY Directory.Packages.props .
COPY NuGet.config .

# Copiar apenas csprojs dos projetos necessários
COPY src/CicloHelper.Domain/CicloHelper.Domain.csproj src/CicloHelper.Domain/
COPY src/CicloHelper.Contracts/CicloHelper.Contracts.csproj src/CicloHelper.Contracts/
COPY src/CicloHelper.Application/CicloHelper.Application.csproj src/CicloHelper.Application/
COPY src/CicloHelper.Infrastructure/CicloHelper.Infrastructure.csproj src/CicloHelper.Infrastructure/
COPY src/CicloHelper.API/CicloHelper.API.csproj src/CicloHelper.API/

# Restore dependencies
RUN dotnet restore src/CicloHelper.API/CicloHelper.API.csproj

# Copiar todo o código dos projetos necessários
COPY src/CicloHelper.Domain/ src/CicloHelper.Domain/
COPY src/CicloHelper.Contracts/ src/CicloHelper.Contracts/
COPY src/CicloHelper.Application/ src/CicloHelper.Application/
COPY src/CicloHelper.Infrastructure/ src/CicloHelper.Infrastructure/
COPY src/CicloHelper.API/ src/CicloHelper.API/

# Build e publish - SEM --no-restore e SEM limpar cache antes
WORKDIR /src/src/CicloHelper.API
RUN dotnet publish CicloHelper.API.csproj -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Non-root user para segurança
RUN useradd --no-create-home --shell /bin/false appuser && chown -R appuser:appuser /app
USER appuser

# Copiar publish
COPY --from=build /app/publish .

# Configurações
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "CicloHelper.API.dll"]