/**
 * Serviço de Resposta Centralizado
 * Padroniza todas as respostas da API
 */

class ResponseService {

  /**
   * Resposta de sucesso padrão
   */
  static success(res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    // Adicionar metadados se for array com paginação
    if (Array.isArray(data) && data.length > 0 && data[0]._meta) {
      response.meta = data[0]._meta;
      delete data[0]._meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Resposta de erro padrão
   */
  static error(res, message = 'Erro interno do servidor', statusCode = 500, details = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      statusCode
    };

    if (details) {
      response.details = details;
    }

    // Log do erro se for erro do servidor
    if (statusCode >= 500) {
      console.error(`❌ [API ERROR ${statusCode}]:`, message, details || '');
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Resposta para dados não encontrados
   */
  static notFound(res, resource = 'Recurso', id = null) {
    const message = id 
      ? `${resource} com ID ${id} não encontrado`
      : `${resource} não encontrado`;
      
    return this.error(res, message, 404);
  }

  /**
   * Resposta para erro de validação
   */
  static validationError(res, errors, message = 'Erro de validação') {
    return this.error(res, message, 400, { 
      validationErrors: Array.isArray(errors) ? errors : [errors]
    });
  }

  /**
   * Resposta para erro de autenticação
   */
  static unauthorized(res, message = 'Acesso não autorizado') {
    return this.error(res, message, 401);
  }

  /**
   * Resposta para erro de permissão
   */
  static forbidden(res, message = 'Acesso negado') {
    return this.error(res, message, 403);
  }

  /**
   * Resposta para conflito (dados duplicados)
   */
  static conflict(res, message = 'Dados já existem', field = null) {
    const details = field ? { conflictField: field } : null;
    return this.error(res, message, 409, details);
  }

  /**
   * Resposta para muitas requisições
   */
  static tooManyRequests(res, message = 'Muitas requisições') {
    return this.error(res, message, 429);
  }

  /**
   * Resposta para dados criados
   */
  static created(res, data, message = 'Criado com sucesso') {
    return this.success(res, data, message, 201);
  }

  /**
   * Resposta para operação sem conteúdo
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Resposta paginada
   */
  static paginated(res, data, pagination, message = 'Dados obtidos com sucesso') {
    const response = {
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.page,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        totalItems: pagination.total,
        itemsPerPage: pagination.limit,
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(response);
  }

  /**
   * Resposta com dados de lista simples
   */
  static list(res, data, total = null, message = 'Lista obtida com sucesso') {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    if (total !== null) {
      response.total = total;
    }

    return res.status(200).json(response);
  }

  /**
   * Resposta para upload de arquivo
   */
  static fileUploaded(res, fileData, message = 'Arquivo enviado com sucesso') {
    return this.success(res, {
      filename: fileData.filename,
      originalName: fileData.originalname,
      size: fileData.size,
      mimetype: fileData.mimetype,
      path: fileData.path,
      url: fileData.publicUrl || null
    }, message, 201);
  }

  /**
   * Resposta para operação de atualização
   */
  static updated(res, data = null, message = 'Atualizado com sucesso') {
    return this.success(res, data, message, 200);
  }

  /**
   * Resposta para operação de exclusão
   */
  static deleted(res, message = 'Excluído com sucesso') {
    return this.success(res, null, message, 200);
  }

  /**
   * Resposta para health check
   */
  static health(res, checks = {}) {
    const allHealthy = Object.values(checks).every(check => check === true);
    
    const response = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks
    };

    const statusCode = allHealthy ? 200 : 503;
    return res.status(statusCode).json(response);
  }

  /**
   * Resposta para estatísticas/dashboard
   */
  static statistics(res, stats, message = 'Estatísticas obtidas com sucesso') {
    return this.success(res, {
      ...stats,
      generatedAt: new Date().toISOString()
    }, message);
  }

  /**
   * Wrapper para operações assíncronas (evita try/catch repetitivo)
   */
  static async handle(res, asyncOperation, successMessage = 'Operação realizada com sucesso') {
    try {
      const result = await asyncOperation();
      
      if (result === null || result === undefined) {
        return this.notFound(res);
      }
      
      return this.success(res, result, successMessage);
      
    } catch (error) {
      console.error('❌ [RESPONSE] Erro na operação:', error);
      
      // Tratar diferentes tipos de erro
      if (error.message.includes('não encontrado')) {
        return this.notFound(res);
      }
      
      if (error.message.includes('já existe') || error.message.includes('duplicado')) {
        return this.conflict(res, error.message);
      }
      
      if (error.message.includes('validação') || error.message.includes('inválido')) {
        return this.validationError(res, error.message);
      }
      
      if (error.message.includes('não autorizado') || error.message.includes('token')) {
        return this.unauthorized(res, error.message);
      }
      
      return this.error(res, error.message || 'Erro interno do servidor');
    }
  }

  /**
   * Middleware para capturar erros não tratados
   */
  static errorHandler() {
    return (error, req, res, next) => {
      console.error('❌ [UNHANDLED ERROR]:', error);
      
      // Se response já foi enviado, delegate para handler padrão do Express
      if (res.headersSent) {
        return next(error);
      }
      
      // Erros de validação do Prisma
      if (error.code === 'P2002') {
        return ResponseService.conflict(res, 'Dados já existem');
      }
      
      if (error.code === 'P2025') {
        return ResponseService.notFound(res);
      }
      
      // Erro de validação do Express
      if (error.type === 'entity.parse.failed') {
        return ResponseService.validationError(res, 'JSON inválido');
      }
      
      // Erro de arquivo muito grande
      if (error.code === 'LIMIT_FILE_SIZE') {
        return ResponseService.validationError(res, 'Arquivo muito grande');
      }
      
      // Erro genérico
      return ResponseService.error(res, 
        process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor'
      );
    };
  }

  /**
   * Middleware para rotas não encontradas
   */
  static notFoundHandler() {
    return (req, res) => {
      return ResponseService.notFound(res, 'Rota', req.originalUrl);
    };
  }

  /**
   * Formatar dados para resposta
   */
  static formatData(data, fields = null) {
    if (!data) return null;
    
    if (Array.isArray(data)) {
      return data.map(item => this.formatData(item, fields));
    }
    
    if (typeof data === 'object') {
      const formatted = { ...data };
      
      // Remover campos sensíveis por padrão
      delete formatted.senha;
      delete formatted.password;
      delete formatted.token;
      
      // Formatar datas
      Object.keys(formatted).forEach(key => {
        if (formatted[key] instanceof Date) {
          formatted[key] = formatted[key].toISOString();
        }
      });
      
      // Filtrar campos específicos se fornecidos
      if (fields && Array.isArray(fields)) {
        const filtered = {};
        fields.forEach(field => {
          if (formatted.hasOwnProperty(field)) {
            filtered[field] = formatted[field];
          }
        });
        return filtered;
      }
      
      return formatted;
    }
    
    return data;
  }

  /**
   * Resposta com cache headers
   */
  static cached(res, data, cacheTime = 300, message = 'Dados obtidos com sucesso') {
    res.set('Cache-Control', `public, max-age=${cacheTime}`);
    return this.success(res, data, message);
  }
}

module.exports = ResponseService;