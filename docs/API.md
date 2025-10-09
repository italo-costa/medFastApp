# 📋 Documentação da API - MediApp Backend

## 🔗 Base URL
```
http://localhost:3001/api
```

## 🔐 Autenticação
Todas as rotas protegidas requerem o header `Authorization`:
```
Authorization: Bearer <jwt_token>
```

## 📚 Endpoints

### 🔑 Autenticação

#### POST /auth/login
Login de usuário médico
```json
// Request
{
  "email": "medico@exemplo.com",
  "password": "senha123"
}

// Response
{
  "success": true,
  "user": {
    "id": "user123",
    "name": "Dr. João Silva",
    "email": "medico@exemplo.com",
    "specialty": "Cardiologia",
    "crm": "12345-SP"
  },
  "token": "jwt_token_aqui"
}
```

#### POST /auth/logout
Logout do usuário
```json
// Response
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

#### GET /auth/me
Buscar dados do usuário logado
```json
// Response
{
  "success": true,
  "user": {
    "id": "user123",
    "name": "Dr. João Silva",
    "email": "medico@exemplo.com",
    "specialty": "Cardiologia",
    "crm": "12345-SP"
  }
}
```

### 👤 Pacientes

#### GET /patients
Listar todos os pacientes
```
Query params:
- search: string (opcional) - busca por nome ou CPF
- page: number (opcional) - página para paginação
- limit: number (opcional) - limite de itens por página
```

#### GET /patients/:id
Buscar paciente por ID

#### POST /patients
Criar novo paciente
```json
{
  "name": "Maria Silva",
  "cpf": "123.456.789-00",
  "birthDate": "1990-05-15",
  "gender": "F",
  "phone": "(11) 99999-9999",
  "email": "maria@exemplo.com",
  "address": "Rua das Flores, 123",
  "emergencyContact": "João Silva - (11) 88888-8888"
}
```

#### PUT /patients/:id
Atualizar dados do paciente

#### DELETE /patients/:id
Excluir paciente (soft delete)

### 📋 Prontuários

#### GET /records
Listar prontuários
```
Query params:
- patientId: string (opcional) - filtrar por paciente
- startDate: string (opcional) - data inicial
- endDate: string (opcional) - data final
```

#### GET /records/:id
Buscar prontuário por ID

#### POST /records
Criar novo prontuário
```json
{
  "patientId": "patient123",
  "chiefComplaint": "Dor no peito",
  "historyOfPresentIllness": "Paciente refere dor no peito há 2 dias...",
  "physicalExamination": "Ausculta cardíaca normal...",
  "diagnosis": "Angina estável",
  "treatment": "Repouso e medicação",
  "medications": "Aspirina 100mg 1x ao dia",
  "observations": "Paciente orientado sobre sinais de alerta"
}
```

#### PUT /records/:id
Atualizar prontuário

#### DELETE /records/:id
Excluir prontuário (soft delete)

### 🔬 Exames

#### GET /exams
Listar exames
```
Query params:
- patientId: string (opcional) - filtrar por paciente
- examType: string (opcional) - tipo de exame
```

#### GET /exams/:id
Buscar exame por ID

#### POST /exams/upload
Upload de arquivo de exame
```
Content-Type: multipart/form-data

Fields:
- file: arquivo (PDF, imagem, áudio)
- patientId: ID do paciente
- examType: tipo do exame
- examDate: data do exame
- description: descrição (opcional)
```

#### DELETE /exams/:id
Excluir arquivo de exame

### ⚠️ Alergias

#### GET /allergies
Listar alergias
```
Query params:
- patientId: string (opcional) - filtrar por paciente
```

#### POST /allergies
Registrar nova alergia
```json
{
  "patientId": "patient123",
  "allergen": "Penicilina",
  "reaction": "Erupção cutânea",
  "severity": "Moderada",
  "dateDiscovered": "2023-01-15"
}
```

#### PUT /allergies/:id
Atualizar alergia

#### DELETE /allergies/:id
Remover alergia

### 👥 Usuários

#### GET /users
Listar usuários (apenas admins)

#### POST /users
Criar novo usuário
```json
{
  "name": "Dr. Carlos Mendes",
  "email": "carlos@exemplo.com",
  "crm": "54321-RJ",
  "specialty": "Neurologia",
  "phone": "(21) 99999-9999",
  "password": "senha123"
}
```

## 📊 Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autorizado |
| 403 | Acesso negado |
| 404 | Não encontrado |
| 409 | Conflito (já existe) |
| 413 | Arquivo muito grande |
| 500 | Erro interno do servidor |

## 🔒 Políticas de Segurança

### Rate Limiting
- 100 requests por 15 minutos por IP
- Headers de resposta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### Upload de Arquivos
- Tamanho máximo: 10MB por arquivo
- Tipos permitidos: PDF, JPG, JPEG, PNG, MP3, WAV, DOC, DOCX
- Scan de vírus automático

### Auditoria
Todas as operações sensíveis são registradas:
- Criação/edição/exclusão de prontuários
- Acesso a dados de pacientes
- Upload/download de exames
- Alterações em alergias/medicações

## 🏥 Compliance Médico

### LGPD
- Consentimento do paciente registrado
- Logs de auditoria completos
- Direito ao esquecimento implementado
- Criptografia de dados sensíveis

### Backup e Recuperação
- Backup automático diário
- Retenção de 7 anos para dados médicos
- Recuperação point-in-time

## 🔧 Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
# Banco de dados
DATABASE_URL="postgresql://user:pass@localhost:5432/mediapp"

# JWT
JWT_SECRET="sua-chave-jwt-super-secreta"
JWT_EXPIRES_IN="24h"

# AWS S3
AWS_ACCESS_KEY_ID="sua-access-key"
AWS_SECRET_ACCESS_KEY="sua-secret-key"
AWS_S3_BUCKET="mediapp-files"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-app"
```