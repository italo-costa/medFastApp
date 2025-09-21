const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Listar todos os pacientes
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    let where = {};
    
    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          medicalRecords: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          allergies: true
        }
      }),
      prisma.patient.count({ where })
    ]);

    const patientsWithLastConsult = patients.map(patient => ({
      ...patient,
      ultimaConsulta: patient.medicalRecords[0]?.createdAt || null,
      medicalRecords: undefined // Remove o array completo para não sobrecarregar
    }));

    res.json({
      success: true,
      patients: patientsWithLastConsult,
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

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: {
        medicalRecords: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              select: { name: true, crm: true, specialty: true }
            }
          }
        },
        allergies: true,
        exams: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    res.json({
      success: true,
      patient
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
      alergias,
      observacoes
    } = req.body;

    // Validações básicas
    if (!nomeCompleto || !cpf || !dataNascimento || !telefone) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: nomeCompleto, CPF, dataNascimento e telefone'
      });
    }

    // Verificar se CPF já existe
    const existingPatient = await prisma.patient.findUnique({
      where: { cpf }
    });

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'CPF já cadastrado no sistema'
      });
    }

    // Criar paciente
    const patient = await prisma.patient.create({
      data: {
        name: nomeCompleto,
        cpf,
        rg: rg || null,
        birthDate: new Date(dataNascimento),
        phone: telefone,
        email: email || null,
        bloodType: tipoSanguineo || null,
        observations: observacoes || null
      }
    });

    // Criar alergias se informadas
    if (alergias && alergias.trim()) {
      const allergiesList = alergias.split(',').map(allergy => allergy.trim());
      
      for (const allergyName of allergiesList) {
        if (allergyName) {
          await prisma.allergy.create({
            data: {
              patientId: patient.id,
              allergen: allergyName,
              severity: 'MODERATE', // Padrão
              description: `Alergia registrada durante cadastro: ${allergyName}`
            }
          });
        }
      }
    }

    logger.info(`Novo paciente cadastrado: ${patient.name} (${patient.cpf})`);

    res.status(201).json({
      success: true,
      message: 'Paciente cadastrado com sucesso',
      patient
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
      observacoes
    } = req.body;

    // Verificar se paciente existe
    const existingPatient = await prisma.patient.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    // Verificar se o novo CPF já existe (se foi alterado)
    if (cpf !== existingPatient.cpf) {
      const cpfExists = await prisma.patient.findUnique({
        where: { cpf }
      });

      if (cpfExists) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado para outro paciente'
        });
      }
    }

    // Atualizar paciente
    const updatedPatient = await prisma.patient.update({
      where: { id: parseInt(id) },
      data: {
        name: nomeCompleto,
        cpf,
        rg: rg || null,
        birthDate: new Date(dataNascimento),
        phone: telefone,
        email: email || null,
        bloodType: tipoSanguineo || null,
        observations: observacoes || null
      }
    });

    logger.info(`Paciente atualizado: ${updatedPatient.name} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Paciente atualizado com sucesso',
      patient: updatedPatient
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
    const existingPatient = await prisma.patient.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    // Deletar paciente (cascade irá remover registros relacionados)
    await prisma.patient.delete({
      where: { id: parseInt(id) }
    });

    logger.info(`Paciente deletado: ${existingPatient.name} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Paciente deletado com sucesso'
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
      prisma.patient.count(),
      prisma.patient.count({
        where: {
          allergies: {
            some: {}
          }
        }
      }),
      prisma.medicalRecord.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.medicalRecord.count({
        where: {
          isActive: true
        }
      })
    ]);

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

// ==================== ROTAS DE ANAMNESE ====================

// Criar nova anamnese
router.post('/:id/anamnesis', async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = parseInt(id);
    
    const {
      doctorId,
      profession,
      maritalStatus,
      education,
      lifestyle,
      chiefComplaint,
      historyPresentIllness,
      previousIllnesses,
      surgeries,
      hospitalizations,
      allergies,
      currentMedications,
      familyHistory,
      smoking,
      alcohol,
      drugs,
      physicalActivity,
      generalSymptoms,
      cardiovascular,
      respiratory,
      gastrointestinal,
      genitourinary,
      neurological,
      musculoskeletal,
      dermatological,
      vitalSigns,
      physicalExamination,
      observations,
      isComplete
    } = req.body;

    // Verificar se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    // Verificar se o médico existe
    const doctor = await prisma.user.findFirst({
      where: { 
        id: doctorId,
        role: 'DOCTOR'
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    const anamnesis = await prisma.anamnesis.create({
      data: {
        patientId,
        doctorId,
        profession,
        maritalStatus,
        education,
        lifestyle,
        chiefComplaint,
        historyPresentIllness,
        previousIllnesses,
        surgeries,
        hospitalizations,
        allergies,
        currentMedications,
        familyHistory,
        smoking,
        alcohol,
        drugs,
        physicalActivity,
        generalSymptoms,
        cardiovascular,
        respiratory,
        gastrointestinal,
        genitourinary,
        neurological,
        musculoskeletal,
        dermatological,
        vitalSigns,
        physicalExamination,
        observations,
        isComplete: isComplete || false
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            cpf: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            crm: true,
            specialty: true
          }
        }
      }
    });

    logger.info(`Anamnese criada para paciente ${patientId} pelo médico ${doctorId}`);

    res.status(201).json({
      success: true,
      anamnesis
    });
  } catch (error) {
    logger.error('Erro ao criar anamnese:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Listar anamneses de um paciente
router.get('/:id/anamnesis', async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = parseInt(id);
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [anamneses, total] = await Promise.all([
      prisma.anamnesis.findMany({
        where: { patientId },
        skip,
        take,
        orderBy: { consultationDate: 'desc' },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              crm: true,
              specialty: true
            }
          }
        }
      }),
      prisma.anamnesis.count({ where: { patientId } })
    ]);

    res.json({
      success: true,
      anamneses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Erro ao listar anamneses:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar anamnese específica
router.get('/:id/anamnesis/:anamnesisId', async (req, res) => {
  try {
    const { id, anamnesisId } = req.params;
    const patientId = parseInt(id);

    const anamnesis = await prisma.anamnesis.findFirst({
      where: {
        id: anamnesisId,
        patientId
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            cpf: true,
            birthDate: true,
            gender: true,
            phone: true,
            email: true,
            bloodType: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            crm: true,
            specialty: true
          }
        }
      }
    });

    if (!anamnesis) {
      return res.status(404).json({
        success: false,
        message: 'Anamnese não encontrada'
      });
    }

    res.json({
      success: true,
      anamnesis
    });
  } catch (error) {
    logger.error('Erro ao buscar anamnese:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar anamnese
router.put('/:id/anamnesis/:anamnesisId', async (req, res) => {
  try {
    const { id, anamnesisId } = req.params;
    const patientId = parseInt(id);
    
    const updateData = { ...req.body };
    delete updateData.patientId; // Não permitir alterar o paciente
    delete updateData.doctorId;  // Não permitir alterar o médico
    delete updateData.id;        // Não permitir alterar o ID

    const anamnesis = await prisma.anamnesis.findFirst({
      where: {
        id: anamnesisId,
        patientId
      }
    });

    if (!anamnesis) {
      return res.status(404).json({
        success: false,
        message: 'Anamnese não encontrada'
      });
    }

    const updatedAnamnesis = await prisma.anamnesis.update({
      where: { id: anamnesisId },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            cpf: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            crm: true,
            specialty: true
          }
        }
      }
    });

    logger.info(`Anamnese ${anamnesisId} atualizada para paciente ${patientId}`);

    res.json({
      success: true,
      anamnesis: updatedAnamnesis
    });
  } catch (error) {
    logger.error('Erro ao atualizar anamnese:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Verificar se paciente tem anamnese completa
router.get('/:id/anamnesis/check/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = parseInt(id);

    const completedAnamnesis = await prisma.anamnesis.findFirst({
      where: {
        patientId,
        isComplete: true
      },
      orderBy: { consultationDate: 'desc' }
    });

    res.json({
      success: true,
      hasCompleteAnamnesis: !!completedAnamnesis,
      lastAnamnesis: completedAnamnesis || null
    });
  } catch (error) {
    logger.error('Erro ao verificar anamnese completa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;