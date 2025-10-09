const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createRealisticTestData() {
    console.log('🧪 Criando dados de teste realistas para frontend...');

    try {
        // Limpar dados existentes
        await prisma.prescricao.deleteMany({});
        await prisma.consulta.deleteMany({});
        await prisma.prontuario.deleteMany({});
        await prisma.medico.deleteMany({});
        await prisma.paciente.deleteMany({});
        await prisma.usuario.deleteMany({});

        // Criar médicos realistas
        const medicos = [
            {
                nome: 'Dr. Carlos Alberto Santos',
                email: 'carlos.santos@clinicamedica.com',
                crm: '123456',
                crm_uf: 'SP',
                especialidade: 'Cardiologia',
                telefone: '(11) 3456-7890',
                celular: '(11) 98765-4321',
                endereco: 'Av. Paulista, 1500 - Conjunto 1205 - São Paulo/SP'
            },
            {
                nome: 'Dra. Ana Paula Oliveira',
                email: 'ana.oliveira@clinicamedica.com',
                crm: '654321',
                crm_uf: 'RJ',
                especialidade: 'Dermatologia',
                telefone: '(21) 2345-6789',
                celular: '(21) 99876-5432',
                endereco: 'Rua das Laranjeiras, 300 - Rio de Janeiro/RJ'
            },
            {
                nome: 'Dr. Roberto Silva Mendes',
                email: 'roberto.mendes@clinicamedica.com',
                crm: '789123',
                crm_uf: 'MG',
                especialidade: 'Ortopedia',
                telefone: '(31) 3333-4444',
                celular: '(31) 99999-8888',
                endereco: 'Av. Afonso Pena, 1000 - Belo Horizonte/MG'
            }
        ];

        const medicosCreated = [];
        for (const medicoData of medicos) {
            const senhaHash = await bcrypt.hash('medico123', 10);
            
            const usuario = await prisma.usuario.create({
                data: {
                    email: medicoData.email,
                    senha: senhaHash,
                    nome: medicoData.nome,
                    tipo: 'MEDICO',
                    ativo: true
                }
            });

            const medico = await prisma.medico.create({
                data: {
                    usuario_id: usuario.id,
                    crm: medicoData.crm,
                    crm_uf: medicoData.crm_uf,
                    especialidade: medicoData.especialidade,
                    telefone: medicoData.telefone,
                    celular: medicoData.celular,
                    endereco: medicoData.endereco
                }
            });

            medicosCreated.push({ ...medico, usuario });
        }

        // Criar pacientes realistas
        const pacientes = [
            {
                nome: 'Maria Silva Santos',
                cpf: '12345678901',
                rg: '123456789',
                data_nascimento: new Date('1985-03-15'),
                sexo: 'FEMININO',
                telefone: '(11) 99999-1111',
                celular: '(11) 88888-1111',
                email: 'maria.santos@email.com',
                endereco: 'Rua das Flores, 123 - Vila Madalena - São Paulo/SP',
                cep: '05435-000',
                cidade: 'São Paulo',
                uf: 'SP',
                profissao: 'Professora',
                estado_civil: 'CASADO',
                nome_contato: 'José Santos (esposo)',
                telefone_contato: '(11) 77777-1111',
                convenio: 'Unimed',
                numero_convenio: '123456789012'
            },
            {
                nome: 'João Pedro Oliveira',
                cpf: '98765432109',
                rg: '987654321',
                data_nascimento: new Date('1992-08-22'),
                sexo: 'MASCULINO',
                telefone: '(11) 88888-2222',
                celular: '(11) 99999-2222',
                email: 'joao.oliveira@email.com',
                endereco: 'Av. Augusta, 500 - Consolação - São Paulo/SP',
                cep: '01305-000',
                cidade: 'São Paulo',
                uf: 'SP',
                profissao: 'Engenheiro de Software',
                estado_civil: 'SOLTEIRO',
                nome_contato: 'Mariana Oliveira (mãe)',
                telefone_contato: '(11) 66666-2222'
            },
            {
                nome: 'Ana Beatriz Costa',
                cpf: '45678912345',
                rg: '456789123',
                data_nascimento: new Date('1978-11-30'),
                sexo: 'FEMININO',
                telefone: '(21) 77777-3333',
                celular: '(21) 99999-3333',
                email: 'ana.costa@email.com',
                endereco: 'Rua Copacabana, 200 - Copacabana - Rio de Janeiro/RJ',
                cep: '22070-010',
                cidade: 'Rio de Janeiro',
                uf: 'RJ',
                profissao: 'Arquiteta',
                estado_civil: 'DIVORCIADO',
                convenio: 'Bradesco Saúde',
                numero_convenio: '987654321098'
            },
            {
                nome: 'Carlos Eduardo Ferreira',
                cpf: '78912345678',
                rg: '789123456',
                data_nascimento: new Date('1965-06-12'),
                sexo: 'MASCULINO',
                telefone: '(31) 66666-4444',
                celular: '(31) 99999-4444',
                email: 'carlos.ferreira@email.com',
                endereco: 'Rua da Liberdade, 789 - Centro - Belo Horizonte/MG',
                cep: '30112-000',
                cidade: 'Belo Horizonte',
                uf: 'MG',
                profissao: 'Advogado',
                estado_civil: 'CASADO',
                nome_contato: 'Lucia Ferreira (esposa)',
                telefone_contato: '(31) 55555-4444'
            },
            {
                nome: 'Fernanda Lima Rodrigues',
                cpf: '15975348620',
                rg: '159753486',
                data_nascimento: new Date('1990-02-28'),
                sexo: 'FEMININO',
                telefone: '(11) 55555-5555',
                celular: '(11) 99999-5555',
                email: 'fernanda.lima@email.com',
                endereco: 'Av. Brigadeiro Faria Lima, 1000 - Itaim Bibi - São Paulo/SP',
                cep: '04538-132',
                cidade: 'São Paulo',
                uf: 'SP',
                profissao: 'Médica Veterinária',
                estado_civil: 'SOLTEIRO'
            }
        ];

        const pacientesCreated = [];
        for (const pacienteData of pacientes) {
            const paciente = await prisma.paciente.create({
                data: pacienteData
            });
            pacientesCreated.push(paciente);
        }

        // Criar prontuários e consultas realistas
        for (let i = 0; i < pacientesCreated.length; i++) {
            const paciente = pacientesCreated[i];
            const medico = medicosCreated[i % medicosCreated.length];

            const prontuario = await prisma.prontuario.create({
                data: {
                    paciente_id: paciente.id,
                    medico_id: medico.id,
                    data_consulta: new Date(),
                    tipo_consulta: 'CONSULTA_ROTINA',
                    queixa_principal: 'Consulta de rotina',
                    observacoes: `Prontuário criado para acompanhamento de ${paciente.nome}`
                }
            });

            // Criar consultas realistas
            const consultas = [
                {
                    data_hora: new Date('2024-10-01T10:00:00'),
                    tipo: 'CONSULTA_ROTINA',
                    status: 'CONCLUIDA',
                    observacoes: 'Consulta de rotina e check-up preventivo'
                },
                {
                    data_hora: new Date('2024-09-15T14:30:00'),
                    tipo: 'CONSULTA_RETORNO',
                    status: 'CONCLUIDA',
                    observacoes: 'Dor de cabeça frequente - retorno'
                }
            ];

            for (const consultaData of consultas) {
                await prisma.consulta.create({
                    data: {
                        ...consultaData,
                        medico_id: medico.id,
                        paciente_id: paciente.id
                    }
                });
            }
        }

        console.log('✅ Dados de teste criados com sucesso!');
        console.log(`📊 Resumo: ${medicosCreated.length} médicos, ${pacientesCreated.length} pacientes criados`);

    } catch (error) {
        console.error('❌ Erro ao criar dados de teste:', error);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    createRealisticTestData()
        .then(() => {
            console.log('🎉 Processo concluído!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Erro no processo:', error);
            process.exit(1);
        });
}

module.exports = { createRealisticTestData };