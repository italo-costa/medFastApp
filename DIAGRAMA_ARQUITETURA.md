# 🏗️ MediApp - Diagrama de Arquitetura

## 📐 Arquitetura Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🏥 MEDIAPP ECOSYSTEM                               │
│                          Sistema de Gestão Médica                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🌐 PRESENTATION LAYER                               │
├─────────────────────────────┬───────────────────────────────────────────────┤
│     📱 MOBILE APP           │           🖥️ WEB DASHBOARD                    │
│                             │                                               │
│   ┌─────────────────────┐   │   ┌─────────────────────────────────────────┐ │
│   │  React Native       │   │   │         Frontend Web                   │ │
│   │  + TypeScript       │   │   │                                         │ │
│   │                     │   │   │  ┌─────────────────────────────────────┐│ │
│   │  🔧 Stack:          │   │   │  │        HTML5 + CSS3                ││ │
│   │  • Redux Toolkit    │   │   │  │        JavaScript ES6+             ││ │
│   │  • RN Paper         │   │   │  │        Font Awesome                ││ │
│   │  • React Navigation │   │   │  │        Responsive Design           ││ │
│   │  • TypeScript       │   │   │  └─────────────────────────────────────┘│ │
│   │                     │   │   │                                         │ │
│   │  📊 Status:         │   │   │  🧩 Componentes Especiais:             │ │
│   │  🔄 Em desenvolvimento │   │   │  • PatientPhotoManager              │ │
│   │  📦 Estrutura base  │   │   │  • AddressManager (ViaCEP)            │ │
│   │     pronta          │   │   │  • InsuranceManager                   │ │
│   └─────────────────────┘   │   └─────────────────────────────────────────┘ │
│                             │                                               │
│   PORT: 8081 (Development) │           Served by Express                   │
│   EXPO: 19000              │           PORT: 3001/static                   │
└─────────────────────────────┴───────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         🔗 API GATEWAY LAYER                               │
│                       Node.js + Express.js                                 │
│                          PORT: 3001                                        │
│                                                                             │
│  🛡️ MIDDLEWARE STACK:                                                      │
│  ├── helmet() - Security headers                                           │
│  ├── cors() - Cross-origin resource sharing                                │
│  ├── express.json() - JSON parser                                          │
│  ├── morgan() - Request logging                                            │
│  ├── rateLimit() - Rate limiting                                           │
│  └── authenticateToken() - JWT verification                                │
│                                                                             │
│  🗂️ API ENDPOINTS:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📋 MEDICAL MANAGEMENT APIS                                        │   │
│  │                                                                     │   │
│  │  🔐 /api/auth/*        → Authentication & Authorization            │   │
│  │     ├── POST /login    → JWT token generation                      │   │
│  │     ├── POST /register → New doctor registration                   │   │
│  │     └── GET /me        → User profile verification                 │   │
│  │                                                                     │   │
│  │  👨‍⚕️ /api/users/*       → Doctor/User Management                    │   │
│  │     ├── GET /doctors   → List all doctors                          │   │
│  │     ├── GET /:id       → Doctor details                            │   │
│  │     └── PUT /:id       → Update doctor profile                     │   │
│  │                                                                     │   │
│  │  👤 /api/patients/*    → Advanced Patient Management (NEW!)        │   │
│  │     ├── GET /          → List patients with pagination             │   │
│  │     ├── POST /         → Create new patient                        │   │
│  │     ├── GET /:id       → Patient details with relationships        │   │
│  │     ├── PUT /:id       → Update patient data                       │   │
│  │     ├── DELETE /:id    → Remove patient                            │   │
│  │     └── GET /stats     → Patient statistics                        │   │
│  │                                                                     │   │
│  │  📋 /api/records/*     → Medical Records & Anamnesis               │   │
│  │     ├── GET /          → List medical records                      │   │
│  │     ├── POST /         → Create new anamnesis                      │   │
│  │     └── GET /:id       → Record details                            │   │
│  │                                                                     │   │
│  │  🔬 /api/exams/*       → Exams & File Management                   │   │
│  │     ├── GET /          → List exams                                │   │
│  │     ├── POST /upload   → Upload medical files                      │   │
│  │     └── GET /:id       → Exam details                              │   │
│  │                                                                     │   │
│  │  ⚠️ /api/allergies/*   → Allergy Management                        │   │
│  │     ├── GET /          → List allergies                            │   │
│  │     ├── POST /         → Add new allergy                           │   │
│  │     └── DELETE /:id    → Remove allergy                            │   │
│  │                                                                     │   │
│  │  📊 /api/analytics/*   → Dashboard & Statistics                    │   │
│  │     ├── GET /overview  → General statistics                        │   │
│  │     └── GET /reports   → Custom reports                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       🏢 BUSINESS LOGIC LAYER                              │
│                         Prisma ORM + Validators                            │
│                                                                             │
│  🧠 CORE SERVICES:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📊 DATA VALIDATION & PROCESSING                                   │   │
│  │                                                                     │   │
│  │  🔍 validators.js:                                                  │   │
│  │     ├── validateCPF() - Brazilian CPF validation                   │   │
│  │     ├── formatPhone() - Phone number formatting                    │   │
│  │     ├── formatCEP() - ZIP code formatting                          │   │
│  │     └── sanitizeString() - Data sanitization                       │   │
│  │                                                                     │   │
│  │  🛡️ Security Services:                                              │   │
│  │     ├── bcryptjs - Password hashing                                │   │
│  │     ├── jsonwebtoken - JWT handling                                │   │
│  │     └── helmet - Security headers                                  │   │
│  │                                                                     │   │
│  │  📝 Logger Service:                                                 │   │
│  │     ├── winston - Structured logging                               │   │
│  │     ├── morgan - HTTP request logging                              │   │
│  │     └── Error tracking & monitoring                                │   │
│  │                                                                     │   │
│  │  🔗 External Integrations:                                         │   │
│  │     ├── ViaCEP API - Brazilian address lookup                      │   │
│  │     ├── Brazilian Insurance Systems                                │   │
│  │     └── Medical record standards                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🗄️ DATA ACCESS LAYER                                │
│                          Prisma ORM Client                                 │
│                                                                             │
│  📊 DATABASE SCHEMA (PostgreSQL):                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      🏥 MEDICAL DATA MODEL                          │   │
│  │                                                                     │   │
│  │  👤 users                    👨‍⚕️ Core Users & Doctors               │   │
│  │     ├── id (Primary Key)                                           │   │
│  │     ├── name, username, email                                      │   │
│  │     ├── password_hash                                              │   │
│  │     ├── role (DOCTOR, ADMIN)                                       │   │
│  │     ├── crm, specialty                                             │   │
│  │     └── created_at, updated_at                                     │   │
│  │                                                                     │   │
│  │  🧑 patients                 📋 Complete Patient Records            │   │
│  │     ├── id (Primary Key)                                           │   │
│  │     ├── name, cpf, rg                                              │   │
│  │     ├── birth_date, phone, email                                   │   │
│  │     ├── blood_type, observations                                   │   │
│  │     ├── emergency_contact                                          │   │
│  │     ├── address (JSON) - Street, number, city, state, zip         │   │
│  │     ├── insurance (JSON) - Provider, number, type                 │   │
│  │     └── created_at, updated_at                                     │   │
│  │                                                                     │   │
│  │  📝 medical_records         📋 Clinical Documentation               │   │
│  │     ├── id (Primary Key)                                           │   │
│  │     ├── patient_id (FK → patients)                                 │   │
│  │     ├── doctor_id (FK → users)                                     │   │
│  │     ├── record_date                                                │   │
│  │     ├── chief_complaint                                            │   │
│  │     ├── diagnosis, treatment                                       │   │
│  │     └── created_at, updated_at                                     │   │
│  │                                                                     │   │
│  │  🩺 anamnesis               📋 Detailed Medical History             │   │
│  │     ├── id (Primary Key)                                           │   │
│  │     ├── patient_id (FK → patients)                                 │   │
│  │     ├── doctor_id (FK → users)                                     │   │
│  │     ├── profession, marital_status                                 │   │
│  │     ├── lifestyle, chief_complaint                                 │   │
│  │     ├── history_present_illness                                    │   │
│  │     ├── previous_illnesses, surgeries                              │   │
│  │     ├── family_history, allergies                                  │   │
│  │     ├── current_medications                                        │   │
│  │     ├── smoking, alcohol, drugs                                    │   │
│  │     ├── physical_activity                                          │   │
│  │     ├── systems_review (JSON)                                      │   │
│  │     └── created_at, updated_at                                     │   │
│  │                                                                     │   │
│  │  🔬 exams                   📁 Medical Files & Results              │   │
│  │     ├── id (Primary Key)                                           │   │
│  │     ├── patient_id (FK → patients)                                 │   │
│  │     ├── doctor_id (FK → users)                                     │   │
│  │     ├── exam_type, exam_date                                       │   │
│  │     ├── file_path, file_name                                       │   │
│  │     ├── results, observations                                      │   │
│  │     └── created_at, updated_at                                     │   │
│  │                                                                     │   │
│  │  ⚠️ allergies               🚨 Allergy Management                   │   │
│  │     ├── id (Primary Key)                                           │   │
│  │     ├── patient_id (FK → patients)                                 │   │
│  │     ├── allergen, severity                                         │   │
│  │     ├── reaction_type                                              │   │
│  │     ├── notes                                                      │   │
│  │     └── created_at, updated_at                                     │   │
│  │                                                                     │   │
│  │  📸 patient_photos         🖼️ Patient Image Management             │   │
│  │     ├── id (Primary Key)                                           │   │
│  │     ├── patient_id (FK → patients)                                 │   │
│  │     ├── file_path, file_name                                       │   │
│  │     ├── file_size, mime_type                                       │   │
│  │     ├── is_primary                                                 │   │
│  │     └── created_at, updated_at                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  🔗 RELATIONSHIPS:                                                         │
│     ├── One Doctor → Many Medical Records                                  │
│     ├── One Patient → Many Medical Records                                 │
│     ├── One Patient → Many Anamnesis Records                               │
│     ├── One Patient → Many Exams                                          │
│     ├── One Patient → Many Allergies                                      │
│     └── One Patient → Many Photos                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       💾 INFRASTRUCTURE LAYER                              │
│                       PostgreSQL Database                                  │
│                          PORT: 5432                                        │
│                                                                             │
│  🗄️ DATABASE CONFIGURATION:                                               │
│     ├── PostgreSQL 16.x                                                   │
│     ├── Connection Pool: 10 connections                                   │
│     ├── SSL: Required in production                                       │
│     ├── Backup: Automated daily backups                                   │
│     └── Monitoring: Query performance tracking                            │
│                                                                             │
│  📁 FILE STORAGE:                                                          │
│     ├── Patient Photos: /uploads/photos/                                  │
│     ├── Medical Files: /uploads/exams/                                    │
│     ├── Documents: /uploads/documents/                                    │
│     └── Backup Files: /backups/                                           │
│                                                                             │
│  🔧 ENVIRONMENT VARIABLES:                                                 │
│     ├── DATABASE_URL="postgresql://user:password@localhost:5432/mediapp"  │
│     ├── JWT_SECRET="secure-secret-key"                                    │
│     ├── NODE_ENV="development"                                            │
│     ├── PORT=3001                                                         │
│     └── UPLOAD_PATH="/uploads"                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Dados Principal

### **1. Autenticação de Usuário**
```
Usuario → Web/Mobile → API /auth/login → JWT Token → Acesso às rotas protegidas
```

### **2. Gestão de Pacientes (Nova Funcionalidade)**
```
Médico → Interface Web → Formulário Completo → API /patients → Database → 
       ↑                        ↓
   Validação ←              Upload Foto
   ViaCEP ←                Endereço  
   Convênio ←              Dados Médicos
```

### **3. Consulta e Prontuários**
```
Médico → Seleciona Paciente → Cria Anamnese → API /records → 
       → Anexa Exames → Upload Files → Database
```

## 🌟 Diferenciais da Arquitetura

### **🚀 Escalabilidade**
- API RESTful stateless
- Database com índices otimizados
- Sistema de cache (planejado)
- Load balancing ready

### **🛡️ Segurança**
- JWT tokens com refresh
- Validação de dados em múltiplas camadas
- Headers de segurança (Helmet)
- Rate limiting por endpoint

### **📱 Multi-platform**
- Backend agnóstico de frontend
- APIs RESTful padronizadas
- Suporte nativo para mobile e web

### **🧩 Modularidade**
- Componentes frontend reutilizáveis
- Middlewares especializados
- Database schema bem estruturado
- Separação clara de responsabilidades

---

*Este diagrama representa a arquitetura atual do MediApp v2.0*  
*Última atualização: Janeiro 2025*