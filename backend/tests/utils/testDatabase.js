const { PrismaClient } = require('@prisma/client');

class TestDatabase {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mediapp_test'
        }
      }
    });
  }

  async connect() {
    await this.prisma.$connect();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  async cleanDatabase() {
    // Limpar dados em ordem para respeitar foreign keys
    const deleteOrder = [
      'consulta',
      'prontuario',
      'exame',
      'alergia',
      'medico',
      'paciente',
      'usuario'
    ];

    for (const table of deleteOrder) {
      try {
        await this.prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
        await this.prisma.$executeRawUnsafe(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1`);
      } catch (error) {
        console.warn(`Aviso ao limpar tabela ${table}:`, error.message);
      }
    }
  }

  async seedTestData() {
    // Criar dados de teste básicos
    const testUser = await this.prisma.usuario.create({
      data: {
        nome: 'Test User',
        email: 'test@mediapp.com',
        senha: 'hashedpassword',
        tipo: 'MEDICO'
      }
    });

    const testMedico = await this.prisma.medico.create({
      data: {
        nomeCompleto: 'Dr. Test Silva',
        cpf: '12345678901',
        crm: 'TEST123',
        especialidade: 'Cardiologia',
        telefone: '(11) 99999-9999',
        email: 'dr.test@mediapp.com',
        status: 'ATIVO',
        usuarioId: testUser.id
      }
    });

    const testPaciente = await this.prisma.paciente.create({
      data: {
        nomeCompleto: 'Paciente Test',
        cpf: '98765432100',
        dataNascimento: new Date('1990-01-01'),
        telefone: '(11) 88888-8888',
        email: 'paciente.test@email.com',
        ativo: true
      }
    });

    return {
      usuario: testUser,
      medico: testMedico,
      paciente: testPaciente
    };
  }
}

module.exports = TestDatabase;