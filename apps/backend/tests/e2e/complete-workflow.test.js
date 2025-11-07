/**
 * Testes E2E - Workflow Completo da Aplicação
 * Testa fluxos completos: cadastro → login → operações médicas → logout
 */

const request = require('supertest');
const app = require('../../src/app');
const { testDatabaseSetup, cleanupTestData } = require('../utils/testHelpers');
const AuthService = require('../../src/services/authService');

describe('🌐 E2E Workflow Tests', () => {

  let adminToken;
  let medicoToken;
  let medicoId;
  let pacienteId;
  let consultaId;

  beforeAll(async () => {
    await testDatabaseSetup();
    
    // Criar admin para operações privilegiadas
    adminToken = AuthService.generateToken({
      userId: 1,
      email: 'admin@medfast.com',
      tipo: 'admin'
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('🏥 Complete Medical Workflow', () => {

    test('1. Admin deve cadastrar novo médico', async () => {
      const novoMedico = {
        nome: 'Dr. Workflow Test',
        email: 'workflow@medfast.com',
        senha: 'WorkflowTest123@',
        cpf: '12345678901',
        telefone: '11987654321',
        crm: 'WF123456',
        especialidade: 'Cardiologia',
        endereco: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          numero: '1000',
          cidade: 'São Paulo',
          estado: 'SP'
        }
      };

      const response = await request(app)
        .post('/api/medicos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoMedico)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.medico.crm).toBe('WF123456');
      expect(response.body.data.usuario.email).toBe('workflow@medfast.com');
      
      medicoId = response.body.data.medico.id;
    });

    test('2. Médico deve fazer login com credenciais criadas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'workflow@medfast.com',
          password: 'WorkflowTest123@'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.tipo).toBe('medico');
      
      medicoToken = response.body.data.token;
    });

    test('3. Médico deve acessar seu próprio perfil', async () => {
      const response = await request(app)
        .get(`/api/medicos/${medicoId}`)
        .set('Authorization', `Bearer ${medicoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.crm).toBe('WF123456');
      expect(response.body.data.especialidade).toBe('Cardiologia');
    });

    test('4. Médico deve cadastrar novo paciente', async () => {
      const novoPaciente = {
        nome: 'João Workflow Silva',
        cpf: '98765432100',
        telefone: '11912345678',
        email: 'joao.workflow@test.com',
        dataNascimento: '1985-06-15',
        sexo: 'M',
        endereco: {
          cep: '04038-000',
          logradouro: 'Rua da Consolação',
          numero: '500',
          cidade: 'São Paulo',
          estado: 'SP'
        },
        historicoMedico: 'Hipertensão controlada'
      };

      const response = await request(app)
        .post('/api/pacientes')
        .set('Authorization', `Bearer ${medicoToken}`)
        .send(novoPaciente)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe('João Workflow Silva');
      expect(response.body.data.cpf).toBe('98765432100');
      
      pacienteId = response.body.data.id;
    });

    test('5. Médico deve agendar consulta para paciente', async () => {
      const novaConsulta = {
        pacienteId: pacienteId,
        medicoId: medicoId,
        dataHora: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
        tipoConsulta: 'consulta_inicial',
        observacoes: 'Primeira consulta - check-up completo'
      };

      const response = await request(app)
        .post('/api/consultas')
        .set('Authorization', `Bearer ${medicoToken}`)
        .send(novaConsulta)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pacienteId).toBe(pacienteId);
      expect(response.body.data.medicoId).toBe(medicoId);
      expect(response.body.data.status).toBe('agendada');
      
      consultaId = response.body.data.id;
    });

    test('6. Médico deve listar suas consultas agendadas', async () => {
      const response = await request(app)
        .get('/api/consultas')
        .set('Authorization', `Bearer ${medicoToken}`)
        .query({ medicoId: medicoId, status: 'agendada' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const consulta = response.body.data.find(c => c.id === consultaId);
      expect(consulta).toBeDefined();
      expect(consulta.paciente.nome).toBe('João Workflow Silva');
    });

    test('7. Médico deve atualizar status da consulta para realizada', async () => {
      const atualizacaoConsulta = {
        status: 'realizada',
        diagnostico: 'Pressão arterial elevada. Necessário acompanhamento.',
        prescricao: 'Losartana 50mg - 1x ao dia\nDieta hipossódica\nExercícios leves',
        observacoes: 'Paciente orientado sobre mudanças no estilo de vida'
      };

      const response = await request(app)
        .put(`/api/consultas/${consultaId}`)
        .set('Authorization', `Bearer ${medicoToken}`)
        .send(atualizacaoConsulta)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('realizada');
      expect(response.body.data.diagnostico).toContain('Pressão arterial');
    });

    test('8. Médico deve buscar histórico do paciente', async () => {
      const response = await request(app)
        .get(`/api/pacientes/${pacienteId}/historico`)
        .set('Authorization', `Bearer ${medicoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paciente.id).toBe(pacienteId);
      expect(response.body.data.consultas).toBeInstanceOf(Array);
      expect(response.body.data.consultas.length).toBeGreaterThan(0);
      
      const consultaRealizada = response.body.data.consultas.find(c => c.id === consultaId);
      expect(consultaRealizada.status).toBe('realizada');
      expect(consultaRealizada.diagnostico).toBeDefined();
    });

    test('9. Médico deve gerar relatório de atendimentos', async () => {
      const response = await request(app)
        .get('/api/relatorios/atendimentos')
        .set('Authorization', `Bearer ${medicoToken}`)
        .query({
          medicoId: medicoId,
          dataInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          dataFim: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalConsultas).toBeGreaterThan(0);
      expect(response.body.data.consultasRealizadas).toBeGreaterThan(0);
      expect(response.body.data.detalhes).toBeInstanceOf(Array);
    });

    test('10. Médico deve fazer logout com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${medicoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logout');
    });

  });

  describe('🔒 Security and Validation Workflow', () => {

    test('deve bloquear acesso após logout', async () => {
      const response = await request(app)
        .get('/api/medicos/perfil')
        .set('Authorization', `Bearer ${medicoToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('deve validar dados em todas as etapas', async () => {
      // Login inválido
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid', password: '123' })
        .expect(400);

      // Cadastro de médico inválido
      await request(app)
        .post('/api/medicos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Dr. Inválido' }) // Dados incompletos
        .expect(400);

      // Cadastro de paciente inválido
      await request(app)
        .post('/api/pacientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'João', cpf: 'cpf_inválido' })
        .expect(400);
    });

    test('deve respeitar permissões de acesso', async () => {
      // Médico não pode acessar dados de outro médico
      const response = await request(app)
        .get('/api/medicos/999')
        .set('Authorization', `Bearer ${medicoToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('acesso');
    });

  });

  describe('📊 Data Integrity Workflow', () => {

    test('deve manter consistência dos dados ao longo do workflow', async () => {
      // Verificar se médico ainda existe
      const medicoResponse = await request(app)
        .get(`/api/medicos/${medicoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(medicoResponse.body.data.id).toBe(medicoId);

      // Verificar se paciente ainda existe  
      const pacienteResponse = await request(app)
        .get(`/api/pacientes/${pacienteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(pacienteResponse.body.data.id).toBe(pacienteId);

      // Verificar se consulta ainda existe
      const consultaResponse = await request(app)
        .get(`/api/consultas/${consultaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(consultaResponse.body.data.id).toBe(consultaId);
      expect(consultaResponse.body.data.status).toBe('realizada');
    });

    test('deve validar relacionamentos entre entidades', async () => {
      const response = await request(app)
        .get(`/api/consultas/${consultaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const consulta = response.body.data;
      expect(consulta.medicoId).toBe(medicoId);
      expect(consulta.pacienteId).toBe(pacienteId);
      expect(consulta.medico).toBeDefined();
      expect(consulta.paciente).toBeDefined();
    });

  });

  describe('⚡ Performance Workflow', () => {

    test('todas as operações devem ser realizadas em tempo hábil', async () => {
      const operations = [
        () => request(app).get('/api/medicos').set('Authorization', `Bearer ${adminToken}`),
        () => request(app).get('/api/pacientes').set('Authorization', `Bearer ${adminToken}`),
        () => request(app).get('/api/consultas').set('Authorization', `Bearer ${adminToken}`),
        () => request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${adminToken}`)
      ];

      for (const operation of operations) {
        const start = Date.now();
        const response = await operation().expect(200);
        const duration = Date.now() - start;

        expect(response.body.success).toBe(true);
        expect(duration).toBeLessThan(2000); // Menos de 2 segundos
      }
    });

  });

});