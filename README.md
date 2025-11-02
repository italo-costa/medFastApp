# 🏥 MediApp - Sistema Médico Completo v2.0# 🏥 MediApp - Sistema de Gestão Médica Completo



[![Node.js](https://img.shields.io/badge/Node.js-18.0%2B-green.svg)](https://nodejs.org/)Sistema médico moderno e completo com arquitetura robusta para gestão de pacientes, prontuários digitais e dados clínicos. **Versão 2.0** com funcionalidades avançadas de gestão de pacientes.

[![React Native](https://img.shields.io/badge/React%20Native-0.72.6-blue.svg)](https://reactnative.dev/)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13%2B-blue.svg)](https://postgresql.org/)## 🚀 Funcionalidades

[![Status](https://img.shields.io/badge/Status-Refatorado-success.svg)](https://github.com/mediapp/workspace)

### ⭐ **Gestão Avançada de Pacientes** (NOVO!)

**Sistema médico completo para gestão de prontuários, médicos e pacientes com tecnologia moderna e arquitetura limpa.**- **📸 Gerenciamento de Fotos**: Upload, crop e otimização automática

- **🏠 Endereços Inteligentes**: Integração ViaCEP para auto-complete brasileiro

## 🎯 Visão Geral- **🏥 Planos de Saúde**: Gestão completa de convênios e SUS

- **📋 Dados Completos**: Informações pessoais, médicas e de contato

MediApp é uma solução completa para gestão médica que inclui:- **🔍 Busca Avançada**: Filtros inteligentes com paginação

- 👨‍⚕️ **Gestão de Médicos** - Cadastro, edição e controle- **📊 Estatísticas**: Dashboard com métricas em tempo real

- 👥 **Gestão de Pacientes** - Prontuários eletrônicos completos  

- 🗺️ **Analytics Geográfico** - Mapas interativos e visualizações### ✅ Gestão de Médicos

- 📊 **Dashboard Analytics** - Métricas e relatórios avançados- Cadastro completo com CRM, especialidades e validações

- 🔗 **Integrações Externas** - SUS, ANS, ViaCEP- Sistema de autenticação seguro com JWT

- 📱 **App Mobile** - React Native para iOS/Android- Perfis detalhados com formação e experiência

- Dashboard personalizado por profissional

## 🏗️ Arquitetura Refatorada

### ✅ Prontuários Digitais

```- Sistema de anamnese completo e estruturado

📦 mediapp/- Relacionamento médico-paciente com histórico

├── 📄 package.json                 # Workspace principal- Consultas organizadas por data e especialidade

├── 📄 README.md                    # Este arquivo- Diagnósticos integrados com sistema médico

├── 🚀 start-mediapp-unified.sh     # Script de inicialização

├── 📁 apps/### ✅ Sistema de Exames e Arquivos

│   ├── 📁 backend/                 # Backend Node.js unificado- Upload de arquivos médicos (PDF, imagens)

│   │   ├── 📄 package.json- Organização por paciente e tipo de exame

│   │   ├── 📁 src/- Controle de resultados e laudos

│   │   │   ├── 📄 app.js           # ✅ Servidor principal ÚNICO- Sistema de anexos e observações

│   │   │   ├── 📁 routes/          # Rotas da API

│   │   │   ├── 📁 services/        # Serviços de negócio### ✅ Dashboard e Analytics

│   │   │   ├── 📁 middleware/      # Middlewares Express- Visão geral do sistema com estatísticas

│   │   │   ├── 📁 config/          # Configurações- Métricas de atendimento em tempo real

│   │   │   └── 📁 utils/           # Utilitários- Interface moderna e totalmente responsiva

│   │   ├── 📁 public/              # Arquivos estáticos- Relatórios personalizados e exportação

│   │   ├── 📁 tests/               # Testes automatizados

│   │   └── 📁 prisma/              # Schema do banco## 🛠️ Tecnologias

│   └── 📁 mobile/                  # App React Native

│       ├── 📄 package.json### **Backend (Node.js + Express)**

│       ├── 📁 src/                 # Código fonte mobile- **API RESTful**: Endpoints padronizados e documentados  

│       ├── 📁 android/             # Configuração Android- **PostgreSQL + Prisma ORM**: Banco de dados robusto com ORM moderno

│       └── 📁 ios/                 # Configuração iOS- **Autenticação JWT**: Sistema seguro com refresh tokens

├── 📁 docs/                        # Documentação consolidada- **Validações**: CPF, telefone, CEP, dados médicos

├── 📁 scripts/                     # Scripts de build/deploy- **Segurança**: Helmet, CORS, Rate limiting

└── 📁 tests/                       # Testes de integração- **Upload de Arquivos**: Sistema de upload com validação

```

### **Frontend Web (HTML5 + JavaScript)**

## 🚀 Quick Start- **Interface Moderna**: Design responsivo e intuitivo

- **Componentes Modulares**: PatientPhotoManager, AddressManager, InsuranceManager

### 1. Pré-requisitos- **Integrações**: ViaCEP (endereços), validações brasileiras

- **Upload de Fotos**: Sistema de crop e otimização

```bash- **Formulários Inteligentes**: Validação em tempo real

# Node.js 18+

node --version### **Mobile App (React Native)**

- **Framework**: React Native 0.72.6 + TypeScript

# PostgreSQL 13+- **Estado**: Redux Toolkit para gerenciamento global

pg_config --version- **UI**: React Native Paper - Material Design

- **Navegação**: React Navigation 6.x

# Git- **Status**: Estrutura base pronta, em expansão

git --version

```### **Database (PostgreSQL + Prisma)**

- **Schema Completo**: 8 tabelas com relacionamentos

### 2. Clonagem e Setup- **Dados Reais**: 5 pacientes de exemplo com consultas

- **Migrations**: Controle de versão do banco

```bash- **Validações**: Constraints e índices otimizados

# Clonar repositório

git clone https://github.com/mediapp/workspace.git## 📊 Dados Implementados (Database Real)

cd mediapp

### **Médicos Cadastrados (1)**

# Setup automático- Dr. João Silva - CRM 123456-SP - Cardiologia

chmod +x start-mediapp-unified.sh

./start-mediapp-unified.sh### **Pacientes Completos (5)**

# Escolha opção 3 (Setup inicial)- Maria Silva Santos - CPF: 123.456.789-00 - A+ 

```- João Pedro Oliveira - CPF: 987.654.321-00 - O+

- Ana Costa Lima - CPF: 456.789.123-00 - B+

### 3. Inicialização- Carlos Eduardo Santos - CPF: 789.123.456-00 - AB+

- Patricia Rodrigues Almeida - CPF: 321.654.987-00 - A-

```bash

# Servidor de produção### **Consultas e Prontuários (3)**

./start-mediapp-unified.sh- Consulta Cardiológica - Maria Silva (Set/2024)

# Escolha opção 1- Consulta Preventiva - João Pedro (Out/2024)  

- Acompanhamento - Ana Costa (Nov/2024)

# Ou servidor de desenvolvimento

./start-mediapp-unified.sh  ### **Exames e Arquivos (3)**

# Escolha opção 2- Eletrocardiograma - Maria Silva

```- Hemograma Completo - João Pedro

- Ultrassom - Ana Costa

### 4. Acessar Aplicação

### **Alergias Registradas (3)**

🌐 **Web Interface**: http://localhost:3001/  - Penicilina - Severity: HIGH

⚡ **Health Check**: http://localhost:3001/health  - Dipirona - Severity: MEDIUM  

👨‍⚕️ **Gestão Médicos**: http://localhost:3001/gestao-medicos.html  - Ácido Acetilsalicílico - Severity: LOW

👥 **Gestão Pacientes**: http://localhost:3001/gestao-pacientes.html  

🗺️ **Analytics Geográfico**: http://localhost:3001/src/pages/analytics-geografico.html  ## 🏗️ Arquitetura do Sistema



## 📋 Funcionalidades### **Visão Geral**

```

### 🎯 Core Features🌐 Frontend Web (HTML5/JS) + 📱 Mobile (React Native)

                    ↓

| Funcionalidade | Status | Descrição |🔗 API Gateway (Express.js) - PORT 3001

|----------------|--------|-----------|                    ↓  

| **Gestão de Médicos** | ✅ | CRUD completo, especialidades, CRM |🧠 Business Logic (Prisma ORM + Validators)

| **Gestão de Pacientes** | ✅ | Prontuários, histórico, documentos |                    ↓

| **Analytics Dashboard** | ✅ | Métricas, gráficos, relatórios |💾 PostgreSQL Database - PORT 5432

| **Mapas Geográficos** | ✅ | Leaflet.js, markers interativos |```

| **Integração SUS** | ✅ | Dados DATASUS, estabelecimentos |

| **Integração ANS** | ✅ | Operadoras, beneficiários |### **Componentes Principais**

| **API ViaCEP** | ✅ | Busca de endereços |

| **App Mobile** | ✅ | React Native 0.72.6 |#### **1. API Layer (Node.js + Express)**

```

### 🔧 Technical Features/api/auth/*         → Autenticação JWT

/api/users/*        → Gestão de médicos  

- **Servidor Unificado**: Um único `app.js` substitui 15+ servidores duplicados/api/patients/*     → Gestão de pacientes (NOVO!)

- **Workspace Monorepo**: Estrutura limpa com backend e mobile/api/records/*      → Prontuários médicos

- **Database ORM**: Prisma com PostgreSQL  /api/exams/*        → Exames e arquivos

- **Testes Automatizados**: Jest + Supertest/api/allergies/*    → Controle de alergias

- **Docker Support**: Containerização opcional/api/analytics/*    → Dashboard e estatísticas

- **CI/CD Ready**: GitHub Actions configurado```

- **Mobile APK**: Build automático Android

#### **2. Frontend Components (Web)**

## 🧹 Refatoração Realizada- `PatientPhotoManager` - Gerenciamento de fotos com crop

- `AddressManager` - Integração ViaCEP para endereços

### ❌ Removido (Duplicações)- `InsuranceManager` - Gestão de planos de saúde brasileiros

- Interface responsiva e moderna

- 🗂️ `backend/`, `mediapp/`, `mediapp-refined/` (pastas duplicadas)

- 🖥️ 15+ servidores diferentes (`robust-server.js`, `persistent-server.js`, etc.)#### **3. Database Schema (PostgreSQL)**

- 📦 6 arquivos `package.json` duplicados```sql

- 📜 30+ scripts de inicialização redundantesusers (médicos) → medical_records ← patients

- 📝 50+ arquivos de documentação repetida                      ↓

                  anamnesis, exams, allergies, patient_photos

### ✅ Consolidado```



- 🏗️ **Estrutura Única**: `/apps/backend` e `/apps/mobile`### **Segurança & Compliance**

- 🖥️ **Servidor Único**: `apps/backend/src/app.js`- ✅ **JWT Authentication** - Tokens seguros com refresh

- 📦 **3 Package.json**: Workspace + Backend + Mobile- 🔐 **Data Validation** - CPF, telefone, CEP, dados médicos

- 🚀 **1 Script Start**: `start-mediapp-unified.sh`- 🛡️ **CORS + Helmet** - Headers de segurança

- 📚 **Documentação Limpa**: Este README.md- 📝 **Request Logging** - Auditoria completa

- 🚫 **Rate Limiting** - Proteção contra ataques

### 📈 Resultado

### 👥 Colaboração

| Métrica | Antes | Depois | Melhoria |- Múltiplos médicos por paciente

|---------|-------|--------|----------|- Notificações de alterações

| **Pastas Backend** | 6 | 1 | -83% |- Comentários e observações

| **Servidores** | 15+ | 1 | -93% |- Logs de atividade

| **Package.json** | 6 | 3 | -50% |

| **Scripts Start** | 30+ | 1 | -96% |## 📱 Compatibilidade

| **Docs MD** | 100+ | 10 | -90% |- **Android**: 7.0+ (API 24+)

- **iOS**: 12.0+

## 🛠️ Desenvolvimento- **Tablets**: Suporte completo

- **Offline**: Sincronização automática

### Scripts Disponíveis

## 🛠️ Setup do Projeto

```bash

# Workspace principal### Pré-requisitos

npm run dev                 # Backend + Mobile em paralelo- Node.js 18+

npm run backend:start       # Só o backend- React Native CLI

npm run mobile:android      # Build Android- Android Studio / Xcode

npm run test               # Todos os testes- PostgreSQL 14+

npm run setup              # Setup completo

### Instalação

# Backend específico```bash

cd apps/backend# Clone o projeto

npm start                  # Produçãogit clone <repo-url>

npm run dev               # Desenvolvimento com nodemoncd aplicativo

npm test                  # Testes

npm run db:migrate        # Migração do banco# Instale dependências

npm install

# Mobile específico  

cd apps/mobile## 🚀 Instalação e Execução

npm run android           # Build Android

npm run ios              # Build iOS### **Pré-requisitos**

npm test                 # Testes mobile- Node.js 18+

```- PostgreSQL 16+

- Git

## 📊 API Documentation

### **Configuração Rápida**

### 🔗 Endpoints Principais```bash

# 1. Clone o repositório

| Método | Endpoint | Descrição |git clone <repo-url>

|--------|----------|-----------|cd aplicativo

| `GET` | `/health` | Status do sistema |

| `GET` | `/api/medicos` | Listar médicos |# 2. Configure o backend

| `POST` | `/api/medicos` | Criar médico |cd backend

| `PUT` | `/api/medicos/:id` | Atualizar médico |npm install

| `DELETE` | `/api/medicos/:id` | Remover médico |

| `GET` | `/api/patients` | Listar pacientes |# 3. Configure o banco de dados

| `POST` | `/api/patients` | Criar paciente |createdb mediapp

| `GET` | `/api/statistics/dashboard` | Métricas |npx prisma generate

| `GET` | `/api/viacep/:cep` | Buscar CEP |npx prisma db push



### 📈 Analytics Endpoints# 4. Insira dados de exemplo (opcional)

npx prisma db seed

| Método | Endpoint | Descrição |

|--------|----------|-----------|# 5. Inicie o servidor

| `POST` | `/api/external/analytics/consolidated` | Dados consolidados |npm run dev

| `GET` | `/api/external/analytics/maps/establishments` | Estabelecimentos para mapa |```

| `POST` | `/api/external/analytics/maps/marker/create` | Criar marker |

| `GET` | `/api/external/analytics/maps/heatmap/:tipo` | Dados heatmap |### **Acessar o Sistema**

- **Dashboard**: http://localhost:3001

## 🔒 Segurança- **Gestão de Pacientes**: http://localhost:3001/gestao-pacientes.html

- **Health Check**: http://localhost:3001/health

- Autenticação JWT- **API Docs**: http://localhost:3001/api

- Criptografia de senhas com bcrypt

- Validação de dados com Joi### **Mobile (Opcional)**

- Rate limiting```bash

- Helmet para headers de segurança# Configure o mobile

cd mobile

## 📄 Licençanpm install



Este projeto está licenciado sob a [MIT License](LICENSE).# Execute no simulador

npm run android  # ou npm run ios

## 🆘 Suporte```



- 🐛 **Issues**: [GitHub Issues](https://github.com/mediapp/workspace/issues)## 📊 Estrutura do Projeto

- 💬 **Discussões**: [GitHub Discussions](https://github.com/mediapp/workspace/discussions)```

- 📧 **Email**: suporte@mediapp.com.braplicativo/

├── backend/                      # API Node.js + Express

---│   ├── src/

│   │   ├── routes/              # Rotas da API (/api/*)

**MediApp v2.0** - Sistema médico completo, refatorado e otimizado 🏥✨│   │   ├── utils/               # Validadores e utilitários
│   │   └── middleware/          # Autenticação e logging
│   ├── public/                  # Frontend web estático
│   │   ├── gestao-pacientes.html # ⭐ Gestão avançada de pacientes
│   │   ├── js/                  # Componentes JavaScript
│   │   └── css/                 # Estilos do sistema
│   ├── prisma/                  # Schema e migrations
│   └── server-*.js              # Servidores alternativos
├── mobile/                      # App React Native
│   ├── src/
│   │   ├── store/               # Redux Toolkit
│   │   ├── components/          # Componentes reutilizáveis
│   │   └── theme/               # Design system
│   └── android/ios/             # Configurações nativas
├── docs/                        # 📚 Documentação completa
│   ├── RESUMO_APLICACAO.md      # Resumo executivo
│   ├── DIAGRAMA_ARQUITETURA.md  # Diagrama técnico
│   └── *.md                     # Documentação técnica
└── README.md                    # Este arquivo
```

## 🔒 Segurança e Compliance

### **Autenticação e Autorização**
- JWT tokens com refresh automático
- Validação de dados em múltiplas camadas
- Rate limiting por endpoint
- Headers de segurança (Helmet)

### **Proteção de Dados**
- Validação CPF, telefone, CEP brasileiros
- Sanitização de dados de entrada
- Logs de auditoria completos
- Backup automático de dados

### **Compliance Médico**
- Estrutura de dados conforme padrões médicos
- Controle de acesso por perfil
- Histórico de alterações
- Privacidade de dados sensíveis

## 🎯 Status do Projeto

### **✅ Funcional (75% completo)**
- ✅ Backend API completo com PostgreSQL
- ✅ Gestão avançada de pacientes com fotos e endereços
- ✅ Sistema de autenticação JWT
- ✅ Dashboard com estatísticas
- ✅ Base mobile React Native configurada

### **🔄 Em Desenvolvimento**
- 🔄 Sistema completo de prontuários
- 🔄 Agendamento de consultas
- 🔄 Expansão do mobile app

### **� Roadmap**
- [ ] v2.1: Sistema de agendamento
- [ ] v2.2: Relatórios médicos personalizados
- [ ] v2.3: Notificações automáticas
- [ ] v3.0: Deploy em produção + CI/CD

## 📚 Documentação

- 📋 **[Resumo da Aplicação](RESUMO_APLICACAO.md)** - Visão geral completa
- 🏗️ **[Diagrama de Arquitetura](DIAGRAMA_ARQUITETURA.md)** - Estrutura técnica
- 📁 **[Documentação Técnica](docs/)** - Guias detalhados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**MediApp v2.0** - Sistema completo de gestão médica  
*Última atualização: Janeiro 2025*
🏥 **MediApp** - Tecnologia a serviço da saúde