// Servidor robusto com tratamento adequado de sinais
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;
const PID_FILE = '/tmp/mediapp-server.pid';
const LOG_FILE = '/tmp/mediapp-server.log';

// Sistema de logging robusto
class Logger {
  static log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const emoji = {
      'ERROR': '❌',
      'WARN': '⚠️',
      'INFO': '✅',
      'DEBUG': '🔍'
    }[level] || '📝';
    
    const logMessage = `[${timestamp}] ${emoji} [${level}] ${message}`;
    console.log(logMessage);
    
    // Salvar em arquivo de forma assíncrona
    fs.appendFile(LOG_FILE, logMessage + '\n').catch(() => {});
  }

  static error(message) { this.log(message, 'ERROR'); }
  static warn(message) { this.log(message, 'WARN'); }
  static info(message) { this.log(message, 'INFO'); }
  static debug(message) { this.log(message, 'DEBUG'); }
}

// Controle de estado do servidor
let server;
let isShuttingDown = false;
let shutdownTimeout;

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static('public'));

// Middleware de logging de requisições
app.use((req, res, next) => {
  Logger.debug(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check robusto
app.get('/health', async (req, res) => {
  try {
    // Teste de conectividade com banco
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Informações do sistema
    const stats = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected',
      pid: process.pid,
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(stats);
    Logger.debug('Health check realizado com sucesso');
    
  } catch (error) {
    Logger.error(`Health check falhou: ${error.message}`);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      pid: process.pid
    });
  }
});

// Status do servidor
app.get('/status', (req, res) => {
  res.json({
    server: 'running',
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    shutting_down: isShuttingDown,
    timestamp: new Date().toISOString()
  });
});

// Rota principal
app.get('/', (req, res) => {
  res.json({
    message: '🏥 MediApp v3.0.0 - Sistema de Gestão Médica (Servidor Robusto)',
    status: 'running',
    pid: process.pid,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    links: {
      health: `/health`,
      api_medicos: `/api/medicos`,
      api_pacientes: `/api/pacientes`,
      stats: `/api/stats`,
      status: `/status`
    }
  });
});

// API de médicos
app.get('/api/medicos', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const medicos = await prisma.medico.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            ativo: true
          }
        }
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: {
        criado_em: 'desc'
      }
    });

    const total = await prisma.medico.count();

    res.json({
      success: true,
      data: medicos,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: medicos.length
      },
      timestamp: new Date().toISOString()
    });
    
    Logger.debug(`API médicos: retornados ${medicos.length} registros`);
    
  } catch (error) {
    Logger.error(`Erro na API de médicos: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API de pacientes
app.get('/api/pacientes', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const pacientes = await prisma.paciente.findMany({
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: {
        criado_em: 'desc'
      }
    });

    const total = await prisma.paciente.count();

    res.json({
      success: true,
      data: pacientes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: pacientes.length
      },
      timestamp: new Date().toISOString()
    });
    
    Logger.debug(`API pacientes: retornados ${pacientes.length} registros`);
    
  } catch (error) {
    Logger.error(`Erro na API de pacientes: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Estatísticas do sistema
app.get('/api/stats', async (req, res) => {
  try {
    const [
      totalMedicos,
      totalPacientes,
      totalConsultas,
      totalExames,
      totalUsuarios
    ] = await Promise.all([
      prisma.medico.count(),
      prisma.paciente.count(),
      prisma.consulta.count(),
      prisma.exame.count(),
      prisma.usuario.count()
    ]);

    const stats = {
      success: true,
      data: {
        medicos: totalMedicos,
        pacientes: totalPacientes,
        consultas: totalConsultas,
        exames: totalExames,
        usuarios: totalUsuarios
      },
      server: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '3.0.0'
      },
      timestamp: new Date().toISOString()
    };

    res.json(stats);
    Logger.debug('Estatísticas geradas com sucesso');
    
  } catch (error) {
    Logger.error(`Erro ao gerar estatísticas: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota alternativa para dashboard (compatibilidade com frontend)
app.get('/api/statistics/dashboard', async (req, res) => {
  try {
    const [
      totalMedicos,
      totalPacientes,
      totalConsultas,
      totalExames,
      totalUsuarios
    ] = await Promise.all([
      prisma.medico.count(),
      prisma.paciente.count(),
      prisma.consulta.count(),
      prisma.exame.count(),
      prisma.usuario.count()
    ]);

    const stats = {
      success: true,
      medicos: {
        total: totalMedicos,
        ativos: totalMedicos, // Assumindo que todos são ativos
        especialidades: await prisma.medico.groupBy({
          by: ['especialidade'],
          _count: { especialidade: true }
        }).then(groups => groups.length)
      },
      pacientes: {
        total: totalPacientes
      },
      consultas: {
        total: totalConsultas
      },
      exames: {
        total: totalExames
      },
      usuarios: {
        total: totalUsuarios
      },
      timestamp: new Date().toISOString()
    };

    res.json(stats);
    Logger.debug('Estatísticas do dashboard geradas com sucesso');
    
  } catch (error) {
    Logger.error(`Erro ao gerar estatísticas do dashboard: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota individual - Obter médico por ID
app.get('/api/medicos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const medico = await prisma.medico.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            ativo: true
          }
        }
      }
    });

    if (!medico) {
      return res.status(404).json({
        success: false,
        error: 'Médico não encontrado',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: medico,
      timestamp: new Date().toISOString()
    });

    Logger.debug(`Médico ${id} obtido com sucesso`);
    
  } catch (error) {
    Logger.error(`Erro ao obter médico: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para criar novo médico
app.post('/api/medicos', async (req, res) => {
  try {
    const { nomeCompleto, email, crm, crm_uf, especialidade, telefone, celular } = req.body;
    
    // Criar usuário primeiro
    const usuario = await prisma.usuario.create({
      data: {
        id: `usr-${Date.now()}`,
        nome: nomeCompleto,
        email: email,
        senha: '$2b$10$N9qo8uLOickgx2ZMRZoMye', // senha padrão
        tipo: 'MEDICO',
        ativo: true,
        atualizado_em: new Date()
      }
    });

    // Criar médico
    const medico = await prisma.medico.create({
      data: {
        id: `med-${Date.now()}`,
        usuario_id: usuario.id,
        crm,
        crm_uf,
        especialidade,
        telefone,
        celular,
        atualizado_em: new Date()
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            ativo: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: medico,
      timestamp: new Date().toISOString()
    });

    Logger.info(`Médico ${medico.id} criado com sucesso`);
    
  } catch (error) {
    Logger.error(`Erro ao criar médico: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para atualizar médico
app.put('/api/medicos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nomeCompleto, email, crm, crm_uf, especialidade, telefone, celular } = req.body;
    
    const medico = await prisma.medico.findUnique({
      where: { id },
      include: { usuario: true }
    });

    if (!medico) {
      return res.status(404).json({
        success: false,
        error: 'Médico não encontrado',
        timestamp: new Date().toISOString()
      });
    }

    // Atualizar usuário
    await prisma.usuario.update({
      where: { id: medico.usuario_id },
      data: {
        nome: nomeCompleto,
        email: email,
        atualizado_em: new Date()
      }
    });

    // Atualizar médico
    const medicoAtualizado = await prisma.medico.update({
      where: { id },
      data: {
        crm,
        crm_uf,
        especialidade,
        telefone,
        celular,
        atualizado_em: new Date()
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            ativo: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: medicoAtualizado,
      timestamp: new Date().toISOString()
    });

    Logger.info(`Médico ${id} atualizado com sucesso`);
    
  } catch (error) {
    Logger.error(`Erro ao atualizar médico: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para excluir médico
app.delete('/api/medicos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const medico = await prisma.medico.findUnique({
      where: { id }
    });

    if (!medico) {
      return res.status(404).json({
        success: false,
        error: 'Médico não encontrado',
        timestamp: new Date().toISOString()
      });
    }

    // Deletar médico (cascata deleta o usuário)
    await prisma.medico.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Médico excluído com sucesso',
      timestamp: new Date().toISOString()
    });

    Logger.info(`Médico ${id} excluído com sucesso`);
    
  } catch (error) {
    Logger.error(`Erro ao excluir médico: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota individual - Obter paciente por ID
app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const paciente = await prisma.paciente.findUnique({
      where: { id }
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: 'Paciente não encontrado',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: paciente,
      timestamp: new Date().toISOString()
    });

    Logger.debug(`Paciente ${id} obtido com sucesso`);
    
  } catch (error) {
    Logger.error(`Erro ao obter paciente: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para criar novo paciente
app.post('/api/pacientes', async (req, res) => {
  try {
    const { nome, cpf, rg, data_nascimento, sexo, telefone, celular, email, endereco, cep, cidade, uf } = req.body;
    
    const paciente = await prisma.paciente.create({
      data: {
        id: `pac-${Date.now()}`,
        nome,
        cpf,
        rg,
        data_nascimento: new Date(data_nascimento),
        sexo,
        telefone,
        celular,
        email,
        endereco,
        cep,
        cidade,
        uf,
        ativo: true,
        atualizado_em: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: paciente,
      timestamp: new Date().toISOString()
    });

    Logger.info(`Paciente ${paciente.id} criado com sucesso`);
    
  } catch (error) {
    Logger.error(`Erro ao criar paciente: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para atualizar paciente
app.put('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cpf, rg, data_nascimento, sexo, telefone, celular, email, endereco, cep, cidade, uf } = req.body;
    
    const pacienteExiste = await prisma.paciente.findUnique({
      where: { id }
    });

    if (!pacienteExiste) {
      return res.status(404).json({
        success: false,
        error: 'Paciente não encontrado',
        timestamp: new Date().toISOString()
      });
    }

    const pacienteAtualizado = await prisma.paciente.update({
      where: { id },
      data: {
        nome,
        cpf,
        rg,
        data_nascimento: new Date(data_nascimento),
        sexo,
        telefone,
        celular,
        email,
        endereco,
        cep,
        cidade,
        uf,
        atualizado_em: new Date()
      }
    });

    res.json({
      success: true,
      data: pacienteAtualizado,
      timestamp: new Date().toISOString()
    });

    Logger.info(`Paciente ${id} atualizado com sucesso`);
    
  } catch (error) {
    Logger.error(`Erro ao atualizar paciente: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para excluir paciente
app.delete('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pacienteExiste = await prisma.paciente.findUnique({
      where: { id }
    });

    if (!pacienteExiste) {
      return res.status(404).json({
        success: false,
        error: 'Paciente não encontrado',
        timestamp: new Date().toISOString()
      });
    }

    await prisma.paciente.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Paciente excluído com sucesso',
      timestamp: new Date().toISOString()
    });

    Logger.info(`Paciente ${id} excluído com sucesso`);
    
  } catch (error) {
    Logger.error(`Erro ao excluir paciente: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  Logger.error(`Erro não tratado: ${error.message}`);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Função de shutdown graceful melhorada
async function gracefulShutdown(signal, code = 0) {
  if (isShuttingDown) {
    Logger.warn('Shutdown já em andamento, ignorando sinal adicional');
    return;
  }
  
  isShuttingDown = true;
  Logger.info(`Recebido sinal ${signal}, iniciando shutdown graceful...`);
  
  // Timeout de segurança para forçar saída após 30 segundos
  shutdownTimeout = setTimeout(() => {
    Logger.error('Timeout no shutdown graceful, forçando saída');
    process.exit(1);
  }, 30000);
  
  try {
    // Remover arquivo PID
    try {
      await fs.unlink(PID_FILE);
      Logger.info('Arquivo PID removido');
    } catch (err) {
      // Ignorar se arquivo não existe
    }
    
    // Fechar servidor HTTP
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
      Logger.info('Servidor HTTP fechado');
    }
    
    // Fechar conexões com banco
    await prisma.$disconnect();
    Logger.info('Conexão com banco fechada');
    
    clearTimeout(shutdownTimeout);
    Logger.info('Shutdown graceful concluído!');
    process.exit(code);
    
  } catch (error) {
    Logger.error(`Erro durante shutdown: ${error.message}`);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

// Função para salvar PID
async function savePid() {
  try {
    await fs.writeFile(PID_FILE, process.pid.toString());
    Logger.info(`PID ${process.pid} salvo em ${PID_FILE}`);
  } catch (error) {
    Logger.warn(`Erro ao salvar PID: ${error.message}`);
  }
}

// Inicialização do servidor
async function startServer() {
  try {
    Logger.info('🏥 Iniciando MediApp v3.0.0 (Servidor Robusto)...');
    
    // Salvar PID
    await savePid();
    
    // Testar conexão com banco
    await prisma.$connect();
    Logger.info('✅ Conectado ao PostgreSQL');
    
    // Testar query simples
    await prisma.$queryRaw`SELECT 1`;
    Logger.info('✅ Teste de conectividade com banco OK');
    
    // Iniciar servidor HTTP
    server = app.listen(PORT, '0.0.0.0', () => {
      Logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      Logger.info(`📍 PID: ${process.pid}`);
      Logger.info(`📍 Health check: http://localhost:${PORT}/health`);
      Logger.info(`📍 Status: http://localhost:${PORT}/status`);
      Logger.info(`📍 API Médicos: http://localhost:${PORT}/api/medicos`);
      Logger.info(`📍 API Pacientes: http://localhost:${PORT}/api/pacientes`);
      Logger.info(`📍 Estatísticas: http://localhost:${PORT}/api/stats`);
      Logger.info('🎯 Sistema 100% operacional e robusto!');
    });
    
    // Configurar timeout do servidor
    server.timeout = 120000; // 2 minutos
    server.keepAliveTimeout = 65000; // 65 segundos
    server.headersTimeout = 66000; // 66 segundos
    
  } catch (error) {
    Logger.error(`Erro ao iniciar servidor: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handlers de sinais - mais robustos
process.on('SIGINT', () => {
  Logger.info('Recebido SIGINT (Ctrl+C)');
  gracefulShutdown('SIGINT', 0);
});

process.on('SIGTERM', () => {
  Logger.info('Recebido SIGTERM');
  gracefulShutdown('SIGTERM', 0);
});

process.on('SIGHUP', () => {
  Logger.info('Recebido SIGHUP, ignorando...');
  // Ignorar SIGHUP em vez de fazer shutdown
});

// Handlers de erros
process.on('uncaughtException', (error) => {
  Logger.error(`Exceção não capturada: ${error.message}`);
  console.error(error.stack);
  gracefulShutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error(`Promise rejeitada: ${reason}`);
  console.error('Promise:', promise);
  gracefulShutdown('unhandledRejection', 1);
});

// Handler para quando processo pai morre
process.on('disconnect', () => {
  Logger.info('Processo pai desconectado');
  gracefulShutdown('disconnect', 0);
});

// Iniciar servidor apenas se for o módulo principal
if (require.main === module) {
  startServer().catch(error => {
    Logger.error(`Falha crítica na inicialização: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { app, startServer, gracefulShutdown };