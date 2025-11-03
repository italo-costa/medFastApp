/**
 * Router de Médicos - Refatorado com Serviços Centralizados
 * Usa AuthService, ValidationService, FileService e ResponseService
 */

const express = require('express');
const databaseService = require('../services/database');
const AuthService = require('../services/authService');
const ValidationService = require('../services/validationService');
const FileService = require('../services/fileService');
const ResponseService = require('../services/responseService');

const router = express.Router();

// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================

// Aplicar autenticação em todas as rotas
router.use(AuthService.authMiddleware());

// ========================================
// ROTAS CRUD DE MÉDICOS
// ========================================

// GET /api/medicos - Listar todos os médicos
router.get('/', async (req, res) => {
  return ResponseService.handle(res, async () => {
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
      databaseService.client.medico.findMany({
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
      databaseService.client.medico.count({ where })
    ]);

    // Formatar resposta usando ResponseService
    const medicosFormatados = medicos.map(medico => ResponseService.formatData({
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

    return ResponseService.paginated(res, medicosFormatados, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    });

  });
});

// GET /api/medicos/:id - Buscar médico específico
router.get('/:id', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { id } = req.params;

    const medico = await databaseService.client.medico.findUnique({
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
      return ResponseService.notFound(res, 'Médico', id);
    }

    // Formatar resposta
    const medicoFormatado = ResponseService.formatData({
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
    });

    return medicoFormatado;

  }, 'Médico encontrado com sucesso');
});

// POST /api/medicos - Cadastrar novo médico
router.post('/', async (req, res) => {
  return ResponseService.handle(res, async () => {
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

    // Validações usando ValidationService
    const medicoData = {
      nome,
      email,
      crm,
      telefone: telefone || celular
    };

    const validation = ValidationService.validateMedicoData(medicoData);
    if (!validation.valid) {
      return ResponseService.validationError(res, validation.errors);
    }

    // Validar senha
    const senhaValidation = ValidationService.validatePassword(senha, { minLength: 6 });
    if (!senhaValidation.valid) {
      return ResponseService.validationError(res, senhaValidation.errors);
    }

    // Validar especialidade
    if (!especialidade || especialidade.trim().length < 2) {
      return ResponseService.validationError(res, 'Especialidade deve ter pelo menos 2 caracteres');
    }

    // Verificar se email já existe
    const emailDisponivel = await AuthService.isEmailAvailable(validation.sanitized.email);
    if (!emailDisponivel) {
      return ResponseService.conflict(res, 'Email já está cadastrado', 'email');
    }

    // Verificar se CRM já existe
    const crmExistente = await databaseService.client.medico.findUnique({
      where: { crm: validation.sanitized.crm }
    });

    if (crmExistente) {
      return ResponseService.conflict(res, 'CRM já está cadastrado', 'crm');
    }

    // Criptografar senha usando AuthService
    const senhaHash = await AuthService.hashPassword(senha);

    // Criar usuário e médico em transação
    const resultado = await databaseService.client.$transaction(async (transaction) => {
      // Criar usuário
      const usuario = await transaction.usuario.create({
        data: {
          nome: validation.sanitized.nome,
          email: validation.sanitized.email,
          senha: senhaHash,
          tipo: 'MEDICO'
        }
      });

      // Criar médico
      const medico = await transaction.medico.create({
        data: {
          usuario_id: usuario.id,
          crm: validation.sanitized.crm,
          crm_uf: (crm_uf || 'SP').toUpperCase(),
          especialidade: ValidationService.sanitizeText(especialidade, { maxLength: 100 }),
          telefone: validation.sanitized.telefone,
          celular: validation.sanitized.telefone,
          endereco: ValidationService.sanitizeText(endereco, { maxLength: 255 }),
          formacao: ValidationService.sanitizeText(formacao, { maxLength: 200 }) || 'Não informado',
          experiencia: ValidationService.sanitizeText(experiencia, { maxLength: 500 }),
          horario_atendimento: ValidationService.sanitizeText(horario_atendimento, { maxLength: 200 })
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

    console.log(`✅ [MEDICOS] Médico cadastrado: ${resultado.usuario.nome} (CRM: ${resultado.crm})`);

    // Formatar resposta usando ResponseService
    const medicoResposta = ResponseService.formatData({
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
    });

    return medicoResposta;

  }, 'Médico cadastrado com sucesso');
});

// PUT /api/medicos/:id - Atualizar médico
router.put('/:id', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { id } = req.params;
    const dadosAtualizacao = req.body;

    // Verificar se médico existe
    const medicoExistente = await databaseService.client.medico.findUnique({
      where: { id },
      include: { usuario: true }
    });

    if (!medicoExistente) {
      return ResponseService.notFound(res, 'Médico', id);
    }

    // Validar dados se fornecidos
    const errors = [];

    if (dadosAtualizacao.nome) {
      const nomeValidation = ValidationService.validateName(dadosAtualizacao.nome);
      if (!nomeValidation.valid) {
        errors.push(...nomeValidation.errors);
      }
    }

    if (dadosAtualizacao.telefone) {
      const telefoneValidation = ValidationService.validatePhone(dadosAtualizacao.telefone);
      if (!telefoneValidation.valid) {
        errors.push(...telefoneValidation.errors);
      }
    }

    if (dadosAtualizacao.celular) {
      const celularValidation = ValidationService.validatePhone(dadosAtualizacao.celular);
      if (!celularValidation.valid) {
        errors.push(...celularValidation.errors);
      }
    }

    if (errors.length > 0) {
      return ResponseService.validationError(res, errors);
    }

    // Separar dados do usuário e do médico
    const dadosUsuario = {};
    const dadosMedico = {};

    // Campos que pertencem ao usuário
    if (dadosAtualizacao.nome !== undefined) {
      dadosUsuario.nome = ValidationService.sanitizeText(dadosAtualizacao.nome, { maxLength: 100 });
    }

    // Campos que pertencem ao médico
    const camposMedico = ['especialidade', 'telefone', 'celular', 'endereco', 'formacao', 'experiencia', 'horario_atendimento'];
    camposMedico.forEach(campo => {
      if (dadosAtualizacao[campo] !== undefined) {
        if (campo === 'telefone' || campo === 'celular') {
          // Validar e sanitizar telefone
          const phoneValidation = ValidationService.validatePhone(dadosAtualizacao[campo]);
          if (phoneValidation.valid) {
            dadosMedico[campo] = phoneValidation.sanitized;
          }
        } else {
          // Sanitizar outros campos de texto
          dadosMedico[campo] = ValidationService.sanitizeText(dadosAtualizacao[campo], { 
            maxLength: campo === 'endereco' ? 255 : campo === 'experiencia' ? 500 : 200 
          });
        }
      }
    });

    // Atualizar em transação
    const medicoAtualizado = await databaseService.client.$transaction(async (transaction) => {
      // Atualizar usuário se necessário
      if (Object.keys(dadosUsuario).length > 0) {
        await transaction.usuario.update({
          where: { id: medicoExistente.usuario_id },
          data: dadosUsuario
        });
      }

      // Atualizar médico se necessário
      if (Object.keys(dadosMedico).length > 0) {
        await transaction.medico.update({
          where: { id },
          data: dadosMedico
        });
      }

      // Buscar dados atualizados
      return await transaction.medico.findUnique({
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

    console.log(`✅ [MEDICOS] Médico atualizado: ${medicoAtualizado.usuario.nome} (CRM: ${medicoAtualizado.crm})`);

    // Formatar resposta
    const medicoResposta = ResponseService.formatData({
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
    });

    return medicoResposta;

  }, 'Médico atualizado com sucesso');
});

// DELETE /api/medicos/:id - Desativar médico (soft delete)
router.delete('/:id', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { id } = req.params;

    // Verificar se médico existe
    const medicoExistente = await databaseService.client.medico.findUnique({
      where: { id },
      include: { usuario: true }
    });

    if (!medicoExistente) {
      return ResponseService.notFound(res, 'Médico', id);
    }

    // Desativar usuário (soft delete)
    await databaseService.client.usuario.update({
      where: { id: medicoExistente.usuario_id },
      data: { ativo: false }
    });

    console.log(`🗑️ [MEDICOS] Médico desativado: ${medicoExistente.usuario.nome} (CRM: ${medicoExistente.crm})`);

    return null; // Sem dados para retornar

  }, 'Médico desativado com sucesso');
});

// POST /api/medicos/:id/reativar - Reativar médico
router.post('/:id/reativar', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { id } = req.params;

    // Verificar se médico existe
    const medicoExistente = await databaseService.client.medico.findUnique({
      where: { id },
      include: { usuario: true }
    });

    if (!medicoExistente) {
      return ResponseService.notFound(res, 'Médico', id);
    }

    // Reativar usuário
    await databaseService.client.usuario.update({
      where: { id: medicoExistente.usuario_id },
      data: { ativo: true }
    });

    console.log(`♻️ [MEDICOS] Médico reativado: ${medicoExistente.usuario.nome} (CRM: ${medicoExistente.crm})`);

    return null; // Sem dados para retornar

  }, 'Médico reativado com sucesso');
});

// POST /api/medicos/:id/foto - Upload de foto do médico
router.post('/:id/foto', FileService.uploadProfilePhoto(), async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { id } = req.params;

    // Verificar se médico existe
    const medicoExistente = await databaseService.client.medico.findUnique({
      where: { id }
    });

    if (!medicoExistente) {
      return ResponseService.notFound(res, 'Médico', id);
    }

    if (!req.file) {
      return ResponseService.validationError(res, 'Nenhuma foto foi enviada');
    }

    // Atualizar médico com caminho da foto
    await databaseService.client.medico.update({
      where: { id },
      data: {
        foto_url: req.file.publicUrl
      }
    });

    console.log(`📷 [MEDICOS] Foto atualizada para médico: ${id}`);

    return {
      foto_url: req.file.publicUrl,
      filename: req.file.filename,
      size: req.file.size
    };

  }, 'Foto atualizada com sucesso');
});

// GET /api/medicos/estatisticas/dashboard - Estatísticas para dashboard
router.get('/estatisticas/dashboard', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const [
      totalMedicos,
      medicosAtivos,
      medicosInativos,
      especialidades,
      consultasHoje,
      consultasMes
    ] = await Promise.all([
      // Total de médicos
      databaseService.client.medico.count(),
      
      // Médicos ativos
      databaseService.client.medico.count({
        where: { usuario: { ativo: true } }
      }),
      
      // Médicos inativos
      databaseService.client.medico.count({
        where: { usuario: { ativo: false } }
      }),
      
      // Distribuição por especialidades
      databaseService.client.medico.groupBy({
        by: ['especialidade'],
        _count: { especialidade: true },
        where: { usuario: { ativo: true } },
        orderBy: { _count: { especialidade: 'desc' } },
        take: 10
      }),
      
      // Consultas hoje
      databaseService.client.consulta.count({
        where: {
          data_hora: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }).catch(() => 0), // Se tabela não existir
      
      // Consultas este mês
      databaseService.client.consulta.count({
        where: {
          data_hora: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        }
      }).catch(() => 0) // Se tabela não existir
    ]);

    return ResponseService.statistics(res, {
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
    });

  });
});

module.exports = router;