/**
 * Controller de Pacientes
 * Gerencia todas as operações relacionadas aos pacientes
 */

const databaseService = require('../services/database');

class PacientesController {
  /**
   * Listar pacientes com filtros e paginação
   */
  async listar(req, res) {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Construir filtros
    let where = {
      ativo: true
    };

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search.replace(/\D/g, ''), mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    try {
      const [pacientes, total] = await Promise.all([
        databaseService.client.paciente.findMany({
          where,
          select: {
            id: true,
            nome: true,
            cpf: true,
            data_nascimento: true,
            sexo: true,
            telefone: true,
            celular: true,
            email: true,
            cidade: true,
            uf: true,
            convenio: true,
            _count: {
              select: {
                prontuarios: true,
                exames: true,
                consultas: true
              }
            }
          },
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { nome: 'asc' }
        }),
        databaseService.client.paciente.count({ where })
      ]);

      // Calcular idade
      const pacientesFormatados = pacientes.map(paciente => {
        const idade = Math.floor((new Date() - new Date(paciente.data_nascimento)) / (365.25 * 24 * 60 * 60 * 1000));
        
        return {
          id: paciente.id,
          nome: paciente.nome,
          cpf: paciente.cpf,
          idade,
          sexo: paciente.sexo,
          telefone: paciente.telefone || paciente.celular,
          email: paciente.email,
          cidade: paciente.cidade,
          uf: paciente.uf,
          convenio: paciente.convenio || 'SUS',
          estatisticas: {
            prontuarios: paciente._count.prontuarios,
            exames: paciente._count.exames,
            consultas: paciente._count.consultas
          }
        };
      });

      res.successWithPagination(
        pacientesFormatados,
        { page, limit, total },
        `${pacientesFormatados.length} pacientes encontrados`
      );

    } catch (error) {
      console.error('❌ [PACIENTES] Erro ao listar:', error.message);
      res.error('Erro ao buscar pacientes', 500, error.message);
    }
  }

  /**
   * Buscar paciente por ID
   */
  async buscarPorId(req, res) {
    const { id } = req.params;

    try {
      const paciente = await databaseService.client.paciente.findUnique({
        where: { id },
        include: {
          alergias: true,
          medicamentos: {
            where: { ativo: true }
          },
          doencas: true,
          _count: {
            select: {
              prontuarios: true,
              exames: true,
              consultas: true,
              agendamentos: true
            }
          }
        }
      });

      if (!paciente) {
        return res.notFound('Paciente não encontrado');
      }

      // Calcular idade
      const idade = Math.floor((new Date() - new Date(paciente.data_nascimento)) / (365.25 * 24 * 60 * 60 * 1000));

      const pacienteCompleto = {
        id: paciente.id,
        nome: paciente.nome,
        cpf: paciente.cpf,
        rg: paciente.rg,
        data_nascimento: paciente.data_nascimento,
        idade,
        sexo: paciente.sexo,
        telefone: paciente.telefone,
        celular: paciente.celular,
        email: paciente.email,
        endereco: paciente.endereco,
        cep: paciente.cep,
        cidade: paciente.cidade,
        uf: paciente.uf,
        profissao: paciente.profissao,
        estado_civil: paciente.estado_civil,
        nome_contato: paciente.nome_contato,
        telefone_contato: paciente.telefone_contato,
        convenio: paciente.convenio,
        numero_convenio: paciente.numero_convenio,
        observacoes: paciente.observacoes,
        alergias: paciente.alergias,
        medicamentos_em_uso: paciente.medicamentos,
        doencas_preexistentes: paciente.doencas,
        estatisticas: {
          prontuarios: paciente._count.prontuarios,
          exames: paciente._count.exames,
          consultas: paciente._count.consultas,
          agendamentos: paciente._count.agendamentos
        }
      };

      res.success(pacienteCompleto, 'Paciente encontrado com sucesso');

    } catch (error) {
      console.error('❌ [PACIENTES] Erro ao buscar por ID:', error.message);
      res.error('Erro ao buscar paciente', 500, error.message);
    }
  }

  /**
   * Criar novo paciente
   */
  async criar(req, res) {
    const dadosPaciente = req.body;

    try {
      // Verificar se CPF já existe
      const cpfExistente = await databaseService.client.paciente.findUnique({
        where: { cpf: dadosPaciente.cpf.replace(/\D/g, '') }
      });

      if (cpfExistente) {
        return res.error('CPF já cadastrado no sistema', 409);
      }

      // Limpar e formatar CPF
      dadosPaciente.cpf = dadosPaciente.cpf.replace(/\D/g, '');

      const novoPaciente = await databaseService.client.paciente.create({
        data: {
          ...dadosPaciente,
          data_nascimento: new Date(dadosPaciente.data_nascimento),
          ativo: true
        }
      });

      res.success(
        {
          id: novoPaciente.id,
          nome: novoPaciente.nome,
          cpf: novoPaciente.cpf
        },
        'Paciente cadastrado com sucesso',
        201
      );

    } catch (error) {
      console.error('❌ [PACIENTES] Erro ao criar:', error.message);
      
      if (error.code === 'P2002') {
        return res.error('CPF já cadastrado', 409);
      }
      
      res.error('Erro ao cadastrar paciente', 500, error.message);
    }
  }

  /**
   * Atualizar paciente
   */
  async atualizar(req, res) {
    const { id } = req.params;
    const dadosAtualizacao = req.body;

    try {
      // Verificar se paciente existe
      const pacienteExistente = await databaseService.client.paciente.findUnique({
        where: { id }
      });

      if (!pacienteExistente) {
        return res.notFound('Paciente não encontrado');
      }

      // Formatar dados se necessário
      if (dadosAtualizacao.cpf) {
        dadosAtualizacao.cpf = dadosAtualizacao.cpf.replace(/\D/g, '');
      }

      if (dadosAtualizacao.data_nascimento) {
        dadosAtualizacao.data_nascimento = new Date(dadosAtualizacao.data_nascimento);
      }

      const pacienteAtualizado = await databaseService.client.paciente.update({
        where: { id },
        data: dadosAtualizacao
      });

      res.success(
        {
          id: pacienteAtualizado.id,
          nome: pacienteAtualizado.nome,
          cpf: pacienteAtualizado.cpf
        },
        'Paciente atualizado com sucesso'
      );

    } catch (error) {
      console.error('❌ [PACIENTES] Erro ao atualizar:', error.message);
      res.error('Erro ao atualizar paciente', 500, error.message);
    }
  }

  /**
   * Remover paciente (soft delete)
   */
  async remover(req, res) {
    const { id } = req.params;

    try {
      const paciente = await databaseService.client.paciente.findUnique({
        where: { id }
      });

      if (!paciente) {
        return res.notFound('Paciente não encontrado');
      }

      // Desativar paciente (soft delete)
      await databaseService.client.paciente.update({
        where: { id },
        data: { ativo: false }
      });

      res.success(null, 'Paciente removido com sucesso');

    } catch (error) {
      console.error('❌ [PACIENTES] Erro ao remover:', error.message);
      res.error('Erro ao remover paciente', 500, error.message);
    }
  }
}

module.exports = new PacientesController();