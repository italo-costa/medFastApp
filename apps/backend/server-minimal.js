// Servidor mínimo para teste
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

// Middleware básico
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/health', async (req, res) => {
  try {
    // Teste simples de conexão
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Rota básica para teste
app.get('/', (req, res) => {
  res.json({
    message: '🏥 MediApp v3.0.0 - Sistema de Gestão Médica',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API básica de médicos para teste
app.get('/api/medicos', async (req, res) => {
  try {
    const medicos = await prisma.medico.findMany({
      include: {
        usuario: true
      },
      take: 10
    });

    res.json({
      success: true,
      data: medicos,
      count: medicos.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API básica de pacientes para teste
app.get('/api/pacientes', async (req, res) => {
  try {
    const pacientes = await prisma.paciente.findMany({
      take: 10
    });

    res.json({
      success: true,
      data: pacientes,
      count: pacientes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Estatísticas básicas
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      prisma.medico.count(),
      prisma.paciente.count(),
      prisma.consulta.count(),
      prisma.exame.count()
    ]);

    res.json({
      success: true,
      data: {
        medicos: stats[0],
        pacientes: stats[1],
        consultas: stats[2],
        exames: stats[3]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Iniciar servidor
async function startServer() {
  try {
    console.log('🏥 Iniciando MediApp v3.0.0...');
    
    // Testar conexão com banco
    await prisma.$connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 API Médicos: http://localhost:${PORT}/api/medicos`);
      console.log(`📍 API Pacientes: http://localhost:${PORT}/api/pacientes`);
      console.log(`📍 Estatísticas: http://localhost:${PORT}/api/stats`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Desligando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Desligando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();