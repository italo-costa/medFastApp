#!/usr/bin/env node
/**
 * MediApp - Servidor Linux Estável e Unificado
 * Configurado especificamente para ambiente virtualizado Linux
 * Inclui todas as funcionalidades principais da aplicação
 */

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

// ========================================
// CONFIGURAÇÃO BASE
// ========================================

const config = {
  port: process.env.PORT || 3002,
  host: '0.0.0.0', // Importante para WSL/Docker
  env: process.env.NODE_ENV || 'development',
  maxFileSize: '10mb',
  uploadDir: path.join(__dirname, '../uploads'),
  publicDir: path.join(__dirname, '../public'),
  dataDir: path.join(__dirname, '../../data')
};

// Sistema de logging simples
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const emoji = type === 'ERROR' ? '❌' : type === 'WARN' ? '⚠️' : type === 'SUCCESS' ? '✅' : '📝';
  console.log(`[${timestamp}] ${emoji} [MEDIAPP-LINUX] ${message}`);
};

// ========================================
// DADOS MOCK COMPLETOS
// ========================================

const mockData = {
  medicos: [
    {
      id: 1,
      nome: 'Dr. João Silva',
      crm: 'CRM123456',
      especialidade: 'Cardiologia',
      telefone: '(11) 99999-1111',
      email: 'joao.silva@mediapp.com',
      endereco: 'Rua das Flores, 123 - São Paulo/SP',
      status: 'ativo',
      created_at: '2024-01-15T10:30:00.000Z'
    },
    {
      id: 2,
      nome: 'Dra. Maria Costa',
      crm: 'CRM789012',
      especialidade: 'Pediatria',
      telefone: '(21) 88888-2222',
      email: 'maria.costa@mediapp.com',
      endereco: 'Av. Principal, 456 - Rio de Janeiro/RJ',
      status: 'ativo',
      created_at: '2024-01-20T14:15:00.000Z'
    },
    {
      id: 3,
      nome: 'Dr. Carlos Lima',
      crm: 'CRM345678',
      especialidade: 'Ortopedia',
      telefone: '(31) 77777-3333',
      email: 'carlos.lima@mediapp.com',
      endereco: 'Rua Central, 789 - Belo Horizonte/MG',
      status: 'ativo',
      created_at: '2024-02-01T09:45:00.000Z'
    },
    {
      id: 4,
      nome: 'Dra. Ana Santos',
      crm: 'CRM567890',
      especialidade: 'Dermatologia',
      telefone: '(85) 66666-4444',
      email: 'ana.santos@mediapp.com',
      endereco: 'Av. Beira Mar, 321 - Fortaleza/CE',
      status: 'ativo',
      created_at: '2024-02-10T16:20:00.000Z'
    },
    {
      id: 5,
      nome: 'Dr. Pedro Oliveira',
      crm: 'CRM901234',
      especialidade: 'Neurologia',
      telefone: '(47) 55555-5555',
      email: 'pedro.oliveira@mediapp.com',
      endereco: 'Rua do Porto, 654 - Joinville/SC',
      status: 'ativo',
      created_at: '2024-02-15T11:10:00.000Z'
    }
  ],
  
  pacientes: [
    {
      id: 1,
      nome: 'Roberto Oliveira',
      cpf: '111.222.333-44',
      telefone: '(11) 99999-1111',
      email: 'roberto@email.com',
      endereco: 'Rua A, 123 - São Paulo/SP',
      data_nascimento: '1985-03-15',
      status: 'ativo',
      created_at: '2024-01-10T08:30:00.000Z'
    },
    {
      id: 2,
      nome: 'Sandra Silva',
      cpf: '555.666.777-88',
      telefone: '(21) 88888-2222',
      email: 'sandra@email.com',
      endereco: 'Av. B, 456 - Rio de Janeiro/RJ',
      data_nascimento: '1990-07-22',
      status: 'ativo',
      created_at: '2024-01-12T10:15:00.000Z'
    },
    {
      id: 3,
      nome: 'Carlos Mendes',
      cpf: '999.888.777-66',
      telefone: '(31) 77777-3333',
      email: 'carlos@email.com',
      endereco: 'Rua C, 789 - Belo Horizonte/MG',
      data_nascimento: '1978-11-08',
      status: 'ativo',
      created_at: '2024-01-14T14:45:00.000Z'
    }
  ],
  
  stats: {
    medicosAtivos: { value: 25, trend: '+3 este mês', percentage: 12 },
    pacientesCadastrados: { value: 147, trend: '+12 este mês', percentage: 8.9 },
    consultasHoje: { value: 8, trend: 'Normal', percentage: 0 },
    prontuariosAtivos: { value: 1089, trend: '+156 este mês', percentage: 16.7 },
    consultasMes: { value: 234, trend: '+45 este mês', percentage: 23.8 },
    receitasEmitidas: { value: 89, trend: '+15 hoje', percentage: 20.3 }
  },
  
  especialidades: [
    'Cardiologia',
    'Pediatria', 
    'Ortopedia',
    'Dermatologia',
    'Neurologia',
    'Ginecologia',
    'Urologia',
    'Oftalmologia',
    'Psiquiatria',
    'Clínica Geral'
  ]
};

// ========================================
// CRIAR APLICAÇÃO EXPRESS
// ========================================

const app = express();

// Middleware básicos
app.use(express.json({ limit: config.maxFileSize }));
app.use(express.urlencoded({ extended: true, limit: config.maxFileSize }));

// CORS para ambiente Linux
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Logging de requests
app.use((req, res, next) => {
  log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Criar diretórios necessários
[config.uploadDir, config.dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Diretório criado: ${dir}`);
  }
});

// Servir arquivos estáticos
app.use(express.static(config.publicDir, { 
  maxAge: '1h',
  etag: true 
}));

app.use('/uploads', express.static(config.uploadDir, {
  maxAge: '1d',
  etag: true
}));

app.use('/data', express.static(config.dataDir, {
  maxAge: '1h',
  etag: true
}));

// ========================================
// FUNÇÕES AUXILIARES PARA ESTATÍSTICAS
// ========================================

function calcularEstatisticasReais() {
  const totalMedicos = mockData.medicos.length;
  const medicosAtivos = mockData.medicos.filter(m => m.status === 'ativo').length;
  const totalPacientes = mockData.pacientes.length;
  const pacientesAtivos = mockData.pacientes.filter(p => p.status === 'ativo').length;
  
  // Calcular médicos novos este mês
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  
  const medicosNovosMes = mockData.medicos.filter(m => {
    const dataCreated = new Date(m.created_at);
    return dataCreated >= inicioMes;
  }).length;
  
  // Calcular especialidades únicas
  const especialidadesUnicas = [...new Set(mockData.medicos.map(m => m.especialidade))].length;
  
  return {
    medicosAtivos: { 
      value: medicosAtivos, 
      trend: medicosNovosMes > 0 ? `+${medicosNovosMes} este mês` : 'Sem novos', 
      percentage: medicosNovosMes > 0 ? Math.round((medicosNovosMes / totalMedicos) * 100) : 0 
    },
    pacientesCadastrados: { 
      value: totalPacientes, 
      trend: '+0 este mês', 
      percentage: 0 
    },
    consultasHoje: { 
      value: 0, 
      trend: 'Normal', 
      percentage: 0 
    },
    prontuariosAtivos: { 
      value: pacientesAtivos, 
      trend: 'Estável', 
      percentage: 0 
    },
    consultasMes: { 
      value: 0, 
      trend: 'Em breve', 
      percentage: 0 
    },
    receitasEmitidas: { 
      value: 0, 
      trend: 'Em breve', 
      percentage: 0 
    },
    totalMedicos: totalMedicos,
    especialidades: especialidadesUnicas
  };
}

// ========================================
// ROTAS DE SISTEMA
// ========================================

// Health Check
app.get('/health', (req, res) => {
  const healthData = {
    server: 'MediApp Linux Stable Server',
    version: '3.0.0-linux',
    status: 'healthy',
    environment: config.env,
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    timestamp: new Date().toISOString(),
    pid: process.pid
  };
  
  res.json({
    success: true,
    data: healthData,
    message: 'Sistema Linux operacional'
  });
});

// Status do servidor
app.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      medicos: mockData.medicos.length,
      pacientes: mockData.pacientes.length,
      especialidades: mockData.especialidades.length,
      uptime: process.uptime(),
      requests: res.locals.requestCount || 0
    },
    message: 'Status do sistema'
  });
});

// ========================================
// API DE MÉDICOS
// ========================================

// Listar médicos
app.get('/api/medicos', (req, res) => {
  const { search, especialidade, status, page = 1, limit = 10 } = req.query;
  let medicos = [...mockData.medicos];
  
  // Filtros
  if (search) {
    const searchLower = search.toLowerCase();
    medicos = medicos.filter(m => 
      m.nome.toLowerCase().includes(searchLower) ||
      m.crm.toLowerCase().includes(searchLower) ||
      m.especialidade.toLowerCase().includes(searchLower)
    );
  }
  
  if (especialidade) {
    medicos = medicos.filter(m => m.especialidade === especialidade);
  }
  
  if (status) {
    medicos = medicos.filter(m => m.status === status);
  }
  
  // Paginação
  const offset = (page - 1) * limit;
  const paginatedMedicos = medicos.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    data: paginatedMedicos,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: medicos.length,
      pages: Math.ceil(medicos.length / limit)
    },
    message: 'Médicos obtidos com sucesso'
  });
});

// Buscar médicos
app.get('/api/medicos/buscar', (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.json({
      success: true,
      data: mockData.medicos,
      message: 'Todos os médicos'
    });
  }
  
  const searchLower = q.toLowerCase();
  const filtered = mockData.medicos.filter(m => 
    m.nome.toLowerCase().includes(searchLower) ||
    m.crm.toLowerCase().includes(searchLower) ||
    m.especialidade.toLowerCase().includes(searchLower)
  );
  
  res.json({
    success: true,
    data: filtered,
    message: `${filtered.length} médicos encontrados`
  });
});

// Obter médico por ID
app.get('/api/medicos/:id', (req, res) => {
  const { id } = req.params;
  const medico = mockData.medicos.find(m => m.id === parseInt(id));
  
  if (!medico) {
    return res.status(404).json({
      success: false,
      message: 'Médico não encontrado'
    });
  }
  
  res.json({
    success: true,
    data: medico,
    message: 'Médico encontrado'
  });
});

// Criar médico
app.post('/api/medicos', (req, res) => {
  const { nome, crm, especialidade, telefone, email, endereco } = req.body;
  
  // Validação básica
  if (!nome || !crm || !especialidade) {
    return res.status(400).json({
      success: false,
      message: 'Nome, CRM e especialidade são obrigatórios'
    });
  }
  
  // Verificar se CRM já existe
  const existingMedico = mockData.medicos.find(m => m.crm === crm);
  if (existingMedico) {
    return res.status(409).json({
      success: false,
      message: 'CRM já cadastrado'
    });
  }
  
  const novoMedico = {
    id: Math.max(...mockData.medicos.map(m => m.id)) + 1,
    nome,
    crm,
    especialidade,
    telefone: telefone || '',
    email: email || '',
    endereco: endereco || '',
    status: 'ativo',
    created_at: new Date().toISOString()
  };
  
  mockData.medicos.push(novoMedico);
  
  res.status(201).json({
    success: true,
    data: novoMedico,
    message: 'Médico cadastrado com sucesso'
  });
});

// Atualizar médico
app.put('/api/medicos/:id', (req, res) => {
  const { id } = req.params;
  const { nome, crm, especialidade, telefone, email, endereco, status } = req.body;
  
  const medicoIndex = mockData.medicos.findIndex(m => m.id === parseInt(id));
  
  if (medicoIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Médico não encontrado'
    });
  }
  
  // Verificar se CRM já existe em outro médico
  if (crm) {
    const existingMedico = mockData.medicos.find(m => m.crm === crm && m.id !== parseInt(id));
    if (existingMedico) {
      return res.status(409).json({
        success: false,
        message: 'CRM já cadastrado para outro médico'
      });
    }
  }
  
  // Atualizar dados
  mockData.medicos[medicoIndex] = {
    ...mockData.medicos[medicoIndex],
    ...(nome && { nome }),
    ...(crm && { crm }),
    ...(especialidade && { especialidade }),
    ...(telefone !== undefined && { telefone }),
    ...(email !== undefined && { email }),
    ...(endereco !== undefined && { endereco }),
    ...(status && { status }),
    updated_at: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: mockData.medicos[medicoIndex],
    message: 'Médico atualizado com sucesso'
  });
});

// Deletar médico
app.delete('/api/medicos/:id', (req, res) => {
  const { id } = req.params;
  const medicoIndex = mockData.medicos.findIndex(m => m.id === parseInt(id));
  
  if (medicoIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Médico não encontrado'
    });
  }
  
  const deletedMedico = mockData.medicos.splice(medicoIndex, 1)[0];
  
  res.json({
    success: true,
    data: deletedMedico,
    message: 'Médico removido com sucesso'
  });
});

// ========================================
// API DE PACIENTES
// ========================================

// Listar pacientes
app.get('/api/pacientes', (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  let pacientes = [...mockData.pacientes];
  
  // Filtro de busca
  if (search) {
    const searchLower = search.toLowerCase();
    pacientes = pacientes.filter(p => 
      p.nome.toLowerCase().includes(searchLower) ||
      p.cpf.includes(search) ||
      p.email.toLowerCase().includes(searchLower)
    );
  }
  
  // Paginação
  const offset = (page - 1) * limit;
  const paginatedPacientes = pacientes.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    data: paginatedPacientes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: pacientes.length,
      pages: Math.ceil(pacientes.length / limit)
    },
    message: 'Pacientes obtidos com sucesso'
  });
});

// Buscar pacientes
app.get('/api/pacientes/buscar', (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.json({
      success: true,
      data: mockData.pacientes,
      message: 'Todos os pacientes'
    });
  }
  
  const searchLower = q.toLowerCase();
  const filtered = mockData.pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchLower) ||
    p.cpf.includes(q) ||
    p.email.toLowerCase().includes(searchLower)
  );
  
  res.json({
    success: true,
    data: filtered,
    message: `${filtered.length} pacientes encontrados`
  });
});

// Obter paciente por ID
app.get('/api/pacientes/:id', (req, res) => {
  const { id } = req.params;
  const paciente = mockData.pacientes.find(p => p.id === parseInt(id));
  
  if (!paciente) {
    return res.status(404).json({
      success: false,
      message: 'Paciente não encontrado'
    });
  }
  
  res.json({
    success: true,
    data: paciente,
    message: 'Paciente encontrado'
  });
});

// ========================================
// API DE DASHBOARD E ESTATÍSTICAS
// ========================================

// Estatísticas do dashboard
app.get('/api/dashboard/stats', (req, res) => {
  const stats = calcularEstatisticasReais();
  res.json({
    success: true,
    data: stats,
    message: 'Estatísticas obtidas com sucesso'
  });
});

app.get('/api/statistics/dashboard', (req, res) => {
  const stats = calcularEstatisticasReais();
  res.json({
    success: true,
    data: stats,
    message: 'Estatísticas do dashboard'
  });
});

// Especialidades
app.get('/api/especialidades', (req, res) => {
  res.json({
    success: true,
    data: mockData.especialidades,
    message: 'Especialidades obtidas com sucesso'
  });
});

// ========================================
// INTEGRAÇÃO VIACEP
// ========================================

app.get('/api/viacep/:cep', async (req, res) => {
  const { cep } = req.params;
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      return res.status(404).json({
        success: false,
        message: 'CEP não encontrado'
      });
    }
    
    res.json({
      success: true,
      data,
      message: 'CEP encontrado com sucesso'
    });
    
  } catch (error) {
    log(`Erro ViaCEP: ${error.message}`, 'ERROR');
    res.status(500).json({
      success: false,
      message: 'Erro ao consultar CEP'
    });
  }
});

// ========================================
// MIDDLEWARE DE ERRO
// ========================================

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      message: 'Endpoint não encontrado',
      path: req.path
    });
  } else {
    // Serve index.html para SPA
    const indexPath = path.join(config.publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MediApp - Linux Server</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2c5530; }
            .status { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .endpoints { background: #f3f4f6; padding: 20px; border-radius: 5px; }
            a { color: #1976d2; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏥 MediApp - Servidor Linux Estável v3.0.0</h1>
            
            <div class="status">
              ✅ Sistema operacional - Configurado para ambiente virtualizado Linux
            </div>
            
            <div class="endpoints">
              <h3>🔧 Endpoints Disponíveis:</h3>
              <ul>
                <li><a href="/health">Health Check</a> - Status do sistema</li>
                <li><a href="/status">Status</a> - Informações gerais</li>
                <li><a href="/api/medicos">API Médicos</a> - CRUD de médicos</li>
                <li><a href="/api/pacientes">API Pacientes</a> - CRUD de pacientes</li>
                <li><a href="/api/dashboard/stats">Dashboard Stats</a> - Estatísticas</li>
                <li><a href="/api/especialidades">Especialidades</a> - Lista de especialidades</li>
              </ul>
              
              <h3>📊 Páginas Web:</h3>
              <ul>
                <li><a href="/gestao-medicos.html">Gestão de Médicos</a></li>
                <li><a href="/gestao-pacientes.html">Gestão de Pacientes</a></li>
                <li><a href="/dashboard.html">Dashboard</a></li>
              </ul>
            </div>
            
            <p><strong>Ambiente:</strong> ${config.env} | <strong>Porta:</strong> ${config.port}</p>
          </div>
        </body>
        </html>
      `);
    }
  }
});

// Error handler
app.use((error, req, res, next) => {
  log(`Erro interno: ${error.message}`, 'ERROR');
  console.error(error.stack);
  
  res.status(500).json({
    success: false,
    message: config.env === 'production' ? 'Erro interno do servidor' : error.message,
    error: config.env === 'development' ? error.stack : undefined
  });
});

// ========================================
// INICIALIZAÇÃO DO SERVIDOR
// ========================================

// Graceful shutdown
let server;
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) {
    log('Shutdown já em andamento...', 'WARN');
    return;
  }
  
  isShuttingDown = true;
  log(`Recebido sinal ${signal}, iniciando shutdown graceful...`);
  
  if (server) {
    server.close(() => {
      log('Servidor HTTP fechado com sucesso', 'SUCCESS');
      process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      log('Forçando encerramento após timeout', 'WARN');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Signal handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Error handlers
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
function startServer() {
  try {
    server = app.listen(config.port, config.host, () => {
      log('==========================================', 'SUCCESS');
      log('🏥 MediApp Linux Stable Server v3.0.0', 'SUCCESS');
      log('==========================================', 'SUCCESS');
      log(`✅ Servidor iniciado em ${config.host}:${config.port}`, 'SUCCESS');
      log(`🌐 Environment: ${config.env}`, 'SUCCESS');
      log(`🖥️  Platform: ${process.platform} ${process.arch}`, 'SUCCESS');
      log(`⚡ Node.js: ${process.version}`, 'SUCCESS');
      log(`📊 PID: ${process.pid}`, 'SUCCESS');
      log('', 'SUCCESS');
      log('🔗 URLs disponíveis:', 'SUCCESS');
      log(`   📊 Health Check: http://localhost:${config.port}/health`, 'SUCCESS');
      log(`   🏥 Dashboard: http://localhost:${config.port}/`, 'SUCCESS');
      log(`   👨‍⚕️ Médicos: http://localhost:${config.port}/api/medicos`, 'SUCCESS');
      log(`   👥 Pacientes: http://localhost:${config.port}/api/pacientes`, 'SUCCESS');
      log(`   📈 Stats: http://localhost:${config.port}/api/dashboard/stats`, 'SUCCESS');
      log('', 'SUCCESS');
      log('🎯 Sistema Linux 100% operacional!', 'SUCCESS');
      log('==========================================', 'SUCCESS');
    });
    
    // Configurar timeouts
    server.timeout = 120000; // 2 minutos
    server.keepAliveTimeout = 65000; // 65 segundos
    server.headersTimeout = 66000; // 66 segundos
    
    // Lidar com erros do servidor
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        log(`Porta ${config.port} já está em uso`, 'ERROR');
        process.exit(1);
      } else {
        log(`Erro no servidor: ${error.message}`, 'ERROR');
        throw error;
      }
    });
    
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

module.exports = { app, startServer };