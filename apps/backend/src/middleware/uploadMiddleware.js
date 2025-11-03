/**
 * Middleware para Upload de Arquivos
 * Gerencia upload de fotos de médicos com validação e processamento
 */

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Configuração de storage
const storage = multer.memoryStorage();

// Filtro para validar tipos de arquivo
const fileFilter = (req, file, cb) => {
  // Tipos permitidos
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use apenas JPEG, PNG ou WebP'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1 // Apenas 1 arquivo por vez
  }
});

/**
 * Middleware para upload de foto de médico
 */
const uploadMedicoFoto = upload.single('foto');

/**
 * Processar e salvar foto do médico
 * @param {Buffer} buffer - Buffer da imagem
 * @param {string} originalName - Nome original do arquivo
 * @param {string} medicoId - ID do médico
 * @returns {Object} - Informações do arquivo salvo
 */
async function processarFotoMedico(buffer, originalName, medicoId) {
  try {
    // Criar diretório se não existir
    const uploadDir = path.join(__dirname, '../../uploads/medicos');
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Gerar nome único para o arquivo
    const fileExtension = '.webp'; // Sempre converter para WebP
    const fileName = `medico_${medicoId}_${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Processar imagem com Sharp
    await sharp(buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .webp({
        quality: 85,
        effort: 4
      })
      .toFile(filePath);
    
    // Retornar informações do arquivo
    return {
      fileName,
      originalName,
      url: `/uploads/medicos/${fileName}`,
      path: filePath,
      size: (await fs.stat(filePath)).size
    };
    
  } catch (error) {
    throw new Error(`Erro ao processar imagem: ${error.message}`);
  }
}

/**
 * Remover foto anterior do médico
 * @param {string} fotoUrl - URL da foto anterior
 */
async function removerFotoAnterior(fotoUrl) {
  if (!fotoUrl) return;
  
  try {
    // Extrair nome do arquivo da URL
    const fileName = path.basename(fotoUrl);
    const filePath = path.join(__dirname, '../../uploads/medicos', fileName);
    
    // Verificar se arquivo existe e remover
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      console.log(`✅ Foto anterior removida: ${fileName}`);
    } catch (error) {
      // Arquivo não existe, ignorar
      console.log(`⚠️ Foto anterior não encontrada: ${fileName}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao remover foto anterior: ${error.message}`);
  }
}

/**
 * Middleware de tratamento de erros do multer
 */
function handleUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.error('Arquivo muito grande. Máximo 5MB permitido', 400);
      case 'LIMIT_FILE_COUNT':
        return res.error('Apenas um arquivo permitido', 400);
      case 'LIMIT_UNEXPECTED_FILE':
        return res.error('Campo de arquivo inesperado', 400);
      default:
        return res.error(`Erro no upload: ${error.message}`, 400);
    }
  }
  
  if (error.message.includes('Tipo de arquivo não permitido')) {
    return res.error(error.message, 400);
  }
  
  next(error);
}

/**
 * Validar e processar upload de foto
 */
async function validarUploadFoto(req, res, next) {
  try {
    // Se não há arquivo, continuar
    if (!req.file) {
      return next();
    }
    
    // Validações adicionais
    const { buffer, originalname, mimetype, size } = req.file;
    
    // Verificar se é realmente uma imagem
    try {
      const metadata = await sharp(buffer).metadata();
      if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) {
        throw new Error('Arquivo não é uma imagem válida');
      }
    } catch (error) {
      return res.error('Arquivo não é uma imagem válida', 400);
    }
    
    // Adicionar informações validadas ao req
    req.validatedFile = {
      buffer,
      originalname,
      mimetype,
      size
    };
    
    next();
    
  } catch (error) {
    res.error(`Erro na validação do arquivo: ${error.message}`, 400);
  }
}

module.exports = {
  uploadMedicoFoto,
  processarFotoMedico,
  removerFotoAnterior,
  handleUploadError,
  validarUploadFoto
};