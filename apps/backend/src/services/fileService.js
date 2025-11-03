/**
 * Serviço de Arquivos Centralizado - Versão Simplificada
 * Consolida upload e manipulação de arquivos
 */

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class FileService {

  /**
   * Configurações de upload
   */
  static getUploadConfig() {
    return {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedDocumentTypes: ['application/pdf'],
      uploadPath: path.join(process.cwd(), 'uploads'),
      tempPath: path.join(process.cwd(), 'temp')
    };
  }

  /**
   * Storage para multer com nomes únicos
   */
  static getMulterStorage(subfolder = '') {
    const config = this.getUploadConfig();
    
    return multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadDir = path.join(config.uploadPath, subfolder);
        
        try {
          await fs.mkdir(uploadDir, { recursive: true });
          cb(null, uploadDir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const uniqueName = this.generateUniqueFileName(file.originalname);
        cb(null, uniqueName);
      }
    });
  }

  /**
   * Gerar nome único para arquivo
   */
  static generateUniqueFileName(originalName) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${randomString}${ext}`;
  }

  /**
   * Configuração do multer para upload de imagens
   */
  static getImageUpload(fieldName = 'foto', subfolder = 'fotos') {
    const config = this.getUploadConfig();
    
    return multer({
      storage: this.getMulterStorage(subfolder),
      limits: {
        fileSize: config.maxFileSize
      },
      fileFilter: (req, file, cb) => {
        if (config.allowedImageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Tipo de arquivo não permitido. Aceitos: ${config.allowedImageTypes.join(', ')}`));
        }
      }
    }).single(fieldName);
  }

  /**
   * Processar imagem com Sharp
   */
  static async processImage(inputPath, options = {}) {
    const {
      width = null,
      height = null,
      quality = 80,
      format = 'jpeg',
      outputPath = null
    } = options;

    try {
      let sharpInstance = sharp(inputPath);

      // Redimensionar se especificado
      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Aplicar formato e qualidade
      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
      }

      // Salvar processada
      const finalOutputPath = outputPath || inputPath;
      await sharpInstance.toFile(finalOutputPath);

      // Se foi salva em local diferente, remover original
      if (outputPath && outputPath !== inputPath) {
        await this.deleteFile(inputPath);
      }

      return finalOutputPath;

    } catch (error) {
      console.error('❌ [FILE] Erro ao processar imagem:', error);
      throw new Error('Erro ao processar imagem');
    }
  }

  /**
   * Deletar arquivo
   */
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ [FILE] Arquivo deletado: ${filePath}`);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ [FILE] Erro ao deletar arquivo:', error);
      }
      return false;
    }
  }

  /**
   * Verificar se arquivo existe
   */
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obter URL pública do arquivo
   */
  static getPublicUrl(filePath, baseUrl = '') {
    if (!filePath) return null;
    
    const config = this.getUploadConfig();
    const relativePath = path.relative(config.uploadPath, filePath);
    return `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  /**
   * Middleware para upload de foto de perfil
   */
  static uploadProfilePhoto() {
    return (req, res, next) => {
      const upload = this.getImageUpload('foto', 'perfil');
      
      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        // Se arquivo foi enviado, processar
        if (req.file) {
          try {
            // Processar imagem
            const processedPath = await this.processImage(req.file.path, {
              width: 800,
              height: 800,
              quality: 85,
              format: 'jpeg'
            });

            req.file.processedPath = processedPath;
            req.file.publicUrl = this.getPublicUrl(processedPath, req.protocol + '://' + req.get('host'));

          } catch (error) {
            // Deletar arquivo se houve erro no processamento
            await this.deleteFile(req.file.path);
            
            return res.status(500).json({
              success: false,
              message: 'Erro ao processar imagem'
            });
          }
        }

        next();
      });
    };
  }

}

module.exports = FileService;