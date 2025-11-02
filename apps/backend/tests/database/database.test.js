const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('🧪 Testes de Banco de Dados', () => {

    describe('Conexão e Configuração', () => {
        test('deve conectar ao banco de dados de teste', async () => {
            const result = await prisma.$queryRaw`SELECT 1 as test`;
            expect(result[0].test).toBe(1);
        });

        test('deve ter as tabelas necessárias', async () => {
            const tables = await prisma.$queryRaw`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            `;
            
            const tableNames = tables.map(t => t.table_name);
            
            expect(tableNames).toContain('usuarios');
            expect(tableNames).toContain('medicos');
            expect(tableNames).toContain('pacientes');
            expect(tableNames).toContain('prontuarios');
            expect(tableNames).toContain('consultas');
            expect(tableNames).toContain('prescricoes');
        });
    });

    describe('Transações e Integridade', () => {
        test('deve manter integridade referencial', async () => {
            // Criar usuário e médico
            const usuario = await prisma.usuario.create({
                data: {
                    email: 'transacao.test@test.com',
                    senha: await bcrypt.hash('123456', 4),
                    nome: 'Dr. Transação',
                    tipo: 'MEDICO'
                }
            });

            const medico = await prisma.medico.create({
                data: {
                    usuario_id: usuario.id,
                    crm: 'TRANS123',
                    crm_uf: 'SP',
                    especialidade: 'Teste'
                }
            });

            // Verificar se os registros foram criados corretamente
            expect(usuario.id).toBeDefined();
            expect(medico.id).toBeDefined();
            expect(medico.usuario_id).toBe(usuario.id);

            // Deletar médico primeiro
            await prisma.medico.delete({
                where: { id: medico.id }
            });

            // Agora deletar usuário deve funcionar
            await prisma.usuario.delete({
                where: { id: usuario.id }
            });

            // Verificar se foram realmente deletados
            const usuarioVerifica = await prisma.usuario.findUnique({
                where: { id: usuario.id }
            });
            const medicoVerifica = await prisma.medico.findUnique({
                where: { id: medico.id }
            });

            expect(usuarioVerifica).toBeNull();
            expect(medicoVerifica).toBeNull();
        });

        test('deve executar transação complexa', async () => {
            await prisma.$transaction(async (tx) => {
                // Criar usuário
                const usuario = await tx.usuario.create({
                    data: {
                        email: 'transacao.complexa@test.com',
                        senha: await bcrypt.hash('123456', 4),
                        nome: 'Dr. Transação Complexa',
                        tipo: 'MEDICO'
                    }
                });

                // Criar médico
                const medico = await tx.medico.create({
                    data: {
                        usuario_id: usuario.id,
                        crm: 'COMPLEX123',
                        crm_uf: 'SP',
                        especialidade: 'Cardiologia'
                    }
                });

                // Criar paciente
                const usuarioPaciente = await tx.usuario.create({
                    data: {
                        email: 'paciente.transacao@test.com',
                        senha: await bcrypt.hash('123456', 4),
                        nome: 'Paciente Transação',
                        tipo: 'ADMIN' // Mudando para ADMIN pois PACIENTE não existe no enum
                    }
                });

                const paciente = await tx.paciente.create({
                    data: {
                        nome: 'Paciente Transação',
                        cpf: '12345678901',
                        data_nascimento: new Date('1990-01-01'),
                        sexo: 'MASCULINO',
                        telefone: '11999999999'
                    }
                });

                expect(usuario.id).toBeDefined();
                expect(medico.id).toBeDefined();
                expect(paciente.id).toBeDefined();
            });
        });
    });

    describe('Consultas Complexas', () => {
        test('deve buscar estatísticas agregadas', async () => {
            const stats = await prisma.usuario.aggregate({
                _count: {
                    id: true
                },
                where: {
                    tipo: 'MEDICO'
                }
            });

            expect(stats._count.id).toBeGreaterThanOrEqual(0);
        });

        test('deve buscar com filtros e ordenação', async () => {
            const usuarios = await prisma.usuario.findMany({
                where: {
                    ativo: true
                },
                orderBy: {
                    criado_em: 'desc'
                },
                take: 5
            });

            expect(usuarios).toBeInstanceOf(Array);
            expect(usuarios.length).toBeLessThanOrEqual(5);
        });
    });

    describe('Performance e Índices', () => {
        test('deve executar consulta por CPF rapidamente', async () => {
            const start = Date.now();
            
            await prisma.paciente.findFirst({
                where: {
                    cpf: '12345678901'
                }
            });
            
            const end = Date.now();
            const executionTime = end - start;
            
            expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo
        });

        test('deve executar consulta por email rapidamente', async () => {
            const start = Date.now();
            
            await prisma.usuario.findFirst({
                where: {
                    email: 'test@example.com'
                }
            });
            
            const end = Date.now();
            const executionTime = end - start;
            
            expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo
        });
    });

    describe('Validações de Dados', () => {
        test('deve validar enums corretamente', async () => {
            const usuario = await prisma.usuario.create({
                data: {
                    email: 'enum.test@test.com',
                    senha: await bcrypt.hash('123456', 4),
                    nome: 'Teste Enum',
                    tipo: 'MEDICO'
                }
            });

            expect(usuario.tipo).toBe('MEDICO');
            expect(['MEDICO', 'PACIENTE', 'ADMIN']).toContain(usuario.tipo);
        });

        test('deve rejeitar enum inválido', async () => {
            await expect(
                prisma.usuario.create({
                    data: {
                        email: 'enum.invalid@test.com',
                        senha: await bcrypt.hash('123456', 4),
                        nome: 'Teste Enum Inválido',
                        tipo: 'TIPO_INVALIDO'
                    }
                })
            ).rejects.toThrow();
        });
    });

    describe('Backup e Restore', () => {
        test('deve conseguir fazer backup dos dados', async () => {
            const backup = {
                usuarios: await prisma.usuario.findMany(),
                medicos: await prisma.medico.findMany(),
                pacientes: await prisma.paciente.findMany(),
                timestamp: new Date()
            };

            expect(backup.usuarios).toBeInstanceOf(Array);
            expect(backup.medicos).toBeInstanceOf(Array);
            expect(backup.pacientes).toBeInstanceOf(Array);
            expect(backup.timestamp).toBeInstanceOf(Date);
        });
    });
});