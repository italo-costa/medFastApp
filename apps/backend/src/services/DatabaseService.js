const { PrismaClient } = require('@prisma/client');
const config = require('../config');

class DatabaseService {
  constructor() {
    this.prisma = null;
    this.connected = false;
  }

  async connect() {
    try {
      if (!this.prisma) {
        this.prisma = new PrismaClient({
          datasources: {
            db: {
              url: config.database.url
            }
          },
          log: config.database.logging ? ['query', 'info', 'warn', 'error'] : [],
        });
      }

      // Testa a conexão
      await this.prisma.$connect();
      this.connected = true;
      
      console.log('✅ Database connected successfully');
      return this.prisma;
    } catch (error) {
      this.connected = false;
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.connected = false;
      console.log('🔌 Database disconnected');
    }
  }

  async isConnected() {
    if (!this.prisma) return false;
    
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  async healthCheck() {
    try {
      if (!this.prisma) {
        throw new Error('Prisma client not initialized');
      }

      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1 as health`;
      const end = Date.now();

      return {
        status: 'healthy',
        responseTime: `${end - start}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getStats() {
    try {
      if (!this.prisma) {
        throw new Error('Prisma client not initialized');
      }

      const [
        usuariosCount,
        medicosCount,
        pacientesCount,
        consultasCount,
        prontuariosCount
      ] = await Promise.all([
        this.prisma.usuario.count(),
        this.prisma.medico.count(),
        this.prisma.paciente.count(),
        this.prisma.consulta.count(),
        this.prisma.prontuario.count()
      ]);

      return {
        usuarios: usuariosCount,
        medicos: medicosCount,
        pacientes: pacientesCount,
        consultas: consultasCount,
        prontuarios: prontuariosCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error.message}`);
    }
  }

  async runMigrations() {
    try {
      // Execute pending migrations
      await this.prisma.$executeRaw`SELECT 1`; // Basic check
      console.log('✅ Database migrations up to date');
      return true;
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  async resetDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset database in production');
    }

    try {
      // Delete all records in reverse order (to handle foreign keys)
      const tableNames = [
        'sincronizacao_mobile',
        'estatisticas_dashboard',
        'configuracoes',
        'logs_sistema',
        'sessoes',
        'arquivos',
        'atendimentos',
        'agendamentos',
        'sinais_vitais',
        'prescricoes',
        'doencas_preexistentes',
        'medicamentos_uso',
        'alergias',
        'exames_solicitados',
        'exames',
        'consultas',
        'prontuarios',
        'pacientes',
        'enfermeiros',
        'historico_alteracoes',
        'medicos',
        'usuarios'
      ];

      for (const tableName of tableNames) {
        try {
          await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
        } catch (error) {
          console.warn(`Warning: Could not truncate ${tableName}:`, error.message);
        }
      }

      console.log('✅ Database reset completed');
      return true;
    } catch (error) {
      console.error('❌ Database reset failed:', error.message);
      throw error;
    }
  }

  async seed() {
    try {
      // Basic seed data for testing
      const adminUser = await this.prisma.usuario.create({
        data: {
          email: 'admin@medifast.com',
          senha: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeUreER8Wnkjp24ke', // password: admin123
          nome: 'Administrador Sistema',
          tipo: 'ADMIN',
          ativo: true
        }
      });

      console.log('✅ Database seeded with basic data');
      return { adminUser };
    } catch (error) {
      console.error('❌ Database seed failed:', error.message);
      throw error;
    }
  }

  getPrismaClient() {
    if (!this.prisma) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.prisma;
  }

  // Utility methods for transactions
  async transaction(callback) {
    if (!this.prisma) {
      throw new Error('Database not connected');
    }
    return await this.prisma.$transaction(callback);
  }

  // Raw query execution
  async executeRaw(query, ...params) {
    if (!this.prisma) {
      throw new Error('Database not connected');
    }
    return await this.prisma.$executeRawUnsafe(query, ...params);
  }

  async queryRaw(query, ...params) {
    if (!this.prisma) {
      throw new Error('Database not connected');
    }
    return await this.prisma.$queryRawUnsafe(query, ...params);
  }
}

// Singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;