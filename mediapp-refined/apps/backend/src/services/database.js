/**
 * Serviço centralizado para gerenciamento do banco de dados
 * Centraliza todas as operações do Prisma
 */

const { PrismaClient } = require('@prisma/client');
const config = require('../config');

class DatabaseService {
  constructor() {
    this.prisma = new PrismaClient({
      log: config.server.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });

    this.isConnected = false;
  }

  /**
   * Conectar ao banco de dados
   */
  async connect() {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      console.log('✅ [DATABASE] Conectado ao PostgreSQL');
      
      // Verificar se as tabelas existem
      await this.healthCheck();
      
    } catch (error) {
      console.error('❌ [DATABASE] Erro ao conectar:', error.message);
      throw error;
    }
  }

  /**
   * Desconectar do banco de dados
   */
  async disconnect() {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('✅ [DATABASE] Desconectado do banco de dados');
    } catch (error) {
      console.error('❌ [DATABASE] Erro ao desconectar:', error.message);
    }
  }

  /**
   * Health check do banco de dados
   */
  async healthCheck() {
    try {
      // Contar registros principais para verificar se está funcionando
      const [totalMedicos, totalPacientes, totalExames] = await Promise.all([
        this.prisma.medico.count(),
        this.prisma.paciente.count(),
        this.prisma.exame.count()
      ]);

      console.log('✅ [DATABASE] Health check:');
      console.log(`   👨‍⚕️ ${totalMedicos} médicos`);
      console.log(`   👥 ${totalPacientes} pacientes`);
      console.log(`   🔬 ${totalExames} exames`);

      return {
        status: 'healthy',
        totalMedicos,
        totalPacientes,
        totalExames
      };
    } catch (error) {
      console.error('❌ [DATABASE] Health check falhou:', error.message);
      throw error;
    }
  }

  /**
   * Obter estatísticas do sistema
   */
  async getSystemStats() {
    try {
      const [
        totalMedicos,
        totalPacientes,
        totalProntuarios,
        totalExames,
        totalConsultas,
        medicosAtivos
      ] = await Promise.all([
        this.prisma.medico.count(),
        this.prisma.paciente.count(),
        this.prisma.prontuario.count(),
        this.prisma.exame.count(),
        this.prisma.consulta.count(),
        this.prisma.medico.count({
          where: {
            usuario: {
              ativo: true
            }
          }
        })
      ]);

      return {
        totalMedicos,
        totalPacientes,
        totalProntuarios,
        totalExames,
        totalConsultas,
        medicosAtivos,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ [DATABASE] Erro ao obter estatísticas:', error.message);
      throw error;
    }
  }

  /**
   * Executar uma transação
   */
  async transaction(operations) {
    return await this.prisma.$transaction(operations);
  }

  /**
   * Executar query raw
   */
  async executeRaw(query, params = []) {
    return await this.prisma.$executeRaw(query, ...params);
  }

  /**
   * Query raw
   */
  async queryRaw(query, params = []) {
    return await this.prisma.$queryRaw(query, ...params);
  }

  /**
   * Getter para o cliente Prisma
   */
  get client() {
    if (!this.isConnected) {
      throw new Error('Database não está conectado. Chame connect() primeiro.');
    }
    return this.prisma;
  }
}

// Singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;