# 🏥 MedFastApp - Sistema de Gestão Médica

Sistema completo de gestão médica com funcionalidades para gerenciamento de pacientes, médicos e prontuários eletrônicos.

## 🚀 Funcionalidades

### ✅ Gestão de Médicos
- Cadastro completo de médicos com CRM e especialidades
- Lista de médicos com busca e filtros
- Informações detalhadas: formação, experiência, contato

### ✅ Gestão de Pacientes  
- Cadastro completo de pacientes
- Histórico médico detalhado
- Alergias e contra-indicações
- Informações de convênio e contatos

### ✅ Prontuários Eletrônicos
- Sistema de anamnese completo
- Relacionamento médico-paciente
- Histórico de consultas
- Diagnósticos com CID-10

### ✅ Dashboard e Estatísticas
- Visão geral do sistema
- Estatísticas de pacientes e atendimentos
- Interface intuitiva e responsiva

## 🛠️ Tecnologias

- **Backend**: Node.js com servidor HTTP limpo
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Dados**: Mock data realístico com relacionamentos
- **Ambiente**: WSL2, Ubuntu

## 📊 Dados de Exemplo Implementados

### Médicos (5)
- Dr. Carlos Eduardo Oliveira - Cardiologia
- Dra. Ana Beatriz Costa Santos - Pediatria  
- Dr. Roberto Mendes Silva - Ortopedia
- Dra. Fernanda Lima Rodrigues - Ginecologia
- Dr. Paulo César Almeida - Neurologia

### Pacientes (6)
- João Silva Santos (45 anos) - Hipertensão, Dislipidemia
- Maria Santos Costa (32 anos) - Acompanhamento preventivo
- Carlos Roberto Mendes (58 anos) - Diabetes tipo 2
- Ana Paula Rodrigues Lima (28 anos) - Problemas posturais
- Roberto Silva Oliveira (72 anos) - Cardiopatia
- Beatriz Santos Almeida (35 anos) - Gestante

### Prontuários (7)
- Consultas cardiológicas, pediátricas, ortopédicas
- Acompanhamento pré-natal e neurológico
- Anamnese completa com medicamentos e condutas

## 🏗️ Arquitetura Técnica

### Frontend
- **React Native**: Desenvolvimento híbrido para iOS/Android
- **TypeScript**: Tipagem estática para maior segurança
- **React Navigation**: Navegação nativa
- **Redux Toolkit**: Gerenciamento de estado
- **React Hook Form**: Formulários performáticos

### Backend
- **Node.js + Express**: API RESTful
- **PostgreSQL**: Banco de dados principal
- **Prisma ORM**: Mapeamento objeto-relacional
- **JWT**: Autenticação e autorização
- **Multer**: Upload de arquivos
- **AWS S3**: Armazenamento de mídia

### Segurança & Compliance
- ✅ **LGPD/HIPAA** Compliance
- 🔐 Criptografia AES-256
- 👆 Autenticação biométrica
- 📝 Logs de auditoria
- 🛡️ Backup automático

## 🚀 Funcionalidades Principais

### 👨‍⚕️ Gestão de Usuários
- Login/logout seguro
- Perfis por especialidade
- Controle de permissões
- Autenticação biométrica

### 👤 Gestão de Pacientes
- CRUD completo de pacientes
- Busca avançada (nome, CPF, etc.)
- Histórico médico completo
- Timeline de consultas

### 📋 Sistema de Prontuários
- Criação/edição de prontuários
- Templates por especialidade
- Assinatura digital
- Versionamento de alterações

### 🔬 Exames e Arquivos
- Upload de PDFs, imagens, áudio
- Visualizador integrado
- Organização por tipo/data
- Compartilhamento seguro

### ⚠️ Alergias e Contraindicações
- Cadastro de alergias conhecidas
- Base de medicamentos
- Alertas automáticos
- Interações medicamentosas

### 👥 Colaboração
- Múltiplos médicos por paciente
- Notificações de alterações
- Comentários e observações
- Logs de atividade

## 📱 Compatibilidade
- **Android**: 7.0+ (API 24+)
- **iOS**: 12.0+
- **Tablets**: Suporte completo
- **Offline**: Sincronização automática

## 🛠️ Setup do Projeto

### Pré-requisitos
- Node.js 18+
- React Native CLI
- Android Studio / Xcode
- PostgreSQL 14+

### Instalação
```bash
# Clone o projeto
git clone <repo-url>
cd aplicativo

# Instale dependências
npm install

# Configure o banco de dados
npm run db:migrate

# Inicie o servidor
npm run dev

# Execute no dispositivo
npm run android  # ou npm run ios
```

## 📊 Estrutura do Projeto
```
aplicativo/
├── mobile/                 # App React Native
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── screens/        # Telas do app
│   │   ├── services/       # APIs e serviços
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utilitários
├── backend/                # API Node.js
│   ├── src/
│   │   ├── controllers/    # Controladores
│   │   ├── models/         # Modelos de dados
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middlewares
│   │   └── utils/          # Utilitários
├── docs/                   # Documentação
└── assets/                 # Recursos estáticos
```

## 🔒 Segurança e Privacidade
- Dados criptografados em repouso e trânsito
- Autenticação multi-fator
- Backup automático seguro
- Logs de auditoria completos
- Conformidade com LGPD
- Políticas de retenção de dados

## 📈 Roadmap
- [ ] MVP: Funcionalidades básicas
- [ ] Beta: Testes com médicos
- [ ] v1.0: Lançamento nas stores
- [ ] v1.1: IA para diagnósticos
- [ ] v2.0: Telemedicina integrada

## 📄 License
Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---
🏥 **MediApp** - Tecnologia a serviço da saúde