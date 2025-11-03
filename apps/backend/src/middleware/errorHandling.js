/**
 * Middleware global de tratamento de erros
 * Captura e formata todos os erros da aplicação
 */

const config = require('../config');

/**
 * Logger simples para erros
 */
const logError = (error, req) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.error(`[${timestamp}] ❌ ERROR`);
  console.error(`   Method: ${method}`);
  console.error(`   URL: ${url}`);
  console.error(`   IP: ${ip}`);
  console.error(`   Message: ${error.message}`);
  console.error(`   Stack: ${error.stack}`);
  console.error('----------------------------------------');
};

/**
 * Middleware de tratamento de erros
 */
const errorHandler = (error, req, res, next) => {
  // Log do erro
  logError(error, req);

  // Se já foi enviada uma resposta, delegar para o Express
  if (res.headersSent) {
    return next(error);
  }

  // Determinar status code baseado no tipo de erro
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let details = null;

  // Erros específicos
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Dados de entrada inválidos';
    details = error.details || error.message;
  } else if (error.name === 'UnauthorizedError' || error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token de acesso inválido ou expirado';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Acesso negado';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Recurso não encontrado';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = 'Conflito de dados';
  } else if (error.code === 'P2002') {
    // Erro de constraint única do Prisma
    statusCode = 409;
    message = 'Dados já existem no sistema';
  } else if (error.code === 'P2025') {
    // Registro não encontrado no Prisma
    statusCode = 404;
    message = 'Registro não encontrado';
  } else if (error.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Arquivo muito grande';
  }

  // Em produção, não expor detalhes técnicos
  if (config.server.env === 'production') {
    details = null;
    if (statusCode === 500) {
      message = 'Erro interno do servidor';
    }
  } else {
    // Em desenvolvimento, incluir stack trace
    details = {
      stack: error.stack,
      ...details
    };
  }

  // Resposta formatada
  res.status(statusCode).json({
    success: false,
    message,
    details,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};

/**
 * Middleware para capturar rotas não encontradas
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};

/**
 * Wrapper para async functions
 * Captura erros automaticamente sem precisar de try/catch
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};