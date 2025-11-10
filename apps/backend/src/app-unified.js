/**
 * MediApp - Servidor Principal Refatorado v3.0.0
 * Sistema inteligente com resolução automática de conflitos de porta
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Importar configurações e serviços
const config = require('./config');
const databaseService = require('./services/database');
const centralMiddleware = require('./middleware/centralMiddleware');

// Importar sistema de portas
const { resolvePortConflict, generatePortReport } = require('./config/ports');

// Importar rotas
const medicosRoutes = require('./routes/medicosRoutes');
const patientsRoutes = require('./routes/patients-db');
const recordsRoutes = require('./routes/records');
const examsRoutes = require('./routes/exams');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboardRoutes');
const validacaoRoutes = require('./routes/validacaoRoutes');
const historicoRoutes = require('./routes/historicoRoutes');
const analyticsRoutes = require('./routes/analytics');
const statisticsRoutes = require('./routes/statistics');

// Criar aplicação Express
const app = express();

// Sistema de logging aprimorado
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const emoji = type === 'ERROR' ? '❌' : type === 'WARN' ? '⚠️' : type === 'SUCCESS' ? '✅' : '🔍';
  console.log(`[${timestamp}] ${emoji} [MEDIAPP] ${message}`);
  
  // Salvar em arquivo de log se possível
  try {
    const logDir = '/tmp/mediapp-logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(`${logDir}/app.log`, `[${timestamp}] [${type}] ${message}\n`);
  } catch (error) {
    // Ignorar erros de log
  }
};

// Função para carregar configuração externa de portas
function loadPortConfig() {
  const configFile = process.env.MEDIAPP_CONFIG_FILE || '/tmp/mediapp-services.json';
  
  try {
    if (fs.existsSync(configFile)) {
      const externalConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      log(`Configuração externa carregada: ${configFile}`, 'SUCCESS');
      return externalConfig;
    }
  } catch (error) {
    log(`Erro ao carregar configuração externa: ${error.message}`, 'WARN');
  }
  
  return null;
}

// ========================================
// APLICAR MIDDLEWARES CENTRALIZADOS
// ========================================

// Middlewares básicos (ordem é importante!)
try {
  centralMiddleware.applyBasicMiddlewares(app);
  log('Middlewares básicos aplicados', 'SUCCESS');
} catch (error) {
  log(`Erro ao aplicar middlewares básicos: ${error.message}`, 'ERROR');
  // Aplicar middlewares mínimos como fallback
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
}

// Parse do body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, {
    maxAge: config.server.env === 'production' ? '1d' : '0',
    etag: true
  }));
  log(`Arquivos estáticos servidos de: ${publicDir}`, 'SUCCESS');
} else {
  log(`Diretório público não encontrado: ${publicDir}`, 'WARN');
}

// ========================================
// CONFIGURAR ROTAS
// ========================================

// Health check sempre disponível
app.get('/health', async (req, res) => {
  try {
    const externalConfig = loadPortConfig();
    const dbStats = await databaseService.getSystemStats().catch(() => null);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      service: 'MediApp v3.0.0',
      status: 'OK',
      port: process.env.PORT || config.server.port,
      environment: config.server.env,
      database: dbStats ? 'connected' : 'disconnected',
      stats: dbStats,
      config: externalConfig ? 'loaded' : 'default',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Status do sistema
app.get('/status', async (req, res) => {
  try {
    const portReport = await generatePortReport();
    const externalConfig = loadPortConfig();
    
    res.json({
      success: true,
      service: 'MediApp v3.0.0',
      timestamp: new Date().toISOString(),
      ports: portReport,
      config: externalConfig,
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Aplicar rotas principais (com tratamento de erro)
const routes = [
  { path: '/api/auth', router: authRoutes, name: 'Auth' },
  { path: '/api/medicos', router: medicosRoutes, name: 'Médicos' },
  { path: '/api/pacientes', router: patientsRoutes, name: 'Pacientes' },
  { path: '/api/records', router: recordsRoutes, name: 'Records' },
  { path: '/api/exames', router: examsRoutes, name: 'Exames' },
  { path: '/api/dashboard', router: dashboardRoutes, name: 'Dashboard' },
  { path: '/api/validacao', router: validacaoRoutes, name: 'Validação' },
  { path: '/api/historico', router: historicoRoutes, name: 'Histórico' },
  { path: '/api/analytics', router: analyticsRoutes, name: 'Analytics' },
  { path: '/api/statistics', router: statisticsRoutes, name: 'Statistics' }
];

routes.forEach(({ path, router, name }) => {
  try {
    if (router) {
      app.use(path, router);
      log(`Rota ${name} configurada: ${path}`, 'SUCCESS');
    }
  } catch (error) {
    log(`Erro ao configurar rota ${name}: ${error.message}`, 'ERROR');
  }
});

// ========================================
// MIDDLEWARES FINAIS
// ========================================

try {
  centralMiddleware.applyFinalMiddlewares(app);
  log('Middlewares finais aplicados', 'SUCCESS');
} catch (error) {
  log(`Erro ao aplicar middlewares finais: ${error.message}`, 'WARN');
  
  // Middleware de erro básico como fallback
  app.use((error, req, res, next) => {
    console.error('Erro na aplicação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  });
}

// ========================================
// INICIALIZAÇÃO DO SERVIDOR
// ========================================

// Função para resolver porta automaticamente
async function resolveServerPort() {
  try {
    log('Resolvendo conflitos de porta...', 'INFO');
    
    // Tentar usar configuração externa primeiro
    const externalConfig = loadPortConfig();
    if (externalConfig && externalConfig.ports && externalConfig.ports.main) {
      log(`Usando porta da configuração externa: ${externalConfig.ports.main}`, 'INFO');
      return externalConfig.ports.main;
    }
    
    // Usar sistema de resolução de conflitos
    const resolvedPort = await resolvePortConflict('main', false); // Não forçar kill inicialmente
    log(`Sistema de portas resolveu para: ${resolvedPort}`, 'SUCCESS');
    
    return resolvedPort;
  } catch (error) {
    log(`Erro na resolução de porta: ${error.message}`, 'WARN');
    // Fallback para porta padrão
    return process.env.PORT || config.server.port || 3002;
  }
}

// Iniciar servidor
async function startServer() {
  try {
    log('Iniciando MediApp v3.0.0...', 'INFO');
    
    // Conectar ao banco de dados
    try {
      await databaseService.connect();
      log('Conectado ao banco de dados', 'SUCCESS');
    } catch (dbError) {
      log(`Erro na conexão com banco: ${dbError.message}`, 'ERROR');
      // Continuar sem banco em modo degradado
    }
    
    // Resolver porta
    const serverPort = await resolveServerPort();
    
    // Iniciar servidor HTTP
    const server = app.listen(serverPort, config.server.host, () => {
      log(`🚀 Servidor iniciado na porta ${serverPort}`, 'SUCCESS');
      log(`🌐 Environment: ${config.server.env}`, 'SUCCESS');
      log(`🔗 Health Check: http://localhost:${serverPort}/health`, 'SUCCESS');
      log(`📊 API Médicos: http://localhost:${serverPort}/api/medicos`, 'SUCCESS');
      log(`🏥 Gestão Médicos: http://localhost:${serverPort}/gestao-medicos.html`, 'SUCCESS');
      log(`👥 Gestão Pacientes: http://localhost:${serverPort}/gestao-pacientes.html`, 'SUCCESS');
      log(`📈 Status do Sistema: http://localhost:${serverPort}/status`, 'SUCCESS');
      log('🎯 Sistema 100% operacional!', 'SUCCESS');
    });
    
    // Configurar timeout e eventos
    server.timeout = 120000; // 2 minutos
    server.keepAliveTimeout = 65000; // 65 segundos
    server.headersTimeout = 66000; // 66 segundos
    
    // Tratamento de erros do servidor
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        log(`Porta ${serverPort} em uso - tentando resolver...`, 'WARN');
        
        // Tentar resolver conflito forçadamente
        resolvePortConflict('main', true).then((newPort) => {
          log(`Tentando nova porta: ${newPort}`, 'INFO');
          // Tentar iniciar em nova porta
          setTimeout(() => {
            server.listen(newPort, config.server.host);
          }, 2000);
        }).catch((resolveError) => {
          log(`Falha na resolução de conflito: ${resolveError.message}`, 'ERROR');
          process.exit(1);
        });
      } else {
        log(`Erro no servidor: ${error.message}`, 'ERROR');
        process.exit(1);
      }
    });
    
    // Tornar server global para o gracefulShutdown
    global.server = server;
    
    return server;
    
  } catch (error) {
    log(`Erro ao iniciar servidor: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  log('Recebido SIGTERM, encerrando graciosamente...', 'INFO');
  if (global.server) {
    global.server.close(() => {
      log('Servidor encerrado graciosamente', 'SUCCESS');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  log('Recebido SIGINT, encerrando graciosamente...', 'INFO');
  if (global.server) {
    global.server.close(() => {
      log('Servidor encerrado graciosamente', 'SUCCESS');
      process.exit(0);
    });
  }
});

// Iniciar apenas se não estiver sendo importado
if (require.main === module) {
  startServer().catch(error => {
    console.error('❌ Falha crítica na inicialização:', error);
    process.exit(1);
  });
}

module.exports = app;