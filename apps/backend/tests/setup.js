const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Configurar ambiente de teste
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['error']  // Only log errors in tests
});

// Setup global para todos os testes
beforeAll(async () => {
    console.log('🧪 Configurando ambiente de teste...');
    
    // Executar migrations no banco de teste
    try {
        execSync('npx prisma migrate deploy', { 
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
        });
        console.log('✅ Migrations executadas com sucesso');
    } catch (error) {
        console.error('❌ Erro ao executar migrations:', error.message);
    }
    
    // Conectar ao banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco de teste');
});

// Cleanup após todos os testes
afterAll(async () => {
    console.log('🧹 Limpando ambiente de teste...');
    
    // Limpar todas as tabelas
    const tableNames = await prisma.$queryRaw`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != '_prisma_migrations'
    `;
    
    for (const { tablename } of tableNames) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
    }
    
    await prisma.$disconnect();
    console.log('✅ Ambiente de teste limpo');
});

// Limpar dados entre testes
beforeEach(async () => {
    // Limpar todas as tabelas na ordem correta (por causa das FKs)
    await prisma.prescricao.deleteMany();
    await prisma.exameSolicitado.deleteMany();
    await prisma.sinalVital.deleteMany();
    await prisma.prontuario.deleteMany();
    await prisma.consulta.deleteMany();
    await prisma.agendamento.deleteMany();
    await prisma.exame.deleteMany();
    await prisma.alergia.deleteMany();
    await prisma.medicamentoUso.deleteMany();
    await prisma.doencaPreexistente.deleteMany();
    await prisma.arquivo.deleteMany();
    await prisma.atendimento.deleteMany();
    await prisma.paciente.deleteMany();
    await prisma.medico.deleteMany();
    await prisma.enfermeiro.deleteMany();
    await prisma.sessao.deleteMany();
    await prisma.logSistema.deleteMany();
    await prisma.usuario.deleteMany();
});

// Make prisma available globally in tests
global.testPrisma = prisma;

// Helper function to create test data
global.createTestUser = async (overrides = {}) => {
  const userData = {
    email: `test${Date.now()}@test.com`,
    senha: '$2a$04$rWf4VlWnGFMXzpcN5PLhLOWTGhd4f4KuvQWvTrFdDrms28q.Z9.Ha', // password: test123
    nome: 'Test User',
    tipo: 'ADMIN',
    ativo: true,
    ...overrides
  };

  return await prisma.usuario.create({ data: userData });
};

global.createTestMedico = async (usuarioId, overrides = {}) => {
  const medicoData = {
    usuario_id: usuarioId,
    crm: `${Date.now().toString().slice(-6)}`,
    crm_uf: 'SP',
    especialidade: 'Cardiologia',
    telefone: '11999999999',
    celular: '11888888888',
    ...overrides
  };

  return await prisma.medico.create({ data: medicoData });
};

global.createTestPaciente = async (overrides = {}) => {
  const pacienteData = {
    nome: 'Test Patient',
    cpf: `${Date.now().toString().slice(-11)}`,
    data_nascimento: new Date('1990-01-01'),
    sexo: 'MASCULINO',
    telefone: '11777777777',
    ...overrides
  };

  return await prisma.paciente.create({ data: pacienteData });
};

// Timeout for async operations
jest.setTimeout(30000);

module.exports = { prisma };