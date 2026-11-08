# Multi-stage build para CicloHelper.Web (React + Vite + Nginx)
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copiar package files
COPY src/CicloHelper.Web/package*.json ./
RUN npm ci

# Copiar código
COPY src/CicloHelper.Web/ ./

# Build
RUN npm run build

# Stage 2: Runtime (Nginx)
FROM nginx:alpine AS runtime

# Copiar config customizada
COPY src/CicloHelper.Web/nginx.conf /etc/nginx/nginx.conf

# Copiar build artifacts
COPY --from=build /app/dist /usr/share/nginx/html

# Non-root user
RUN adduser -D -H -u 1000 -s /sbin/nologin nginxuser && \
    mkdir -p /var/cache/nginx /var/log/nginx /run && \
    chown -R nginxuser:nginxuser /usr/share/nginx/html /var/cache/nginx /var/log/nginx /run /etc/nginx

USER nginxuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]