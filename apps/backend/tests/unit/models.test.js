const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('🧪 Testes Unitários - Modelos', () => {
    
    describe('Usuario Model', () => {
        test('deve criar um usuário médico', async () => {
            const senhaHash = await bcrypt.hash('123456', 4);
            
            const usuario = await prisma.usuario.create({
                data: {
                    email: 'test.medico@test.com',
                    senha: senhaHash,
                    nome: 'Dr. Teste Silva',
                    tipo: 'MEDICO'
                }
            });

            expect(usuario).toBeDefined();
            expect(usuario.email).toBe('test.medico@test.com');
            expect(usuario.nome).toBe('Dr. Teste Silva');
            expect(usuario.tipo).toBe('MEDICO');
            expect(usuario.ativo).toBe(true);
        });

        test('deve impedir email duplicado', async () => {
            const senhaHash = await bcrypt.hash('123456', 4);
            
            // Primeiro usuário
            await prisma.usuario.create({
                data: {
                    email: 'duplicado@test.com',
                    senha: senhaHash,
                    nome: 'Primeiro Usuário',
                    tipo: 'MEDICO'
                }
            });

            // Segundo usuário com mesmo email - deve falhar
            await expect(
                prisma.usuario.create({
                    data: {
                        email: 'duplicado@test.com',
                        senha: senhaHash,
                        nome: 'Segundo Usuário',
                        tipo: 'ENFERMEIRO'
                    }
                })
            ).rejects.toThrow();
        });
    });

    describe('Medico Model', () => {
        test('deve criar um médico com usuário', async () => {
            const senhaHash = await bcrypt.hash('123456', 4);
            
            const usuario = await prisma.usuario.create({
                data: {
                    email: 'medico.completo@test.com',
                    senha: senhaHash,
                    nome: 'Dr. Médico Completo',
                    tipo: 'MEDICO'
                }
            });

            const medico = await prisma.medico.create({
                data: {
                    usuario_id: usuario.id,
                    crm: '123456',
                    crm_uf: 'SP',
                    especialidade: 'Cardiologia',
                    telefone: '(11) 1234-5678',
                    celular: '(11) 98765-4321'
                }
            });

            expect(medico).toBeDefined();
            expect(medico.crm).toBe('123456');
            expect(medico.especialidade).toBe('Cardiologia');
        });

        test('deve impedir CRM duplicado', async () => {
            const senhaHash = await bcrypt.hash('123456', 4);
            
            // Primeiro médico
            const usuario1 = await prisma.usuario.create({
                data: {
                    email: 'medico1@test.com',
                    senha: senhaHash,
                    nome: 'Dr. Primeiro',
                    tipo: 'MEDICO'
                }
            });

            await prisma.medico.create({
                data: {
                    usuario_id: usuario1.id,
                    crm: 'CRM_DUPLICADO',
                    crm_uf: 'SP',
                    especialidade: 'Cardiologia'
                }
            });

            // Segundo médico com mesmo CRM
            const usuario2 = await prisma.usuario.create({
                data: {
                    email: 'medico2@test.com',
                    senha: senhaHash,
                    nome: 'Dr. Segundo',
                    tipo: 'MEDICO'
                }
            });

            await expect(
                prisma.medico.create({
                    data: {
                        usuario_id: usuario2.id,
                        crm: 'CRM_DUPLICADO',
                        crm_uf: 'RJ',
                        especialidade: 'Pediatria'
                    }
                })
            ).rejects.toThrow();
        });
    });

    describe('Paciente Model', () => {
        test('deve criar um paciente completo', async () => {
            const paciente = await prisma.paciente.create({
                data: {
                    nome: 'João Silva Teste',
                    cpf: '12345678901',
                    rg: '123456789',
                    data_nascimento: new Date('1990-05-15'),
                    sexo: 'MASCULINO',
                    telefone: '(11) 1234-5678',
                    email: 'joao.teste@email.com',
                    endereco: 'Rua Teste, 123',
                    profissao: 'Engenheiro',
                    estado_civil: 'SOLTEIRO'
                }
            });

            expect(paciente).toBeDefined();
            expect(paciente.nome).toBe('João Silva Teste');
            expect(paciente.cpf).toBe('12345678901');
            expect(paciente.sexo).toBe('MASCULINO');
            expect(paciente.ativo).toBe(true);
        });

        test('deve calcular idade corretamente', async () => {
            const paciente = await prisma.paciente.create({
                data: {
                    nome: 'Maria Idade Teste',
                    cpf: '98765432100',
                    data_nascimento: new Date('1985-03-20'),
                    sexo: 'FEMININO'
                }
            });

            const idade = Math.floor((new Date() - new Date(paciente.data_nascimento)) / (365.25 * 24 * 60 * 60 * 1000));
            expect(idade).toBeGreaterThan(35);
            expect(idade).toBeLessThan(50);
        });
    });

    describe('Prontuario Model', () => {
        test('deve criar prontuário com relacionamentos', async () => {
            // Criar médico
            const senhaHash = await bcrypt.hash('123456', 4);
            const usuario = await prisma.usuario.create({
                data: {
                    email: 'medico.prontuario@test.com',
                    senha: senhaHash,
                    nome: 'Dr. Prontuário',
                    tipo: 'MEDICO'
                }
            });

            const medico = await prisma.medico.create({
                data: {
                    usuario_id: usuario.id,
                    crm: 'CRM_PRONT',
                    crm_uf: 'SP',
                    especialidade: 'Clínica Geral'
                }
            });

            // Criar paciente
            const paciente = await prisma.paciente.create({
                data: {
                    nome: 'Paciente Prontuário',
                    cpf: '11122233344',
                    data_nascimento: new Date('1980-01-01'),
                    sexo: 'MASCULINO'
                }
            });

            // Criar prontuário
            const prontuario = await prisma.prontuario.create({
                data: {
                    paciente_id: paciente.id,
                    medico_id: medico.id,
                    data_consulta: new Date(),
                    tipo_consulta: 'CONSULTA_ROTINA',
                    queixa_principal: 'Dor de cabeça',
                    historia_doenca_atual: 'Paciente relata dor de cabeça há 3 dias',
                    hipotese_diagnostica: 'Cefaleia tensional',
                    conduta: 'Prescrição de analgésico'
                }
            });

            expect(prontuario).toBeDefined();
            expect(prontuario.queixa_principal).toBe('Dor de cabeça');
            expect(prontuario.tipo_consulta).toBe('CONSULTA_ROTINA');
        });
    });

    describe('Relacionamentos', () => {
        test('deve buscar médico com usuário', async () => {
            const senhaHash = await bcrypt.hash('123456', 4);
            const usuario = await prisma.usuario.create({
                data: {
                    email: 'relacao.medico@test.com',
                    senha: senhaHash,
                    nome: 'Dr. Relacionamento',
                    tipo: 'MEDICO'
                }
            });

            const medico = await prisma.medico.create({
                data: {
                    usuario_id: usuario.id,
                    crm: 'CRM_REL',
                    crm_uf: 'SP',
                    especialidade: 'Neurologia'
                }
            });

            const medicoComUsuario = await prisma.medico.findUnique({
                where: { id: medico.id },
                include: { usuario: true }
            });

            expect(medicoComUsuario.usuario).toBeDefined();
            expect(medicoComUsuario.usuario.nome).toBe('Dr. Relacionamento');
            expect(medicoComUsuario.usuario.email).toBe('relacao.medico@test.com');
        });

        test('deve buscar paciente com contadores', async () => {
            const paciente = await prisma.paciente.create({
                data: {
                    nome: 'Paciente Contador',
                    cpf: '55566677788',
                    data_nascimento: new Date('1990-01-01'),
                    sexo: 'FEMININO'
                }
            });

            const pacienteComContadores = await prisma.paciente.findUnique({
                where: { id: paciente.id },
                include: {
                    _count: {
                        select: {
                            prontuarios: true,
                            consultas: true,
                            exames: true
                        }
                    }
                }
            });

            expect(pacienteComContadores._count).toBeDefined();
            expect(pacienteComContadores._count.prontuarios).toBe(0);
            expect(pacienteComContadores._count.consultas).toBe(0);
            expect(pacienteComContadores._count.exames).toBe(0);
        });
    });
});