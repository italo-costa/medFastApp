/**
 * Setup para testes - Configurações globais
 */

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mediapp_test';

// Configurar timeout global
jest.setTimeout(30000);

// Mock console para testes mais limpos (opcional)
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Silenciar logs durante testes (opcional)
  // console.log = jest.fn();
  // console.error = jest.fn();
});

afterAll(() => {
  // Restaurar console
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Handler para promises rejeitadas não capturadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handler para exceções não capturadas
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

module.exports = {};