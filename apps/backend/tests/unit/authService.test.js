/**
 * Testes unitários para AuthService - Segurança e Autenticação
 * Casos de teste abrangentes para JWT, hashing de senhas e middleware de auth
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthService = require('../../src/services/authService');

// Mock do databaseService
jest.mock('../../src/services/database', () => ({
  client: {
    usuario: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  }
}));

const mockDatabase = require('../../src/services/database');

describe('🔐 AuthService - Testes de Segurança', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key-2025';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('Password Hashing', () => {
    
    test('deve fazer hash da senha com salt apropriado', async () => {
      const password = 'MinhaSenh@123';
      const hash = await AuthService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hash é longo
      
      // Verificar se o hash é válido
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    test('deve rejeitar senha vazia ou nula', async () => {
      await expect(AuthService.hashPassword('')).rejects.toThrow('Senha é obrigatória');
      await expect(AuthService.hashPassword(null)).rejects.toThrow('Senha é obrigatória');
      await expect(AuthService.hashPassword(undefined)).rejects.toThrow('Senha é obrigatória');
    });

    test('deve usar salt level 12 (verificação de segurança)', async () => {
      const password = 'TestPassword123';
      const hash = await AuthService.hashPassword(password);
      
      // bcrypt hash format: $2a$rounds$salt+hash
      const rounds = hash.split('$')[2];
      expect(rounds).toBe('12'); // Verificar salt level
    });

  });

  describe('Password Comparison', () => {
    
    test('deve comparar senha correta com hash', async () => {
      const password = 'MinhaSenh@Segura123';
      const hash = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    test('deve rejeitar senha incorreta', async () => {
      const correctPassword = 'SenhaCorreta123';
      const wrongPassword = 'SenhaErrada123';
      const hash = await AuthService.hashPassword(correctPassword);
      
      const isValid = await AuthService.comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    test('deve lidar com parâmetros inválidos', async () => {
      const hash = await AuthService.hashPassword('test123');
      
      expect(await AuthService.comparePassword('', hash)).toBe(false);
      expect(await AuthService.comparePassword(null, hash)).toBe(false);
      expect(await AuthService.comparePassword('test123', '')).toBe(false);
      expect(await AuthService.comparePassword('test123', null)).toBe(false);
    });

  });

  describe('JWT Token Generation', () => {
    
    test('deve gerar token JWT válido com payload', () => {
      const payload = {
        userId: 123,
        email: 'test@medfast.com',
        tipo: 'medico'
      };
      
      const token = AuthService.generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verificar se é um JWT válido
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    test('deve usar configurações padrão do token', () => {
      const payload = { userId: 123 };
      const token = AuthService.generateToken(payload);
      
      const decoded = jwt.verify(token, 'test-secret-key-2025');
      expect(decoded.exp - decoded.iat).toBe(86400); // 24 horas em segundos
      expect(decoded.iss).toBe('medfast-api');
    });

    test('deve permitir opções customizadas', () => {
      const payload = { userId: 123 };
      const options = {
        expiresIn: '1h',
        issuer: 'custom-api'
      };
      
      const token = AuthService.generateToken(payload, options);
      const decoded = jwt.verify(token, 'test-secret-key-2025');
      
      expect(decoded.exp - decoded.iat).toBe(3600); // 1 hora em segundos
      expect(decoded.iss).toBe('custom-api');
    });

  });

  describe('JWT Token Verification', () => {
    
    test('deve verificar token válido', () => {
      const payload = {
        userId: 123,
        email: 'test@medfast.com',
        tipo: 'medico'
      };
      
      const token = AuthService.generateToken(payload);
      const decoded = AuthService.verifyToken(token);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.tipo).toBe(payload.tipo);
    });

    test('deve rejeitar token inválido', () => {
      const invalidToken = 'token.invalido.aqui';
      
      expect(() => {
        AuthService.verifyToken(invalidToken);
      }).toThrow('Token inválido');
    });

    test('deve rejeitar token expirado', () => {
      const payload = { userId: 123 };
      const expiredToken = jwt.sign(payload, 'test-secret-key-2025', { expiresIn: '-1h' });
      
      expect(() => {
        AuthService.verifyToken(expiredToken);
      }).toThrow('Token expirado');
    });

    test('deve rejeitar token vazio ou nulo', () => {
      expect(() => AuthService.verifyToken('')).toThrow('Token é obrigatório');
      expect(() => AuthService.verifyToken(null)).toThrow('Token é obrigatório');
      expect(() => AuthService.verifyToken(undefined)).toThrow('Token é obrigatório');
    });

  });

  describe('Authentication Middleware', () => {
    
    test('deve autenticar request com token válido', async () => {
      const mockUser = {
        id: 123,
        nome: 'Dr. João Silva',
        email: 'joao@medfast.com',
        tipo: 'medico',
        ativo: true
      };

      // Mock do validateUser
      const validateUserSpy = jest.spyOn(AuthService, 'validateUser');
      validateUserSpy.mockResolvedValue(mockUser);

      const token = AuthService.generateToken({
        userId: mockUser.id,
        email: mockUser.email,
        tipo: mockUser.tipo
      });

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();

      const middleware = AuthService.authMiddleware();
      await middleware(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(validateUserSpy).toHaveBeenCalledWith(mockUser.id);
      
      validateUserSpy.mockRestore();
    });

    test('deve rejeitar request sem token', async () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = AuthService.authMiddleware();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token de acesso requerido'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('deve rejeitar token mal formatado', async () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat token123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = AuthService.authMiddleware();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token de acesso requerido'
      });
    });

  });

  describe('User Validation', () => {
    
    test('deve validar usuário existente e ativo', async () => {
      const mockUser = {
        id: 123,
        nome: 'Dr. João Silva',
        email: 'joao@medfast.com',
        tipo: 'medico',
        ativo: true,
        medico: {
          id: 1,
          crm: '12345',
          especialidade: 'Cardiologia'
        }
      };

      mockDatabase.client.usuario.findUnique.mockResolvedValue(mockUser);

      const result = await AuthService.validateUser(123);
      
      // O AuthService retorna apenas campos específicos, sem 'ativo'
      const expectedResult = {
        id: mockUser.id,
        nome: mockUser.nome,
        email: mockUser.email,
        tipo: mockUser.tipo,
        medico: mockUser.medico
      };
      
      expect(result).toEqual(expectedResult);
      expect(mockDatabase.client.usuario.findUnique).toHaveBeenCalledWith({
        where: { id: 123 },
        include: {
          medico: {
            select: {
              id: true,
              crm: true,
              especialidade: true
            }
          }
        }
      });
    });

    test('deve rejeitar usuário inexistente', async () => {
      mockDatabase.client.usuario.findUnique.mockResolvedValue(null);

      await expect(AuthService.validateUser(999))
        .rejects.toThrow('Usuário não encontrado');
    });

  });

  describe('Password Generation', () => {
    
    test('deve gerar senha temporária com tamanho padrão', () => {
      const password = AuthService.generateTemporaryPassword();
      
      expect(password).toBeDefined();
      expect(password.length).toBe(8);
      expect(typeof password).toBe('string');
    });

    test('deve gerar senha com tamanho customizado', () => {
      const customLength = 12;
      const password = AuthService.generateTemporaryPassword(customLength);
      
      expect(password.length).toBe(customLength);
    });

    test('deve gerar senhas diferentes a cada chamada', () => {
      const password1 = AuthService.generateTemporaryPassword();
      const password2 = AuthService.generateTemporaryPassword();
      
      expect(password1).not.toBe(password2);
    });

    test('deve usar apenas caracteres seguros', () => {
      const password = AuthService.generateTemporaryPassword(100);
      const safeChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789]+$/;
      
      expect(safeChars.test(password)).toBe(true);
    });

  });

});