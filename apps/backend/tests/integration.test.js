/**
 * Testes Integrados - Fase 5
 * Valida toda a refatoração dos serviços centralizados
 */

const request = require('supertest');
const { app } = require('../src/app');
const databaseService = require('../src/services/database');
const AuthService = require('../src/services/authService');
const ValidationService = require('../src/services/validationService');
const ResponseService = require('../src/services/responseService');
const FileService = require('../src/services/fileService');

// Configurar timeout para testes de integração
jest.setTimeout(30000);

describe('🧪 TESTES INTEGRADOS - Sistema Refatorado', () => {
  
  let server;
  let testUser;
  let authToken;
  
  beforeAll(async () => {
    // Conectar ao banco de dados
    await databaseService.connect();
    
    // Criar usuário de teste
    testUser = {
      email: 'teste@mediapp.com',
      senha: '123456789',
      nome: 'Usuário Teste',
      tipo: 'medico'
    };
    
    console.log('🔧 [TEST] Setup inicial concluído');
  });
  
  afterAll(async () => {
    // Limpar dados de teste
    try {
      await databaseService.client.usuario.deleteMany({
        where: { email: 'teste@mediapp.com' }
      });
      await databaseService.client.medico.deleteMany({
        where: { usuario: { email: 'teste@mediapp.com' } }
      });
      await databaseService.client.paciente.deleteMany({
        where: { email: 'teste@mediapp.com' }
      });
    } catch (error) {
      console.log('⚠️ [TEST] Erro na limpeza:', error.message);
    }
    
    // Desconectar banco
    await databaseService.disconnect();
    
    console.log('🧹 [TEST] Limpeza concluída');
  });

  describe('1. 🏥 Health Check e Infraestrutura', () => {
    
    test('Deve responder no health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.server).toBe('MediApp Unified Server');
      expect(response.body.data.status).toBe('OK');
      expect(response.body.data.version).toBe('2.0.0');
      expect(response.body.data.middleware).toBe('Centralizado');
    });
    
    test('Deve retornar 404 para rota inexistente', async () => {
      const response = await request(app)
        .get('/rota-inexistente')
        .expect(404);
        
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('não encontrado');
    });
    
    test('Deve ter headers de segurança', async () => {
      const response = await request(app)
        .get('/health');
        
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-api-version']).toBe('2.0.0');
    });
    
  });

  describe('2. 🔐 Serviços Centralizados - Unitários', () => {
    
    describe('AuthService', () => {
      
      test('Deve fazer hash da senha', async () => {
        const senha = 'minhasenha123';
        const hash = await AuthService.hashPassword(senha);
        
        expect(hash).toBeDefined();
        expect(hash).not.toBe(senha);
        expect(hash.length).toBeGreaterThan(50);
      });
      
      test('Deve comparar senhas corretamente', async () => {
        const senha = 'minhasenha123';
        const hash = await AuthService.hashPassword(senha);
        
        const isValid = await AuthService.comparePassword(senha, hash);
        const isInvalid = await AuthService.comparePassword('senhaerrada', hash);
        
        expect(isValid).toBe(true);
        expect(isInvalid).toBe(false);
      });
      
      test('Deve gerar e verificar tokens JWT', () => {
        const payload = { userId: 123, email: 'test@test.com' };
        const token = AuthService.generateToken(payload);
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        
        const decoded = AuthService.verifyToken(token);
        expect(decoded.userId).toBe(123);
        expect(decoded.email).toBe('test@test.com');
      });
      
    });
    
    describe('ValidationService', () => {
      
      test('Deve validar emails', () => {
        expect(ValidationService.validateEmail('test@test.com')).toBe(true);
        expect(ValidationService.validateEmail('invalido')).toBe(false);
        expect(ValidationService.validateEmail('')).toBe(false);
      });
      
      test('Deve validar CPFs', () => {
        expect(ValidationService.validateCPF('123.456.789-09')).toBe(true);
        expect(ValidationService.validateCPF('12345678909')).toBe(true);
        expect(ValidationService.validateCPF('111.111.111-11')).toBe(false);
        expect(ValidationService.validateCPF('123')).toBe(false);
      });
      
      test('Deve validar CRMs', () => {
        expect(ValidationService.validateCRM('123456')).toBe(true);
        expect(ValidationService.validateCRM('12345')).toBe(true);
        expect(ValidationService.validateCRM('abc')).toBe(false);
        expect(ValidationService.validateCRM('')).toBe(false);
      });
      
      test('Deve validar telefones', () => {
        expect(ValidationService.validatePhone('(11) 99999-9999')).toBe(true);
        expect(ValidationService.validatePhone('11999999999')).toBe(true);
        expect(ValidationService.validatePhone('123')).toBe(false);
      });
      
      test('Deve sanitizar texto', () => {
        const texto = '  <script>alert("xss")</script>  Texto normal  ';
        const sanitized = ValidationService.sanitizeText(texto);
        
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).toContain('Texto normal');
        expect(sanitized.trim()).toBe(sanitized);
      });
      
    });
    
    describe('ResponseService', () => {
      
      test('Deve formatar dados corretamente', () => {
        const data = { id: 1, name: 'Test', createdAt: new Date() };
        const formatted = ResponseService.formatData(data);
        
        expect(formatted.id).toBe(1);
        expect(formatted.name).toBe('Test');
        expect(typeof formatted.createdAt).toBe('string');
      });
      
    });
    
  });

  describe('3. 🔐 API de Autenticação', () => {
    
    test('Deve registrar novo usuário', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.nome).toBe(testUser.nome);
      expect(response.body.data.token).toBeDefined();
      
      authToken = response.body.data.token;
    });
    
    test('Deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          senha: testUser.senha
        })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();
    });
    
    test('Deve rejeitar login com credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          senha: 'senhaerrada'
        })
        .expect(401);
        
      expect(response.body.success).toBe(false);
    });
    
    test('Deve validar dados de registro', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'emailinvalido',
          senha: '123', // muito curta
          nome: ''
        })
        .expect(400);
        
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
    
    test('Deve proteger rotas com middleware de auth', async () => {
      const response = await request(app)
        .get('/api/medicos')
        .expect(401);
        
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token');
    });
    
    test('Deve permitir acesso com token válido', async () => {
      const response = await request(app)
        .get('/api/medicos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      expect(response.body.success).toBe(true);
    });
    
  });

  describe('4. 👨‍⚕️ API de Médicos', () => {
    
    let medicoId;
    
    test('Deve listar médicos (vazio)', async () => {
      const response = await request(app)
        .get('/api/medicos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination).toBeDefined();
    });
    
    test('Deve criar novo médico', async () => {
      const novoMedico = {
        nome: 'Dr. Teste',
        email: 'dr.teste@mediapp.com',
        crm: '123456',
        crm_uf: 'SP',
        especialidade: 'Cardiologia',
        telefone: '(11) 99999-9999',
        cpf: '123.456.789-09',
        data_nascimento: '1980-01-01',
        sexo: 'M',
        endereco: 'Rua Teste, 123',
        cep: '01234-567',
        cidade: 'São Paulo',
        uf: 'SP'
      };
      
      const response = await request(app)
        .post('/api/medicos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(novoMedico)
        .expect(201);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe(novoMedico.nome);
      expect(response.body.data.crm).toBe(novoMedico.crm);
      
      medicoId = response.body.data.id;
    });
    
    test('Deve validar dados do médico', async () => {
      const response = await request(app)
        .post('/api/medicos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: '', // inválido
          email: 'emailinvalido', // inválido
          crm: 'abc', // inválido
          cpf: '123' // inválido
        })
        .expect(400);
        
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
    
    test('Deve buscar médico por ID', async () => {
      const response = await request(app)
        .get(`/api/medicos/${medicoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(medicoId);
    });
    
    test('Deve atualizar médico', async () => {
      const response = await request(app)
        .put(`/api/medicos/${medicoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          especialidade: 'Neurologia'
        })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.especialidade).toBe('Neurologia');
    });
    
  });

  describe('5. 👥 API de Pacientes', () => {
    
    let pacienteId;
    
    test('Deve criar novo paciente', async () => {
      const novoPaciente = {
        name: 'Paciente Teste',
        email: 'paciente.teste@mediapp.com',
        cpf: '987.654.321-00',
        phone: '(11) 88888-8888',
        birthDate: '1990-01-01',
        gender: 'F',
        bloodType: 'O+',
        address: 'Rua Paciente, 456',
        cep: '01234-567',
        city: 'São Paulo',
        state: 'SP'
      };
      
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(novoPaciente)
        .expect(201);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(novoPaciente.name);
      expect(response.body.data.cpf).toBe(novoPaciente.cpf);
      
      pacienteId = response.body.data.id;
    });
    
    test('Deve listar pacientes', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });
    
    test('Deve buscar estatísticas de pacientes', async () => {
      const response = await request(app)
        .get('/api/patients/stats/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPatients).toBeGreaterThan(0);
    });
    
  });

  describe('6. 🔒 Middleware e Segurança', () => {
    
    test('Deve aplicar rate limiting', async () => {
      // Fazer muitas requisições rapidamente para testar rate limit
      const promises = Array(15).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test', senha: 'test' })
      );
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });
    
    test('Deve validar Content-Type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'text/plain')
        .send('dados invalidos')
        .expect(400);
        
      expect(response.body.message).toContain('Content-Type');
    });
    
    test('Deve ter CORS configurado', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000');
        
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
    
  });

  describe('7. 🚀 Integração ViaCEP', () => {
    
    test('Deve consultar CEP válido', async () => {
      const response = await request(app)
        .get('/api/viacep/01310-100')
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.localidade).toBe('São Paulo');
    });
    
    test('Deve retornar erro para CEP inválido', async () => {
      const response = await request(app)
        .get('/api/viacep/00000-000')
        .expect(404);
        
      expect(response.body.success).toBe(false);
    });
    
  });

});

module.exports = {
  testUser,
  authToken
};