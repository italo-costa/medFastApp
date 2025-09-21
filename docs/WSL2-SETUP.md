# 🐧 MediApp no WSL2 - Guia de Execução

## ✅ Ambiente WSL2 Configurado com Sucesso!

Seu aplicativo MediApp foi configurado e está **funcionando perfeitamente** no ambiente Linux virtualizado (WSL2) dentro do Windows!

## 🚀 Como Executar a Aplicação

### 1. Backend (API Node.js + PostgreSQL)

#### Iniciar o Servidor Backend:
```bash
# Acesse o WSL Ubuntu
wsl -d Ubuntu

# Navegue para o diretório do projeto
cd /home/italo_unix_user/aplicativo/backend

# Inicie o servidor
npm run dev
```

**✅ Servidor rodando em:** http://localhost:3001

#### Testar a API:
```bash
# Health check
curl http://localhost:3001/health

# Resposta esperada:
# {"status":"OK","timestamp":"2025-09-21T15:55:15.965Z","uptime":3.006518755,"environment":"development","version":"1.0.0"}
```

### 2. Banco de Dados PostgreSQL

#### Status do Banco:
- ✅ **PostgreSQL 16** instalado e configurado
- ✅ **Banco:** mediapp
- ✅ **Usuário:** italo_unix_user
- ✅ **Senha:** mediapp123
- ✅ **Migrações:** Executadas com sucesso

#### Comandos úteis:
```bash
# Iniciar PostgreSQL (se parado)
sudo service postgresql start

# Acessar o banco
psql -U italo_unix_user -d mediapp

# Verificar tabelas criadas
\dt
```

### 3. Mobile App (React Native)

**Nota:** O app mobile está preparado, mas requer configuração adicional para execução:

```bash
# No WSL, navegue para o mobile
cd /home/italo_unix_user/aplicativo/mobile

# Instalar dependências
npm install

# Para Android (requer Android Studio)
npm run android

# Para iOS (requer macOS + Xcode)
npm run ios
```

## 🌐 Acessos Disponíveis

### API Endpoints:
- **Health Check:** http://localhost:3001/health
- **Auth:** http://localhost:3001/api/auth (em desenvolvimento)
- **Patients:** http://localhost:3001/api/patients (em desenvolvimento)
- **Records:** http://localhost:3001/api/records (em desenvolvimento)

### Banco de Dados:
- **Host:** localhost
- **Porta:** 5432
- **Database:** mediapp
- **Schema:** public

## 🛠️ Comandos Rápidos

### Iniciar Tudo de Uma Vez:
```bash
# Comando completo para iniciar backend
wsl -d Ubuntu -- bash -c "cd /home/italo_unix_user/aplicativo/backend && sudo service postgresql start && npm run dev"
```

### Parar Serviços:
```bash
# Parar Node.js
pkill node

# Parar PostgreSQL
sudo service postgresql stop
```

### Logs e Debug:
```bash
# Ver logs do backend
tail -f /home/italo_unix_user/aplicativo/backend/logs/combined.log

# Verificar processos
ps aux | grep node
ps aux | grep postgres
```

## 📊 Status do Projeto

### ✅ **Funcionando:**
- [x] Ambiente WSL2 Ubuntu
- [x] Node.js 18.20.8
- [x] PostgreSQL 16
- [x] Prisma ORM + Migrações
- [x] Express Server
- [x] API Health Check
- [x] Logs estruturados
- [x] Sistema de segurança básico

### 🔄 **Em Desenvolvimento:**
- [ ] Sistema de autenticação JWT
- [ ] CRUD completo de pacientes
- [ ] Interface React Native
- [ ] Sistema de prontuários
- [ ] Upload de arquivos

## 🏥 Funcionalidades Médicas Preparadas

### Banco de Dados:
- **Tabela Users:** Médicos e profissionais
- **Tabela Patients:** Pacientes e dados pessoais
- Relacionamentos preparados para:
  - Prontuários médicos
  - Alergias e medicações
  - Exames e arquivos
  - Logs de auditoria

### APIs Estruturadas:
- Rotas de autenticação
- Rotas de pacientes
- Rotas de prontuários
- Rotas de exames
- Rotas de alergias

## 🔧 Resolução de Problemas

### Se o servidor não iniciar:
```bash
# Verificar se PostgreSQL está rodando
sudo service postgresql status

# Verificar se a porta 3001 está livre
ss -tlnp | grep :3001

# Reinstalar dependências se necessário
rm -rf node_modules && npm install
```

### Se houver problemas com o banco:
```bash
# Recrear o banco
sudo -u postgres dropdb mediapp
sudo -u postgres createdb -O italo_unix_user mediapp

# Reexecutar migrações
npx prisma migrate dev --name init
```

## 🎯 Próximos Passos Recomendados

1. **Implementar Autenticação JWT** - Sistema de login para médicos
2. **Criar CRUD de Pacientes** - Interface completa de gestão
3. **Desenvolver Sistema de Prontuários** - Funcionalidade core
4. **Adicionar Upload de Arquivos** - Para exames e documentos
5. **Configurar App Mobile** - Interface nativa para dispositivos

---

## 🌟 **SUCESSO!** 

Seu aplicativo MediApp está **funcionando perfeitamente** no WSL2! O ambiente Linux virtualizado está pronto para desenvolvimento completo com todas as ferramentas necessárias instaladas e configuradas.

**Como acessar:** Use `wsl -d Ubuntu` e navegue para `/home/italo_unix_user/aplicativo/`