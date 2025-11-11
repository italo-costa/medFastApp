// Teste simples do sistema de agenda
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Importar rotas de agenda
const agendaMedicaRoutes = require('./src/routes/agenda-medica');

// Configurar rota
app.use('/api/agenda', agendaMedicaRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Iniciar servidor
const PORT = 3002;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 Dashboard: http://localhost:${PORT}/api/agenda/dashboard`);
      console.log(`📍 Pacientes: http://localhost:${PORT}/api/agenda/pacientes`);
      console.log(`📍 Médicos: http://localhost:${PORT}/api/agenda/medicos`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();