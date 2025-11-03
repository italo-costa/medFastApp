/**
 * Testes de Performance e Carga - Fase 5
 * Valida o comportamento do sistema sob carga
 */

const request = require('supertest');
const { app } = require('../src/app');
const databaseService = require('../src/services/database');

describe('⚡ TESTES DE PERFORMANCE', () => {
  
  let authToken;
  
  beforeAll(async () => {
    await databaseService.connect();
    
    // Criar usuário para testes
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'perf@test.com',
        senha: '123456789',
        nome: 'Performance Test',
        tipo: 'admin'
      });
      
    authToken = response.body.data.token;
    console.log('🔧 [PERF] Setup concluído');
  });
  
  afterAll(async () => {
    // Limpar dados
    try {
      await databaseService.client.usuario.deleteMany({
        where: { email: 'perf@test.com' }
      });
    } catch (error) {
      console.log('⚠️ [PERF] Erro na limpeza:', error.message);
    }
    
    await databaseService.disconnect();
  });

  describe('1. 🚀 Performance de Endpoints', () => {
    
    test('Health check deve responder em < 100ms', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/health')
        .expect(200);
        
      const duration = Date.now() - start;
      
      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(100);
      
      console.log(`⏱️ [PERF] Health check: ${duration}ms`);
    });
    
    test('Login deve responder em < 500ms', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'perf@test.com',
          senha: '123456789'
        })
        .expect(200);
        
      const duration = Date.now() - start;
      
      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(500);
      
      console.log(`⏱️ [PERF] Login: ${duration}ms`);
    });
    
    test('Listagem de médicos deve responder em < 200ms', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/medicos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      const duration = Date.now() - start;
      
      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(200);
      
      console.log(`⏱️ [PERF] Lista médicos: ${duration}ms`);
    });
    
  });

  describe('2. 🔥 Testes de Carga', () => {
    
    test('Deve suportar 50 requisições simultâneas ao health check', async () => {
      const start = Date.now();
      
      const promises = Array(50).fill().map(() =>
        request(app).get('/health')
      );
      
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;
      
      // Todas devem ter sucesso
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      // Deve completar em menos de 2 segundos
      expect(duration).toBeLessThan(2000);
      
      console.log(`⚡ [LOAD] 50 requisições simultâneas: ${duration}ms`);
    });
    
    test('Deve suportar 20 logins simultâneos', async () => {
      const start = Date.now();
      
      const promises = Array(20).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'perf@test.com',
            senha: '123456789'
          })
      );
      
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;
      
      // Pelo menos 80% devem ter sucesso (considerando rate limiting)
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(16);
      
      console.log(`⚡ [LOAD] 20 logins simultâneos: ${duration}ms (${successCount}/20 sucessos)`);
    });
    
  });

  describe('3. 🛡️ Testes de Resiliência', () => {
    
    test('Deve lidar com payloads grandes', async () => {
      const largePayload = {
        nome: 'A'.repeat(1000),
        email: 'large@test.com',
        observacoes: 'B'.repeat(5000)
      };
      
      const response = await request(app)
        .post('/api/medicos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largePayload);
        
      // Deve falhar por validação, não por tamanho
      expect([400, 413]).toContain(response.status);
    });
    
    test('Deve lidar com caracteres especiais e encoding', async () => {
      const specialChars = {
        nome: 'José María da Silva Ñoño',
        email: 'special@test.com',
        observacoes: 'Paciente com histórico de 中文 e émojis 🏥👨‍⚕️'
      };
      
      const response = await request(app)
        .post('/api/medicos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(specialChars);
        
      // Deve processar ou dar erro de validação específico
      expect([200, 201, 400]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });
    
    test('Deve lidar com requisições mal formadas', async () => {
      const malformedRequests = [
        request(app).post('/api/auth/login').send('not json'),
        request(app).post('/api/auth/login').send(null),
        request(app).post('/api/auth/login').send(undefined),
        request(app).post('/api/auth/login').send([]),
      ];
      
      const responses = await Promise.allSettled(malformedRequests);
      
      responses.forEach(result => {
        if (result.status === 'fulfilled') {
          expect([400, 422]).toContain(result.value.status);
        }
      });
    });
    
  });

  describe('4. 📊 Monitoramento de Recursos', () => {
    
    test('Deve monitorar uso de memória', async () => {
      const initialMemory = process.memoryUsage();
      
      // Fazer várias operações
      const promises = Array(30).fill().map(async (_, i) => {
        await request(app).get('/health');
        await request(app).get('/api/statistics/dashboard');
      });
      
      await Promise.all(promises);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Aumento de memória deve ser razoável (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`📊 [MEMORY] Aumento: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    });
    
  });

});

module.exports = {};