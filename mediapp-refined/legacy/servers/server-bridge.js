const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

// SERVIDOR DEFINITIVO - MÁXIMA COMPATIBILIDADE WSL-WINDOWS
const app = express();
const PORT = 3001;

// Sistema de log robusto
const log = (msg, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'ERROR' ? '❌' : type === 'WARN' ? '⚠️' : '✅';
  console.log(`[${timestamp}] ${prefix} ${msg}`);
};

// Detectar ambiente
const isWSL = !!process.env.WSL_DISTRO_NAME || 
              !!process.env.WSLENV || 
              process.platform === 'linux' && os.release().toLowerCase().includes('microsoft');

log(`Ambiente detectado: ${isWSL ? 'WSL' : 'Windows'}`, 'INFO');

// Configuração CORS máxima compatibilidade
app.use(cors({
  origin: function (origin, callback) {
    // Permitir qualquer origem em desenvolvimento
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware de logging para debug
app.use((req, res, next) => {
  log(`${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});

// Headers para manter conexão ativa
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=120, max=1000');
  res.setHeader('Server', 'MediApp-WSL-Bridge');
  next();
});

// Middleware básico robusto
app.use(express.json({ 
  limit: '50mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb' 
}));

// Servir arquivos estáticos com cache
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: isWSL ? 0 : '1d', // Sem cache no WSL para desenvolvimento
  etag: false,
  lastModified: false
}));

// Health check avançado
app.get('/health', (req, res) => {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
      if (iface.family === 'IPv4') {
        ips.push(`${name}: ${iface.address}`);
      }
    });
  });

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: isWSL ? 'WSL' : 'Windows',
    platform: process.platform,
    node_version: process.version,
    pid: process.pid,
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    network_interfaces: ips,
    request_headers: req.headers
  });
});

// Test endpoint específico para WSL
app.get('/wsl-bridge-test', (req, res) => {
  const clientInfo = {
    ip: req.ip,
    ips: req.ips,
    hostname: req.hostname,
    protocol: req.protocol,
    secure: req.secure,
    xhr: req.xhr,
    headers: req.headers
  };

  res.json({
    message: 'WSL Bridge funcionando!',
    timestamp: new Date().toISOString(),
    client: clientInfo,
    server: {
      environment: isWSL ? 'WSL' : 'Windows',
      pid: process.pid,
      uptime: Math.floor(process.uptime())
    }
  });
});

// APIs médicas básicas para teste
app.get('/api/test', (req, res) => {
  res.json({
    message: 'MediApp API funcionando',
    timestamp: new Date().toISOString(),
    environment: isWSL ? 'WSL' : 'Windows'
  });
});

app.get('/api/pacientes/test', (req, res) => {
  res.json({
    message: 'API Pacientes ativa',
    data: [
      { id: 1, nome: 'Paciente Teste', idade: 30 }
    ],
    timestamp: new Date().toISOString()
  });
});

// Rota catch-all
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'Endpoint não encontrado',
      path: req.path,
      method: req.method
    });
  }
  
  const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
    <title>MediApp - Teste de Conectividade</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .status { padding: 20px; border-radius: 5px; margin: 10px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .test-btn { padding: 10px 20px; margin: 5px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; }
        .test-btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>🏥 MediApp - Conectividade WSL-Windows</h1>
    
    <div class="status success">
        ✅ Servidor funcionando corretamente!<br>
        Ambiente: ${isWSL ? 'WSL' : 'Windows'}<br>
        Timestamp: ${new Date().toISOString()}
    </div>
    
    <div class="info">
        <h3>🔧 Testes de Conectividade:</h3>
        <button class="test-btn" onclick="testEndpoint('/health')">Health Check</button>
        <button class="test-btn" onclick="testEndpoint('/wsl-bridge-test')">WSL Bridge Test</button>
        <button class="test-btn" onclick="testEndpoint('/api/test')">API Test</button>
        <button class="test-btn" onclick="testEndpoint('/api/pacientes/test')">Pacientes Test</button>
    </div>
    
    <div id="test-results"></div>
    
    <script>
        async function testEndpoint(endpoint) {
            const resultDiv = document.getElementById('test-results');
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                resultDiv.innerHTML = '<div class="status success"><strong>' + endpoint + ':</strong><br><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
            } catch (error) {
                resultDiv.innerHTML = '<div class="status" style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24;"><strong>Erro em ' + endpoint + ':</strong><br>' + error.message + '</div>';
            }
        }
        
        // Auto-test na carga
        setTimeout(() => testEndpoint('/health'), 1000);
    </script>
</body>
</html>`;
  
  res.send(htmlResponse);
});

// Error handling robusto
app.use((err, req, res, next) => {
  log(`Erro na requisição ${req.method} ${req.path}: ${err.message}`, 'ERROR');
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Tratamento de sinais robusto
process.on('uncaughtException', (error) => {
  log(`Exceção não capturada: ${error.message}`, 'ERROR');
  log(`Stack: ${error.stack}`, 'ERROR');
  // NÃO encerrar processo
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Promise rejeitada: ${reason}`, 'ERROR');
  // NÃO encerrar processo
});

// Iniciar servidor com configuração otimizada
const server = app.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  log('🚀 ========================================');
  log(`🏥 MediApp WSL-Bridge Server INICIADO`);
  log(`📡 Bind: ${address.address}:${address.port}`);
  log(`🌍 Ambiente: ${isWSL ? 'WSL' : 'Windows'}`);
  log(`📊 PID: ${process.pid}`);
  log('🚀 ========================================');
  log(`🔗 Acesse: http://localhost:${PORT}`);
  log(`🔧 Health: http://localhost:${PORT}/health`);
  log(`🌉 Bridge: http://localhost:${PORT}/wsl-bridge-test`);
  log('🚀 ========================================');
});

// Configurações otimizadas para WSL
server.keepAliveTimeout = 120000; // 2 minutos
server.headersTimeout = 125000;   // 2 minutos + 5s
server.timeout = 300000;          // 5 minutos
server.maxConnections = 1000;

// Sistema de heartbeat
let heartbeatCount = 0;
const heartbeatInterval = setInterval(() => {
  heartbeatCount++;
  log(`💓 Heartbeat #${heartbeatCount} - Uptime: ${Math.floor(process.uptime())}s - Conexões ativas: ${server._connections || 0}`);
}, 60000); // A cada minuto

// Graceful shutdown
const gracefulShutdown = (signal) => {
  log(`🛑 Sinal ${signal} recebido - iniciando shutdown graceful...`);
  
  clearInterval(heartbeatInterval);
  
  server.close((err) => {
    if (err) {
      log(`Erro no shutdown: ${err.message}`, 'ERROR');
      process.exit(1);
    }
    
    log('✅ Servidor fechado com sucesso');
    process.exit(0);
  });
  
  // Forçar saída após 15 segundos
  setTimeout(() => {
    log('⚠️ Forçando encerramento após timeout');
    process.exit(1);
  }, 15000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Log inicial do ambiente
setTimeout(() => {
  log('🔍 Informações do ambiente:');
  log(`Node.js: ${process.version}`);
  log(`Platform: ${process.platform}`);
  log(`Architecture: ${process.arch}`);
  log(`WSL: ${isWSL ? 'Sim' : 'Não'}`);
  log(`PID: ${process.pid}`);
  log(`Memory: ${JSON.stringify(process.memoryUsage())}`);
}, 2000);

module.exports = app;