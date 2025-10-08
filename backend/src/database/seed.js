const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // 1. Criar usuários e médicos
    console.log('👨‍⚕️ Criando médicos...');
    
    const medicos = [
        {
            email: 'carlos.oliveira@medifast.com',
            nome: 'Dr. Carlos Eduardo Oliveira',
            crm: '123456',
            crm_uf: 'SP',
            especialidade: 'Cardiologia',
            telefone: '(11) 3456-7890',
            celular: '(11) 99876-5432',
            endereco: 'Rua Augusta, 1245 - Consolacao, Sao Paulo - SP',
            formacao: 'USP - Faculdade de Medicina (2005), Residencia em Cardiologia - InCor (2008)',
            experiencia: '17 anos',
            horario_atendimento: 'Segunda a Sexta: 8h as 18h'
        },
        {
            email: 'ana.santos@medifast.com',
            nome: 'Dra. Ana Beatriz Costa Santos',
            crm: '789012',
            crm_uf: 'SP',
            especialidade: 'Pediatria',
            telefone: '(11) 3987-6543',
            celular: '(11) 98765-4321',
            endereco: 'Av. Paulista, 1578 - Bela Vista, Sao Paulo - SP',
            formacao: 'UNIFESP - Medicina (2008), Residencia em Pediatria - Hospital Sao Paulo (2011)',
            experiencia: '14 anos',
            horario_atendimento: 'Segunda a Quinta: 7h as 17h, Sexta: 7h as 12h'
        },
        {
            email: 'roberto.mendes@medifast.com',
            nome: 'Dr. Roberto Mendes Silva',
            crm: '345678',
            crm_uf: 'SP',
            especialidade: 'Ortopedia',
            telefone: '(11) 3321-9876',
            celular: '(11) 97654-3210',
            endereco: 'Rua Oscar Freire, 987 - Jardins, Sao Paulo - SP',
            formacao: 'PUC-SP - Medicina (2003), Residencia em Ortopedia - HC-FMUSP (2007)',
            experiencia: '20 anos',
            horario_atendimento: 'Terca e Quinta: 14h as 19h, Sabado: 8h as 12h'
        },
        {
            email: 'fernanda.lima@medifast.com',
            nome: 'Dra. Fernanda Lima Rodrigues',
            crm: '901234',
            crm_uf: 'SP',
            especialidade: 'Ginecologia e Obstetricia',
            telefone: '(11) 3654-7890',
            celular: '(11) 96543-2109',
            endereco: 'Rua Haddock Lobo, 456 - Cerqueira Cesar, Sao Paulo - SP',
            formacao: 'Santa Casa - Medicina (2006), Residencia em GO - Hospital das Clinicas (2010)',
            experiencia: '15 anos',
            horario_atendimento: 'Segunda, Quarta e Sexta: 9h as 18h'
        },
        {
            email: 'paulo.almeida@medifast.com',
            nome: 'Dr. Paulo Cesar Almeida',
            crm: '567890',
            crm_uf: 'SP',
            especialidade: 'Neurologia',
            telefone: '(11) 3789-0123',
            celular: '(11) 95432-1098',
            endereco: 'Av. Brigadeiro Faria Lima, 2034 - Jardim Paulistano, Sao Paulo - SP',
            formacao: 'USP - Medicina (2001), Residencia em Neurologia - HC-FMUSP (2005)',
            experiencia: '22 anos',
            horario_atendimento: 'Segunda a Quarta: 8h as 17h, Quinta: 13h as 19h'
        }
    ];

    const medicosCreated = [];
    for (const medicoData of medicos) {
        const hashedPassword = await bcrypt.hash('123456', 12);
        
        const usuario = await prisma.usuario.create({
            data: {
                email: medicoData.email,
                senha: hashedPassword,
                nome: medicoData.nome,
                tipo: 'MEDICO'
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
                endereco: medicoData.endereco,
                formacao: medicoData.formacao,
                experiencia: medicoData.experiencia,
                horario_atendimento: medicoData.horario_atendimento
            }
        });

        medicosCreated.push(medico);
    }

    // 2. Criar pacientes
    console.log('👥 Criando pacientes...');
    
    const pacientes = [
        {
            nome: 'Joao Silva Santos',
            cpf: '12345678901',
            rg: '123456789',
            data_nascimento: new Date('1979-03-15'),
            sexo: 'MASCULINO',
            telefone: '(11) 98765-4321',
            celular: '(11) 97654-3210',
            email: 'joao.silva@email.com',
            endereco: 'Rua das Flores, 123 - Vila Madalena, Sao Paulo - SP',
            cep: '05435-020',
            cidade: 'Sao Paulo',
            uf: 'SP',
            profissao: 'Engenheiro Civil',
            estado_civil: 'CASADO',
            nome_contato: 'Maria Silva Santos (esposa)',
            telefone_contato: '(11) 96543-2109',
            convenio: 'Unimed Premium',
            numero_convenio: '123456789012',
            observacoes: 'Paciente colaborativo, historico familiar de problemas cardiacos'
        },
        {
            nome: 'Maria Santos Costa',
            cpf: '98765432109',
            rg: '987654321',
            data_nascimento: new Date('1992-07-22'),
            sexo: 'FEMININO',
            telefone: '(11) 87654-3210',
            celular: '(11) 86543-2109',
            email: 'maria.costa@email.com',
            endereco: 'Av. Sao Joao, 456 - Centro, Sao Paulo - SP',
            cep: '01035-000',
            cidade: 'Sao Paulo',
            uf: 'SP',
            profissao: 'Professora',
            estado_civil: 'SOLTEIRO',
            nome_contato: 'Jose Santos (pai)',
            telefone_contato: '(11) 85432-1098',
            convenio: 'Bradesco Saude',
            numero_convenio: '987654321098',
            observacoes: 'Paciente jovem, busca acompanhamento preventivo'
        },
        {
            nome: 'Carlos Roberto Mendes',
            cpf: '45678912345',
            rg: '456789123',
            data_nascimento: new Date('1966-11-08'),
            sexo: 'MASCULINO',
            telefone: '(11) 76543-2109',
            celular: '(11) 75432-1098',
            email: 'carlos.mendes@empresa.com',
            endereco: 'Rua Consolacao, 789 - Consolacao, Sao Paulo - SP',
            cep: '01302-100',
            cidade: 'Sao Paulo',
            uf: 'SP',
            profissao: 'Contador',
            estado_civil: 'DIVORCIADO',
            nome_contato: 'Ana Mendes (filha)',
            telefone_contato: '(11) 74321-0987',
            convenio: 'SulAmerica',
            numero_convenio: '456789123456',
            observacoes: 'Paciente com boa aderencia ao tratamento, trabalha sentado'
        },
        {
            nome: 'Ana Paula Rodrigues Lima',
            cpf: '78912345678',
            rg: '789123456',
            data_nascimento: new Date('1996-04-12'),
            sexo: 'FEMININO',
            telefone: '(11) 65432-1098',
            celular: '(11) 64321-0987',
            email: 'anapaula@startup.com',
            endereco: 'Rua Augusta, 2134 - Jardins, Sao Paulo - SP',
            cep: '01412-100',
            cidade: 'Sao Paulo',
            uf: 'SP',
            profissao: 'Designer UX/UI',
            estado_civil: 'SOLTEIRO',
            nome_contato: 'Beatriz Lima (mae)',
            telefone_contato: '(11) 63210-9876',
            convenio: 'Particular',
            observacoes: 'Paciente jovem, trabalha muito tempo no computador'
        },
        {
            nome: 'Roberto Silva Oliveira',
            cpf: '32165498732',
            rg: '321654987',
            data_nascimento: new Date('1952-09-30'),
            sexo: 'MASCULINO',
            telefone: '(11) 54321-0987',
            celular: '(11) 53210-9876',
            email: 'roberto.oliveira@aposentado.com',
            endereco: 'Rua Pamplona, 567 - Jardim Paulista, Sao Paulo - SP',
            cep: '01405-001',
            cidade: 'Sao Paulo',
            uf: 'SP',
            profissao: 'Aposentado (ex-bancario)',
            estado_civil: 'VIUVO',
            nome_contato: 'Marcos Oliveira (filho)',
            telefone_contato: '(11) 52109-8765',
            convenio: 'Golden Cross',
            numero_convenio: '321654987321',
            observacoes: 'Paciente idoso, necessita acompanhamento cardiologico regular'
        },
        {
            nome: 'Beatriz Santos Almeida',
            cpf: '65432109876',
            rg: '654321098',
            data_nascimento: new Date('1989-12-03'),
            sexo: 'FEMININO',
            telefone: '(11) 43210-9876',
            celular: '(11) 42109-8765',
            email: 'beatriz.almeida@advocacia.com',
            endereco: 'Av. Faria Lima, 1478 - Itaim Bibi, Sao Paulo - SP',
            cep: '04567-890',
            cidade: 'Sao Paulo',
            uf: 'SP',
            profissao: 'Advogada',
            estado_civil: 'CASADO',
            nome_contato: 'Fernando Almeida (esposo)',
            telefone_contato: '(11) 41098-7654',
            convenio: 'Amil',
            numero_convenio: '654321098654',
            observacoes: 'Gestante - 20 semanas, primeira gestacao'
        }
    ];

    const pacientesCreated = [];
    for (const pacienteData of pacientes) {
        const paciente = await prisma.paciente.create({
            data: pacienteData
        });
        pacientesCreated.push(paciente);
    }

    // 3. Criar alergias, medicamentos e doenças preexistentes
    console.log('💊 Criando alergias e medicamentos...');
    
    // Alergias
    await prisma.alergia.create({
        data: {
            paciente_id: pacientesCreated[0].id,
            substancia: 'Dipirona',
            tipo_reacao: 'Erupcao cutanea',
            gravidade: 'MODERADA',
            observacoes: 'Manifestacao em 30 minutos apos administracao'
        }
    });

    await prisma.alergia.create({
        data: {
            paciente_id: pacientesCreated[0].id,
            substancia: 'Penicilina',
            tipo_reacao: 'Choque anafilatico',
            gravidade: 'GRAVE',
            observacoes: 'Reacao severa documentada em 2018'
        }
    });

    // Medicamentos em uso
    await prisma.medicamentoUso.create({
        data: {
            paciente_id: pacientesCreated[0].id,
            nome_medicamento: 'Losartana',
            dosagem: '50mg',
            frequencia: '1x ao dia',
            via_administracao: 'Via oral',
            data_inicio: new Date('2023-01-15'),
            observacoes: 'Para controle da hipertensao'
        }
    });

    await prisma.medicamentoUso.create({
        data: {
            paciente_id: pacientesCreated[2].id,
            nome_medicamento: 'Metformina',
            dosagem: '850mg',
            frequencia: '2x ao dia',
            via_administracao: 'Via oral',
            data_inicio: new Date('2022-06-10'),
            observacoes: 'Controle do diabetes tipo 2'
        }
    });

    // Doenças preexistentes
    await prisma.doencaPreexistente.create({
        data: {
            paciente_id: pacientesCreated[0].id,
            nome_doenca: 'Hipertensao arterial',
            cid: 'I10',
            data_diagnostico: new Date('2020-05-10'),
            status: 'CONTROLADA',
            observacoes: 'Controlada com medicacao'
        }
    });

    await prisma.doencaPreexistente.create({
        data: {
            paciente_id: pacientesCreated[2].id,
            nome_doenca: 'Diabetes mellitus tipo 2',
            cid: 'E11',
            data_diagnostico: new Date('2019-03-20'),
            status: 'EM_TRATAMENTO',
            observacoes: 'Acompanhamento endocrinologico regular'
        }
    });

    console.log('✅ Seed concluído com sucesso!');
    console.log(`👨‍⚕️ ${medicosCreated.length} médicos criados`);
    console.log(`👥 ${pacientesCreated.length} pacientes criados`);
    console.log('💊 Alergias, medicamentos e doenças preexistentes adicionados');
}

main()
    .catch((e) => {
        console.error('❌ Erro durante seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });