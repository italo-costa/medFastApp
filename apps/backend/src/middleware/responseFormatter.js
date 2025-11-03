/**
 * Middleware para padronizar respostas da API
 * Garante que todas as respostas sigam o mesmo formato
 */

/**
 * Middleware que adiciona métodos de resposta padronizados ao objeto res
 */
const responseFormatter = (req, res, next) => {
  // Sucesso com dados
  res.success = (data, message = 'Operação realizada com sucesso', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  };

  // Sucesso com paginação
  res.successWithPagination = (data, pagination, message = 'Dados recuperados com sucesso') => {
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: parseInt(pagination.page) || 1,
        limit: parseInt(pagination.limit) || 10,
        total: pagination.total || 0,
        totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
      },
      message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  };

  // Erro personalizado
  res.error = (message = 'Erro interno do servidor', statusCode = 500, details = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  };

  // Erro de validação
  res.validationError = (errors, message = 'Dados inválidos') => {
    return res.status(400).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  };

  // Não encontrado
  res.notFound = (message = 'Recurso não encontrado') => {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  };

  // Não autorizado
  res.unauthorized = (message = 'Acesso não autorizado') => {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  };

  next();
};

module.exports = responseFormatter;