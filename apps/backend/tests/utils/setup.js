const { PrismaClient } = require('@prisma/client');

// Setup global para testes
beforeAll(async () => {
  // Configurar ambiente de teste
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mediapp_test';
  
  console.log('🧪 Configurando ambiente de testes...');
});

afterAll(async () => {
  console.log('🧪 Finalizando testes...');
});

// Configurar timeout global para testes
jest.setTimeout(30000);