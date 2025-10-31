const winston = require('winston');
const path = require('path');

// Configurações do logger
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mediapp-backend' },
  transports: []
};

// Configurar transports baseado no ambiente
if (process.env.NODE_ENV !== 'production') {
  // Desenvolvimento: log no console com cores
  loggerConfig.transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    })
  );
} else {
  // Produção: logs em arquivos
  loggerConfig.transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger(loggerConfig);

// Stream para integração com Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Função para log de auditoria médica
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mediapp-audit' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/audit.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  ]
});

// Função para registrar ações médicas sensíveis
const logMedicalAction = (userId, action, patientId, details = {}) => {
  auditLogger.info({
    userId,
    action,
    patientId,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown'
  });
};

module.exports = {
  logger,
  auditLogger,
  logMedicalAction
};