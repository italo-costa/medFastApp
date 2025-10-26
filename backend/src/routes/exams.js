const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/exams');
    
    // Criar diretório se não existir
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Nome único: timestamp_pacienteId_originalname
    const uniqueName = `${Date.now()}_${req.body.paciente_id || 'unknown'}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Filtro de tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Imagens
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    // PDFs
    'application/pdf',
    // Vídeos
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/mkv',
    'video/webm',
    // Documentos médicos
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Tipos aceitos: imagens, PDFs, vídeos e documentos.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limite
  }
});

// ====================================
// ROTAS DE EXAMES MÉDICOS
// ====================================

// GET /api/exams - Listar todos os exames
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, paciente_id, tipo_exame, data_inicio, data_fim } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Construir filtros
    const where = {};
    
    if (paciente_id) {
      where.paciente_id = paciente_id;
    }
    
    if (tipo_exame) {
      where.tipo_exame = {
        contains: tipo_exame,
        mode: 'insensitive'
      };
    }
    
    if (data_inicio || data_fim) {
      where.data_realizacao = {};
      if (data_inicio) {
        where.data_realizacao.gte = new Date(data_inicio);
      }
      if (data_fim) {
        where.data_realizacao.lte = new Date(data_fim);
      }
    }

    // Buscar exames com relacionamentos
    const exames = await prisma.exame.findMany({
      where,
      skip,
      take,
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            data_nascimento: true
          }
        }
      },
      orderBy: {
        data_realizacao: 'desc'
      }
    });

    // Contar total para paginação
    const total = await prisma.exame.count({ where });
    
    res.json({
      success: true,
      data: exames,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar exames:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// GET /api/exams/:id - Buscar exame específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const exame = await prisma.exame.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            data_nascimento: true,
            telefone: true
          }
        }
      }
    });

    if (!exame) {
      return res.status(404).json({
        success: false,
        error: 'Exame não encontrado'
      });
    }

    res.json({
      success: true,
      data: exame
    });
    
  } catch (error) {
    console.error('Erro ao buscar exame:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// POST /api/exams/upload - Upload de novo exame
router.post('/upload', upload.single('arquivo'), async (req, res) => {
  try {
    const {
      paciente_id,
      tipo_exame,
      nome_exame,
      data_realizacao,
      laboratorio,
      empresa_exame,
      medico_solicitante,
      observacoes,
      resultado
    } = req.body;

    // Validações básicas
    if (!paciente_id || !tipo_exame || !nome_exame || !data_realizacao) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: paciente_id, tipo_exame, nome_exame, data_realizacao'
      });
    }

    // Verificar se paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { id: paciente_id }
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: 'Paciente não encontrado'
      });
    }

    // Dados do arquivo (se houver)
    let arquivo_url = null;
    let nome_arquivo_original = null;
    let tamanho_arquivo = null;
    let tipo_arquivo = null;

    if (req.file) {
      arquivo_url = req.file.path;
      nome_arquivo_original = req.file.originalname;
      tamanho_arquivo = req.file.size;
      tipo_arquivo = req.file.mimetype;
    }

    // Criar exame no banco
    const novoExame = await prisma.exame.create({
      data: {
        paciente_id,
        tipo_exame,
        nome_exame,
        data_realizacao: new Date(data_realizacao),
        laboratorio: laboratorio || empresa_exame, // Compatibilidade
        medico_solicitante,
        observacoes,
        resultado,
        arquivo_url,
        nome_arquivo_original,
        tamanho_arquivo,
        tipo_arquivo
      },
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            cpf: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: novoExame,
      message: 'Exame cadastrado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao fazer upload do exame:', error);
    
    // Remover arquivo se houver erro
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// PUT /api/exams/:id - Atualizar exame (sem arquivo)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo_exame,
      nome_exame,
      data_realizacao,
      laboratorio,
      empresa_exame,
      medico_solicitante,
      observacoes,
      resultado
    } = req.body;

    // Verificar se exame existe
    const exameExistente = await prisma.exame.findUnique({
      where: { id }
    });

    if (!exameExistente) {
      return res.status(404).json({
        success: false,
        error: 'Exame não encontrado'
      });
    }

    // Atualizar exame
    const exameAtualizado = await prisma.exame.update({
      where: { id },
      data: {
        tipo_exame,
        nome_exame,
        data_realizacao: data_realizacao ? new Date(data_realizacao) : undefined,
        laboratorio: laboratorio || empresa_exame,
        medico_solicitante,
        observacoes,
        resultado
      },
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            cpf: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: exameAtualizado,
      message: 'Exame atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar exame:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// DELETE /api/exams/:id - Excluir exame
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar exame para obter caminho do arquivo
    const exame = await prisma.exame.findUnique({
      where: { id }
    });

    if (!exame) {
      return res.status(404).json({
        success: false,
        error: 'Exame não encontrado'
      });
    }

    // Excluir arquivo do disco se existir
    if (exame.arquivo_url) {
      try {
        await fs.unlink(exame.arquivo_url);
      } catch (fileError) {
        console.warn('Arquivo não encontrado no disco:', fileError.message);
      }
    }

    // Excluir exame do banco
    await prisma.exame.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Exame excluído com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir exame:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// GET /api/exams/download/:id - Download de arquivo
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const exame = await prisma.exame.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            nome: true
          }
        }
      }
    });

    if (!exame) {
      return res.status(404).json({
        success: false,
        error: 'Exame não encontrado'
      });
    }

    if (!exame.arquivo_url) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    // Verificar se arquivo existe no disco
    try {
      await fs.access(exame.arquivo_url);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor'
      });
    }

    // Nome do arquivo para download
    const downloadName = `${exame.paciente.nome}_${exame.nome_exame}_${exame.data_realizacao.toISOString().split('T')[0]}.${path.extname(exame.nome_arquivo_original)}`;

    // Headers para download
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Type', exame.tipo_arquivo || 'application/octet-stream');
    
    // Enviar arquivo
    res.sendFile(path.resolve(exame.arquivo_url));
    
  } catch (error) {
    console.error('Erro ao fazer download do exame:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// GET /api/exams/view/:id - Visualizar arquivo inline
router.get('/view/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const exame = await prisma.exame.findUnique({
      where: { id }
    });

    if (!exame || !exame.arquivo_url) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    // Verificar se arquivo existe
    try {
      await fs.access(exame.arquivo_url);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor'
      });
    }

    // Headers para visualização inline
    res.setHeader('Content-Type', exame.tipo_arquivo || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    
    // Enviar arquivo
    res.sendFile(path.resolve(exame.arquivo_url));
    
  } catch (error) {
    console.error('Erro ao visualizar exame:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// GET /api/exams/patient/:paciente_id - Exames de um paciente específico
router.get('/patient/:paciente_id', async (req, res) => {
  try {
    const { paciente_id } = req.params;
    
    const exames = await prisma.exame.findMany({
      where: { paciente_id },
      orderBy: {
        data_realizacao: 'desc'
      }
    });

    res.json({
      success: true,
      data: exames
    });
    
  } catch (error) {
    console.error('Erro ao buscar exames do paciente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// GET /api/exams/types - Listar tipos de exames mais comuns
router.get('/types/common', async (req, res) => {
  try {
    const tiposComuns = [
      'Raio-X',
      'Tomografia Computadorizada',
      'Ressonância Magnética',
      'Ultrassom',
      'Eletrocardiograma',
      'Ecocardiograma',
      'Endoscopia',
      'Colonoscopia',
      'Mamografia',
      'Densitometria Óssea',
      'Exame de Sangue',
      'Exame de Urina',
      'Espirometria',
      'Holter',
      'MAPA',
      'Biopsia',
      'Teste Ergométrico',
      'PET Scan',
      'Cintilografia',
      'Angiografia'
    ];

    res.json({
      success: true,
      data: tiposComuns
    });
    
  } catch (error) {
    console.error('Erro ao buscar tipos de exames:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

module.exports = router;