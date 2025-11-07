/**
 * Testes unitários para ResponseService - Padronização de Respostas
 * Verifica estruturas de resposta, códigos HTTP e formatação de dados
 */

const ResponseService = require('../../src/services/responseService');

describe('📋 ResponseService - Padronização de Respostas', () => {

  let mockRes;

  beforeEach(() => {
    // Mock objeto response do Express
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Responses', () => {

    test('deve retornar resposta de sucesso básica', () => {
      const data = { id: 1, nome: 'Teste' };
      
      ResponseService.success(mockRes, data);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operação realizada com sucesso',
        data: data,
        timestamp: expect.any(String)
      });
    });

    test('deve permitir mensagem customizada', () => {
      const customMessage = 'Usuário criado com sucesso';
      
      ResponseService.success(mockRes, null, customMessage);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: customMessage,
        timestamp: expect.any(String)
      });
    });

    test('deve permitir status code customizado', () => {
      const data = { id: 1 };
      
      ResponseService.success(mockRes, data, 'Criado', 201);
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Criado',
        data: data,
        timestamp: expect.any(String)
      });
    });

    test('deve lidar com data null sem incluir propriedade data', () => {
      ResponseService.success(mockRes, null);
      
      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('data');
      expect(jsonCall.success).toBe(true);
    });

    test('deve incluir metadados de paginação quando disponível', () => {
      const dataWithMeta = [
        { _meta: { total: 100, page: 1, limit: 10 } },
        { id: 1, nome: 'Item 1' },
        { id: 2, nome: 'Item 2' }
      ];
      
      ResponseService.success(mockRes, dataWithMeta);
      
      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.meta).toEqual({ total: 100, page: 1, limit: 10 });
      expect(jsonCall.data[0]).not.toHaveProperty('_meta');
    });

  });

  describe('Error Responses', () => {

    test('deve retornar resposta de erro básica', () => {
      ResponseService.error(mockRes, 'Erro de validação', 400);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erro de validação',
        statusCode: 400,
        timestamp: expect.any(String)
      });
    });

    test('deve usar valores padrão para erro', () => {
      ResponseService.error(mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erro interno do servidor',
        statusCode: 500,
        timestamp: expect.any(String)
      });
    });

    test('deve incluir detalhes quando fornecidos', () => {
      const details = { field: 'email', code: 'INVALID_FORMAT' };
      
      ResponseService.error(mockRes, 'Validação falhou', 422, details);
      
      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.details).toEqual(details);
    });

    test('deve fazer log para erros do servidor (>= 500)', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      ResponseService.error(mockRes, 'Erro interno', 500, { db: 'connection failed' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ [API ERROR 500]:',
        'Erro interno',
        { db: 'connection failed' }
      );
      
      consoleSpy.mockRestore();
    });

    test('não deve fazer log para erros de cliente (< 500)', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      ResponseService.error(mockRes, 'Bad request', 400);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

  });

  describe('Validation Error Response', () => {

    test('deve formatar erro de validação Joi', () => {
      const joiError = [
        { message: 'Email é obrigatório', path: ['email'] },
        { message: 'Nome deve ter pelo menos 2 caracteres', path: ['nome'] }
      ];
      
      ResponseService.validationError(mockRes, joiError);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erro de validação',
        statusCode: 400,
        details: {
          validationErrors: joiError
        },
        timestamp: expect.any(String)
      });
    });

    test('deve lidar com erro de validação sem detalhes', () => {
      const simpleError = { message: 'Validação falhou' };
      
      ResponseService.validationError(mockRes, simpleError, 'Erro de validação');
      
      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.message).toBe('Erro de validação');
      expect(jsonCall.details.validationErrors).toEqual([simpleError]);
    });

  });

  describe('Pagination Response', () => {

    test('deve formatar resposta paginada', () => {
      const items = [
        { id: 1, nome: 'Item 1' },
        { id: 2, nome: 'Item 2' }
      ];
      
      const pagination = {
        page: 1,
        limit: 10,
        total: 25
      };
      
      ResponseService.paginated(mockRes, items, pagination, 'Itens encontrados');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Itens encontrados',
        data: items,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalItems: 25,
          itemsPerPage: 10,
          hasNext: true,
          hasPrev: false
        },
        timestamp: expect.any(String)
      });
    });

    test('deve calcular hasNext e hasPrev corretamente', () => {
      const items = [];
      
      // Página do meio
      let pagination = { page: 2, limit: 10, total: 25, totalPages: 3 };
      ResponseService.paginated(mockRes, items, pagination);
      
      let jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.pagination.hasNext).toBe(true);
      expect(jsonCall.pagination.hasPrev).toBe(true);
      
      mockRes.json.mockClear();
      
      // Última página
      pagination = { page: 3, limit: 10, total: 25, totalPages: 3 };
      ResponseService.paginated(mockRes, items, pagination);
      
      jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.pagination.hasNext).toBe(false);
      expect(jsonCall.pagination.hasPrev).toBe(true);
    });

  });

  describe('Created Response', () => {

    test('deve retornar resposta 201 para criação', () => {
      const newUser = { id: 1, nome: 'João Silva', email: 'joao@test.com' };
      
      ResponseService.created(mockRes, newUser, 'Usuário criado');
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuário criado',
        data: newUser,
        timestamp: expect.any(String)
      });
    });

  });

  describe('Not Found Response', () => {

    test('deve retornar resposta 404', () => {
      ResponseService.notFound(mockRes, 'Usuário');
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuário não encontrado',
        statusCode: 404,
        timestamp: expect.any(String)
      });
    });

    test('deve usar mensagem padrão', () => {
      ResponseService.notFound(mockRes);
      
      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.message).toBe('Recurso não encontrado');
    });

  });

  describe('Forbidden Response', () => {

    test('deve retornar resposta 403', () => {
      ResponseService.forbidden(mockRes, 'Acesso negado para esta operação');
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acesso negado para esta operação',
        statusCode: 403,
        timestamp: expect.any(String)
      });
    });

  });

  describe('Timestamp Formatting', () => {

    test('deve usar timestamp ISO válido', () => {
      ResponseService.success(mockRes, null);
      
      const jsonCall = mockRes.json.mock.calls[0][0];
      const timestamp = jsonCall.timestamp;
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    test('timestamps devem ser diferentes em chamadas consecutivas', (done) => {
      ResponseService.success(mockRes, null);
      const firstTimestamp = mockRes.json.mock.calls[0][0].timestamp;
      
      setTimeout(() => {
        mockRes.json.mockClear();
        ResponseService.success(mockRes, null);
        const secondTimestamp = mockRes.json.mock.calls[0][0].timestamp;
        
        expect(firstTimestamp).not.toBe(secondTimestamp);
        done();
      }, 1);
    });

  });

});