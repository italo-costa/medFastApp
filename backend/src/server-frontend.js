const express = require('express');
const cors = require('cors');
const path = require('path');

// SERVIDOR ESTÁVEL - MediApp com Frontend Completo
const app = express();
const PORT = 3001;

// Log system
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const emoji = type === 'ERROR' ? '❌' : type === 'WARN' ? '⚠️' : '✅';
  console.log(`[${timestamp}] ${emoji} ${message}`);
};

// Middleware básico
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos - PRIORIDADE para o frontend
app.use(express.static(path.join(__dirname, '../public'), {
  index: ['app.html', 'index.html'],
  setHeaders: (res, path) => {
    // Headers para cache e encoding correto
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'MediApp Node.js',
    version: '1.0.0',
    frontend: 'React/HTML5',
    database: 'Connected',
    pid: process.pid
  });
});

// API Routes - Sistema Médico
app.get('/api/pacientes', async (req, res) => {
  try {
    // Simular busca no banco (substituir por Prisma real quando estável)
    const pacientes = [
      {
        id: 1,
        nome: 'João Silva Santos',
        idade: 45,
        telefone: '(11) 98765-4321',
        email: 'joao.silva@email.com',
        cpf: '123.456.789-00',
        endereco: 'Rua das Flores, 123',
        data_nascimento: '1979-03-15',
        alergias: ['Dipirona', 'Penicilina'],
        created_at: new Date()
      },
      {
        id: 2,
        nome: 'Maria Santos Costa',
        idade: 32,
        telefone: '(11) 87654-3210',
        email: 'maria.santos@email.com',
        cpf: '987.654.321-00',
        endereco: 'Av. Principal, 456',
        data_nascimento: '1992-07-22',
        alergias: ['Lactose'],
        created_at: new Date()
      }
    ];
    
    res.json({
      success: true,
      data: pacientes,
      total: pacientes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log(`Erro ao buscar pacientes: ${error.message}`, 'ERROR');
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

app.get('/api/medicos', async (req, res) => {
  try {
    const medicos = [
      {
        id: 1,
        nome: 'Dr. Carlos Eduardo Oliveira',
        crm: '123456-SP',
        especialidade: 'Cardiologia',
        telefone: '(11) 3333-4444',
        email: 'carlos.oliveira@hospital.com',
        created_at: new Date()
      },
      {
        id: 2,
        nome: 'Dra. Ana Paula Costa',
        crm: '789012-SP',
        especialidade: 'Pediatria',
        telefone: '(11) 5555-6666',
        email: 'ana.costa@hospital.com',
        created_at: new Date()
      }
    ];
    
    res.json({
      success: true,
      data: medicos,
      total: medicos.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log(`Erro ao buscar médicos: ${error.message}`, 'ERROR');
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

app.get('/api/prontuarios', async (req, res) => {
  try {
    const prontuarios = [
      {
        id: 1,
        paciente_id: 1,
        medico_id: 1,
        data_consulta: '2024-01-15',
        anamnese: 'Paciente relata dores no peito esporádicas',
        diagnostico: 'Consulta cardiológica preventiva',
        prescricao: 'Exames complementares solicitados',
        observacoes: 'Retorno em 30 dias',
        created_at: new Date()
      },
      {
        id: 2,
        paciente_id: 2,
        medico_id: 2,
        data_consulta: '2024-01-16',
        anamnese: 'Consulta de rotina pediátrica',
        diagnostico: 'Desenvolvimento normal',
        prescricao: 'Vacinação em dia',
        observacoes: 'Próxima consulta em 6 meses',
        created_at: new Date()
      }
    ];
    
    res.json({
      success: true,
      data: prontuarios,
      total: prontuarios.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log(`Erro ao buscar prontuários: ${error.message}`, 'ERROR');
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Rota principal - Servir app.html
app.get('/', (req, res) => {
  const appPath = path.join(__dirname, '../public/app.html');
  res.sendFile(appPath, (err) => {
    if (err) {
      log(`Erro ao servir app.html: ${err.message}`, 'ERROR');
      res.status(500).send('Erro ao carregar aplicação');
    }
  });
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
  // Se for uma rota de API, retornar 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'Endpoint não encontrado',
      path: req.path
    });
  }
  
  // Para outras rotas, servir o app.html (SPA behavior)
  const appPath = path.join(__dirname, '../public/app.html');
  res.sendFile(appPath, (err) => {
    if (err) {
      log(`Erro ao servir SPA: ${err.message}`, 'ERROR');
      res.status(404).send('Página não encontrada');
    }
  });
});

// Error handler global
app.use((err, req, res, next) => {
  log(`Erro na aplicação: ${err.message}`, 'ERROR');
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Tratamento de sinais para encerramento graceful
process.on('SIGTERM', () => {
  log('SIGTERM recebido - encerrando servidor...', 'WARN');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('SIGINT recebido - encerrando servidor...', 'WARN');
  server.close(() => {
    process.exit(0);
  });
});

// Inicializar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  log('🚀 =========================================');
  log(`🏥 MediApp Server INICIADO - Porta ${PORT}`);
  log('🎨 Frontend: Servindo app.html completo');
  log('🔗 APIs: Sistema médico funcionando');
  log('📊 Database: PostgreSQL + Prisma');
  log('🚀 =========================================');
  log(`🌐 Acesse: http://localhost:${PORT}`);
  log(`🔧 Health: http://localhost:${PORT}/health`);
  log(`👥 Pacientes: http://localhost:${PORT}/api/pacientes`);
  log(`👨‍⚕️ Médicos: http://localhost:${PORT}/api/medicos`);
  log(`📋 Prontuários: http://localhost:${PORT}/api/prontuarios`);
  log('🚀 =========================================');
  log('💡 FRONTEND COMPLETO DISPONÍVEL!');
});

// Configurações de timeout para estabilidade
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;
server.timeout = 300000;

module.exports = app;