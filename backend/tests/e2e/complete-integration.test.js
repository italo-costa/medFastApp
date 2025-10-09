const request = require('supertest');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Import do app diretamente  
const app = require('../../src/server-prisma');
const prisma = new PrismaClient();

describe('🧪 Integração Frontend-Backend', () => {
    let authToken;
    let testData = {};

    beforeAll(async () => {
        console.log('🔧 Configurando teste de integração...');
        
        // Limpar e criar dados de teste
        await cleanAndSetupData();
    });

    afterAll(async () => {
        console.log('🧹 Limpando dados de teste...');
        await cleanDatabase();
        await prisma.$disconnect();
    });

    async function cleanAndSetupData() {
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
                email: 'dr.teste@mediapp.com',
                senha: senhaHash,
                nome: 'Dr. João Teste',
                tipo: 'MEDICO',
                ativo: true
            }
        });

        testData.medico = await prisma.medico.create({
            data: {
                usuario_id: usuario.id,
                crm: 'CRM123456',
                crm_uf: 'SP',
                especialidade: 'Cardiologia',
                telefone: '(11) 99999-0001'
            }
        });

        // Criar pacientes
        testData.pacientes = await Promise.all([
            prisma.paciente.create({
                data: {
                    nome: 'Maria Silva Santos',
                    cpf: '12345678901',
                    data_nascimento: new Date('1985-03-15'),
                    sexo: 'FEMININO',
                    telefone: '(11) 98765-4321',
                    email: 'maria.santos@email.com',
                    endereco: 'Rua das Flores, 123 - São Paulo/SP'
                }
            }),
            prisma.paciente.create({
                data: {
                    nome: 'Carlos Eduardo Lima',
                    cpf: '98765432109',
                    data_nascimento: new Date('1975-08-22'),
                    sexo: 'MASCULINO',
                    telefone: '(11) 95432-1098',
                    email: 'carlos.lima@email.com'
                }
            })
        ]);

        console.log('✅ Dados de teste criados:', {
            medico: testData.medico.crm,
            pacientes: testData.pacientes.length
        });
    }

    async function cleanDatabase() {
        await prisma.consulta.deleteMany({});
        await prisma.medico.deleteMany({});
        await prisma.paciente.deleteMany({});
        await prisma.sessao.deleteMany({});
        await prisma.usuario.deleteMany({});
    }

    test('🏥 Sistema deve estar online', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);

        expect(response.body.status).toBe('OK');
        expect(response.body.message).toContain('MediApp');
        console.log('✅ Sistema online e funcionando');
    });

    test('🔐 Médico deve conseguir fazer login', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'dr.teste@mediapp.com',
                senha: 'medico123'
            })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
        expect(response.body.usuario.tipo).toBe('MEDICO');
        
        authToken = response.body.token;
        console.log('✅ Login realizado com sucesso');
    });

    test('👨‍⚕️ Deve listar médicos cadastrados', async () => {
        const response = await request(app)
            .get('/api/medicos')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBe(1);
        
        const medico = response.body.data[0];
        expect(medico.crm).toBe('CRM123456');
        expect(medico.especialidade).toBe('Cardiologia');
        
        console.log('✅ Médicos listados:', response.body.data.length);
    });

    test('👥 Deve listar pacientes cadastrados', async () => {
        const response = await request(app)
            .get('/api/pacientes')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBe(2);
        
        const paciente = response.body.data[0];
        expect(paciente).toHaveProperty('nome');
        expect(paciente).toHaveProperty('cpf');
        
        console.log('✅ Pacientes listados:', response.body.data.length);
    });

    test('🔍 Deve buscar paciente por CPF', async () => {
        const cpf = testData.pacientes[0].cpf;
        
        const response = await request(app)
            .get(`/api/pacientes/buscar/${cpf}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.cpf).toBe(cpf);
        expect(response.body.data.nome).toBe('Maria Silva Santos');
        
        console.log('✅ Paciente encontrado:', response.body.data.nome);
    });

    test('📝 Deve criar nova consulta', async () => {
        const novaConsulta = {
            paciente_id: testData.pacientes[0].id,
            medico_id: testData.medico.id,
            data_consulta: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
            hora_consulta: '14:30',
            tipo: 'CONSULTA',
            observacoes: 'Consulta de cardiologia - primeira vez'
        };

        const response = await request(app)
            .post('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .send(novaConsulta)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.tipo).toBe('CONSULTA');
        expect(response.body.data.observacoes).toContain('cardiologia');
        
        testData.consulta = response.body.data;
        console.log('✅ Consulta criada:', response.body.data.id);
    });

    test('📋 Deve listar consultas criadas', async () => {
        const response = await request(app)
            .get('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBe(1);
        
        const consulta = response.body.data[0];
        expect(consulta.id).toBe(testData.consulta.id);
        expect(consulta.tipo).toBe('CONSULTA');
        
        console.log('✅ Consultas listadas:', response.body.data.length);
    });

    test('📊 Deve gerar estatísticas do sistema', async () => {
        const response = await request(app)
            .get('/api/estatisticas/resumo')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        
        const stats = response.body.data;
        expect(stats.total_medicos).toBe(1);
        expect(stats.total_pacientes).toBe(2);
        expect(stats.total_consultas).toBe(1);
        
        console.log('✅ Estatísticas:', stats);
    });

    test('🎯 Fluxo completo: buscar paciente → agendar consulta → verificar estatísticas', async () => {
        console.log('🎬 Iniciando fluxo completo...');
        
        // 1. Buscar segundo paciente
        const cpfPaciente = testData.pacientes[1].cpf;
        const paciente = await request(app)
            .get(`/api/pacientes/buscar/${cpfPaciente}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        console.log('🔍 Paciente encontrado:', paciente.body.data.nome);

        // 2. Agendar consulta
        const novaConsulta = {
            paciente_id: testData.pacientes[1].id,
            medico_id: testData.medico.id,
            data_consulta: new Date(Date.now() + 48 * 60 * 60 * 1000), // Em 2 dias
            hora_consulta: '09:15',
            tipo: 'RETORNO',
            observacoes: 'Consulta de retorno cardiológico'
        };

        const consulta = await request(app)
            .post('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .send(novaConsulta)
            .expect(201);

        console.log('📝 Consulta agendada:', consulta.body.data.id);

        // 3. Verificar estatísticas atualizadas
        const stats = await request(app)
            .get('/api/estatisticas/resumo')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(stats.body.data.total_consultas).toBe(2);
        console.log('📊 Estatísticas atualizadas:', stats.body.data.total_consultas, 'consultas');
        
        console.log('✅ Fluxo completo executado com sucesso!');
    });

    test('📱 Performance do Dashboard: carregamento simultâneo', async () => {
        console.log('📱 Testando performance do dashboard...');
        
        const startTime = Date.now();
        
        // Simular carregamento de dashboard - todas as requisições em paralelo
        const [
            medicosRes,
            pacientesRes, 
            consultasRes,
            estatisticasRes
        ] = await Promise.all([
            request(app).get('/api/medicos').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/pacientes').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/consultas').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/estatisticas/resumo').set('Authorization', `Bearer ${authToken}`)
        ]);
        
        const totalTime = Date.now() - startTime;
        
        // Verificar que todas foram bem-sucedidas
        expect(medicosRes.status).toBe(200);
        expect(pacientesRes.status).toBe(200);
        expect(consultasRes.status).toBe(200);
        expect(estatisticasRes.status).toBe(200);
        
        // Verificar performance
        expect(totalTime).toBeLessThan(1000); // Menos de 1 segundo
        
        console.log(`⚡ Dashboard carregado em ${totalTime}ms`);
        console.log('📊 Dados carregados:', {
            medicos: medicosRes.body.data.length,
            pacientes: pacientesRes.body.data.length,
            consultas: consultasRes.body.data.length,
            estatisticas: estatisticasRes.body.data
        });
        
        console.log('✅ Performance do dashboard aprovada!');
    });

    test('🔒 Segurança: rotas protegidas devem negar acesso sem token', async () => {
        const routesToTest = [
            '/api/medicos',
            '/api/pacientes',
            '/api/consultas',
            '/api/estatisticas/resumo'
        ];

        for (const route of routesToTest) {
            const response = await request(app)
                .get(route)
                .expect(403);
                
            expect(response.body.error).toContain('Token não fornecido');
        }

        console.log('✅ Todas as rotas estão devidamente protegidas');
    });
});