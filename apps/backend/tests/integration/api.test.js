const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock do app para testes
const createTestApp = () => {
    const express = require('express');
    const cors = require('cors');
    const { PrismaClient } = require('@prisma/client');
    
    const app = express();
    const prisma = new PrismaClient();
    
    app.use(cors());
    app.use(express.json());
    
    // Middleware de autenticação simplificado para testes
    const authenticateToken = async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token de acesso requerido' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const usuario = await prisma.usuario.findUnique({
                where: { id: decoded.userId },
                include: { medico: true }
            });

            if (!usuario || !usuario.ativo) {
                return res.status(401).json({ error: 'Token inválido' });
            }

            req.user = usuario;
            next();
        } catch (error) {
            return res.status(403).json({ error: 'Token inválido' });
        }
    };

    // Rotas de teste
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, senha } = req.body;

            const usuario = await prisma.usuario.findUnique({
                where: { email },
                include: { medico: true }
            });

            if (!usuario || !usuario.ativo) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            const senhaValida = await bcrypt.compare(senha, usuario.senha);
            if (!senhaValida) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            const token = jwt.sign(
                { userId: usuario.id, tipo: usuario.tipo },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({
                success: true,
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo: usuario.tipo
                }
            });

        } catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    app.get('/api/medicos', async (req, res) => {
        try {
            const medicos = await prisma.medico.findMany({
                include: {
                    usuario: {
                        select: { nome: true, email: true, ativo: true }
                    }
                }
            });

            const medicosFormatados = medicos.map(medico => ({
                id: medico.id,
                nome: medico.usuario.nome,
                email: medico.usuario.email,
                crm: `${medico.crm}-${medico.crm_uf}`,
                especialidade: medico.especialidade
            }));

            res.json({
                success: true,
                data: medicosFormatados,
                total: medicosFormatados.length
            });

        } catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    app.get('/api/pacientes', async (req, res) => {
        try {
            const pacientes = await prisma.paciente.findMany({
                where: { ativo: true },
                include: {
                    _count: {
                        select: {
                            prontuarios: true,
                            consultas: true
                        }
                    }
                }
            });

            res.json({
                success: true,
                data: pacientes,
                total: pacientes.length
            });

        } catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    app.post('/api/pacientes', authenticateToken, async (req, res) => {
        try {
            const pacienteData = req.body;
            
            if (pacienteData.cpf) {
                const cpfExistente = await prisma.paciente.findUnique({
                    where: { cpf: pacienteData.cpf }
                });

                if (cpfExistente) {
                    return res.status(400).json({ error: 'CPF já está cadastrado' });
                }
            }

            const paciente = await prisma.paciente.create({
                data: {
                    ...pacienteData,
                    data_nascimento: new Date(pacienteData.data_nascimento)
                }
            });

            res.status(201).json({
                success: true,
                data: paciente
            });

        } catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    app.get('/health', async (req, res) => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                database: 'Connected'
            });
        } catch (error) {
            res.status(500).json({
                status: 'ERROR',
                database: 'Disconnected'
            });
        }
    });

    return { app, prisma };
};

describe('🧪 Testes de Integração - APIs', () => {
    let app, prisma, testUser, authToken;

    beforeAll(async () => {
        const testApp = createTestApp();
        app = testApp.app;
        prisma = testApp.prisma;
    });

    beforeEach(async () => {
        // Recriar usuário de teste a cada teste
        const senhaHash = await bcrypt.hash('123456', 4);
        testUser = await prisma.usuario.create({
            data: {
                email: 'test.integration@test.com',
                senha: senhaHash,
                nome: 'Dr. Teste Integração',
                tipo: 'MEDICO'
            }
        });

        await prisma.medico.create({
            data: {
                usuario_id: testUser.id,
                crm: 'TEST123',
                crm_uf: 'SP',
                especialidade: 'Teste'
            }
        });

        // Gerar token de autenticação
        authToken = jwt.sign(
            { userId: testUser.id, tipo: testUser.tipo },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    describe('Health Check', () => {
        test('GET /health deve retornar status OK', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('OK');
            expect(response.body.database).toBe('Connected');
            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('Autenticação', () => {
        test('POST /api/auth/login deve autenticar usuário válido', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test.integration@test.com',
                    senha: '123456'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.usuario.nome).toBe('Dr. Teste Integração');
            expect(response.body.usuario.email).toBe('test.integration@test.com');
        });

        test('POST /api/auth/login deve rejeitar credenciais inválidas', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test.integration@test.com',
                    senha: 'senha_errada'
                })
                .expect(401);

            expect(response.body.error).toBe('Credenciais inválidas');
        });

        test('POST /api/auth/login deve rejeitar email inexistente', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'inexistente@test.com',
                    senha: '123456'
                })
                .expect(401);

            expect(response.body.error).toBe('Credenciais inválidas');
        });
    });

    describe('API Médicos', () => {
        test('GET /api/medicos deve retornar lista de médicos', async () => {
            const response = await request(app)
                .get('/api/medicos')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.total).toBeGreaterThan(0);
            
            const medico = response.body.data.find(m => m.email === 'test.integration@test.com');
            expect(medico).toBeDefined();
            expect(medico.nome).toBe('Dr. Teste Integração');
            expect(medico.crm).toBe('TEST123-SP');
        });
    });

    describe('API Pacientes', () => {
        test('GET /api/pacientes deve retornar lista de pacientes', async () => {
            const response = await request(app)
                .get('/api/pacientes')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.total).toBeGreaterThanOrEqual(0);
        });

        test('POST /api/pacientes deve criar novo paciente', async () => {
            const novoPaciente = {
                nome: 'Paciente Teste API',
                cpf: '12312312312',
                data_nascimento: '1990-01-01',
                sexo: 'MASCULINO',
                telefone: '(11) 1234-5678',
                email: 'paciente.teste@email.com'
            };

            const response = await request(app)
                .post('/api/pacientes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(novoPaciente)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.nome).toBe('Paciente Teste API');
            expect(response.body.data.cpf).toBe('12312312312');
        });

        test('POST /api/pacientes deve rejeitar CPF duplicado', async () => {
            // Primeiro paciente
            const paciente1 = {
                nome: 'Primeiro Paciente',
                cpf: '99988877766',
                data_nascimento: '1990-01-01',
                sexo: 'MASCULINO'
            };

            await request(app)
                .post('/api/pacientes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(paciente1)
                .expect(201);

            // Segundo paciente com mesmo CPF
            const paciente2 = {
                nome: 'Segundo Paciente',
                cpf: '99988877766',
                data_nascimento: '1985-01-01',
                sexo: 'FEMININO'
            };

            const response = await request(app)
                .post('/api/pacientes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(paciente2)
                .expect(400);

            expect(response.body.error).toBe('CPF já está cadastrado');
        });

        test('POST /api/pacientes deve rejeitar requisição sem token', async () => {
            const novoPaciente = {
                nome: 'Paciente Sem Auth',
                cpf: '11111111111',
                data_nascimento: '1990-01-01',
                sexo: 'MASCULINO'
            };

            const response = await request(app)
                .post('/api/pacientes')
                .send(novoPaciente)
                .expect(401);

            expect(response.body.error).toBe('Token de acesso requerido');
        });
    });

    describe('Validações de Dados', () => {
        test('deve validar formato de data de nascimento', async () => {
            const pacienteInvalido = {
                nome: 'Paciente Data Inválida',
                cpf: '33333333333',
                data_nascimento: 'data-inválida',
                sexo: 'MASCULINO'
            };

            await request(app)
                .post('/api/pacientes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(pacienteInvalido)
                .expect(500); // Erro interno devido a data inválida
        });
    });

    describe('Performance', () => {
        test('API deve responder em menos de 1 segundo', async () => {
            const start = Date.now();
            
            await request(app)
                .get('/api/medicos')
                .expect(200);
                
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(1000);
        });
    });
});