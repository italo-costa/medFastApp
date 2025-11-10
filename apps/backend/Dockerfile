# 🏥 MediApp Backend Dockerfile
# Multi-stage build para otimização

# ===============================
# BASE STAGE
# ===============================
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache \
    curl \
    postgresql-client \
    dumb-init

# Configurar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mediapp -u 1001

# Criar diretórios
WORKDIR /app
RUN chown -R mediapp:nodejs /app

# ===============================
# DEPENDENCIES STAGE  
# ===============================
FROM base AS deps

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Gerar Prisma Client
RUN npx prisma generate

# ===============================
# DEVELOPMENT STAGE
# ===============================
FROM base AS development

# Copiar node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copiar código fonte
COPY --chown=mediapp:nodejs . .

# Criar diretórios necessários
RUN mkdir -p uploads logs public && \
    chown -R mediapp:nodejs uploads logs public

# Instalar dependências de desenvolvimento
RUN npm install

# Expor porta
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Configurar usuário
USER mediapp

# Comando padrão
CMD ["dumb-init", "npm", "run", "start:dev"]

# ===============================
# BUILD STAGE
# ===============================
FROM base AS build

# Copiar dependências
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copiar código fonte
COPY --chown=mediapp:nodejs . .

# Build da aplicação
RUN npm run build

# ===============================
# PRODUCTION STAGE
# ===============================
FROM base AS production

ENV NODE_ENV=production

# Copiar dependências de produção
COPY --from=deps --chown=mediapp:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=mediapp:nodejs /app/package*.json ./

# Copiar código da aplicação
COPY --from=build --chown=mediapp:nodejs /app/server-robust.js ./
COPY --from=build --chown=mediapp:nodejs /app/prisma ./prisma/
COPY --from=build --chown=mediapp:nodejs /app/public ./public/

# Criar diretórios necessários
RUN mkdir -p uploads logs && \
    chown -R mediapp:nodejs uploads logs

# Expor porta
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Configurar usuário
USER mediapp

# Comando de inicialização
CMD ["dumb-init", "node", "server-robust.js"]