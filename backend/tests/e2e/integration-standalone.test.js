const request = require('supertest');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Import do app diretamente  
const app = require('../../src/server-prisma');
const prisma = new PrismaClient();

// Desabilitar setup global para este teste
jest.mock('../setup.js', () => ({
    beforeEach: jest.fn(),
    afterEach: jest.fn()
}));

describe('🧪 Teste de Integração Completo', () => {
    let authToken;
    let testMedico;
    let testPaciente;
    let consultaId;

    beforeAll(async () => {
        console.log('🔧 Preparando ambiente de teste...');
        
        // Aplicar migrações
        const { exec } = require('child_process');
        await new Promise((resolve) => {
            exec('npx prisma migrate dev --name test', { cwd: process.cwd() }, resolve);
        });
        
        // Limpar dados existentes
        await prisma.consulta.deleteMany({});
        await prisma.medico.deleteMany({});
        await prisma.paciente.deleteMany({});
        await prisma.sessao.deleteMany({});
        await prisma.usuario.deleteMany({});
        
        // Criar médico
        const senhaHash = await bcrypt.hash('medico123', 10);
        
        const usuario = await prisma.usuario.create({
            data: {
                email: 'test.medico@clinica.com',
                senha: senhaHash,
                nome: 'Dr. Teste Silva',
                tipo: 'MEDICO',
                ativo: true
            }
        });

        testMedico = await prisma.medico.create({
            data: {
                usuario_id: usuario.id,
                crm: 'TEST123',
                crm_uf: 'SP',
                especialidade: 'Clínica Geral',
                telefone: '(11) 1234-5678'
            }
        });

        // Criar paciente
        testPaciente = await prisma.paciente.create({
            data: {
                nome: 'Paciente Teste Santos',
                cpf: '11111111111',
                data_nascimento: new Date('1990-01-01'),
                sexo: 'MASCULINO',
                telefone: '(11) 99999-9999',
                email: 'paciente.teste@email.com'
            }
        });

        console.log('✅ Dados de teste criados - Usuário:', usuario.id);
    });

    afterAll(async () => {
        // Limpar dados
        await prisma.consulta.deleteMany({});
        await prisma.medico.deleteMany({});
        await prisma.paciente.deleteMany({});
        await prisma.sessao.deleteMany({});
        await prisma.usuario.deleteMany({});
        await prisma.$disconnect();
    });

    test('🏥 Status do sistema', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);

        expect(response.body.status).toBe('OK');
        console.log('✅ Sistema funcionando');
    });

    test('🔐 Autenticação e obtenção de token', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test.medico@clinica.com',
                senha: 'medico123'
            })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
        expect(response.body.usuario.tipo).toBe('MEDICO');
        
        authToken = response.body.token;
        console.log('✅ Autenticação realizada com sucesso');
    });

    test('👨‍⚕️ Listar médicos', async () => {
        const response = await request(app)
            .get('/api/medicos')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        
        console.log('✅ Médicos listados:', response.body.data.length);
    });

    test('👥 Listar pacientes', async () => {
        const response = await request(app)
            .get('/api/pacientes')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        
        console.log('✅ Pacientes listados:', response.body.data.length);
    });

    test('🔍 Buscar paciente por CPF', async () => {
        const response = await request(app)
            .get('/api/pacientes/buscar/11111111111')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.cpf).toBe('11111111111');
        
        console.log('✅ Paciente encontrado por CPF:', response.body.data.nome);
    });

    test('📝 Criar consulta', async () => {
        const novaConsulta = {
            paciente_id: testPaciente.id,
            medico_id: testMedico.id,
            data_consulta: new Date(Date.now() + 24 * 60 * 60 * 1000),
            hora_consulta: '14:00',
            tipo: 'CONSULTA',
            observacoes: 'Consulta de teste'
        };

        const response = await request(app)
            .post('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .send(novaConsulta)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        
        consultaId = response.body.data.id;
        console.log('✅ Consulta criada:', consultaId);
    });

    test('📋 Listar consultas', async () => {
        const response = await request(app)
            .get('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        
        console.log('✅ Consultas listadas:', response.body.data.length);
    });

    test('📊 Gerar estatísticas', async () => {
        const response = await request(app)
            .get('/api/estatisticas/resumo')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('total_medicos');
        expect(response.body.data).toHaveProperty('total_pacientes');
        expect(response.body.data).toHaveProperty('total_consultas');
        
        console.log('✅ Estatísticas:', response.body.data);
    });

    test('🎯 Fluxo completo de trabalho médico', async () => {
        console.log('🎬 Simulando fluxo completo...');
        
        // 1. Buscar paciente
        const paciente = await request(app)
            .get(`/api/pacientes/buscar/${testPaciente.cpf}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        // 2. Criar nova consulta
        const novaConsulta = {
            paciente_id: testPaciente.id,
            medico_id: testMedico.id,
            data_consulta: new Date(Date.now() + 48 * 60 * 60 * 1000),
            hora_consulta: '10:30',
            tipo: 'RETORNO',
            observacoes: 'Consulta de retorno'
        };

        const consulta = await request(app)
            .post('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .send(novaConsulta)
            .expect(201);

        // 3. Verificar estatísticas
        const stats = await request(app)
            .get('/api/estatisticas/resumo')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(stats.body.data.total_consultas).toBe(2);
        console.log('✅ Fluxo completo executado com sucesso');
    });

    test('📱 Dashboard performance', async () => {
        const startTime = Date.now();
        
        const [medicos, pacientes, consultas, estatisticas] = await Promise.all([
            request(app).get('/api/medicos').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/pacientes').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/consultas').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/estatisticas/resumo').set('Authorization', `Bearer ${authToken}`)
        ]);
        
        const totalTime = Date.now() - startTime;
        
        expect(medicos.status).toBe(200);
        expect(pacientes.status).toBe(200);
        expect(consultas.status).toBe(200);
        expect(estatisticas.status).toBe(200);
        expect(totalTime).toBeLessThan(1000);
        
        console.log(`✅ Dashboard carregado em ${totalTime}ms`);
        console.log('📊 Dados:', {
            medicos: medicos.body.data.length,
            pacientes: pacientes.body.data.length,
            consultas: consultas.body.data.length,
            stats: estatisticas.body.data
        });
    });
});