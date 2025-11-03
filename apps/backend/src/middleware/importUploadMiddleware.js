/**
 * Middleware para upload de arquivos de importação
 */

const multer = require('multer');
const path = require('path');

// Configuração de armazenamento temporário
const storage = multer.memoryStorage();

// Filtro de tipos de arquivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ];

  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use apenas .xlsx, .xls ou .csv'), false);
  }
};

// Configuração do multer para importação
const uploadImportacao = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 1 // Apenas um arquivo por vez
  }
});

/**
 * Middleware para tratamento de erros de upload
 */
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. Tamanho máximo: 10MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Muitos arquivos. Envie apenas um arquivo por vez'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de arquivo inesperado'
      });
    }
  }

  if (err.message.includes('Tipo de arquivo não permitido')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Outros erros
  return res.status(500).json({
    success: false,
    message: 'Erro no upload do arquivo'
  });
};

/**
 * Middleware para validar se arquivo foi enviado
 */
const validateFilePresence = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Nenhum arquivo foi enviado'
    });
  }
  next();
};

module.exports = {
  uploadImportacao: uploadImportacao.single('arquivo'),
  handleUploadErrors,
  validateFilePresence
};