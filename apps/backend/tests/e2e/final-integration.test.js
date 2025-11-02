const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const app = require('../../src/server-prisma');

const prisma = new PrismaClient();

describe('🧪 Testes Integrados Completos', () => {
    let server;
    let testMedico;
    let testPaciente;
    let authToken;

    beforeAll(async () => {
        server = app.listen(3005);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Criar dados de teste diretamente
        await createTestData();
    });

    afterAll(async () => {
        if (server) server.close();
        await prisma.$disconnect();
    });

    async function createTestData() {
        console.log('🔧 Criando dados de teste...');
        
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
    }

    test('🏥 deve verificar status do sistema', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);

        expect(response.body.status).toBe('OK');
        expect(response.body.message).toContain('MediApp');
        expect(response.body.database).toBe('Connected');
    });

    test('🔐 deve autenticar médico', async () => {
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

    test('👨‍⚕️ deve listar médicos', async () => {
        const response = await request(app)
            .get('/api/medicos')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        
        const medico = response.body.data[0];
        expect(medico).toHaveProperty('crm');
        expect(medico).toHaveProperty('especialidade');
        expect(medico.especialidade).toBe('Clínica Geral');
    });

    test('👥 deve listar pacientes', async () => {
        const response = await request(app)
            .get('/api/pacientes')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        
        const paciente = response.body.data[0];
        expect(paciente).toHaveProperty('nome');
        expect(paciente).toHaveProperty('cpf');
        expect(paciente.nome).toBe('Paciente Teste Santos');
    });

    test('🔍 deve buscar paciente por CPF', async () => {
        const response = await request(app)
            .get('/api/pacientes/buscar/11111111111')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.cpf).toBe('11111111111');
        expect(response.body.data.nome).toBe('Paciente Teste Santos');
    });

    test('📝 deve criar nova consulta', async () => {
        const novaConsulta = {
            paciente_id: testPaciente.id,
            data_hora: new Date().toISOString(),
            tipo: 'CONSULTA_ROTINA',
            observacoes: 'Consulta de teste integrado - sistema funcionando'
        };

        const response = await request(app)
            .post('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .send(novaConsulta)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.tipo).toBe('CONSULTA_ROTINA');
        expect(response.body.data.observacoes).toContain('teste integrado');
        
        console.log('✅ Consulta criada:', response.body.data.id);
    });

    test('📋 deve listar consultas criadas', async () => {
        const response = await request(app)
            .get('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        
        const consulta = response.body.data[0];
        expect(consulta).toHaveProperty('paciente');
        expect(consulta).toHaveProperty('medico');
        expect(consulta).toHaveProperty('tipo');
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
        
        expect(response.body.data.total_medicos).toBeGreaterThan(0);
        expect(response.body.data.total_pacientes).toBeGreaterThan(0);
        expect(response.body.data.total_consultas).toBeGreaterThan(0);
    });

    test('🔒 deve proteger rotas com autenticação', async () => {
        // Sem token
        await request(app)
            .get('/api/consultas')
            .expect(401);

        // Token inválido
        await request(app)
            .get('/api/consultas')
            .set('Authorization', 'Bearer token-invalido')
            .expect(403);
            
        // Login com credenciais erradas
        await request(app)
            .post('/api/auth/login')
            .send({
                email: 'inexistente@email.com',
                senha: 'senhaerrada'
            })
            .expect(401);
    });

    test('⚡ deve ter boa performance', async () => {
        const tempos = [];

        for (let i = 0; i < 3; i++) {
            const inicio = Date.now();
            
            await request(app)
                .get('/health')
                .expect(200);
            
            tempos.push(Date.now() - inicio);
        }

        const tempoMedio = tempos.reduce((a, b) => a + b, 0) / tempos.length;
        expect(tempoMedio).toBeLessThan(100);
        
        console.log(`⚡ Performance: ${tempoMedio}ms (média de ${tempos.length} requisições)`);
    });

    test('🎯 deve simular fluxo completo', async () => {
        console.log('🎬 Iniciando simulação de fluxo completo...');
        
        // 1. Buscar paciente
        const pacienteBusca = await request(app)
            .get(`/api/pacientes/buscar/${testPaciente.cpf}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        console.log('✅ Paciente encontrado:', pacienteBusca.body.data.nome);

        // 2. Criar consulta
        const novaConsulta = {
            paciente_id: testPaciente.id,
            data_hora: new Date().toISOString(),
            tipo: 'CONSULTA_ROTINA',
            observacoes: 'Fluxo completo: Paciente em boa saúde, rotina preventiva'
        };

        const consultaCriada = await request(app)
            .post('/api/consultas')
            .set('Authorization', `Bearer ${authToken}`)
            .send(novaConsulta)
            .expect(201);

        console.log('✅ Consulta agendada:', consultaCriada.body.data.id);

        // 3. Atualizar consulta para concluída
        const consultaAtualizada = await request(app)
            .put(`/api/consultas/${consultaCriada.body.data.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                status: 'CONCLUIDA',
                observacoes: 'Consulta realizada com sucesso. Paciente orientado sobre prevenção.'
            })
            .expect(200);

        expect(consultaAtualizada.body.data.status).toBe('CONCLUIDA');
        console.log('✅ Consulta concluída com sucesso');

        // 4. Verificar histórico
        const historico = await request(app)
            .get(`/api/pacientes/${testPaciente.id}/consultas`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(historico.body.data.length).toBeGreaterThan(0);
        console.log(`✅ Histórico verificado: ${historico.body.data.length} consulta(s)`);

        console.log('🎉 Fluxo completo executado com sucesso!');
    });

    test('📱 deve simular dashboard carregamento', async () => {
        const inicio = Date.now();
        
        // Simular carregamento paralelo do dashboard
        const [medicosRes, pacientesRes, consultasRes, statsRes] = await Promise.all([
            request(app).get('/api/medicos').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/pacientes').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/consultas').set('Authorization', `Bearer ${authToken}`),
            request(app).get('/api/estatisticas/resumo').set('Authorization', `Bearer ${authToken}`)
        ]);

        const tempoTotal = Date.now() - inicio;

        // Verificar se todos carregaram
        expect(medicosRes.status).toBe(200);
        expect(pacientesRes.status).toBe(200);
        expect(consultasRes.status).toBe(200);
        expect(statsRes.status).toBe(200);

        // Performance
        expect(tempoTotal).toBeLessThan(1000);
        
        console.log(`📊 Dashboard carregado em ${tempoTotal}ms`);
        console.log(`   • ${medicosRes.body.data.length} médicos`);
        console.log(`   • ${pacientesRes.body.data.length} pacientes`);
        console.log(`   • ${consultasRes.body.data.length} consultas`);
    });
});