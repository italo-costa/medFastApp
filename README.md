# 🏥 MediApp - Sistema Médico Completo v3.0.0

[![CI/CD](https://github.com/italo-costa/medFastApp/workflows/🏥%20MediApp%20CI/CD%20Pipeline%20Completa/badge.svg)](https://github.com/italo-costa/medFastApp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

Sistema completo de gestão médica com backend robusto, frontend responsivo e aplicativo mobile. Desenvolvido para clínicas, consultórios e hospitais.

## 🌟 Características Principais

- 📊 **Dashboard Completo**: Gestão de médicos, pacientes e consultas
- 🔐 **Autenticação Segura**: JWT + bcrypt com roles e permissões
- 📱 **Aplicativo Mobile**: React Native para iOS e Android
- 🗄️ **Banco Robusto**: PostgreSQL com Prisma ORM
- 🚀 **API RESTful**: Documentada com OpenAPI/Swagger
- 📈 **Monitoramento**: Logs estruturados e métricas
- 🐳 **Containerizado**: Docker e Docker Compose
- 🔄 **CI/CD**: GitHub Actions automatizado

## ⚡ Tecnologias Utilizadas

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **Prisma ORM** - Object-Relational Mapping
- **PostgreSQL 15** - Banco de dados
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização
- **JavaScript ES6+** - Lógica cliente
- **Bootstrap 5** - Framework CSS

### Mobile
- **React Native** - Desenvolvimento híbrido
- **Expo** - Plataforma de desenvolvimento

### DevOps
- **Docker** - Containerização
- **PM2** - Process Manager
- **GitHub Actions** - CI/CD
- **Nginx** - Proxy reverso

## 🏗️ Estrutura do Projeto

```
mediapp/
├── 📁 apps/
│   ├── 📁 backend/                 # API Node.js + Express
│   │   ├── 📁 src/
│   │   │   ├── 📄 app.js           # Servidor principal
│   │   │   ├── 📁 routes/          # Rotas da API
│   │   │   ├── 📁 services/        # Serviços de negócio
│   │   │   ├── 📁 middleware/      # Middlewares
│   │   │   └── 📁 utils/           # Utilitários
│   │   ├── 📁 public/              # Frontend estático
│   │   ├── 📁 prisma/              # Schema do banco
│   │   └── 📄 package.json
│   └── 📁 mobile/                  # App React Native
├── 📁 .github/workflows/           # CI/CD GitHub Actions
├── 📄 docker-compose.yml           # Orquestração Docker
├── 📄 ecosystem.config.js          # Configuração PM2
└── 📄 README.md
```

## 🚀 Quick Start

### 1. Pré-requisitos

- **Node.js 18+**
- **PostgreSQL 15+**
- **Docker** (opcional)
- **Git**

### 2. Instalação

```bash
# 1. Clonar repositório
git clone https://github.com/italo-costa/medFastApp.git
cd medFastApp

# 2. Instalar dependências
cd apps/backend
npm install

# 3. Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# 4. Setup do banco
npm run db:migrate
npm run db:seed
```

### 3. Execução

#### Desenvolvimento
```bash
npm run dev
```

#### Produção
```bash
npm run start:prod
```

#### Docker (Recomendado)
```bash
docker-compose up -d
```

### 4. Acesso

- **Web**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Docs**: http://localhost:3000/api-docs

## 📊 Funcionalidades Principais

### ✅ **Gestão de Médicos**
- Cadastro completo com CRM e especialidades
- Sistema de autenticação seguro
- Perfis profissionais detalhados
- Dashboard personalizado

### ✅ **Gestão de Pacientes**
- Prontuários digitais completos
- Sistema de upload de fotos
- Integração com ViaCEP para endereços
- Gestão de planos de saúde
- Histórico médico estruturado

### ✅ **Sistema de Consultas**
- Agendamento por especialidade
- Relacionamento médico-paciente
- Upload de exames e laudos
- Controle de resultados

### ✅ **Dashboard Analytics**
- Métricas em tempo real
- Estatísticas por médico
- Relatórios personalizados
- Interface moderna e responsiva

## 🧪 Comandos de Desenvolvimento

```bash
# Desenvolvimento
npm run dev              # Servidor desenvolvimento
npm run dev:watch        # Com watch automático
npm test                 # Executar testes
npm run test:coverage    # Cobertura de testes

# Banco de dados
npm run db:migrate       # Executar migrações
npm run db:seed          # Popular com dados teste
npm run db:studio        # Prisma Studio (GUI)

# Produção
npm run build            # Build produção
npm run start:prod       # Iniciar produção
pm2 start ecosystem.config.js

# Docker
docker-compose up -d     # Iniciar todos serviços
docker-compose down      # Parar serviços
docker-compose logs      # Ver logs
```

## 🔒 Segurança

- **JWT** com expiração configurável
- **bcrypt** para hash de senhas
- **Helmet** para headers de segurança
- **CORS** configurado adequadamente
- **Rate limiting** para proteção DDoS
- **Validação de dados** rigorosa

## 📈 Monitoramento

- Logs estruturados com Winston
- Métricas de performance
- Monitoramento de recursos
- Alertas automáticos para erros

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte, abra uma [issue](https://github.com/italo-costa/medFastApp/issues) ou entre em contato:

- 📧 **Email**: suporte@mediapp.com.br
- 🌐 **Website**: https://mediapp.com.br

---

**🏥 MediApp v3.0.0 - Sistema Médico Completo**

*Desenvolvido com tecnologias modernas para gestão médica eficiente*