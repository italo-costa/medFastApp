# 🏥 MediApp Backend

Sistema de gestão médica completo desenvolvido com Node.js, Express e PostgreSQL.

## 🚀 Tecnologias

- **Node.js** v18+ 
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados
- **Prisma** - ORM
- **JWT** - Autenticação

## 📦 Instalação

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm start
```

## 🌐 Endpoints

- `GET /health` - Status da aplicação
- `GET /api/medicos` - Listar médicos
- `GET /api/patients` - Listar pacientes
- `POST /api/medicos` - Criar médico
- `POST /api/patients` - Criar paciente

## 🔧 Configuração

Copie `.env.example` para `.env` e configure as variáveis de ambiente.
