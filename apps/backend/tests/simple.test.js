/**
 * Testes Simplificados - Fase 5
 * Testes básicos que funcionam sem banco de dados
 */

const request = require('supertest');
const AuthService = require('../src/services/authService');
const ValidationService = require('../src/services/validationService');
const ResponseService = require('../src/services/responseService');

describe('🧪 TESTES SIMPLIFICADOS - Sistema Refatorado', () => {

  describe('1. 🔐 Serviços Centralizados - Testes Unitários', () => {
    
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
        expect(ValidationService.validateEmail('user@example.org')).toBe(true);
        expect(ValidationService.validateEmail('invalido')).toBe(false);
        expect(ValidationService.validateEmail('')).toBe(false);
        expect(ValidationService.validateEmail(null)).toBe(false);
      });
      
      test('Deve validar CPFs', () => {
        expect(ValidationService.validateCPF('123.456.789-09')).toBe(true);
        expect(ValidationService.validateCPF('12345678909')).toBe(true);
        expect(ValidationService.validateCPF('111.111.111-11')).toBe(false);
        expect(ValidationService.validateCPF('123')).toBe(false);
        expect(ValidationService.validateCPF('')).toBe(false);
      });
      
      test('Deve validar CRMs', () => {
        expect(ValidationService.validateCRM('123456')).toBe(true);
        expect(ValidationService.validateCRM('12345')).toBe(true);
        expect(ValidationService.validateCRM('1234567')).toBe(true);
        expect(ValidationService.validateCRM('abc')).toBe(false);
        expect(ValidationService.validateCRM('')).toBe(false);
      });
      
      test('Deve validar telefones', () => {
        expect(ValidationService.validatePhone('(11) 99999-9999')).toBe(true);
        expect(ValidationService.validatePhone('11999999999')).toBe(true);
        expect(ValidationService.validatePhone('(21) 8888-8888')).toBe(true);
        expect(ValidationService.validatePhone('123')).toBe(false);
        expect(ValidationService.validatePhone('abc')).toBe(false);
      });
      
      test('Deve sanitizar texto', () => {
        const texto = '  <script>alert("xss")</script>  Texto normal  ';
        const sanitized = ValidationService.sanitizeText(texto);
        
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).toContain('Texto normal');
        expect(sanitized.trim()).toBe(sanitized);
      });
      
      test('Deve validar dados de médico', () => {
        const dadosValidos = {
          nome: 'Dr. João Silva',
          email: 'joao@test.com',
          crm: '123456',
          cpf: '123.456.789-09',
          telefone: '(11) 99999-9999'
        };
        
        const validation = ValidationService.validateMedicoData(dadosValidos);
        expect(validation.isValid).toBe(true);
        expect(validation.errors.length).toBe(0);
      });
      
      test('Deve detectar dados de médico inválidos', () => {
        const dadosInvalidos = {
          nome: '',
          email: 'email-invalido',
          crm: 'abc',
          cpf: '123',
          telefone: '123'
        };
        
        const validation = ValidationService.validateMedicoData(dadosInvalidos);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
      
    });
    
    describe('ResponseService', () => {
      
      test('Deve formatar dados corretamente', () => {
        const data = { 
          id: 1, 
          name: 'Test', 
          createdAt: new Date('2023-01-01T10:00:00.000Z') 
        };
        
        const formatted = ResponseService.formatData(data);
        
        expect(formatted.id).toBe(1);
        expect(formatted.name).toBe('Test');
        expect(typeof formatted.createdAt).toBe('string');
      });
      
      test('Deve criar resposta de sucesso', () => {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        ResponseService.success(mockRes, { test: 'data' }, 'Sucesso');
        
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: { test: 'data' },
            message: 'Sucesso'
          })
        );
      });
      
      test('Deve criar resposta de erro', () => {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        ResponseService.error(mockRes, 'Erro de teste', 400);
        
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Erro de teste'
          })
        );
      });
      
    });
    
  });

  describe('2. 📊 Análise de Código', () => {
    
    test('Deve ter todos os serviços centralizados', () => {
      // Verificar se os serviços existem e podem ser importados
      expect(AuthService).toBeDefined();
      expect(ValidationService).toBeDefined();
      expect(ResponseService).toBeDefined();
      
      // Verificar funções principais
      expect(typeof AuthService.hashPassword).toBe('function');
      expect(typeof AuthService.comparePassword).toBe('function');
      expect(typeof AuthService.generateToken).toBe('function');
      expect(typeof AuthService.verifyToken).toBe('function');
      
      expect(typeof ValidationService.validateEmail).toBe('function');
      expect(typeof ValidationService.validateCPF).toBe('function');
      expect(typeof ValidationService.validateCRM).toBe('function');
      
      expect(typeof ResponseService.success).toBe('function');
      expect(typeof ResponseService.error).toBe('function');
      expect(typeof ResponseService.formatData).toBe('function');
    });
    
    test('Deve ter middleware centralizado', () => {
      const centralMiddleware = require('../src/middleware/centralMiddleware');
      
      expect(centralMiddleware).toBeDefined();
      expect(typeof centralMiddleware.applyBasicMiddlewares).toBe('function');
      expect(typeof centralMiddleware.applyFinalMiddlewares).toBe('function');
      expect(typeof centralMiddleware.asyncHandler).toBe('function');
    });
    
  });

  describe('3. 🔧 Integração de Componentes', () => {
    
    test('Deve usar AuthService e ValidationService juntos', async () => {
      // Simular criação de usuário com validação e hash
      const dadosUsuario = {
        email: 'integration@test.com',
        senha: 'senha123456',
        nome: 'Teste Integração'
      };
      
      // Validar email
      const emailValido = ValidationService.validateEmail(dadosUsuario.email);
      expect(emailValido).toBe(true);
      
      // Hash da senha
      const hashedPassword = await AuthService.hashPassword(dadosUsuario.senha);
      expect(hashedPassword).toBeDefined();
      
      // Verificar senha
      const senhaCorreta = await AuthService.comparePassword(dadosUsuario.senha, hashedPassword);
      expect(senhaCorreta).toBe(true);
      
      // Gerar token
      const token = AuthService.generateToken({ email: dadosUsuario.email });
      expect(token).toBeDefined();
    });
    
    test('Deve usar ValidationService e ResponseService juntos', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Dados inválidos
      const dadosInvalidos = {
        email: 'invalido',
        cpf: '123'
      };
      
      const validation = ValidationService.validateMedicoData(dadosInvalidos);
      
      if (!validation.isValid) {
        ResponseService.validationError(mockRes, 'Dados inválidos', validation.errors);
        
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Dados inválidos'
          })
        );
      }
    });
    
  });

  describe('4. 🎯 Qualidade do Código', () => {
    
    test('Deve ter cobertura de error handling', () => {
      // Testar cenários de erro
      expect(() => {
        AuthService.verifyToken('token-invalido');
      }).toThrow();
      
      expect(() => {
        ValidationService.validateEmail(undefined);
      }).not.toThrow(); // Deve retornar false, não throw
      
      expect(ValidationService.validateEmail(undefined)).toBe(false);
    });
    
    test('Deve ter performance adequada', async () => {
      // Teste simples de performance
      const start = Date.now();
      
      await AuthService.hashPassword('teste123');
      const hashTime = Date.now() - start;
      
      const start2 = Date.now();
      ValidationService.validateEmail('test@test.com');
      const validationTime = Date.now() - start2;
      
      const start3 = Date.now();
      AuthService.generateToken({ id: 1 });
      const tokenTime = Date.now() - start3;
      
      // Operações devem ser rápidas
      expect(hashTime).toBeLessThan(200); // bcrypt pode ser mais lento
      expect(validationTime).toBeLessThan(10);
      expect(tokenTime).toBeLessThan(10);
      
      console.log(`⏱️ [PERF] Hash: ${hashTime}ms, Validation: ${validationTime}ms, Token: ${tokenTime}ms`);
    });
    
  });

});

module.exports = {};