const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Configurar ambiente de teste
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const prisma = new PrismaClient();

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

module.exports = { prisma };