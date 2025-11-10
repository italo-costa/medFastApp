/**
 * 🔧 MediApp - Configuração Centralizada de Portas
 * Sistema inteligente de detecção e resolução de conflitos
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuração de portas do sistema
const PORT_CONFIG = {
  // Serviços principais
  main: {
    preferred: 3002,
    fallback: [3001, 3003, 3004, 3005],
    description: 'Servidor Principal MediApp'
  },
  
  // Banco de dados
  database: {
    preferred: 5433,
    fallback: [5434, 5435, 5436],
    description: 'PostgreSQL Database'
  },
  
  // Serviços de teste
  test: {
    preferred: 3003,
    fallback: [3006, 3007, 3008],
    description: 'Servidor de Teste'
  },
  
  // Demo e desenvolvimento
  demo: {
    preferred: 3004,
    fallback: [3009, 3010, 3011],
    description: 'Servidor Demo'
  },
  
  // Mínimo/Simple
  minimal: {
    preferred: 3005,
    fallback: [3012, 3013, 3014],
    description: 'Servidor Mínimo'
  }
};

// Portas reservadas que não devem ser usadas
const RESERVED_PORTS = [
  22,    // SSH
  80,    // HTTP
  443,   // HTTPS  
  3000,  // React desenvolvimento
  8080,  // Proxy comum
  8081,  // Metro Bundler
  19000, // Expo
  19006  // Expo Web
];

/**
 * Verificar se uma porta está em uso
 * @param {number} port - Porta a verificar
 * @returns {Promise<boolean>} - true se estiver em uso
 */
async function isPortInUse(port) {
  try {
    // Para WSL/Linux - usar netstat
    const { stdout } = await execPromise(`netstat -tlnp | grep :${port} | grep LISTEN || echo ""`);
    return stdout.trim() !== '';
  } catch (error) {
    // Fallback - tentar conexão TCP
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.once('error', () => resolve(true)); // Porta em uso
      server.once('listening', () => {
        server.close();
        resolve(false); // Porta livre
      });
      
      server.listen(port, '0.0.0.0');
    });
  }
}

/**
 * Buscar porta disponível para um serviço
 * @param {string} serviceName - Nome do serviço (main, database, test, etc.)
 * @returns {Promise<number>} - Porta disponível
 */
async function findAvailablePort(serviceName) {
  const serviceConfig = PORT_CONFIG[serviceName];
  
  if (!serviceConfig) {
    throw new Error(`Configuração não encontrada para serviço: ${serviceName}`);
  }
  
  const portsToCheck = [serviceConfig.preferred, ...serviceConfig.fallback];
  
  for (const port of portsToCheck) {
    if (RESERVED_PORTS.includes(port)) {
      continue;
    }
    
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
  }
  
  // Se nenhuma porta preferida estiver disponível, buscar uma dinâmica
  return findDynamicPort();
}

/**
 * Buscar uma porta dinâmica disponível
 * @returns {Promise<number>} - Porta disponível
 */
async function findDynamicPort() {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', reject);
    server.once('listening', () => {
      const port = server.address().port;
      server.close();
      resolve(port);
    });
    
    server.listen(0, '0.0.0.0'); // Deixa o sistema escolher
  });
}

/**
 * Liberar uma porta específica matando processos que a estão usando
 * @param {number} port - Porta a liberar
 * @returns {Promise<boolean>} - true se liberou com sucesso
 */
async function freePort(port) {
  try {
    // Encontrar processo usando a porta
    const { stdout } = await execPromise(`lsof -ti:${port} || echo ""`);
    const pids = stdout.trim().split('\n').filter(pid => pid && pid !== '');
    
    if (pids.length === 0) {
      return true; // Porta já livre
    }
    
    console.log(`🔄 Liberando porta ${port} - processos: ${pids.join(', ')}`);
    
    // Matar processos
    for (const pid of pids) {
      try {
        await execPromise(`kill -9 ${pid}`);
        console.log(`✅ Processo ${pid} finalizado`);
      } catch (error) {
        console.log(`⚠️ Erro ao finalizar processo ${pid}: ${error.message}`);
      }
    }
    
    // Aguardar um pouco para a porta ser liberada
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar se foi liberada
    return !(await isPortInUse(port));
    
  } catch (error) {
    console.error(`❌ Erro ao liberar porta ${port}:`, error.message);
    return false;
  }
}

/**
 * Resolver conflitos de porta para um serviço
 * @param {string} serviceName - Nome do serviço
 * @param {boolean} forceKill - Se deve matar processos conflitantes
 * @returns {Promise<number>} - Porta disponível
 */
async function resolvePortConflict(serviceName, forceKill = false) {
  const serviceConfig = PORT_CONFIG[serviceName];
  const preferredPort = serviceConfig.preferred;
  
  console.log(`🔍 Verificando porta ${preferredPort} para ${serviceConfig.description}...`);
  
  const inUse = await isPortInUse(preferredPort);
  
  if (!inUse) {
    console.log(`✅ Porta ${preferredPort} disponível para ${serviceName}`);
    return preferredPort;
  }
  
  console.log(`⚠️ Porta ${preferredPort} em uso`);
  
  if (forceKill) {
    console.log(`🔄 Tentando liberar porta ${preferredPort}...`);
    const freed = await freePort(preferredPort);
    
    if (freed) {
      console.log(`✅ Porta ${preferredPort} liberada com sucesso`);
      return preferredPort;
    }
  }
  
  console.log(`🔄 Buscando porta alternativa para ${serviceName}...`);
  const availablePort = await findAvailablePort(serviceName);
  console.log(`✅ Porta ${availablePort} selecionada para ${serviceName}`);
  
  return availablePort;
}

/**
 * Gerar relatório de status das portas
 * @returns {Promise<Object>} - Relatório detalhado
 */
async function generatePortReport() {
  const report = {
    timestamp: new Date().toISOString(),
    services: {},
    conflicts: [],
    recommendations: []
  };
  
  for (const [serviceName, config] of Object.entries(PORT_CONFIG)) {
    const preferredInUse = await isPortInUse(config.preferred);
    const availablePort = await findAvailablePort(serviceName);
    
    report.services[serviceName] = {
      description: config.description,
      preferred: config.preferred,
      preferredAvailable: !preferredInUse,
      recommendedPort: availablePort,
      fallbackPorts: config.fallback
    };
    
    if (preferredInUse) {
      report.conflicts.push({
        service: serviceName,
        port: config.preferred,
        description: config.description
      });
    }
  }
  
  // Gerar recomendações
  if (report.conflicts.length > 0) {
    report.recommendations.push('Execute resolveAllConflicts() para resolver conflitos automaticamente');
    report.recommendations.push('Ou use forceKill=true nos métodos de resolução');
  }
  
  return report;
}

/**
 * Resolver todos os conflitos de porta automaticamente
 * @param {boolean} forceKill - Se deve matar processos conflitantes
 * @returns {Promise<Object>} - Mapa de serviços para portas resolvidas
 */
async function resolveAllConflicts(forceKill = false) {
  const resolved = {};
  
  for (const serviceName of Object.keys(PORT_CONFIG)) {
    try {
      resolved[serviceName] = await resolvePortConflict(serviceName, forceKill);
    } catch (error) {
      console.error(`❌ Erro ao resolver conflito para ${serviceName}:`, error.message);
      resolved[serviceName] = null;
    }
  }
  
  return resolved;
}

module.exports = {
  PORT_CONFIG,
  RESERVED_PORTS,
  isPortInUse,
  findAvailablePort,
  freePort,
  resolvePortConflict,
  generatePortReport,
  resolveAllConflicts
};