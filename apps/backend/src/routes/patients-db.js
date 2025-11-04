const express = require('express');
const { logger } = require('../utils/logger');
const databaseService = require('../services/database');
const ResponseService = require('../services/responseService');

const router = express.Router();
// ============================================
// ROTAS DE PACIENTES - VERSÃO BANCO REAL
// ============================================
// Utiliza o schema Prisma correto: tabela "pacientes"

// Listar todos os pacientes com paginação e busca
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * parseInt(limit);
    const take = parseInt(limit);

    let where = { ativo: true }; // Apenas pacientes ativos
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [patients, total] = await Promise.all([
      databaseService.client.paciente.findMany({
        where,
        skip,
        take,
        orderBy: { criado_em: 'desc' },
        include: {
          alergias: true,
          consultas: {
            orderBy: { data_hora: 'desc' },
            take: 1
          },
          arquivos: {
            where: { tipo_arquivo: 'IMAGEM' },
            orderBy: { criado_em: 'desc' },
            take: 1
          }
        }
      }),
      databaseService.client.paciente.count({ where })
    ]);

    // Formatar dados para compatibilidade com o frontend
    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      name: patient.nome,
      cpf: patient.cpf,
      birthDate: patient.data_nascimento,
      phone: patient.telefone || patient.celular,
      email: patient.email,
      bloodType: null, // Campo não existe no schema atual
      observations: patient.observacoes,
      address: {
        cep: patient.cep,
        street: patient.endereco,
        number: null, // Não tem campo separado
        complement: null,
        neighborhood: null,
        city: patient.cidade,
        state: patient.uf
      },
      insurance: {
        type: patient.convenio ? 'convenio' : 'sus',
        provider: patient.convenio,
        cardNumber: patient.numero_convenio,
        validUntil: null,
        holder: patient.nome
      },
      photo: patient.arquivos[0]?.caminho || null,
      createdAt: patient.criado_em,
      ultimaConsulta: patient.consultas[0]?.data_hora || null
    }));

    logger.info(`Listando pacientes - Página: ${page}, Busca: ${search || 'N/A'}, Total: ${total}`);

    res.json({
      success: true,
      patients: formattedPatients,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / take),
        totalRecords: total
      }
    });
  } catch (error) {
    logger.error('Erro ao listar pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar paciente por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await databaseService.client.paciente.findUnique({
      where: { id: id },
      include: {
        alergias: true,
        consultas: {
          orderBy: { data_hora: 'desc' }
        },
        exames: {
          orderBy: { data_realizacao: 'desc' }
        },
        arquivos: true,
        medicamentos: {
          where: { ativo: true }
        },
        doencas: true
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    // Formatar dados para compatibilidade
    const formattedPatient = {
      id: patient.id,
      name: patient.nome,
      cpf: patient.cpf,
      birthDate: patient.data_nascimento,
      phone: patient.telefone || patient.celular,
      email: patient.email,
      bloodType: null, // Campo não existe no schema
      observations: patient.observacoes,
      address: {
        cep: patient.cep,
        street: patient.endereco,
        number: null,
        complement: null,
        neighborhood: null,
        city: patient.cidade,
        state: patient.uf
      },
      insurance: {
        type: patient.convenio ? 'convenio' : 'sus',
        provider: patient.convenio,
        cardNumber: patient.numero_convenio,
        validUntil: null,
        holder: patient.nome
      },
      photo: patient.arquivos.find(a => a.tipo_arquivo === 'IMAGEM')?.caminho || null,
      createdAt: patient.criado_em,
      allergies: patient.alergias,
      consultations: patient.consultas,
      exams: patient.exames,
      medications: patient.medicamentos,
      diseases: patient.doencas
    };

    logger.info(`Buscando paciente ID: ${id}`);

    res.json({
      success: true,
      patient: formattedPatient
    });
  } catch (error) {
    logger.error('Erro ao buscar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Criar novo paciente
router.post('/', async (req, res) => {
  try {
    const {
      nomeCompleto,
      cpf,
      rg,
      dataNascimento,
      telefone,
      email,
      tipoSanguineo,
      observacoes,
      address,
      insurance,
      photo,
      sexo = 'OUTRO', // Valor padrão
      profissao,
      estadoCivil
    } = req.body;

    // Verificar se CPF já existe
    const existingPatient = await databaseService.client.paciente.findUnique({
      where: { cpf: cpf }
    });

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'CPF já cadastrado no sistema'
      });
    }

    // Criar paciente
    const newPatient = await databaseService.client.paciente.create({
      data: {
        nome: nomeCompleto,
        cpf: cpf,
        rg: rg || null,
        data_nascimento: new Date(dataNascimento),
        sexo: sexo,
        telefone: telefone || null,
        email: email || null,
        endereco: address?.street || null,
        cep: address?.cep || null,
        cidade: address?.city || null,
        uf: address?.state || null,
        profissao: profissao || null,
        estado_civil: estadoCivil || null,
        convenio: insurance?.provider || null,
        numero_convenio: insurance?.cardNumber || null,
        observacoes: observacoes || null
      }
    });

    // Se há foto, criar arquivo
    if (photo) {
      await databaseService.client.arquivo.create({
        data: {
          paciente_id: newPatient.id,
          nome_original: 'foto_paciente.jpg',
          nome_arquivo: `foto_${newPatient.id}_${Date.now()}.jpg`,
          tipo_arquivo: 'IMAGEM',
          tamanho_bytes: photo.length || 0,
          caminho: photo,
          descricao: 'Foto do paciente'
        }
      });
    }

    logger.info(`Novo paciente cadastrado: ${newPatient.nome} (CPF: ${cpf})`);

    res.status(201).json({
      success: true,
      message: 'Paciente cadastrado com sucesso',
      patient: {
        id: newPatient.id,
        name: newPatient.nome,
        cpf: newPatient.cpf,
        birthDate: newPatient.data_nascimento,
        phone: newPatient.telefone,
        email: newPatient.email,
        createdAt: newPatient.criado_em
      }
    });
  } catch (error) {
    logger.error('Erro ao criar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar paciente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nomeCompleto,
      cpf,
      rg,
      dataNascimento,
      telefone,
      email,
      tipoSanguineo,
      observacoes,
      address,
      insurance,
      photo
    } = req.body;

    // Verificar se paciente existe
    const existingPatient = await databaseService.client.paciente.findUnique({
      where: { id: id }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    // Verificar se CPF alterado já existe
    if (cpf !== existingPatient.cpf) {
      const cpfExists = await databaseService.client.paciente.findUnique({
        where: { cpf: cpf }
      });

      if (cpfExists) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado para outro paciente'
        });
      }
    }

    // Atualizar paciente
    const updatedPatient = await databaseService.client.paciente.update({
      where: { id: id },
      data: {
        nome: nomeCompleto,
        cpf: cpf,
        rg: rg || null,
        data_nascimento: new Date(dataNascimento),
        telefone: telefone || null,
        email: email || null,
        endereco: address?.street || null,
        cep: address?.cep || null,
        cidade: address?.city || null,
        uf: address?.state || null,
        convenio: insurance?.provider || null,
        numero_convenio: insurance?.cardNumber || null,
        observacoes: observacoes || null
      }
    });

    // Atualizar foto se fornecida
    if (photo) {
      // Remover foto antiga
      await databaseService.client.arquivo.deleteMany({
        where: {
          paciente_id: id,
          tipo_arquivo: 'IMAGEM'
        }
      });

      // Adicionar nova foto
      await databaseService.client.arquivo.create({
        data: {
          paciente_id: id,
          nome_original: 'foto_paciente.jpg',
          nome_arquivo: `foto_${id}_${Date.now()}.jpg`,
          tipo_arquivo: 'IMAGEM',
          tamanho_bytes: photo.length || 0,
          caminho: photo,
          descricao: 'Foto do paciente'
        }
      });
    }

    logger.info(`Paciente atualizado: ${updatedPatient.nome} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Paciente atualizado com sucesso',
      patient: {
        id: updatedPatient.id,
        name: updatedPatient.nome,
        cpf: updatedPatient.cpf,
        birthDate: updatedPatient.data_nascimento,
        phone: updatedPatient.telefone,
        email: updatedPatient.email
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Deletar paciente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se paciente existe
    const existingPatient = await databaseService.client.paciente.findUnique({
      where: { id: id }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    // Marcar como inativo em vez de deletar (soft delete)
    await databaseService.client.paciente.update({
      where: { id: id },
      data: { ativo: false }
    });

    logger.info(`Paciente desativado: ${existingPatient.nome} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Paciente removido com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao deletar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Estatísticas dos pacientes
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalPatients,
      patientsWithAllergies,
      recentConsults,
      activeRecords
    ] = await Promise.all([
      databaseService.client.paciente.count({ where: { ativo: true } }),
      databaseService.client.paciente.count({
        where: {
          ativo: true,
          alergias: {
            some: {}
          }
        }
      }),
      databaseService.client.consulta.count({
        where: {
          data_hora: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      databaseService.client.prontuario.count()
    ]);

    logger.info('Consultando estatísticas de pacientes');

    res.json({
      success: true,
      stats: {
        totalPacientes: totalPatients,
        pacientesAlergias: patientsWithAllergies,
        consultasHoje: recentConsults,
        prontuariosAtivos: activeRecords
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;