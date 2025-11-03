/**
 * MediApp - Servidor Principal Unificado
 * Fase 4: Middleware Centralizado
 * Arquitetura limpa com serviços centralizados
 */

const express = require('express');
const path = require('path');

// Importar configurações e serviços
const config = require('./config');
const databaseService = require('./services/database');
const centralMiddleware = require('./middleware/centralMiddleware');

// Importar rotas
const medicosRoutes = require('./routes/medicosRoutes');
const patientsRoutes = require('./routes/patients-db');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboardRoutes');
const validacaoRoutes = require('./routes/validacaoRoutes');
const historicoRoutes = require('./routes/historicoRoutes');
const analyticsRoutes = require('./routes/analytics');
const statisticsRoutes = require('./routes/statistics');

// Criar aplicação Express
const app = express();

// Sistema de logging simples
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const emoji = type === 'ERROR' ? '❌' : type === 'WARN' ? '⚠️' : '✅';
  console.log(`[${timestamp}] ${emoji} [MEDIAPP] ${message}`);
};

// ========================================
// APLICAR MIDDLEWARES CENTRALIZADOS
// ========================================

// Middlewares básicos (ordem é importante!)
centralMiddleware.applyBasicMiddlewares(app);

// Parse do body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: config.server.env === 'production' ? '1d' : '0',
  etag: true
}));

// Servir uploads (fotos de médicos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: config.server.env === 'production' ? '7d' : '0',
  etag: true
}));

// Servir arquivos de dados gerados (mapas, relatórios, etc.)
const dataPath = path.join(__dirname, '..', '..', 'data');
app.use('/data', express.static(dataPath, {
  setHeaders: (res, filePath) => {
    // Headers específicos para arquivos de imagem
    if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    if (filePath.endsWith('.csv')) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment');
    }
    if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// Favicon fallback
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// ========================================
// ROTAS DA APLICAÇÃO
// ========================================

// Health check
app.get('/health', centralMiddleware.asyncHandler(async (req, res) => {
  const dbStats = await databaseService.getSystemStats();
  
  const healthData = {
    server: 'MediApp Unified Server',
    status: 'OK',
    version: '2.0.0',
    environment: config.server.env,
    uptime: Math.floor(process.uptime()),
    database: dbStats,
    timestamp: new Date().toISOString(),
    middleware: 'Centralizado'
  };
  
  return res.status(200).json({
    success: true,
    data: healthData,
    message: 'Sistema operacional'
  });
}));

// Rotas da API com rate limiting específico
app.use('/api/auth', centralMiddleware.rateLimits.auth, authRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/validacao', validacaoRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/statistics', statisticsRoutes);

// Rota para estatísticas do dashboard  
app.get('/api/statistics/dashboard', centralMiddleware.asyncHandler(async (req, res) => {
  const stats = await databaseService.getSystemStats();
  
  return res.status(200).json({
    success: true,
    data: stats,
    message: 'Estatísticas obtidas com sucesso'
  });
}));

// Integração ViaCEP
app.get('/api/viacep/:cep', centralMiddleware.asyncHandler(async (req, res) => {
  const { cep } = req.params;
  const fetch = (await import('node-fetch')).default;
  
  const response = await fetch(`${config.external.viaCepUrl}/${cep}/json/`);
  const data = await response.json();
  
  if (data.erro) {
    return res.status(404).json({
      success: false,
      message: 'CEP não encontrado'
    });
  }
  
  return res.status(200).json({
    success: true,
    data,
    message: 'CEP encontrado com sucesso'
  });
}));

// Rota catch-all para SPA
app.get('*', (req, res, next) => {
  // Se é uma rota de API, passe para o 404
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Servir index.html para SPA
  const indexPath = path.join(__dirname, '../public/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send(`
        <h1>MediApp - Servidor Unificado v2.0</h1>
        <p>Sistema médico operacional com middleware centralizado</p>
        <ul>
          <li><a href="/health">Health Check</a></li>
          <li><a href="/api/medicos">API Médicos</a></li>
          <li><a href="/gestao-medicos.html">Gestão de Médicos</a></li>
          <li><a href="/gestao-pacientes.html">Gestão de Pacientes</a></li>
        </ul>
      `);
    }
  });
});

// ========================================
// APLICAR MIDDLEWARES FINAIS
// ========================================

// Middlewares de tratamento de erros (devem ser os últimos)
centralMiddleware.applyFinalMiddlewares(app);

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

// Função de shutdown graceful
let isShuttingDown = false;
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    log('Shutdown já em andamento...', 'WARN');
    return;
  }
  
  isShuttingDown = true;
  log(`Recebido sinal ${signal}, iniciando shutdown graceful...`);
  
  try {
    // Fechar servidor HTTP
    if (global.server) {
      global.server.close(() => {
        log('Servidor HTTP fechado');
      });
    }
    
    // Fechar conexão com banco
    await databaseService.disconnect();
    
    log('Shutdown graceful concluído!');
    process.exit(0);
    
  } catch (error) {
    log(`Erro durante shutdown: ${error.message}`, 'ERROR');
    process.exit(1);
  }
};

// Handlers de sinais
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handlers de erros não capturados
process.on('uncaughtException', (error) => {
  log(`Erro não capturado: ${error.message}`, 'ERROR');
  console.error(error.stack);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Promise rejeitada: ${reason}`, 'ERROR');
  console.error('Promise:', promise);
  gracefulShutdown('unhandledRejection');
});

// Iniciar servidor
async function startServer() {
  try {
    // Conectar ao banco de dados
    await databaseService.connect();
    
    // Iniciar servidor HTTP
    const server = app.listen(config.server.port, config.server.host, () => {
      log(`🚀 Servidor iniciado na porta ${config.server.port}`);
      log(`🌐 Environment: ${config.server.env}`);
      log(`🔗 Health Check: http://localhost:${config.server.port}/health`);
      log(`📊 API Médicos: http://localhost:${config.server.port}/api/medicos`);
      log(`🏥 Gestão Médicos: http://localhost:${config.server.port}/gestao-medicos.html`);
      log(`👥 Gestão Pacientes: http://localhost:${config.server.port}/gestao-pacientes.html`);
      log('🎯 Sistema 100% operacional!');
    });
    
    // Configurar timeout
    server.timeout = 120000; // 2 minutos
    
    // Tornar server global para o gracefulShutdown
    global.server = server;
    
    return server;
    
  } catch (error) {
    log(`Erro ao iniciar servidor: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Iniciar apenas se não estiver sendo importado
if (require.main === module) {
  startServer();
}

module.exports = app;