const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../../src/server-prisma');

const prisma = new PrismaClient();

describe('🧪 Testes Integrados Frontend-Backend', () => {
    let server;

    beforeAll(async () => {
        // Iniciar servidor de teste
        server = app.listen(3003);
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    afterAll(async () => {
        if (server) {
            server.close();
        }
        await prisma.$disconnect();
    });

    describe('🏥 APIs Médicas Integradas', () => {
        test('deve verificar status do sistema', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('OK');
            expect(response.body.message).toContain('MediApp');
            expect(response.body.database).toBe('Connected');
        });

        test('deve autenticar médico e acessar dados', async () => {
            // Autenticação
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                })
                .expect(200);

            expect(loginResponse.body.success).toBe(true);
            expect(loginResponse.body.token).toBeDefined();
            
            const token = loginResponse.body.token;

            // Listar médicos autenticado
            const medicosResponse = await request(app)
                .get('/api/medicos')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(medicosResponse.body.success).toBe(true);
            expect(medicosResponse.body.data.length).toBeGreaterThan(0);
        });

        test('deve gerenciar pacientes completo', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                });

            const token = loginResponse.body.token;

            // Listar pacientes
            const listResponse = await request(app)
                .get('/api/pacientes')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(listResponse.body.data.length).toBeGreaterThan(0);
            
            // Buscar paciente específico
            const paciente = listResponse.body.data[0];
            
            const getResponse = await request(app)
                .get(`/api/pacientes/${paciente.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(getResponse.body.data.id).toBe(paciente.id);
            expect(getResponse.body.data.nome).toBe(paciente.nome);
        });

        test('deve criar e gerenciar consultas', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                });

            const token = loginResponse.body.token;

            // Buscar paciente para consulta
            const pacientesResponse = await request(app)
                .get('/api/pacientes')
                .set('Authorization', `Bearer ${token}`);

            const paciente = pacientesResponse.body.data[0];

            // Criar nova consulta
            const novaConsulta = {
                paciente_id: paciente.id,
                data_hora: new Date().toISOString(),
                tipo: 'CONSULTA_ROTINA',
                observacoes: 'Consulta de teste integrado'
            };

            const createResponse = await request(app)
                .post('/api/consultas')
                .set('Authorization', `Bearer ${token}`)
                .send(novaConsulta)
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data.tipo).toBe('CONSULTA_ROTINA');

            // Listar consultas
            const listConsultasResponse = await request(app)
                .get('/api/consultas')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(listConsultasResponse.body.data.length).toBeGreaterThan(0);
        });

        test('deve validar dados de entrada rigorosamente', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                });

            const token = loginResponse.body.token;

            // Tentar criar paciente com dados inválidos
            const pacienteInvalido = {
                nome: '', // Nome vazio
                cpf: '123', // CPF inválido
                data_nascimento: 'data-inválida',
                sexo: 'INVALIDO'
            };

            const response = await request(app)
                .post('/api/pacientes')
                .set('Authorization', `Bearer ${token}`)
                .send(pacienteInvalido)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        test('deve buscar dados com filtros e paginação', async () => {
            // Buscar médicos por especialidade
            const especialidadeResponse = await request(app)
                .get('/api/medicos?especialidade=Cardiologia')
                .expect(200);

            expect(especialidadeResponse.body.success).toBe(true);
            
            // Verificar se filtro funcionou
            especialidadeResponse.body.data.forEach(medico => {
                expect(medico.especialidade).toBe('Cardiologia');
            });

            // Buscar pacientes paginados
            const paginatedResponse = await request(app)
                .get('/api/pacientes?page=1&limit=2')
                .expect(200);

            expect(paginatedResponse.body.success).toBe(true);
            expect(paginatedResponse.body.data.length).toBeLessThanOrEqual(2);
        });

        test('deve gerar relatórios e estatísticas', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                });

            const token = loginResponse.body.token;

            // Buscar estatísticas gerais
            const statsResponse = await request(app)
                .get('/api/estatisticas/resumo')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(statsResponse.body.success).toBe(true);
            expect(statsResponse.body.data).toHaveProperty('total_medicos');
            expect(statsResponse.body.data).toHaveProperty('total_pacientes');
            expect(statsResponse.body.data).toHaveProperty('total_consultas');
        });

        test('deve proteger rotas sensíveis', async () => {
            // Tentar acessar sem autenticação
            await request(app)
                .get('/api/consultas')
                .expect(401);

            // Tentar acessar com token inválido
            await request(app)
                .get('/api/consultas')
                .set('Authorization', 'Bearer token-inválido')
                .expect(401);

            // Login com credenciais erradas
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'usuario@inexistente.com',
                    senha: 'senhaerrada'
                })
                .expect(401);
        });

        test('deve simular fluxo completo de atendimento', async () => {
            // 1. Login do médico
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                });

            const token = loginResponse.body.token;

            // 2. Buscar paciente por CPF
            const cpfBusca = '12345678901';
            const pacienteResponse = await request(app)
                .get(`/api/pacientes/buscar/${cpfBusca}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const paciente = pacienteResponse.body.data;

            // 3. Criar nova consulta
            const novaConsulta = {
                paciente_id: paciente.id,
                data_hora: new Date().toISOString(),
                tipo: 'CONSULTA_ROTINA',
                observacoes: 'Consulta de rotina - paciente com boa saúde geral'
            };

            const consultaResponse = await request(app)
                .post('/api/consultas')
                .set('Authorization', `Bearer ${token}`)
                .send(novaConsulta)
                .expect(201);

            const consulta = consultaResponse.body.data;

            // 4. Atualizar status da consulta
            const updateResponse = await request(app)
                .put(`/api/consultas/${consulta.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    status: 'CONCLUIDA',
                    observacoes: 'Consulta finalizada com sucesso'
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);

            // 5. Verificar histórico do paciente
            const historicoResponse = await request(app)
                .get(`/api/pacientes/${paciente.id}/consultas`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(historicoResponse.body.data.length).toBeGreaterThan(0);
        });

        test('deve medir performance das APIs', async () => {
            const tempos = [];

            // Testar 5 requisições e medir tempo
            for (let i = 0; i < 5; i++) {
                const inicio = Date.now();
                
                await request(app)
                    .get('/health')
                    .expect(200);
                
                tempos.push(Date.now() - inicio);
            }

            const tempoMedio = tempos.reduce((a, b) => a + b, 0) / tempos.length;
            
            expect(tempoMedio).toBeLessThan(100); // Menos de 100ms em média
            console.log(`⚡ Tempo médio de resposta: ${tempoMedio}ms`);
        });
    });

    describe('📱 Simulação Frontend Real', () => {
        test('deve simular interação de dashboard médico', async () => {
            // Simular carregamento de dashboard
            const startTime = Date.now();
            
            // 1. Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                });

            const token = loginResponse.body.token;

            // 2. Carregar dados paralelos do dashboard
            const [medicosRes, pacientesRes, consultasRes, statsRes] = await Promise.all([
                request(app).get('/api/medicos').set('Authorization', `Bearer ${token}`),
                request(app).get('/api/pacientes').set('Authorization', `Bearer ${token}`),
                request(app).get('/api/consultas').set('Authorization', `Bearer ${token}`),
                request(app).get('/api/estatisticas/resumo').set('Authorization', `Bearer ${token}`)
            ]);

            const loadTime = Date.now() - startTime;

            // Verificar se todos os dados carregaram corretamente
            expect(medicosRes.status).toBe(200);
            expect(pacientesRes.status).toBe(200);
            expect(consultasRes.status).toBe(200);
            expect(statsRes.status).toBe(200);

            // Verificar performance
            expect(loadTime).toBeLessThan(2000); // Dashboard deve carregar em menos de 2s

            console.log(`📊 Dashboard carregado em ${loadTime}ms`);
        });

        test('deve simular busca rápida de paciente', async () => {
            // Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                });

            const token = loginResponse.body.token;

            // Simular digitação progressiva (como autocomplete)
            const buscas = ['123', '1234', '12345', '123456', '1234567890'];
            
            for (const busca of buscas) {
                const inicio = Date.now();
                
                const response = await request(app)
                    .get(`/api/pacientes/buscar/${busca}`)
                    .set('Authorization', `Bearer ${token}`);

                const tempo = Date.now() - inicio;
                
                // Busca deve ser rápida para responsividade
                expect(tempo).toBeLessThan(200);
                
                // Se encontrou resultado completo
                if (busca === '12345678901') {
                    expect(response.status).toBe(200);
                    expect(response.body.data).toBeDefined();
                }
            }
        });
    });
});