const { PrismaClient } = require('@prisma/client');

module.exports = async () => {
  console.log('🧪 Setup global dos testes iniciado');
  
  // Configurar variáveis de ambiente para teste
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3002'; // Porta diferente para testes
  
  // Inicializar Prisma para testes
  global.__PRISMA__ = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mediapp_test'
      }
    }
  });

  try {
    await global.__PRISMA__.$connect();
    console.log('✅ Conexão de teste com banco estabelecida');
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de teste:', error);
  }
};