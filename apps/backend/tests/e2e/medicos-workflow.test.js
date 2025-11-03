const request = require('supertest');
const app = require('../../real-data-server');
const TestDatabase = require('../utils/testDatabase');
const TestHelpers = require('../utils/testHelpers');
const medicosFixtures = require('../fixtures/medicosFixtures');

describe('Fluxo Completo de Gestão de Médicos - Testes E2E', () => {
  let testDb;
  let createdMedicoId;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.connect();
  });

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.cleanDatabase();
  });

  describe('Cenário: Gestão Completa de um Médico', () => {
    test('deve permitir o ciclo completo CRUD de um médico', async () => {
      // 1. CRIAR MÉDICO
      console.log('Testando criação de médico...');
      const novoMedico = {
        ...medicosFixtures.validMedico,
        cpf: TestHelpers.generateUniqueCPF(),
        crm: TestHelpers.generateUniqueCRM(),
        email: TestHelpers.generateUniqueEmail()
      };

      const createResponse = await request(app)
        .post('/api/medicos')
        .send(novoMedico)
        .expect(201);

      const createBody = TestHelpers.expectSuccessResponse(createResponse, 201);
      createdMedicoId = createBody.data.id;
      
      expect(createBody.data.nomeCompleto).toBe(novoMedico.nomeCompleto);
      expect(createBody.data.crm).toBe(novoMedico.crm);
      expect(createBody.data.especialidade).toBe(novoMedico.especialidade);
      expect(createBody.data.status).toBe('ATIVO');

      // 2. LISTAR MÉDICOS (verificar se aparece na lista)
      console.log('Testando listagem de médicos...');
      const listResponse = await request(app)
        .get('/api/medicos')
        .expect(200);

      const listBody = TestHelpers.expectSuccessResponse(listResponse);
      expect(listBody.data).toBeInstanceOf(Array);
      expect(listBody.data.length).toBe(1);
      expect(listBody.total).toBe(1);

      const medicoNaLista = listBody.data.find(m => m.id === createdMedicoId);
      expect(medicoNaLista).toBeDefined();
      expect(medicoNaLista.nomeCompleto).toBe(novoMedico.nomeCompleto);

      // 3. BUSCAR MÉDICO ESPECÍFICO
      console.log('Testando busca de médico específico...');
      const getResponse = await request(app)
        .get(`/api/medicos/${createdMedicoId}`)
        .expect(200);

      const getBody = TestHelpers.expectSuccessResponse(getResponse);
      expect(getBody.data.id).toBe(createdMedicoId);
      expect(getBody.data.nomeCompleto).toBe(novoMedico.nomeCompleto);
      expect(getBody.data.crm).toBe(novoMedico.crm);
      expect(getBody.data._count).toBeDefined();

      // 4. ATUALIZAR MÉDICO
      console.log('Testando atualização de médico...');
      const dadosAtualizacao = {
        nomeCompleto: 'Dr. João Silva Atualizado',
        especialidade: 'Neurologia',
        telefone: '(11) 88888-8888',
        observacoes: 'Médico atualizado via teste E2E'
      };

      const updateResponse = await request(app)
        .put(`/api/medicos/${createdMedicoId}`)
        .send(dadosAtualizacao)
        .expect(200);

      const updateBody = TestHelpers.expectSuccessResponse(updateResponse);
      expect(updateBody.data.nomeCompleto).toBe(dadosAtualizacao.nomeCompleto);
      expect(updateBody.data.especialidade).toBe(dadosAtualizacao.especialidade);
      expect(updateBody.data.telefone).toBe(dadosAtualizacao.telefone);
      expect(updateBody.data.observacoes).toBe(dadosAtualizacao.observacoes);

      // 5. VERIFICAR ATUALIZAÇÃO
      console.log('Verificando se a atualização foi persistida...');
      const verifyResponse = await request(app)
        .get(`/api/medicos/${createdMedicoId}`)
        .expect(200);

      const verifyBody = TestHelpers.expectSuccessResponse(verifyResponse);
      expect(verifyBody.data.nomeCompleto).toBe(dadosAtualizacao.nomeCompleto);
      expect(verifyBody.data.especialidade).toBe(dadosAtualizacao.especialidade);

      // 6. EXCLUIR MÉDICO (sem relacionamentos - hard delete)
      console.log('Testando exclusão de médico...');
      const deleteResponse = await request(app)
        .delete(`/api/medicos/${createdMedicoId}`)
        .expect(200);

      const deleteBody = TestHelpers.expectSuccessResponse(deleteResponse);
      expect(deleteBody.type).toBe('hard_delete');
      expect(deleteBody.message).toContain('excluído');

      // 7. VERIFICAR EXCLUSÃO
      console.log('Verificando se o médico foi excluído...');
      await request(app)
        .get(`/api/medicos/${createdMedicoId}`)
        .expect(404);

      // 8. VERIFICAR LISTA VAZIA
      const finalListResponse = await request(app)
        .get('/api/medicos')
        .expect(200);

      const finalListBody = TestHelpers.expectSuccessResponse(finalListResponse);
      expect(finalListBody.data).toBeInstanceOf(Array);
      expect(finalListBody.data.length).toBe(0);
      expect(finalListBody.total).toBe(0);
    });
  });

  describe('Cenário: Médico com Relacionamentos (Soft Delete)', () => {
    test('deve fazer soft delete quando médico tem consultas', async () => {
      // 1. Criar médico
      const novoMedico = {
        ...medicosFixtures.validMedico,
        cpf: TestHelpers.generateUniqueCPF(),
        crm: TestHelpers.generateUniqueCRM(),
        email: TestHelpers.generateUniqueEmail()
      };

      const createMedicoResponse = await request(app)
        .post('/api/medicos')
        .send(novoMedico)
        .expect(201);

      const medicoId = createMedicoResponse.body.data.id;

      // 2. Criar paciente
      const novoPaciente = TestHelpers.createPacienteData({
        cpf: TestHelpers.generateUniqueCPF(),
        email: TestHelpers.generateUniqueEmail()
      });

      const createPacienteResponse = await request(app)
        .post('/api/pacientes')
        .send(novoPaciente)
        .expect(201);

      const pacienteId = createPacienteResponse.body.data.id;

      // 3. Criar consulta (relacionamento)
      await testDb.prisma.consulta.create({
        data: {
          medicoId: medicoId,
          pacienteId: pacienteId,
          dataConsulta: new Date(),
          tipoConsulta: 'CONSULTA_ROTINA',
          status: 'AGENDADA'
        }
      });

      // 4. Tentar excluir médico (deve fazer soft delete)
      const deleteResponse = await request(app)
        .delete(`/api/medicos/${medicoId}`)
        .expect(200);

      const deleteBody = TestHelpers.expectSuccessResponse(deleteResponse);
      expect(deleteBody.type).toBe('soft_delete');
      expect(deleteBody.message).toContain('desativado');

      // 5. Verificar que médico ainda existe mas está inativo
      const getResponse = await request(app)
        .get(`/api/medicos/${medicoId}`)
        .expect(200);

      const getBody = TestHelpers.expectSuccessResponse(getResponse);
      expect(getBody.data.status).toBe('INATIVO');

      // 6. Verificar que não aparece na listagem normal (apenas ativos)
      const listResponse = await request(app)
        .get('/api/medicos')
        .expect(200);

      const listBody = TestHelpers.expectSuccessResponse(listResponse);
      const medicoNaLista = listBody.data.find(m => m.id === medicoId);
      expect(medicoNaLista).toBeUndefined();
    });
  });

  describe('Cenário: Validações de Negócio', () => {
    test('deve validar unicidade de CRM e CPF', async () => {
      // 1. Criar primeiro médico
      const primeiroMedico = {
        ...medicosFixtures.validMedico,
        cpf: TestHelpers.generateUniqueCPF(),
        crm: TestHelpers.generateUniqueCRM(),
        email: TestHelpers.generateUniqueEmail()
      };

      await request(app)
        .post('/api/medicos')
        .send(primeiroMedico)
        .expect(201);

      // 2. Tentar criar segundo médico com mesmo CRM
      const segundoMedicoMesmoCRM = {
        ...medicosFixtures.validMedico,
        cpf: TestHelpers.generateUniqueCPF(),
        crm: primeiroMedico.crm, // Mesmo CRM
        email: TestHelpers.generateUniqueEmail(),
        nomeCompleto: 'Dr. Segundo Médico'
      };

      const crmDuplicadoResponse = await request(app)
        .post('/api/medicos')
        .send(segundoMedicoMesmoCRM)
        .expect(400);

      TestHelpers.expectValidationError(crmDuplicadoResponse, 'CRM');

      // 3. Tentar criar terceiro médico com mesmo CPF
      const terceiroMedicoMesmoCPF = {
        ...medicosFixtures.validMedico,
        cpf: primeiroMedico.cpf, // Mesmo CPF
        crm: TestHelpers.generateUniqueCRM(),
        email: TestHelpers.generateUniqueEmail(),
        nomeCompleto: 'Dr. Terceiro Médico'
      };

      const cpfDuplicadoResponse = await request(app)
        .post('/api/medicos')
        .send(terceiroMedicoMesmoCPF)
        .expect(400);

      TestHelpers.expectValidationError(cpfDuplicadoResponse, 'CPF');
    });

    test('deve validar especialidades permitidas', async () => {
      const medicoEspecialidadeInvalida = {
        ...medicosFixtures.validMedico,
        cpf: TestHelpers.generateUniqueCPF(),
        crm: TestHelpers.generateUniqueCRM(),
        email: TestHelpers.generateUniqueEmail(),
        especialidade: 'Especialidade Inexistente'
      };

      const response = await request(app)
        .post('/api/medicos')
        .send(medicoEspecialidadeInvalida)
        .expect(400);

      TestHelpers.expectValidationError(response, 'especialidade');
    });
  });

  describe('Cenário: Performance e Carga', () => {
    test('deve lidar com múltiplos médicos eficientemente', async () => {
      const medicosParaCriar = 50;
      const promises = [];

      // Criar múltiplos médicos simultaneamente
      for (let i = 0; i < medicosParaCriar; i++) {
        const medicoData = {
          ...medicosFixtures.validMedico,
          cpf: TestHelpers.generateUniqueCPF(),
          crm: TestHelpers.generateUniqueCRM(),
          email: TestHelpers.generateUniqueEmail(),
          nomeCompleto: `Dr. Médico ${i + 1}`
        };

        promises.push(
          request(app)
            .post('/api/medicos')
            .send(medicoData)
            .expect(201)
        );
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const creationTime = Date.now() - startTime;

      console.log(`Tempo para criar ${medicosParaCriar} médicos: ${creationTime}ms`);
      expect(creationTime).toBeLessThan(30000); // 30 segundos

      // Verificar se todos foram criados
      const listResponse = await request(app)
        .get('/api/medicos')
        .expect(200);

      const listBody = TestHelpers.expectSuccessResponse(listResponse);
      expect(listBody.data.length).toBe(medicosParaCriar);
      expect(listBody.total).toBe(medicosParaCriar);
    });

    test('deve responder rapidamente para consultas', async () => {
      // Criar alguns médicos primeiro
      for (let i = 0; i < 10; i++) {
        const medicoData = {
          ...medicosFixtures.validMedico,
          cpf: TestHelpers.generateUniqueCPF(),
          crm: TestHelpers.generateUniqueCRM(),
          email: TestHelpers.generateUniqueEmail(),
          nomeCompleto: `Dr. Performance ${i + 1}`
        };

        await request(app)
          .post('/api/medicos')
          .send(medicoData)
          .expect(201);
      }

      // Medir tempo de resposta da listagem
      const startTime = Date.now();
      await request(app)
        .get('/api/medicos')
        .expect(200);
      const responseTime = Date.now() - startTime;

      console.log(`Tempo de resposta da listagem: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(1000); // 1 segundo
    });
  });

  describe('Cenário: Recuperação de Erros', () => {
    test('deve continuar funcionando após erros de validação', async () => {
      // 1. Tentar criar médico inválido
      await request(app)
        .post('/api/medicos')
        .send(medicosFixtures.invalidMedico)
        .expect(400);

      // 2. Verificar que sistema ainda funciona normalmente
      const medicoValido = {
        ...medicosFixtures.validMedico,
        cpf: TestHelpers.generateUniqueCPF(),
        crm: TestHelpers.generateUniqueCRM(),
        email: TestHelpers.generateUniqueEmail()
      };

      const createResponse = await request(app)
        .post('/api/medicos')
        .send(medicoValido)
        .expect(201);

      TestHelpers.expectSuccessResponse(createResponse, 201);
    });

    test('deve lidar graciosamente com IDs inválidos', async () => {
      // Tentar acessar médico com ID inválido
      await request(app)
        .get('/api/medicos/abc123')
        .expect(500);

      // Tentar acessar médico inexistente
      await request(app)
        .get('/api/medicos/99999')
        .expect(404);

      // Verificar que listagem ainda funciona
      const listResponse = await request(app)
        .get('/api/medicos')
        .expect(200);

      TestHelpers.expectSuccessResponse(listResponse);
    });
  });
});