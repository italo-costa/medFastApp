/**
 * MediApp - Servidor Principal Unificado
 * Substitui todos os outros servidores (persistent-server.js, robust-server.js, etc.)
 * Arquitetura limpa e organizada
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// Importar configurações e serviços
const config = require('./config');
const databaseService = require('./services/database');
const responseFormatter = require('./middleware/responseFormatter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandling');

// Importar rotas
const medicosRoutes = require('./routes/medicosRoutes');

// Criar aplicação Express
const app = express();

// Sistema de logging simples
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const emoji = type === 'ERROR' ? '❌' : type === 'WARN' ? '⚠️' : '✅';
  console.log(`[${timestamp}] ${emoji} [MEDIAPP] ${message}`);
};

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://viacep.com.br"]
    }
  }
}));

// CORS configurado
app.use(cors(config.cors));

// Compressão
app.use(compression());

// Parse do body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de resposta padronizada
app.use(responseFormatter);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: config.server.env === 'production' ? '1d' : '0',
  etag: true
}));

// Log de requests
app.use((req, res, next) => {
  log(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbStats = await databaseService.getSystemStats();
    
    res.success({
      server: 'MediApp Unified Server',
      status: 'OK',
      version: '1.0.0',
      environment: config.server.env,
      uptime: Math.floor(process.uptime()),
      database: dbStats,
      timestamp: new Date().toISOString()
    }, 'Sistema operacional');
    
  } catch (error) {
    res.error('Erro no health check', 500, error.message);
  }
});

// Rotas da API
app.use('/api/medicos', medicosRoutes);

// Rota para estatísticas do dashboard
app.get('/api/statistics/dashboard', async (req, res) => {
  try {
    const stats = await databaseService.getSystemStats();
    res.success(stats, 'Estatísticas obtidas com sucesso');
  } catch (error) {
    res.error('Erro ao obter estatísticas', 500, error.message);
  }
});

// Integração ViaCEP
app.get('/api/viacep/:cep', async (req, res) => {
  try {
    const { cep } = req.params;
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${config.external.viaCepUrl}/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      return res.notFound('CEP não encontrado');
    }
    
    res.success(data, 'CEP encontrado com sucesso');
    
  } catch (error) {
    log(`Erro na consulta ViaCEP: ${error.message}`, 'ERROR');
    res.error('Erro ao consultar CEP', 500, error.message);
  }
});

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
        <h1>MediApp - Servidor Unificado</h1>
        <p>Sistema médico operacional</p>
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

// Middleware de rota não encontrada
app.use(notFoundHandler);

// Middleware de tratamento de erros
app.use(errorHandler);

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