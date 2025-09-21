const { logger } = require('../utils/logger');

// Middleware para rotas não encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Endpoint não encontrado: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware para tratamento de erros
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Erro de validação do Joi
  if (err.isJoi) {
    statusCode = 400;
    message = err.details[0].message;
  }

  // Erro do Prisma (banco de dados)
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Recurso já existe (violação de unicidade)';
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Recurso não encontrado';
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Erro de multer (upload de arquivo)
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'Arquivo muito grande';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Tipo de arquivo não permitido';
  }

  // Log do erro
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  });

  // Resposta do erro
  const errorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(errorResponse);
};

// Middleware para capturar erros assíncronos
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler
};