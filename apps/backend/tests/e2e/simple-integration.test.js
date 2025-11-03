const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('🧪 Testes Simples Frontend + Backend', () => {
    const baseUrl = 'http://localhost:3002';

    beforeAll(async () => {
        // Aguardar conexão com banco
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('🔍 Verificações Básicas', () => {
        test('deve conectar com o backend', async () => {
            const response = await request(baseUrl)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('OK');
            expect(response.body.message).toContain('MediApp');
        });

        test('deve listar médicos cadastrados', async () => {
            const response = await request(baseUrl)
                .get('/api/medicos')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
            
            // Verificar estrutura dos dados
            const medico = response.body.data[0];
            expect(medico).toHaveProperty('id');
            expect(medico).toHaveProperty('crm');
            expect(medico).toHaveProperty('especialidade');
            expect(medico.usuario).toHaveProperty('nome');
        });

        test('deve listar pacientes cadastrados', async () => {
            const response = await request(baseUrl)
                .get('/api/pacientes')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
            
            // Verificar estrutura dos dados
            const paciente = response.body.data[0];
            expect(paciente).toHaveProperty('id');
            expect(paciente).toHaveProperty('nome');
            expect(paciente).toHaveProperty('cpf');
            expect(paciente).toHaveProperty('data_nascimento');
        });

        test('deve autenticar médico com credenciais válidas', async () => {
            const response = await request(baseUrl)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.tipo).toBe('MEDICO');
        });

        test('deve buscar paciente por CPF', async () => {
            // Primeiro fazer login para obter token
            const loginResponse = await request(baseUrl)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                });

            const token = loginResponse.body.token;

            // Buscar paciente por CPF
            const response = await request(baseUrl)
                .get('/api/pacientes/buscar/12345678901')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.cpf).toBe('12345678901');
            expect(response.body.data.nome).toContain('Maria Silva Santos');
        });

        test('deve criar nova consulta', async () => {
            // Login
            const loginResponse = await request(baseUrl)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                });

            const token = loginResponse.body.token;

            // Buscar paciente para usar no teste
            const pacientesResponse = await request(baseUrl)
                .get('/api/pacientes')
                .set('Authorization', `Bearer ${token}`);

            const paciente = pacientesResponse.body.data[0];

            // Criar nova consulta
            const novaConsulta = {
                paciente_id: paciente.id,
                data_hora: new Date('2024-11-01T10:00:00').toISOString(),
                tipo: 'CONSULTA_ROTINA',
                observacoes: 'Nova consulta de teste criada via API'
            };

            const response = await request(baseUrl)
                .post('/api/consultas')
                .set('Authorization', `Bearer ${token}`)
                .send(novaConsulta)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.tipo).toBe('CONSULTA_ROTINA');
            expect(response.body.data.observacoes).toContain('teste');
        });

        test('deve validar dados de entrada', async () => {
            // Login
            const loginResponse = await request(baseUrl)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                });

            const token = loginResponse.body.token;

            // Tentar criar paciente com CPF inválido
            const pacienteInvalido = {
                nome: 'Teste Inválido',
                cpf: '123', // CPF muito curto
                data_nascimento: '1990-01-01',
                sexo: 'MASCULINO'
            };

            const response = await request(baseUrl)
                .post('/api/pacientes')
                .set('Authorization', `Bearer ${token}`)
                .send(pacienteInvalido)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        test('deve proteger rotas com autenticação', async () => {
            // Tentar acessar rota protegida sem token
            const response = await request(baseUrl)
                .get('/api/consultas')
                .expect(401);

            expect(response.body.error).toContain('Token');
        });

        test('deve filtrar médicos por especialidade', async () => {
            const response = await request(baseUrl)
                .get('/api/medicos?especialidade=Cardiologia')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            
            // Verificar se todos os médicos retornados são da especialidade solicitada
            response.body.data.forEach(medico => {
                expect(medico.especialidade).toBe('Cardiologia');
            });
        });

        test('deve calcular estatísticas básicas', async () => {
            const response = await request(baseUrl)
                .get('/api/estatisticas/resumo')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('total_medicos');
            expect(response.body.data).toHaveProperty('total_pacientes');
            expect(response.body.data).toHaveProperty('total_consultas');
            
            expect(response.body.data.total_medicos).toBeGreaterThan(0);
            expect(response.body.data.total_pacientes).toBeGreaterThan(0);
        });

        test('deve buscar histórico de consultas do paciente', async () => {
            // Login
            const loginResponse = await request(baseUrl)
                .post('/api/auth/login')
                .send({
                    email: 'carlos.santos@clinicamedica.com',
                    senha: 'medico123'
                });

            const token = loginResponse.body.token;

            // Buscar paciente
            const pacientesResponse = await request(baseUrl)
                .get('/api/pacientes')
                .set('Authorization', `Bearer ${token}`);

            const paciente = pacientesResponse.body.data[0];

            // Buscar histórico de consultas
            const response = await request(baseUrl)
                .get(`/api/pacientes/${paciente.id}/consultas`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    describe('📊 Performance e Qualidade', () => {
        test('deve responder rapidamente', async () => {
            const start = Date.now();
            
            await request(baseUrl)
                .get('/health')
                .expect(200);
            
            const responseTime = Date.now() - start;
            expect(responseTime).toBeLessThan(500); // Menos de 500ms
        });

        test('deve retornar dados estruturados corretamente', async () => {
            const response = await request(baseUrl)
                .get('/api/medicos')
                .expect(200);

            // Verificar estrutura padrão da resposta
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('timestamp');
            
            if (response.body.data.length > 0) {
                const medico = response.body.data[0];
                expect(medico).toHaveProperty('id');
                expect(medico).toHaveProperty('crm');
                expect(medico).toHaveProperty('especialidade');
                expect(medico).toHaveProperty('usuario');
                expect(medico.usuario).toHaveProperty('nome');
                expect(medico.usuario).toHaveProperty('email');
            }
        });

        test('deve validar tipos de dados corretamente', async () => {
            const response = await request(baseUrl)
                .get('/api/pacientes')
                .expect(200);

            if (response.body.data.length > 0) {
                const paciente = response.body.data[0];
                
                expect(typeof paciente.id).toBe('string');
                expect(typeof paciente.nome).toBe('string');
                expect(typeof paciente.cpf).toBe('string');
                expect(typeof paciente.ativo).toBe('boolean');
                expect(new Date(paciente.data_nascimento)).toBeInstanceOf(Date);
                expect(new Date(paciente.criado_em)).toBeInstanceOf(Date);
            }
        });
    });
});