const request = require('supertest');
const app = require('../../real-data-server');
const TestDatabase = require('../utils/testDatabase');
const TestHelpers = require('../utils/testHelpers');
const medicosFixtures = require('../fixtures/medicosFixtures');

describe('API de Médicos - Testes de Integração', () => {
  let testDb;
  let testData;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.connect();
  });

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.cleanDatabase();
    testData = await testDb.seedTestData();
  });

  describe('GET /api/medicos', () => {
    test('deve retornar lista de médicos com sucesso', async () => {
      const response = await request(app)
        .get('/api/medicos')
        .expect(200);

      const body = TestHelpers.expectSuccessResponse(response);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.total).toBeDefined();
      
      // Verificar estrutura do médico
      const medico = body.data[0];
      expect(medico).toHaveProperty('id');
      expect(medico).toHaveProperty('nomeCompleto');
      expect(medico).toHaveProperty('crm');
      expect(medico).toHaveProperty('especialidade');
    });

    test('deve retornar lista vazia quando não há médicos', async () => {
      await testDb.cleanDatabase();
      
      const response = await request(app)
        .get('/api/medicos')
        .expect(200);

      const body = TestHelpers.expectSuccessResponse(response);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBe(0);
      expect(body.total).toBe(0);
    });
  });

  describe('GET /api/medicos/:id', () => {
    test('deve retornar médico específico com sucesso', async () => {
      const medicoId = testData.medico.id;
      
      const response = await request(app)
        .get(`/api/medicos/${medicoId}`)
        .expect(200);

      const body = TestHelpers.expectSuccessResponse(response);
      expect(body.data).toHaveProperty('id', medicoId);
      expect(body.data).toHaveProperty('nomeCompleto');
      expect(body.data).toHaveProperty('crm');
      expect(body.data).toHaveProperty('_count');
    });

    test('deve retornar 404 para médico inexistente', async () => {
      const response = await request(app)
        .get('/api/medicos/99999')
        .expect(404);

      TestHelpers.expectErrorResponse(response, 404);
    });

    test('deve retornar erro para ID inválido', async () => {
      const response = await request(app)
        .get('/api/medicos/invalid-id')
        .expect(500);

      TestHelpers.expectErrorResponse(response, 500);
    });
  });

  describe('POST /api/medicos', () => {
    test('deve criar novo médico com sucesso', async () => {
      const medicoData = {
        ...medicosFixtures.validMedico,
        cpf: TestHelpers.generateUniqueCPF(),
        crm: TestHelpers.generateUniqueCRM(),
        email: TestHelpers.generateUniqueEmail()
      };

      const response = await request(app)
        .post('/api/medicos')
        .send(medicoData)
        .expect(201);

      const body = TestHelpers.expectSuccessResponse(response, 201);
      expect(body.data).toHaveProperty('id');
      expect(body.data.nomeCompleto).toBe(medicoData.nomeCompleto);
      expect(body.data.crm).toBe(medicoData.crm);
      expect(body.data.especialidade).toBe(medicoData.especialidade);
    });

    test('deve falhar ao criar médico sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/medicos')
        .send(medicosFixtures.invalidMedico)
        .expect(400);

      TestHelpers.expectValidationError(response, 'obrigatórios');
    });

    test('deve falhar ao criar médico com CRM duplicado', async () => {
      const medicoData = {
        ...medicosFixtures.validMedico,
        cpf: TestHelpers.generateUniqueCPF(),
        crm: testData.medico.crm, // CRM já existente
        email: TestHelpers.generateUniqueEmail()
      };

      const response = await request(app)
        .post('/api/medicos')
        .send(medicoData)
        .expect(400);

      TestHelpers.expectValidationError(response, 'CRM');
    });

    test('deve falhar ao criar médico com CPF duplicado', async () => {
      const medicoData = {
        ...medicosFixtures.validMedico,
        cpf: testData.medico.cpf, // CPF já existente
        crm: TestHelpers.generateUniqueCRM(),
        email: TestHelpers.generateUniqueEmail()
      };

      const response = await request(app)
        .post('/api/medicos')
        .send(medicoData)
        .expect(400);

      TestHelpers.expectValidationError(response, 'CPF');
    });
  });

  describe('PUT /api/medicos/:id', () => {
    test('deve atualizar médico com sucesso', async () => {
      const medicoId = testData.medico.id;
      const updateData = medicosFixtures.updateMedicoData;

      const response = await request(app)
        .put(`/api/medicos/${medicoId}`)
        .send(updateData)
        .expect(200);

      const body = TestHelpers.expectSuccessResponse(response);
      expect(body.data.nomeCompleto).toBe(updateData.nomeCompleto);
      expect(body.data.especialidade).toBe(updateData.especialidade);
      expect(body.data.telefone).toBe(updateData.telefone);
    });

    test('deve falhar ao atualizar médico inexistente', async () => {
      const response = await request(app)
        .put('/api/medicos/99999')
        .send(medicosFixtures.updateMedicoData)
        .expect(404);

      TestHelpers.expectErrorResponse(response, 404);
    });

    test('deve falhar ao atualizar com CRM duplicado', async () => {
      // Criar segundo médico
      const segundoMedico = await testDb.prisma.medico.create({
        data: {
          ...medicosFixtures.validMedico,
          cpf: TestHelpers.generateUniqueCPF(),
          crm: TestHelpers.generateUniqueCRM(),
          email: TestHelpers.generateUniqueEmail(),
          nomeCompleto: 'Dr. Segundo Médico'
        }
      });

      // Tentar atualizar primeiro médico com CRM do segundo
      const response = await request(app)
        .put(`/api/medicos/${testData.medico.id}`)
        .send({ crm: segundoMedico.crm })
        .expect(400);

      TestHelpers.expectValidationError(response, 'CRM');
    });
  });

  describe('DELETE /api/medicos/:id', () => {
    test('deve excluir médico sem relacionamentos (hard delete)', async () => {
      const medicoId = testData.medico.id;

      const response = await request(app)
        .delete(`/api/medicos/${medicoId}`)
        .expect(200);

      const body = TestHelpers.expectSuccessResponse(response);
      expect(body.type).toBe('hard_delete');

      // Verificar se foi realmente excluído
      const checkResponse = await request(app)
        .get(`/api/medicos/${medicoId}`)
        .expect(404);
    });

    test('deve desativar médico com relacionamentos (soft delete)', async () => {
      const medicoId = testData.medico.id;
      
      // Criar uma consulta para o médico
      await testDb.prisma.consulta.create({
        data: {
          medicoId: medicoId,
          pacienteId: testData.paciente.id,
          dataConsulta: new Date(),
          tipoConsulta: 'CONSULTA_ROTINA',
          status: 'AGENDADA'
        }
      });

      const response = await request(app)
        .delete(`/api/medicos/${medicoId}`)
        .expect(200);

      const body = TestHelpers.expectSuccessResponse(response);
      expect(body.type).toBe('soft_delete');

      // Verificar se foi desativado
      const checkResponse = await request(app)
        .get(`/api/medicos/${medicoId}`)
        .expect(200);
      
      expect(checkResponse.body.data.status).toBe('INATIVO');
    });

    test('deve falhar ao excluir médico inexistente', async () => {
      const response = await request(app)
        .delete('/api/medicos/99999')
        .expect(404);

      TestHelpers.expectErrorResponse(response, 404);
    });
  });

  describe('Validações e Regras de Negócio', () => {
    test('deve aceitar especialidades válidas', async () => {
      const especialidades = [
        'Cardiologia', 'Dermatologia', 'Endocrinologia', 
        'Gastroenterologia', 'Ginecologia', 'Neurologia'
      ];

      for (const especialidade of especialidades) {
        const medicoData = {
          ...medicosFixtures.validMedico,
          cpf: TestHelpers.generateUniqueCPF(),
          crm: TestHelpers.generateUniqueCRM(),
          email: TestHelpers.generateUniqueEmail(),
          especialidade
        };

        const response = await request(app)
          .post('/api/medicos')
          .send(medicoData)
          .expect(201);

        expect(response.body.data.especialidade).toBe(especialidade);
      }
    });

    test('deve aceitar status válidos', async () => {
      const statusList = ['ATIVO', 'INATIVO', 'PENDENTE'];

      for (const status of statusList) {
        const medicoData = {
          ...medicosFixtures.validMedico,
          cpf: TestHelpers.generateUniqueCPF(),
          crm: TestHelpers.generateUniqueCRM(),
          email: TestHelpers.generateUniqueEmail(),
          status
        };

        const response = await request(app)
          .post('/api/medicos')
          .send(medicoData)
          .expect(201);

        expect(response.body.data.status).toBe(status);
      }
    });

    test('deve definir status padrão como ATIVO quando não informado', async () => {
      const medicoData = {
        ...medicosFixtures.validMedico,
        cpf: TestHelpers.generateUniqueCPF(),
        crm: TestHelpers.generateUniqueCRM(),
        email: TestHelpers.generateUniqueEmail()
      };
      delete medicoData.status;

      const response = await request(app)
        .post('/api/medicos')
        .send(medicoData)
        .expect(201);

      expect(response.body.data.status).toBe('ATIVO');
    });
  });

  describe('Performance e Limites', () => {
    test('deve responder dentro do tempo limite', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/medicos')
        .expect(200);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5 segundos
    });

    test('deve lidar com campos opcionais nulos', async () => {
      const medicoData = {
        nomeCompleto: 'Dr. Campos Opcionais',
        cpf: TestHelpers.generateUniqueCPF(),
        crm: TestHelpers.generateUniqueCRM(),
        especialidade: 'Cardiologia',
        telefone: '(11) 99999-9999',
        email: TestHelpers.generateUniqueEmail(),
        // Campos opcionais omitidos
        cep: null,
        logradouro: null,
        observacoes: null
      };

      const response = await request(app)
        .post('/api/medicos')
        .send(medicoData)
        .expect(201);

      const body = TestHelpers.expectSuccessResponse(response, 201);
      expect(body.data.cep).toBeNull();
      expect(body.data.logradouro).toBeNull();
      expect(body.data.observacoes).toBeNull();
    });
  });
});