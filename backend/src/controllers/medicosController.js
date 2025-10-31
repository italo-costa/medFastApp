/**
 * Controller de Médicos
 * Gerencia todas as operações relacionadas aos médicos
 */

const databaseService = require('../services/database');

class MedicosController {
  /**
   * Listar médicos com filtros e paginação
   */
  async listar(req, res) {
    const { search, especialidade, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Construir filtros
    let where = {
      usuario: {
        ativo: true
      }
    };

    if (search) {
      where.OR = [
        {
          usuario: {
            nome: { contains: search, mode: 'insensitive' }
          }
        },
        { crm: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (especialidade) {
      where.especialidade = especialidade;
    }

    try {
      const [medicos, total] = await Promise.all([
        databaseService.client.medico.findMany({
          where,
          include: {
            usuario: {
              select: {
                nome: true,
                email: true,
                ativo: true
              }
            },
            _count: {
              select: { consultas: true }
            }
          },
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { crm: 'asc' }
        }),
        databaseService.client.medico.count({ where })
      ]);

      // Formatar dados para o frontend
      const medicosFormatados = medicos.map(medico => ({
        id: medico.id,
        nomeCompleto: medico.usuario?.nome || 'Nome não disponível',
        crm: medico.crm,
        crm_uf: medico.crm_uf,
        especialidade: medico.especialidade,
        telefone: medico.telefone,
        celular: medico.celular,
        email: medico.usuario?.email || 'Email não disponível',
        status: medico.usuario?.ativo ? 'ATIVO' : 'INATIVO',
        totalConsultas: medico._count?.consultas || 0
      }));

      res.successWithPagination(
        medicosFormatados,
        { page, limit, total },
        `${medicosFormatados.length} médicos encontrados`
      );

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao listar:', error.message);
      res.error('Erro ao buscar médicos', 500, error.message);
    }
  }

  /**
   * Buscar médico por ID
   */
  async buscarPorId(req, res) {
    const { id } = req.params;

    try {
      const medico = await databaseService.client.medico.findUnique({
        where: { id },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              ativo: true
            }
          },
          _count: {
            select: {
              consultas: true,
              prontuarios: true
            }
          }
        }
      });

      if (!medico) {
        return res.notFound('Médico não encontrado');
      }

      const medicoFormatado = {
        id: medico.id,
        nomeCompleto: medico.usuario?.nome || 'Nome não disponível',
        crm: medico.crm,
        crm_uf: medico.crm_uf,
        especialidade: medico.especialidade,
        telefone: medico.telefone,
        celular: medico.celular,
        endereco: medico.endereco,
        formacao: medico.formacao,
        experiencia: medico.experiencia,
        horario_atendimento: medico.horario_atendimento,
        email: medico.usuario?.email || 'Email não disponível',
        status: medico.usuario?.ativo ? 'ATIVO' : 'INATIVO',
        estatisticas: {
          totalConsultas: medico._count?.consultas || 0,
          totalProntuarios: medico._count?.prontuarios || 0
        }
      };

      res.success(medicoFormatado, 'Médico encontrado com sucesso');

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao buscar por ID:', error.message);
      res.error('Erro ao buscar médico', 500, error.message);
    }
  }

  /**
   * Criar novo médico
   */
  async criar(req, res) {
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

    try {
      // Verificar se CRM já existe
      const crmExistente = await databaseService.client.medico.findUnique({
        where: { crm }
      });

      if (crmExistente) {
        return res.error('CRM já cadastrado no sistema', 409);
      }

      // Criar médico com usuário em transação
      const novoMedico = await databaseService.client.$transaction(async (prisma) => {
        // Criar usuário
        const usuario = await prisma.usuario.create({
          data: {
            nome,
            email,
            senha, // Implementar hash da senha depois
            tipo: 'MEDICO',
            ativo: true
          }
        });

        // Criar médico
        const medico = await prisma.medico.create({
          data: {
            usuario_id: usuario.id,
            crm,
            crm_uf,
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
                nome: true,
                email: true,
                ativo: true
              }
            }
          }
        });

        return medico;
      });

      res.success(
        {
          id: novoMedico.id,
          nome: novoMedico.usuario.nome,
          crm: novoMedico.crm,
          especialidade: novoMedico.especialidade
        },
        'Médico cadastrado com sucesso',
        201
      );

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao criar:', error.message);
      
      if (error.code === 'P2002') {
        return res.error('Email ou CRM já cadastrado', 409);
      }
      
      res.error('Erro ao cadastrar médico', 500, error.message);
    }
  }

  /**
   * Atualizar médico
   */
  async atualizar(req, res) {
    const { id } = req.params;
    const dadosAtualizacao = req.body;

    try {
      // Verificar se médico existe
      const medicoExistente = await databaseService.client.medico.findUnique({
        where: { id },
        include: { usuario: true }
      });

      if (!medicoExistente) {
        return res.notFound('Médico não encontrado');
      }

      // Atualizar em transação
      const medicoAtualizado = await databaseService.client.$transaction(async (prisma) => {
        // Dados do usuário
        if (dadosAtualizacao.nome || dadosAtualizacao.email) {
          await prisma.usuario.update({
            where: { id: medicoExistente.usuario_id },
            data: {
              ...(dadosAtualizacao.nome && { nome: dadosAtualizacao.nome }),
              ...(dadosAtualizacao.email && { email: dadosAtualizacao.email })
            }
          });
        }

        // Dados do médico
        const { nome, email, ...dadosMedico } = dadosAtualizacao;
        
        const medico = await prisma.medico.update({
          where: { id },
          data: dadosMedico,
          include: {
            usuario: {
              select: {
                nome: true,
                email: true,
                ativo: true
              }
            }
          }
        });

        return medico;
      });

      res.success(
        {
          id: medicoAtualizado.id,
          nome: medicoAtualizado.usuario.nome,
          crm: medicoAtualizado.crm,
          especialidade: medicoAtualizado.especialidade
        },
        'Médico atualizado com sucesso'
      );

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao atualizar:', error.message);
      res.error('Erro ao atualizar médico', 500, error.message);
    }
  }

  /**
   * Remover médico (soft delete)
   */
  async remover(req, res) {
    const { id } = req.params;

    try {
      const medico = await databaseService.client.medico.findUnique({
        where: { id },
        include: { usuario: true }
      });

      if (!medico) {
        return res.notFound('Médico não encontrado');
      }

      // Desativar usuário (soft delete)
      await databaseService.client.usuario.update({
        where: { id: medico.usuario_id },
        data: { ativo: false }
      });

      res.success(null, 'Médico removido com sucesso');

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao remover:', error.message);
      res.error('Erro ao remover médico', 500, error.message);
    }
  }
}

module.exports = new MedicosController();