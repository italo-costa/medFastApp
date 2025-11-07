/**
 * Testes de Integração - AuthService com Middleware e Database
 * Testa fluxo completo de autenticação com banco real
 */

const request = require('supertest');
const express = require('express');
const AuthService = require('../../src/services/authService');
const databaseService = require('../../src/services/database');
const { testDatabaseSetup, createTestUser, cleanupTestData } = require('../utils/testHelpers');

describe('🔗 AuthService Integration Tests', () => {

  let app;
  let testUserId;
  let testUserData;

  beforeAll(async () => {
    // Configurar banco de teste
    await testDatabaseSetup();
    
    // Configurar app Express de teste
    app = express();
    app.use(express.json());
    
    // Rota protegida para testes
    app.get('/api/protected', AuthService.authMiddleware(), (req, res) => {
      res.json({
        success: true,
        message: 'Acesso autorizado',
        user: req.user
      });
    });
    
    // Rota de login para testes
    app.post('/api/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        // Buscar usuário
        const user = await databaseService.client.usuario.findFirst({
          where: { 
            email: email.toLowerCase().trim(),
            ativo: true
          },
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

        if (!user) {
          throw new Error('Credenciais inválidas');
        }

        // Verificar senha
        const senhaValida = await AuthService.comparePassword(password, user.senha);
        if (!senhaValida) {
          throw new Error('Credenciais inválidas');
        }

        // Gerar token
        const token = AuthService.generateToken({
          userId: user.id,
          email: user.email,
          tipo: user.tipo
        });

        const result = {
          token,
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            tipo: user.tipo,
            medico: user.medico
          }
        };
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        res.status(401).json({
          success: false,
          message: error.message
        });
      }
    });

    // Criar usuário de teste
    testUserData = await createTestUser({
      nome: 'Dr. Teste Integração',
      email: 'integracao@test.com',
      password: 'TestIntegracao123@',
      tipo: 'MEDICO',
      crm: 'INT12345',
      especialidade: 'Teste'
    });
    testUserId = testUserData.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await databaseService.client.$disconnect();
  });

  describe('Authentication Flow', () => {

    test('deve fazer login completo e acessar rota protegida', async () => {
      // Fazer login
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'integracao@test.com',
          password: 'TestIntegracao123@'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();
      expect(loginResponse.body.data.user.email).toBe('integracao@test.com');
      expect(loginResponse.body.data.user.tipo).toBe('MEDICO');

      const token = loginResponse.body.data.token;

      // Acessar rota protegida
      const protectedResponse = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(protectedResponse.body.success).toBe(true);
      expect(protectedResponse.body.message).toBe('Acesso autorizado');
      expect(protectedResponse.body.user.id).toBe(testUserId);
    });

    test('deve rejeitar acesso sem token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token de acesso requerido');
    });

    test('deve rejeitar token inválido', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token inválido');
    });

    test('deve rejeitar login com credenciais incorretas', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'integracao@test.com',
          password: 'SenhaErrada123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inválidas');
    });

  });

  describe('Token Refresh Flow', () => {

    test('deve fazer refresh de token válido', async () => {
      // Usar o usuário criado nos testes
      const originalToken = AuthService.generateToken({
        userId: testUserId,
        email: testUserData.email,
        tipo: testUserData.tipo
      });

      // Fazer refresh
      const refreshResult = await AuthService.refreshToken(originalToken);

      expect(refreshResult.token).toBeDefined();
      expect(refreshResult.token).not.toBe(originalToken);
      expect(refreshResult.user.id).toBe(testUserId);
      expect(refreshResult.user.email).toBe(testUserData.email);
    });

    test('deve rejeitar refresh com token inválido', async () => {
      await expect(AuthService.refreshToken('token_invalido'))
        .rejects.toThrow('Token de refresh inválido');
    });

  });

  describe('User Validation with Database', () => {

    test('deve validar usuário ativo no banco', async () => {
      const user = await AuthService.validateUser(testUserId);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
      expect(user.email).toBe('integracao@test.com');
      expect(user.medico).toBeDefined();
      expect(user.medico.crm).toBe('INT12345');
    });

    test('deve rejeitar usuário inexistente', async () => {
      await expect(AuthService.validateUser('99999'))
        .rejects.toThrow('Usuário não encontrado');
    });

    test('deve rejeitar usuário inativo', async () => {
      // Desativar usuário
      await databaseService.client.usuario.update({
        where: { id: testUserId },
        data: { ativo: false }
      });

      await expect(AuthService.validateUser(testUserId))
        .rejects.toThrow('Usuário não encontrado ou inativo');

      // Reativar para outros testes
      await databaseService.client.usuario.update({
        where: { id: testUserId },
        data: { ativo: true }
      });
    });

  });

  describe('Security Edge Cases', () => {

    test('deve lidar com token expirado em middleware', async () => {
      // Gerar token já expirado
      const expiredToken = AuthService.generateToken(
        { userId: testUserId },
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token expirado');
    });

    test('deve verificar integridade do usuário no token', async () => {
      // Token com userId que não existe
      const fakeToken = AuthService.generateToken({
        userId: 99999,
        email: 'fake@test.com'
      });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

  });

  describe('Password Security', () => {

    test('deve manter hash seguro após múltiplas operações', async () => {
      const password = 'SenhaTeste123@';
      
      // Fazer hash múltiplas vezes
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);
      
      // Hashes devem ser diferentes (devido ao salt aleatório)
      expect(hash1).not.toBe(hash2);
      
      // Mas ambos devem validar a mesma senha
      expect(await AuthService.comparePassword(password, hash1)).toBe(true);
      expect(await AuthService.comparePassword(password, hash2)).toBe(true);
    });

    test('deve resistir a timing attacks na comparação', async () => {
      const password = 'MinhaSenh@123';
      const hash = await AuthService.hashPassword(password);
      
      // Medir tempo de comparações válidas e inválidas
      const times = [];
      
      for (let i = 0; i < 10; i++) {
        const start = process.hrtime.bigint();
        await AuthService.comparePassword(password, hash);
        const end = process.hrtime.bigint();
        times.push(Number(end - start));
      }
      
      for (let i = 0; i < 10; i++) {
        const start = process.hrtime.bigint();
        await AuthService.comparePassword('senha_errada', hash);
        const end = process.hrtime.bigint();
        times.push(Number(end - start));
      }
      
      // Tempo deve ser consistente (bcrypt é resistente a timing attacks)
      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxDeviation = Math.max(...times.map(t => Math.abs(t - avgTime)));
      
      // Desvio não deve ser muito alto (tolerância para variações normais)
      expect(maxDeviation / avgTime).toBeLessThan(2.0);
    });

  });

});