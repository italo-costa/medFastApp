# 🏥 MediApp v3.0.0 - Guia Completo de CI/CD por Componente

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Problema Resolvido - SIGTERM/SIGINT](#problema-resolvido---sigtermsigintt)
3. [CI/CD por Componente](#cicd-por-componente)
4. [Sistema de Monitoramento](#sistema-de-monitoramento)
5. [Uso Prático](#uso-prático)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O MediApp v3.0.0 agora possui **CI/CD separado por componente** com pipelines especializadas para:

- **🚀 Backend**: API, serviços, lógica de negócio
- **🎨 Frontend**: Interface web, assets estáticos
- **🗄️ Database**: Schema, migrações, backup/recovery

### 🔧 Arquitetura de Pipelines

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Backend CI/CD │    │  Frontend CI/CD │    │ Database CI/CD  │
│                 │    │                 │    │                 │
│ • Code Analysis │    │ • HTML/CSS/JS   │    │ • Schema Valid. │
│ • Unit Tests    │    │ • UI Tests      │    │ • Migration Test│
│ • Docker Build  │    │ • Asset Optim.  │    │ • Backup Test   │
│ • Deploy API    │    │ • Static Deploy │    │ • Deploy Schema │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │   Monitoramento │
                    │                 │
                    │ • Health Checks │
                    │ • Auto Restart  │
                    │ • Alertas       │
                    │ • Logs          │
                    └─────────────────┘
```

---

## ⚡ Problema Resolvido - SIGTERM/SIGINT

### 🔍 **Diagnóstico do Problema**
Os servidores Node.js estavam sendo terminados imediatamente após iniciar devido a:

1. **Tratamento inadequado de sinais** nos handlers SIGTERM/SIGINT
2. **Comandos WSL/Windows** enviando sinais prematuros (`timeout`, `nohup`)
3. **Falta de isolamento de processo** (sem `setsid`)

### ✅ **Solução Implementada**

#### 1. **Servidor Robusto** (`server-robust.js`)
```javascript
// Tratamento melhorado de sinais
process.on('SIGINT', () => {
  Logger.info('Recebido SIGINT (Ctrl+C)');
  gracefulShutdown('SIGINT', 0);
});

process.on('SIGHUP', () => {
  Logger.info('Recebido SIGHUP, ignorando...');
  // Ignorar SIGHUP em vez de fazer shutdown
});

// Sistema de logging robusto
class Logger {
  static log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${emoji} [${level}] ${message}`;
    console.log(logMessage);
    fs.appendFile(LOG_FILE, logMessage + '\n').catch(() => {});
  }
}
```

#### 2. **Script de Inicialização Robusto** (`start-robust.sh`)
```bash
# Usar setsid para criar nova sessão e evitar sinais do terminal
setsid nohup node server-robust.js </dev/null >>"$SERVER_LOG" 2>&1 &

# Verificação de saúde robusta
while [ $attempts -lt $max_attempts ]; do
  if curl -s -f "http://localhost:3002/health" >/dev/null 2>&1; then
    success "✅ Servidor acessível e funcionando!"
    break
  fi
  
  # Verificar se processo ainda existe
  if ! kill -0 "$server_pid" 2>/dev/null; then
    error "Processo do servidor morreu durante inicialização"
    exit 1
  fi
  
  sleep 2
  ((attempts++))
done
```

---

## 🚀 CI/CD por Componente

### 1. **🔧 Backend Pipeline** (`.github/workflows/backend-ci-cd.yml`)

#### **Stages:**
```yaml
Jobs:
  code-analysis:     # 🔍 ESLint, Security Audit, Unit Tests
  build:            # 🏗️ Production Build, Prisma Generation
  docker:           # 🐳 Docker Build & Registry Push
  deploy:           # 🚀 Database Migration + App Deploy
  notify:           # 📢 Success/Failure Notifications
```

#### **Triggers:**
- Push em `apps/backend/**`
- Changes em arquivos `.js`, `.ts`, `package.json`
- PRs para `master/main`

#### **Features:**
- ✅ Testes automatizados com PostgreSQL 15
- ✅ Docker multi-platform (AMD64, ARM64)
- ✅ Deploy com health checks
- ✅ Rollback automático em falha

### 2. **🎨 Frontend Pipeline** (`.github/workflows/frontend-ci-cd.yml`)

#### **Stages:**
```yaml
Jobs:
  frontend-analysis: # 🔍 HTML/CSS/JS Validation
  build-frontend:   # 🏗️ Asset Optimization & Minification
  ui-tests:         # 🧪 Responsive & UI Testing
  deploy-frontend:  # 🚀 Static Asset Deploy
  notify-frontend:  # 📢 Deployment Status
```

#### **Triggers:**
- Push em `apps/frontend/**` ou `apps/backend/public/**`
- Changes em `.html`, `.css`, `.js`

#### **Features:**
- ✅ HTML/CSS/JS validation
- ✅ Asset optimization (minification, compression)
- ✅ Responsive design testing
- ✅ Performance analysis

### 3. **🗄️ Database Pipeline** (`.github/workflows/database-ci-cd.yml`)

#### **Stages:**
```yaml
Jobs:
  schema-analysis:   # 🔍 Prisma Schema Validation
  migration-tests:   # 🔄 Cross-Version Migration Testing
  backup-recovery:   # 💾 Backup & Recovery Testing
  deploy-database:   # 🚀 Production Migration Deploy
  notify-database:   # 📢 Database Status Notifications
```

#### **Triggers:**
- Push em `apps/backend/prisma/**`
- Changes em `schema.prisma`, migration files

#### **Features:**
- ✅ Schema validation cross PostgreSQL versions (13, 14, 15)
- ✅ Migration testing em múltiplas versões
- ✅ Backup/recovery automation
- ✅ Zero-downtime deployment

---

## 📊 Sistema de Monitoramento

### **Script de Monitoramento** (`monitor.sh`)

#### **Comandos Disponíveis:**
```bash
# Verificação única de saúde
./monitor.sh check

# Monitoramento contínuo (loop infinito)
./monitor.sh monitor

# Status em JSON
./monitor.sh status

# Ver logs recentes
./monitor.sh logs

# Ver alertas
./monitor.sh alerts
```

#### **Componentes Monitorados:**
1. **🐘 PostgreSQL**
   - Container status
   - Conectividade (`pg_isready`)
   - Response time

2. **🚀 Backend**
   - Process health (PID check)
   - HTTP response (`/health` endpoint)
   - Memory/CPU usage

3. **🎨 Frontend**
   - Static files availability
   - HTTP accessibility
   - Asset integrity

#### **Auto-Recovery:**
```bash
# Restart automático em falha (máximo 3 tentativas)
restart_service() {
  local service=$1
  local attempts=$(cat "/tmp/mediapp-${service}-restarts" 2>/dev/null || echo "0")
  
  if [ "$attempts" -ge "$MAX_RESTART_ATTEMPTS" ]; then
    alert "$service" "Max restart attempts reached. Manual intervention required."
    return 1
  fi
  
  # Restart logic para cada componente
  case $service in
    "postgres") docker start mediapp-db ;;
    "backend") nohup node server-robust.js & ;;
  esac
}
```

---

## 🏃 Uso Prático

### **🚀 Inicialização Completa**
```bash
# 1. Iniciar sistema robusto
bash start-robust.sh

# 2. Verificar saúde
bash monitor.sh check

# 3. Monitoramento contínuo (opcional)
bash monitor.sh monitor
```

### **📊 URLs da Aplicação**
```
🔗 Sistema Principal:      http://localhost:3002
📊 Health Check:           http://localhost:3002/health
📋 Status Detalhado:       http://localhost:3002/status
🏥 API Médicos:           http://localhost:3002/api/medicos
👥 API Pacientes:         http://localhost:3002/api/pacientes
📊 Estatísticas:          http://localhost:3002/api/stats
🖥️ Gestão Médicos:       http://localhost:3002/gestao-medicos.html
👨‍⚕️ Gestão Pacientes:      http://localhost:3002/gestao-pacientes.html
```

### **🔧 Comandos de Manutenção**
```bash
# Parar sistema
kill $(cat /tmp/mediapp-server.pid)

# Ver logs do servidor
tail -f /tmp/mediapp-server.log

# Ver logs de monitoramento
tail -f /tmp/mediapp-monitoring.log

# Status em tempo real
watch -n 5 'bash monitor.sh status'

# Backup manual do banco
docker exec mediapp-db pg_dump -U mediapp -d mediapp_db > backup-$(date +%Y%m%d).sql
```

---

## 🛠️ Troubleshooting

### **❌ Servidor não inicia**
```bash
# 1. Verificar logs
cat /tmp/mediapp-server.log

# 2. Verificar porta
lsof -i :3002

# 3. Verificar PostgreSQL
docker logs mediapp-db

# 4. Tentar restart
bash start-robust.sh
```

### **🐘 PostgreSQL com problemas**
```bash
# 1. Verificar container
docker ps | grep mediapp-db

# 2. Ver logs do PostgreSQL
docker logs mediapp-db

# 3. Restart manual
docker restart mediapp-db

# 4. Verificar conectividade
docker exec mediapp-db pg_isready -U mediapp
```

### **🔄 Pipeline CI/CD falhando**
```bash
# 1. Verificar sintaxe YAML
yamllint .github/workflows/*.yml

# 2. Testar migrações localmente
cd apps/backend && npx prisma migrate deploy

# 3. Validar schema
cd apps/backend && npx prisma validate

# 4. Testar build
cd apps/backend && npm ci && npm run build
```

### **📊 Monitoramento com alertas**
```bash
# Ver alertas recentes
bash monitor.sh alerts

# Resetar contador de restarts
rm /tmp/mediapp-*-restarts

# Verificar recursos do sistema
bash monitor.sh check | grep SYSTEM

# Logs detalhados
tail -50 /tmp/mediapp-monitoring.log
```

---

## 📈 Melhorias Futuras

### **🔮 Roadmap**
1. **📊 Métricas Avançadas**
   - Prometheus/Grafana integration
   - Custom metrics collection
   - Performance monitoring

2. **🔐 Security Enhancements**
   - HTTPS/TLS certificates
   - JWT token rotation
   - Security scanning integration

3. **☁️ Cloud Deployment**
   - AWS/Azure/GCP pipelines
   - Kubernetes deployment
   - Auto-scaling configuration

4. **🧪 Advanced Testing**
   - Integration tests
   - Performance testing
   - Load testing automation

---

## ✅ Conclusão

O **MediApp v3.0.0** agora possui:

✅ **CI/CD Separado por Componente** - Pipelines especializadas  
✅ **Problema SIGTERM Resolvido** - Servidor robusto com tratamento correto de sinais  
✅ **Monitoramento Automático** - Health checks e auto-recovery  
✅ **Sistema Totalmente Funcional** - Pronto para navegação do usuário  

**🎯 Sistema 100% Operacional e Pronto para Produção!**