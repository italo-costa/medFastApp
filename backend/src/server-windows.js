const express = require('express');
const cors = require('cors');
const path = require('path');

// Servidor Node.js nativo no Windows
const app = express();
const PORT = 3003;

// Log simples
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

// CORS permissivo
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    platform: process.platform,
    node_version: process.version,
    pid: process.pid
  });
});

// API de teste médico
app.get('/api/pacientes', (req, res) => {
  res.json({
    message: 'Lista de pacientes',
    data: [
      { id: 1, nome: 'João Silva', idade: 45 },
      { id: 2, nome: 'Maria Santos', idade: 32 }
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/medicos', (req, res) => {
  res.json({
    message: 'Lista de médicos',
    data: [
      { id: 1, nome: 'Dr. Carlos', crm: '12345', especialidade: 'Cardiologia' },
      { id: 2, nome: 'Dra. Ana', crm: '67890', especialidade: 'Pediatria' }
    ],
    timestamp: new Date().toISOString()
  });
});

// Rota de fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  }
  
  // Servir app.html
  const appPath = path.join(__dirname, '../public/app.html');
  res.sendFile(appPath, (err) => {
    if (err) {
      res.status(404).send(`
        <h1>MediApp - Servidor Windows</h1>
        <p>Aplicativo médico funcionando no Windows</p>
        <ul>
          <li><a href="/health">Health Check</a></li>
          <li><a href="/api/pacientes">API Pacientes</a></li>
          <li><a href="/api/medicos">API Médicos</a></li>
        </ul>
      `);
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  log(`❌ ERRO: ${err.message}`);
  res.status(500).json({ error: 'Erro interno' });
});

// Iniciar servidor
const server = app.listen(PORT, '127.0.0.1', () => {
  log('🚀 ===================================');
  log(`🏥 MediApp WINDOWS - Porta ${PORT}`);
  log(`🔗 Health: http://localhost:${PORT}/health`);
  log(`🌐 Dashboard: http://localhost:${PORT}`);
  log(`📊 Pacientes: http://localhost:${PORT}/api/pacientes`);
  log(`👨‍⚕️ Médicos: http://localhost:${PORT}/api/medicos`);
  log('🚀 ===================================');
});

// Tratamento de encerramento
process.on('SIGINT', () => {
  log('🛑 Encerrando servidor Windows...');
  server.close(() => {
    log('✅ Servidor fechado');
    process.exit(0);
  });
});

module.exports = app;