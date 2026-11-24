# Multi-stage build for ADUCARGA PWA
# Imagen base: Node 20 (compatible con Next.js 14.2.30 y Bun no es necesario)
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias (cache de capas)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código y construir
COPY . .
RUN npm run build

# Runner: solo lo necesario para ejecutar
FROM node:20-alpine AS runner
WORKDIR /app

# Crear usuario no root (seguridad)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copiar outputs del builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Variables de entorno (se inyectan al construir en EasyPanel)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Cambiar a usuario no root
USER nextjs

EXPOSE 3000

# HEALTHCHECK público (sin autenticación) para EasyPanel
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]