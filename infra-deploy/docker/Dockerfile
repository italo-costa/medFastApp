# 🐳 MediApp Backend - Multi-stage Docker Build

FROM node:18-alpine AS builder

# Configurar diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install && npm cache clean --force

# Gerar Prisma Client
RUN npx prisma generate

# Estágio de produção
FROM node:18-alpine AS production

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mediapp -u 1001

# Configurar diretório
WORKDIR /app

# Instalar cliente PostgreSQL
RUN apk add --no-cache postgresql-client

# Copiar node_modules do builder
COPY --from=builder --chown=mediapp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mediapp:nodejs /app/package*.json ./

# Copiar código da aplicação
COPY --chown=mediapp:nodejs ./src ./src
COPY --chown=mediapp:nodejs ./prisma ./prisma
COPY --chown=mediapp:nodejs ./public ./public

# Criar diretórios necessários com permissões corretas
RUN mkdir -p uploads logs && chown -R mediapp:nodejs uploads logs

# Configurar usuário
USER mediapp

# Expor porta
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http=require('http');http.get('http://localhost:3002/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

# Comando de inicialização
CMD ["node", "src/app.js"]