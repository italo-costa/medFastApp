const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// ====================================
// ROTAS DE PRONTUÁRIOS MÉDICOS
// ====================================

// GET /api/records - Listar todos os prontuários
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, paciente_id, medico_id, data_inicio, data_fim } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Construir filtros
    const where = {};
    
    if (paciente_id) {
      where.paciente_id = paciente_id;
    }
    
    if (medico_id) {
      where.medico_id = medico_id;
    }
    
    if (data_inicio || data_fim) {
      where.data_consulta = {};
      if (data_inicio) {
        where.data_consulta.gte = new Date(data_inicio);
      }
      if (data_fim) {
        where.data_consulta.lte = new Date(data_fim);
      }
    }

    // Buscar prontuários com relacionamentos
    const prontuarios = await prisma.prontuario.findMany({
      where,
      skip,
      take,
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            data_nascimento: true,
            telefone: true
          }
        },
        medico: {
          select: {
            id: true,
            usuario: {
              select: {
                nome: true
              }
            },
            crm: true,
            especialidade: true
          }
        },
        prescricoes: true,
        exames_solicitados: true,
        sinais_vitais: true
      },
      orderBy: {
        data_consulta: 'desc'
      }
    });

    // Contar total para paginação
    const total = await prisma.prontuario.count({ where });
    
    res.json({
      success: true,
      data: prontuarios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar prontuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// GET /api/records/:id - Buscar prontuário específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const prontuario = await prisma.prontuario.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            data_nascimento: true,
            sexo: true,
            telefone: true,
            email: true,
            endereco: true,
            convenio: true,
            alergias: true,
            medicamentos: true,
            doencas: true
          }
        },
        medico: {
          select: {
            id: true,
            usuario: {
              select: {
                nome: true
              }
            },
            crm: true,
            especialidade: true
          }
        },
        prescricoes: true,
        exames_solicitados: true,
        sinais_vitais: true
      }
    });

    if (!prontuario) {
      return res.status(404).json({
        success: false,
        error: 'Prontuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: prontuario
    });
    
  } catch (error) {
    console.error('Erro ao buscar prontuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// POST /api/records - Criar novo prontuário
router.post('/', async (req, res) => {
  try {
    const {
      paciente_id,
      medico_id,
      data_consulta,
      tipo_consulta,
      queixa_principal,
      historia_doenca_atual,
      exame_clinico,
      hipotese_diagnostica,
      conduta,
      cid,
      data_retorno,
      observacoes,
      sinais_vitais,
      prescricoes,
      exames_solicitados
    } = req.body;

    // Validações básicas
    if (!paciente_id || !medico_id || !data_consulta || !tipo_consulta) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: paciente_id, medico_id, data_consulta, tipo_consulta'
      });
    }

    // Criar prontuário em transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar prontuário principal
      const prontuario = await tx.prontuario.create({
        data: {
          paciente_id,
          medico_id,
          data_consulta: new Date(data_consulta),
          tipo_consulta,
          queixa_principal,
          historia_doenca_atual,
          exame_clinico,
          hipotese_diagnostica,
          conduta,
          cid,
          data_retorno: data_retorno ? new Date(data_retorno) : null,
          observacoes
        }
      });

      // Adicionar sinais vitais se fornecidos
      if (sinais_vitais) {
        await tx.sinalVital.create({
          data: {
            prontuario_id: prontuario.id,
            ...sinais_vitais
          }
        });
      }

      // Adicionar prescrições se fornecidas
      if (prescricoes && prescricoes.length > 0) {
        for (const prescricao of prescricoes) {
          await tx.prescricao.create({
            data: {
              prontuario_id: prontuario.id,
              medico_id,
              medicamentos: prescricao.medicamentos,
              observacoes: prescricao.observacoes,
              data_validade: prescricao.data_validade ? new Date(prescricao.data_validade) : null
            }
          });
        }
      }

      // Adicionar exames solicitados se fornecidos
      if (exames_solicitados && exames_solicitados.length > 0) {
        for (const exame of exames_solicitados) {
          await tx.exameSolicitado.create({
            data: {
              prontuario_id: prontuario.id,
              tipo_exame: exame.tipo_exame,
              nome_exame: exame.nome_exame,
              observacoes: exame.observacoes,
              urgente: exame.urgente || false
            }
          });
        }
      }

      return prontuario;
    });

    res.status(201).json({
      success: true,
      data: resultado,
      message: 'Prontuário criado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao criar prontuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// PUT /api/records/:id - Atualizar prontuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      queixa_principal,
      historia_doenca_atual,
      exame_clinico,
      hipotese_diagnostica,
      conduta,
      cid,
      data_retorno,
      observacoes
    } = req.body;

    // Verificar se prontuário existe
    const prontuarioExistente = await prisma.prontuario.findUnique({
      where: { id }
    });

    if (!prontuarioExistente) {
      return res.status(404).json({
        success: false,
        error: 'Prontuário não encontrado'
      });
    }

    // Atualizar prontuário
    const prontuarioAtualizado = await prisma.prontuario.update({
      where: { id },
      data: {
        queixa_principal,
        historia_doenca_atual,
        exame_clinico,
        hipotese_diagnostica,
        conduta,
        cid,
        data_retorno: data_retorno ? new Date(data_retorno) : null,
        observacoes
      },
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            cpf: true
          }
        },
        medico: {
          select: {
            id: true,
            usuario: {
              select: {
                nome: true
              }
            },
            crm: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: prontuarioAtualizado,
      message: 'Prontuário atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar prontuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// DELETE /api/records/:id - Excluir prontuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se prontuário existe
    const prontuarioExistente = await prisma.prontuario.findUnique({
      where: { id }
    });

    if (!prontuarioExistente) {
      return res.status(404).json({
        success: false,
        error: 'Prontuário não encontrado'
      });
    }

    // Excluir prontuário e registros relacionados em transação
    await prisma.$transaction(async (tx) => {
      // Excluir prescrições
      await tx.prescricao.deleteMany({
        where: { prontuario_id: id }
      });

      // Excluir exames solicitados
      await tx.exameSolicitado.deleteMany({
        where: { prontuario_id: id }
      });

      // Excluir sinais vitais
      await tx.sinalVital.deleteMany({
        where: { prontuario_id: id }
      });

      // Excluir prontuário
      await tx.prontuario.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'Prontuário excluído com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir prontuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// GET /api/records/patient/:paciente_id - Prontuários de um paciente específico
router.get('/patient/:paciente_id', async (req, res) => {
  try {
    const { paciente_id } = req.params;
    
    const prontuarios = await prisma.prontuario.findMany({
      where: { paciente_id },
      include: {
        medico: {
          select: {
            usuario: {
              select: {
                nome: true
              }
            },
            crm: true,
            especialidade: true
          }
        },
        prescricoes: true,
        exames_solicitados: true
      },
      orderBy: {
        data_consulta: 'desc'
      }
    });

    res.json({
      success: true,
      data: prontuarios
    });
    
  } catch (error) {
    console.error('Erro ao buscar prontuários do paciente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

module.exports = router;