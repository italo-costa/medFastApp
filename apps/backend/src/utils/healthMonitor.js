const { logger } = require('../utils/logger');

class ServerHealthMonitor {
  constructor(server) {
    this.server = server;
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.connectionCount = 0;
    this.isHealthy = true;
    this.lastHealthCheck = Date.now();
    
    this.setupMonitoring();
  }
  
  setupMonitoring() {
    // Monitorar conexões
    this.server.on('connection', (socket) => {
      this.connectionCount++;
      
      socket.on('close', () => {
        this.connectionCount--;
      });
      
      socket.on('error', (error) => {
        logger.warn('🔌 Erro de socket:', error.message);
      });
    });
    
    // Monitorar requests
    this.server.on('request', (req, res) => {
      this.requestCount++;
      
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          this.errorCount++;
        }
      });
    });
    
    // Health check periódico
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // A cada 30 segundos
    
    // Cleanup on exit
    process.on('exit', () => {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
    });
  }
  
  performHealthCheck() {
    const now = Date.now();
    const uptime = now - this.startTime;
    const memUsage = process.memoryUsage();
    
    const health = {
      status: 'healthy',
      uptime: Math.round(uptime / 1000),
      requests: this.requestCount,
      errors: this.errorCount,
      connections: this.connectionCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
      }
    };
    
    // Verificar condições de saúde
    const isUnhealthy = (
      health.errorRate > 10 || // Mais de 10% de erro
      health.memory.heapUsed > 500 || // Mais de 500MB
      health.connections > 100 // Mais de 100 conexões
    );
    
    if (isUnhealthy && this.isHealthy) {
      this.isHealthy = false;
      logger.warn('⚠️ Servidor marcado como não saudável:', health);
    } else if (!isUnhealthy && !this.isHealthy) {
      this.isHealthy = true;
      logger.info('✅ Servidor voltou ao estado saudável:', health);
    }
    
    this.lastHealthCheck = now;
    
    // Log detalhado apenas em desenvolvimento ou se não saudável
    if (process.env.NODE_ENV === 'development' || !this.isHealthy) {
      logger.info('📊 Health check:', health);
    }
  }
  
  getHealthStatus() {
    return {
      healthy: this.isHealthy,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      requests: this.requestCount,
      errors: this.errorCount,
      connections: this.connectionCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      lastCheck: new Date(this.lastHealthCheck).toISOString(),
      memory: process.memoryUsage()
    };
  }
}

module.exports = ServerHealthMonitor;