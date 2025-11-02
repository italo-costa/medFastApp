const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// ========================================
// VALIDAÇÕES
// ========================================

const validarCadastroMedico = [
  body('nome')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nome deve ter pelo menos 2 caracteres'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido'),
  
  body('crm')
    .isLength({ min: 4, max: 10 })
    .isAlphanumeric()
    .withMessage('CRM deve ter entre 4 e 10 caracteres alfanuméricos'),
  
  body('crm_uf')
    .isLength({ min: 2, max: 2 })
    .isAlpha()
    .toUpperCase()
    .withMessage('UF do CRM deve ter 2 letras'),
  
  body('especialidade')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Especialidade deve ter pelo menos 2 caracteres'),
  
  body('telefone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone deve ser válido'),
  
  body('celular')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Celular deve ser válido'),
  
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
];

const validarAtualizacaoMedico = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nome deve ter pelo menos 2 caracteres'),
  
  body('especialidade')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Especialidade deve ter pelo menos 2 caracteres'),
  
  body('telefone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone deve ser válido'),
  
  body('celular')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Celular deve ser válido')
];

// ========================================
// ROTAS CRUD DE MÉDICOS
// ========================================

// GET /api/medicos - Listar todos os médicos
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      especialidade, 
      ativo = 'true' 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir filtros
    const where = {
      usuario: {
        ativo: ativo === 'true'
      }
    };

    if (search) {
      where.OR = [
        { usuario: { nome: { contains: search, mode: 'insensitive' } } },
        { crm: { contains: search, mode: 'insensitive' } },
        { especialidade: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (especialidade) {
      where.especialidade = { contains: especialidade, mode: 'insensitive' };
    }

    // Buscar médicos com paginação
    const [medicos, total] = await Promise.all([
      prisma.medico.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              ativo: true,
              ultimo_login: true,
              criado_em: true
            }
          }
        },
        skip: offset,
        take: parseInt(limit),
        orderBy: { usuario: { nome: 'asc' } }
      }),
      prisma.medico.count({ where })
    ]);

    // Formatar resposta
    const medicosFormatados = medicos.map(medico => ({
      id: medico.id,
      usuario_id: medico.usuario_id,
      nome: medico.usuario.nome,
      email: medico.usuario.email,
      crm: medico.crm,
      crm_uf: medico.crm_uf,
      especialidade: medico.especialidade,
      telefone: medico.telefone,
      celular: medico.celular,
      endereco: medico.endereco,
      formacao: medico.formacao,
      experiencia: medico.experiencia,
      horario_atendimento: medico.horario_atendimento,
      ativo: medico.usuario.ativo,
      ultimo_login: medico.usuario.ultimo_login,
      criado_em: medico.criado_em,
      atualizado_em: medico.atualizado_em
    }));

    res.json({
      success: true,
      data: medicosFormatados,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Erro ao listar médicos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/medicos/:id - Buscar médico específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const medico = await prisma.medico.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            ativo: true,
            ultimo_login: true,
            criado_em: true
          }
        },
        consultas: {
          select: {
            id: true,
            data_hora: true,
            tipo: true,
            status: true,
            paciente: {
              select: {
                nome: true
              }
            }
          },
          orderBy: { data_hora: 'desc' },
          take: 5
        },
        prontuarios: {
          select: {
            id: true,
            data_consulta: true,
            tipo_consulta: true,
            paciente: {
              select: {
                nome: true
              }
            }
          },
          orderBy: { data_consulta: 'desc' },
          take: 5
        }
      }
    });

    if (!medico) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    // Formatar resposta
    const medicoFormatado = {
      id: medico.id,
      usuario_id: medico.usuario_id,
      nome: medico.usuario.nome,
      email: medico.usuario.email,
      crm: medico.crm,
      crm_uf: medico.crm_uf,
      especialidade: medico.especialidade,
      telefone: medico.telefone,
      celular: medico.celular,
      endereco: medico.endereco,
      formacao: medico.formacao,
      experiencia: medico.experiencia,
      horario_atendimento: medico.horario_atendimento,
      ativo: medico.usuario.ativo,
      ultimo_login: medico.usuario.ultimo_login,
      criado_em: medico.criado_em,
      atualizado_em: medico.atualizado_em,
      consultas_recentes: medico.consultas,
      prontuarios_recentes: medico.prontuarios
    };

    res.json({
      success: true,
      data: medicoFormatado
    });

  } catch (error) {
    logger.error('Erro ao buscar médico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/medicos - Cadastrar novo médico
router.post('/', validarCadastroMedico, async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const {
      nome,
      email,
      senha,
      crm,
      crm_uf,
      especialidade,
      telefone,
      celular,
      endereco,
      formacao,
      experiencia,
      horario_atendimento
    } = req.body;

    // Verificar se email já existe
    const emailExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (emailExistente) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso'
      });
    }

    // Verificar se CRM já existe
    const crmExistente = await prisma.medico.findUnique({
      where: { crm }
    });

    if (crmExistente) {
      return res.status(400).json({
        success: false,
        message: 'CRM já está cadastrado'
      });
    }

    // Criptografar senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // Criar usuário e médico em transação
    const resultado = await prisma.$transaction(async (prismaTransaction) => {
      // Criar usuário
      const usuario = await prismaTransaction.usuario.create({
        data: {
          nome,
          email,
          senha: senhaHash,
          tipo: 'MEDICO'
        }
      });

      // Criar médico
      const medico = await prismaTransaction.medico.create({
        data: {
          usuario_id: usuario.id,
          crm,
          crm_uf: crm_uf.toUpperCase(),
          especialidade,
          telefone,
          celular,
          endereco,
          formacao,
          experiencia,
          horario_atendimento
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              tipo: true,
              ativo: true,
              criado_em: true
            }
          }
        }
      });

      return medico;
    });

    // Log de auditoria
    logger.info(`Médico cadastrado: ${resultado.usuario.nome} (CRM: ${resultado.crm})`);

    // Formatar resposta (sem dados sensíveis)
    const medicoResposta = {
      id: resultado.id,
      usuario_id: resultado.usuario_id,
      nome: resultado.usuario.nome,
      email: resultado.usuario.email,
      crm: resultado.crm,
      crm_uf: resultado.crm_uf,
      especialidade: resultado.especialidade,
      telefone: resultado.telefone,
      celular: resultado.celular,
      endereco: resultado.endereco,
      formacao: resultado.formacao,
      experiencia: resultado.experiencia,
      horario_atendimento: resultado.horario_atendimento,
      ativo: resultado.usuario.ativo,
      criado_em: resultado.criado_em
    };

    res.status(201).json({
      success: true,
      message: 'Médico cadastrado com sucesso',
      data: medicoResposta
    });

  } catch (error) {
    logger.error('Erro ao cadastrar médico:', error);
    
    // Tratamento de erros específicos do Prisma
    if (error.code === 'P2002') {
      const campo = error.meta?.target?.[0];
      return res.status(400).json({
        success: false,
        message: `${campo === 'crm' ? 'CRM' : 'Email'} já está em uso`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/medicos/:id - Atualizar médico
router.put('/:id', validarAtualizacaoMedico, async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const dadosAtualizacao = req.body;

    // Verificar se médico existe
    const medicoExistente = await prisma.medico.findUnique({
      where: { id },
      include: { usuario: true }
    });

    if (!medicoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    // Separar dados do usuário e do médico
    const dadosUsuario = {};
    const dadosMedico = {};

    // Campos que pertencem ao usuário
    if (dadosAtualizacao.nome !== undefined) dadosUsuario.nome = dadosAtualizacao.nome;

    // Campos que pertencem ao médico
    const camposMedico = ['especialidade', 'telefone', 'celular', 'endereco', 'formacao', 'experiencia', 'horario_atendimento'];
    camposMedico.forEach(campo => {
      if (dadosAtualizacao[campo] !== undefined) {
        dadosMedico[campo] = dadosAtualizacao[campo];
      }
    });

    // Atualizar em transação
    const medicoAtualizado = await prisma.$transaction(async (prismaTransaction) => {
      // Atualizar usuário se necessário
      if (Object.keys(dadosUsuario).length > 0) {
        await prismaTransaction.usuario.update({
          where: { id: medicoExistente.usuario_id },
          data: dadosUsuario
        });
      }

      // Atualizar médico se necessário
      if (Object.keys(dadosMedico).length > 0) {
        await prismaTransaction.medico.update({
          where: { id },
          data: dadosMedico
        });
      }

      // Buscar dados atualizados
      return await prismaTransaction.medico.findUnique({
        where: { id },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              ativo: true,
              atualizado_em: true
            }
          }
        }
      });
    });

    // Log de auditoria
    logger.info(`Médico atualizado: ${medicoAtualizado.usuario.nome} (CRM: ${medicoAtualizado.crm})`);

    // Formatar resposta
    const medicoResposta = {
      id: medicoAtualizado.id,
      usuario_id: medicoAtualizado.usuario_id,
      nome: medicoAtualizado.usuario.nome,
      email: medicoAtualizado.usuario.email,
      crm: medicoAtualizado.crm,
      crm_uf: medicoAtualizado.crm_uf,
      especialidade: medicoAtualizado.especialidade,
      telefone: medicoAtualizado.telefone,
      celular: medicoAtualizado.celular,
      endereco: medicoAtualizado.endereco,
      formacao: medicoAtualizado.formacao,
      experiencia: medicoAtualizado.experiencia,
      horario_atendimento: medicoAtualizado.horario_atendimento,
      ativo: medicoAtualizado.usuario.ativo,
      atualizado_em: medicoAtualizado.atualizado_em
    };

    res.json({
      success: true,
      message: 'Médico atualizado com sucesso',
      data: medicoResposta
    });

  } catch (error) {
    logger.error('Erro ao atualizar médico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/medicos/:id - Desativar médico (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se médico existe
    const medicoExistente = await prisma.medico.findUnique({
      where: { id },
      include: { usuario: true }
    });

    if (!medicoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    // Desativar usuário (soft delete)
    await prisma.usuario.update({
      where: { id: medicoExistente.usuario_id },
      data: { ativo: false }
    });

    // Log de auditoria
    logger.info(`Médico desativado: ${medicoExistente.usuario.nome} (CRM: ${medicoExistente.crm})`);

    res.json({
      success: true,
      message: 'Médico desativado com sucesso'
    });

  } catch (error) {
    logger.error('Erro ao desativar médico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/medicos/:id/reativar - Reativar médico
router.post('/:id/reativar', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se médico existe
    const medicoExistente = await prisma.medico.findUnique({
      where: { id },
      include: { usuario: true }
    });

    if (!medicoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    // Reativar usuário
    await prisma.usuario.update({
      where: { id: medicoExistente.usuario_id },
      data: { ativo: true }
    });

    // Log de auditoria
    logger.info(`Médico reativado: ${medicoExistente.usuario.nome} (CRM: ${medicoExistente.crm})`);

    res.json({
      success: true,
      message: 'Médico reativado com sucesso'
    });

  } catch (error) {
    logger.error('Erro ao reativar médico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/medicos/estatisticas/dashboard - Estatísticas para dashboard
router.get('/estatisticas/dashboard', async (req, res) => {
  try {
    const [
      totalMedicos,
      medicosAtivos,
      medicosInativos,
      especialidades,
      consultasHoje,
      consultasMes
    ] = await Promise.all([
      // Total de médicos
      prisma.medico.count(),
      
      // Médicos ativos
      prisma.medico.count({
        where: { usuario: { ativo: true } }
      }),
      
      // Médicos inativos
      prisma.medico.count({
        where: { usuario: { ativo: false } }
      }),
      
      // Distribuição por especialidades
      prisma.medico.groupBy({
        by: ['especialidade'],
        _count: { especialidade: true },
        where: { usuario: { ativo: true } },
        orderBy: { _count: { especialidade: 'desc' } },
        take: 10
      }),
      
      // Consultas hoje
      prisma.consulta.count({
        where: {
          data_hora: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      
      // Consultas este mês
      prisma.consulta.count({
        where: {
          data_hora: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        medicos: {
          total: totalMedicos,
          ativos: medicosAtivos,
          inativos: medicosInativos
        },
        especialidades: especialidades.map(esp => ({
          nome: esp.especialidade,
          quantidade: esp._count.especialidade
        })),
        consultas: {
          hoje: consultasHoje,
          mes: consultasMes
        }
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;