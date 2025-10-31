# 🏥 MediApp - Aplicação de Gestão Médica Completa

> **Sistema de gestão médica moderno com backend robusto, frontend responsivo e aplicativo mobile**

[![Node.js](https://img.shields.io/badge/Node.js-18.20.8-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18.2-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://postgresql.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.72.6-61DAFB.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6.svg)](https://typescriptlang.org/)

---

## 🎯 Visão Geral

O **MediApp** é uma aplicação completa para gestão médica que oferece:

- 🏥 **Gestão de Médicos**: Cadastro, consulta e administração
- 👥 **Gestão de Pacientes**: Prontuários eletrônicos completos  
- 📋 **Gestão de Exames**: Controle de exames e resultados
- 📱 **App Mobile**: Interface nativa para dispositivos móveis
- 🌐 **Interface Web**: Dashboard responsivo e moderno
- 🔐 **Segurança**: Autenticação JWT e criptografia

---

## 📁 Estrutura do Projeto

```
mediapp/
├── 📱 apps/                     # Aplicações principais
│   ├── backend/                # API REST Node.js + Express
│   ├── frontend/               # Interface web responsiva
│   └── mobile/                 # App React Native
├── 📦 packages/                # Pacotes compartilhados
│   ├── shared/                 # Utilitários e helpers
│   ├── types/                  # TypeScript definitions
│   └── configs/                # Configurações centralizadas
├── 🗂️ legacy/                   # Arquivos legados (backup)
│   ├── servers/                # Servidores antigos
│   ├── scripts/                # Scripts antigos
│   └── docs/                   # Documentação antiga
├── 📚 docs/                    # Documentação organizada
│   ├── api/                    # Documentação das APIs
│   ├── deployment/             # Guias de deploy
│   ├── development/            # Setup de desenvolvimento
│   └── architecture/           # Diagramas e arquitetura
├── 🔧 scripts/                 # Scripts utilitários
│   ├── development/            # Scripts de desenvolvimento
│   ├── deployment/             # Scripts de deploy
│   ├── testing/                # Scripts de teste
│   └── maintenance/            # Scripts de manutenção
├── 🧪 tests/                   # Testes automatizados
│   ├── unit/                   # Testes unitários
│   ├── integration/            # Testes de integração
│   └── e2e/                    # Testes end-to-end
└── 📄 configs/                 # Configurações globais
    ├── docker/                 # Configurações Docker
    ├── ci-cd/                  # Pipeline CI/CD
    └── monitoring/             # Monitoramento e logs
```

---

## 🚀 Quick Start

### **Pré-requisitos**
- Node.js 18.20.8+
- PostgreSQL 16+
- npm/yarn
- Git

### **Instalação Rápida**

```bash
# Clone o repositório
git clone <repo-url>
cd mediapp

# Instale dependências do backend
cd apps/backend
npm install

# Configure o banco de dados
cp .env.example .env
# Edite o .env com suas configurações

# Execute as migrations
npx prisma migrate dev

# Inicie o servidor
npm run dev
```

### **Acesso à Aplicação**
- **Backend API**: http://localhost:3002
- **Frontend Web**: http://localhost:3000
- **Documentação API**: http://localhost:3002/api-docs

---

## 🏗️ Tecnologias Utilizadas

### **Backend Stack**
| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **Node.js** | 18.20.8 | Runtime JavaScript |
| **Express.js** | 4.18.2 | Framework web |
| **PostgreSQL** | 16+ | Banco de dados |
| **Prisma** | 5.6.0 | ORM e migrations |
| **JWT** | 9.0.2 | Autenticação |
| **bcryptjs** | 2.4.3 | Criptografia |
| **Winston** | 3.11.0 | Sistema de logs |
| **Helmet** | 7.1.0 | Segurança HTTP |

### **Frontend Stack**
| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **HTML5** | - | Estrutura |
| **CSS3** | - | Estilização |
| **JavaScript** | ES6+ | Interatividade |
| **Font Awesome** | 6.0+ | Ícones |
| **Fetch API** | - | Requisições HTTP |

### **Mobile Stack**
| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **React Native** | 0.72.6 | Framework mobile |
| **TypeScript** | 5.2.2 | Tipagem estática |
| **Redux Toolkit** | 1.9.7 | Gerenciamento de estado |
| **React Navigation** | 6.0+ | Navegação |
| **React Native Paper** | 5.0+ | Componentes UI |

---

## 📊 Funcionalidades Principais

### **🏥 Gestão de Médicos**
- ✅ Cadastro completo de médicos
- ✅ Controle de CRM e especialidades
- ✅ Upload de documentos e fotos
- ✅ Busca e filtros avançados
- ✅ Controle de status (ativo/inativo)

### **👥 Gestão de Pacientes**
- ✅ Prontuário eletrônico completo
- ✅ Histórico médico detalhado
- ✅ Controle de consultas e exames
- ✅ Upload de documentos
- ✅ Integração com ViaCEP

### **📋 Gestão de Exames**
- ✅ Cadastro de diferentes tipos de exames
- ✅ Controle de resultados
- ✅ Upload de arquivos de resultado
- ✅ Histórico de exames por paciente
- ✅ Relatórios e estatísticas

### **🔐 Segurança e Autenticação**
- ✅ Login seguro com JWT
- ✅ Criptografia de senhas
- ✅ Rate limiting
- ✅ Validação de dados
- ✅ Controle de sessões

---

## 🛠️ Scripts Disponíveis

### **Desenvolvimento**
```bash
npm run dev          # Inicia servidor em modo desenvolvimento
npm run build        # Build para produção
npm run test         # Executa testes
npm run test:watch   # Testes em modo watch
npm run lint         # Executa linting
npm run format       # Formata código
```

### **Banco de Dados**
```bash
npm run db:migrate   # Executa migrations
npm run db:seed      # Popula banco com dados
npm run db:studio    # Abre Prisma Studio
npm run db:reset     # Reset completo do banco
```

### **Deploy**
```bash
npm run deploy:dev   # Deploy para desenvolvimento
npm run deploy:prod  # Deploy para produção
npm run docker:build # Build Docker image
npm run docker:run   # Executa container
```

---

## 📈 Status do Projeto

### **Implementação Atual**

| Módulo | Status | Completude |
|--------|--------|------------|
| **Backend API** | ✅ Completo | 100% |
| **Database Schema** | ✅ Completo | 100% |
| **Autenticação** | ✅ Completo | 100% |
| **CRUD Médicos** | ✅ Completo | 100% |
| **CRUD Pacientes** | ✅ Completo | 95% |
| **CRUD Exames** | ✅ Completo | 90% |
| **Frontend Web** | 🔄 Em desenvolvimento | 85% |
| **Mobile App** | 🔄 Em desenvolvimento | 70% |
| **Testes** | 🔄 Em desenvolvimento | 60% |
| **Documentação** | ✅ Completo | 95% |

### **Próximas Implementações**
- 🔧 Finalização do frontend web
- 📱 Conclusão do app mobile
- 🧪 Expansão da cobertura de testes
- 🚀 Pipeline CI/CD
- 📊 Dashboard de analytics
- 🔔 Sistema de notificações

---

## 🏥 Esquema do Banco de Dados

### **Principais Entidades**
```sql
-- Tabela de Médicos
CREATE TABLE medicos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  crm VARCHAR(20) UNIQUE NOT NULL,
  especialidade especialidade_enum NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  status status_enum DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Pacientes  
CREATE TABLE pacientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  data_nascimento DATE NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Exames
CREATE TABLE exames (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES pacientes(id),
  medico_id INTEGER REFERENCES medicos(id),
  tipo_exame tipo_exame_enum NOT NULL,
  descricao TEXT,
  resultado JSONB,
  data_exame TIMESTAMP,
  status status_exame_enum DEFAULT 'PENDENTE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Estatísticas Atuais**
- 📋 **27 tabelas** principais
- 🔢 **8 enums** definidos
- 🔗 **45+ relacionamentos** entre entidades
- 📊 **13 médicos** cadastrados
- 👥 **5 pacientes** cadastrados
- 🧪 **3 exames** registrados

---

## 🔧 Configuração de Desenvolvimento

### **1. Configuração do Ambiente**
```bash
# Copie o arquivo de exemplo
cp apps/backend/.env.example apps/backend/.env

# Configure as variáveis (exemplo)
DATABASE_URL="postgresql://user:password@localhost:5432/mediapp"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=3002
NODE_ENV=development
```

### **2. Setup do Banco de Dados**
```bash
# Entre na pasta do backend
cd apps/backend

# Execute as migrations
npx prisma migrate dev

# (Opcional) Popule com dados de exemplo
npx prisma db seed
```

### **3. Execução em Desenvolvimento**
```bash
# Backend (Terminal 1)
cd apps/backend
npm run dev

# Frontend (Terminal 2)  
cd apps/frontend
npx serve . -p 3000

# Mobile (Terminal 3)
cd apps/mobile
npm run android  # ou npm run ios
```

---

## 📚 Documentação Adicional

- 📖 [**Guia de Arquitetura**](docs/architecture/ARCHITECTURE.md)
- 🔌 [**Documentação da API**](docs/api/API_REFERENCE.md)
- 🚀 [**Guia de Deploy**](docs/deployment/DEPLOYMENT_GUIDE.md)
- 🧪 [**Guia de Testes**](docs/development/TESTING_GUIDE.md)
- 🔧 [**Setup de Desenvolvimento**](docs/development/DEVELOPMENT_SETUP.md)
- 📋 [**Changelog**](CHANGELOG.md)

---

## 🤝 Contribuição

### **Como Contribuir**
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### **Padrões de Código**
- Use ESLint e Prettier para formatação
- Siga os padrões de commit convencionais
- Escreva testes para novas funcionalidades
- Documente mudanças significativas

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👥 Equipe

- **Desenvolvimento Backend**: API REST e banco de dados
- **Desenvolvimento Frontend**: Interface web responsiva  
- **Desenvolvimento Mobile**: App React Native
- **DevOps**: Deploy e infraestrutura
- **QA**: Testes e qualidade

---

## 📞 Suporte

- 📧 **Email**: suporte@mediapp.com
- 📱 **WhatsApp**: (11) 99999-9999
- 🌐 **Website**: https://mediapp.com
- 📋 **Issues**: [GitHub Issues](https://github.com/user/mediapp/issues)

---

*Última atualização: 31 de Outubro de 2025*  
*Versão: 2.0.0 (Estrutura Centralizada)*