/**
 * Teste de Segurança - Verificação de Dados Sensíveis em Analytics
 * Garante que nenhum dado sensível é exposto nas APIs de analytics
 */

const request = require('supertest');
const app = require('../src/server');
const AnalyticsDataSanitizer = require('../src/middleware/analyticsDataSanitizer');

describe('Analytics Data Security Tests', () => {
  let sanitizer;

  beforeEach(() => {
    sanitizer = new AnalyticsDataSanitizer();
  });

  describe('Data Sanitization', () => {
    test('deve remover campos sensíveis', () => {
      const sensitiveData = {
        municipio_nome: 'Fortaleza',
        ocupacao_hospitalar: 78.5,
        cpf: '123.456.789-00',
        email: 'test@example.com',
        password: 'secret123',
        auth_token: 'abc123xyz',
        telefone: '(85) 99999-9999'
      };

      const sanitized = sanitizer.sanitizeAnalyticsData(sensitiveData);

      // Verificar que dados públicos permanecem
      expect(sanitized.municipio_nome).toBe('Fortaleza');
      expect(sanitized.ocupacao_hospitalar).toBe(78.5);

      // Verificar que dados sensíveis foram removidos
      expect(sanitized.cpf).toBeUndefined();
      expect(sanitized.email).toBeUndefined();
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.auth_token).toBeUndefined();
      expect(sanitized.telefone).toBeUndefined();
    });

    test('deve hashificar códigos de município', () => {
      const data = {
        municipio_codigo: '2304400',
        municipio_nome: 'Fortaleza'
      };

      const sanitized = sanitizer.sanitizeAnalyticsData(data);

      expect(sanitized.municipio_codigo).toBeUndefined();
      expect(sanitized.municipio_codigo_hash).toMatch(/^anon_[a-f0-9]{8}$/);
      expect(sanitized.municipio_nome).toBe('Fortaleza');
    });

    test('deve sanitizar arrays recursivamente', () => {
      const data = {
        municipios: [
          {
            nome: 'Fortaleza',
            cpf_gestor: '123.456.789-00',
            ocupacao: 78.5
          },
          {
            nome: 'Recife',
            email_contato: 'contato@recife.gov.br',
            conectividade: 85.2
          }
        ]
      };

      const sanitized = sanitizer.sanitizeAnalyticsData(data);

      expect(sanitized.municipios[0].nome).toBe('Fortaleza');
      expect(sanitized.municipios[0].ocupacao).toBe(78.5);
      expect(sanitized.municipios[0].cpf_gestor).toBeUndefined();

      expect(sanitized.municipios[1].nome).toBe('Recife');
      expect(sanitized.municipios[1].conectividade).toBe(85.2);
      expect(sanitized.municipios[1].email_contato).toBeUndefined();
    });

    test('deve remover informações do servidor', () => {
      const data = {
        municipio_nome: 'Salvador',
        dataDirectory: '/var/app/sensitive/path',
        availableFiles: ['file1.csv', 'file2.json', 'sensitive.txt'],
        error: new Error('Stack trace with sensitive info')
      };

      const sanitized = sanitizer.sanitizeAnalyticsData(data);

      expect(sanitized.municipio_nome).toBe('Salvador');
      expect(sanitized.dataDirectory).toBe('[REDACTED]');
      expect(sanitized.availableFiles).toEqual({ count: 3 });
      expect(sanitized.error).toBe(process.env.NODE_ENV === 'development' ? 
        sanitized.error : '[ERROR_DETAILS_HIDDEN]');
    });
  });

  describe('Data Validation', () => {
    test('deve detectar campos sensíveis', () => {
      const dataWithSensitive = {
        nome: 'João',
        cpf: '123.456.789-00',
        email: 'joao@email.com',
        ocupacao_hospitalar: 75.0
      };

      const validation = sanitizer.validateDataStructure(dataWithSensitive);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContainEqual(
        expect.stringContaining('Campos sensíveis encontrados')
      );
    });

    test('deve validar dados limpos', () => {
      const cleanData = {
        municipio_nome: 'Natal',
        uf: 'RN',
        ocupacao_hospitalar: 72.3,
        populacao: 890480
      };

      const validation = sanitizer.validateDataStructure(cleanData);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
  });

  describe('API Endpoints Security', () => {
    test('GET /api/analytics/health não deve expor dados sensíveis', async () => {
      const response = await request(app)
        .get('/api/analytics/health')
        .expect(200);

      // Verificar que não há caminhos de arquivo expostos
      expect(response.body.dataDirectory).toBeUndefined();
      expect(response.body.availableFiles).toBeUndefined();

      // Verificar que dados públicos estão presentes
      expect(response.body.status).toBe('OK');
      expect(response.body.module).toBe('analytics');
      expect(response.body.compliance_status).toBe('LGPD_COMPLIANT');
      expect(response.body.data_classification).toBe('PUBLIC_AGGREGATED');
    });

    test('GET /api/analytics/data-validation deve mostrar processo de sanitização', async () => {
      const response = await request(app)
        .get('/api/analytics/data-validation')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.validation_report).toBeDefined();
      expect(response.body.data_classification).toBeDefined();
      expect(response.body.sample_sanitization).toBeDefined();
      expect(response.body.compliance_status).toBe('VALIDATED');

      // Verificar que campos sensíveis foram identificados
      const sanitization = response.body.sample_sanitization;
      expect(sanitization.removed_sensitive_data).toContain('cpf');
      expect(sanitization.removed_sensitive_data).toContain('user_session');
      expect(sanitization.removed_sensitive_data).toContain('dataDirectory');
    });

    test('GET /api/analytics/indicators deve retornar apenas dados públicos', async () => {
      const response = await request(app)
        .get('/api/analytics/indicators')
        .expect(200);

      if (response.body.success && response.body.data) {
        const firstMunicipality = response.body.data[0];
        
        // Verificar que dados públicos estão presentes
        expect(firstMunicipality.municipio_nome).toBeDefined();
        expect(firstMunicipality.uf).toBeDefined();
        expect(firstMunicipality.ocupacao_hospitalar).toBeDefined();

        // Verificar que dados sensíveis foram removidos/hasheados
        expect(firstMunicipality.municipio_codigo).toBeUndefined();
        expect(firstMunicipality.cpf).toBeUndefined();
        expect(firstMunicipality.email).toBeUndefined();
        expect(firstMunicipality.telefone).toBeUndefined();

        // Se há hash de código, deve estar no formato correto
        if (firstMunicipality.municipio_codigo_hash) {
          expect(firstMunicipality.municipio_codigo_hash).toMatch(/^anon_[a-f0-9]{8}$/);
        }
      }
    });
  });

  describe('CSP Headers', () => {
    test('deve aplicar headers de segurança corretos', async () => {
      const response = await request(app)
        .get('/api/analytics/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['x-data-classification']).toBe('PUBLIC_AGGREGATED');
      expect(response.headers['x-legal-basis']).toBe('LEGITIMATE_INTEREST');
    });

    test('deve aplicar cache headers para dados públicos', async () => {
      const response = await request(app)
        .get('/api/analytics/indicators')
        .expect(200);

      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['cache-control']).toContain('max-age=3600');
    });
  });

  describe('LGPD Compliance', () => {
    test('deve logar acessos aos dados', async () => {
      // Mock do logger para capturar logs
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .get('/api/analytics/indicators')
        .expect(200);

      // Verificar se log de auditoria foi criado
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analytics data sanitized')
      );

      logSpy.mockRestore();
    });

    test('deve incluir headers de conformidade LGPD', async () => {
      const response = await request(app)
        .get('/api/analytics/compliance')
        .expect(200);

      expect(response.headers['x-data-classification']).toBe('PUBLIC_AGGREGATED');
      expect(response.headers['x-data-retention']).toBe('2_YEARS');
      expect(response.headers['x-legal-basis']).toBe('LEGITIMATE_INTEREST');
    });
  });

  describe('Performance e Limites', () => {
    test('deve recomendar paginação para datasets grandes', () => {
      const largeData = {
        municipios: new Array(10000).fill({
          nome: 'Município',
          ocupacao: 75.0,
          populacao: 100000
        })
      };

      const validation = sanitizer.validateDataStructure(largeData);

      expect(validation.recommendations).toContainEqual(
        expect.stringContaining('paginação para datasets grandes')
      );
    });
  });
});

module.exports = {
  AnalyticsDataSanitizer
};