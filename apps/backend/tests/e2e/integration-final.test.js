const request = require('supertest');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Import do app diretamente  
const app = require('../../src/server-prisma');
const prisma = new PrismaClient();

describe('🧪 Testes Integrados Finais', () => {
    let authToken;
    let testMedico;
    let testPaciente;

    // Criar dados de teste
    const createTestData = async () => {
        console.log('🔧 Criando dados de teste...');
        
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

        console.log('✅ Dados de teste criados');
        return { usuario, testMedico, testPaciente };
    };

    afterAll(async () => {
        // Limpar dados
        await prisma.consulta.deleteMany({});
        await prisma.medico.deleteMany({});
        await prisma.paciente.deleteMany({});
        await prisma.sessao.deleteMany({});
        await prisma.usuario.deleteMany({});
        await prisma.$disconnect();
    });

    test('🏥 deve verificar status do sistema', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);

        expect(response.body.status).toBe('OK');
        expect(response.body.message).toContain('MediApp');
        expect(response.body.database).toBe('Connected');
    });

    test('🔐 deve autenticar médico e obter token', async () => {
        // Criar dados primeiro
        await createTestData();
        
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
        console.log('🔑 Token obtido:', authToken.substring(0, 20) + '...');
    });

    test('👨‍⚕️ deve listar médicos com autenticação', async () => {
        const response = await request(app)
            .get('/api/medicos')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        
        const medico = response.body.data[0];
        expect(medico).toHaveProperty('crm');
        expect(medico).toHaveProperty('especialidade');
        console.log('👨‍⚕️ Médico encontrado:', medico.crm);
    });

    test('👥 deve listar pacientes com autenticação', async () => {
        const response = await request(app)
            .get('/api/pacientes')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        
        const paciente = response.body.data[0];
        expect(paciente).toHaveProperty('nome');
        expect(paciente).toHaveProperty('cpf');
        console.log('👥 Paciente encontrado:', paciente.nome);
    });

    test('🔍 deve buscar paciente por CPF', async () => {
        const response = await request(app)
            .get('/api/pacientes/buscar/11111111111')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.cpf).toBe('11111111111');
        console.log('🔍 Paciente CPF:', response.body.data.nome);
    });

    test('📝 deve criar nova consulta', async () => {
        const novaConsulta = {
            paciente_id: testPaciente.id,
            medico_id: testMedico.id,
            data_consulta: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
            hora_consulta: '14:00',
            tipo: 'CONSULTA',
            observacoes: 'Consulta de rotina de teste'
        };

        const response = await request(app)
            .post('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .send(novaConsulta)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.tipo).toBe('CONSULTA');
        console.log('📝 Consulta criada:', response.body.data.id);
    });

    test('📋 deve listar consultas criadas', async () => {
        const response = await request(app)
            .get('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        console.log('📋 Consultas encontradas:', response.body.data.length);
    });

    test('📊 deve gerar estatísticas', async () => {
        const response = await request(app)
            .get('/api/estatisticas/resumo')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('total_medicos');
        expect(response.body.data).toHaveProperty('total_pacientes');
        expect(response.body.data).toHaveProperty('total_consultas');
        console.log('📊 Estatísticas:', response.body.data);
    });

    test('🔒 deve proteger rotas sem autenticação', async () => {
        const response = await request(app)
            .get('/api/medicos')
            .expect(403);

        expect(response.body.error).toContain('Token não fornecido');
    });

    test('⚡ deve ter boa performance', async () => {
        const startTime = Date.now();
        
        const promises = [
            request(app).get('/health'),
            request(app).get('/health'),
            request(app).get('/health')
        ];
        
        await Promise.all(promises);
        
        const endTime = Date.now();
        const avgTime = (endTime - startTime) / 3;
        
        expect(avgTime).toBeLessThan(100); // Menos de 100ms por request
        console.log('⚡ Performance:', avgTime + 'ms (média de 3 requisições)');
    });

    test('🎯 deve simular fluxo completo de trabalho', async () => {
        console.log('🎬 Iniciando simulação de fluxo completo...');
        
        // 1. Buscar paciente
        const pacienteBusca = await request(app)
            .get(`/api/pacientes/buscar/${testPaciente.cpf}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        console.log('✅ Paciente encontrado:', pacienteBusca.body.data.nome);

        // 2. Listar médicos disponíveis
        const medicosDisponiveis = await request(app)
            .get('/api/medicos')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        console.log('✅ Médicos disponíveis:', medicosDisponiveis.body.data.length);

        // 3. Agendar consulta
        const novaConsulta = {
            paciente_id: testPaciente.id,
            medico_id: testMedico.id,
            data_consulta: new Date(Date.now() + 48 * 60 * 60 * 1000), // Em 2 dias
            hora_consulta: '10:30',
            tipo: 'RETORNO',
            observacoes: 'Consulta de retorno - fluxo completo'
        };

        const consultaCriada = await request(app)
            .post('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .send(novaConsulta)
            .expect(201);

        console.log('✅ Consulta agendada:', consultaCriada.body.data.id);

        // 4. Verificar estatísticas atualizadas
        const statsAtualizadas = await request(app)
            .get('/api/estatisticas/resumo')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        console.log('✅ Estatísticas atualizadas:', statsAtualizadas.body.data);

        expect(statsAtualizadas.body.data.total_consultas).toBeGreaterThan(0);
    });

    test('📱 deve simular carregamento de dashboard', async () => {
        console.log('📱 Simulando carregamento de dashboard...');
        
        const startTime = Date.now();
        
        // Simular carregamento simultâneo de dados do dashboard
        const [medicosRes, pacientesRes, consultasRes, statsRes] = await Promise.all([
            request(app).get('/api/medicos').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/pacientes').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/consultas').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/estatisticas/resumo').set('Authorization', `Bearer ${authToken}`)
        ]);
        
        const endTime = Date.now();
        
        // Verificar que todas as requisições foram bem-sucedidas
        expect(medicosRes.status).toBe(200);
        expect(pacientesRes.status).toBe(200);
        expect(consultasRes.status).toBe(200);
        expect(statsRes.status).toBe(200);

        // Performance
        const totalTime = endTime - startTime;
        expect(totalTime).toBeLessThan(1000); // Menos de 1 segundo total
        
        console.log('📊 Dashboard carregado em:', totalTime + 'ms');
        console.log('📊 Dados:', {
            medicos: medicosRes.body.data.length,
            pacientes: pacientesRes.body.data.length,
            consultas: consultasRes.body.data.length,
            stats: statsRes.body.data
        });
    });
});