/**
 * Router de Pacientes - Refatorado com Serviços Centralizados
 * Usa AuthService, ValidationService e ResponseService
 */

const express = require('express');
const databaseService = require('../services/database');
const AuthService = require('../services/authService');
const ValidationService = require('../services/validationService');
const ResponseService = require('../services/responseService');

const router = express.Router();

// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================

// Aplicar autenticação em todas as rotas
router.use(AuthService.authMiddleware());

// ========================================
// ROTAS CRUD DE PACIENTES
// ========================================

// Listar todos os pacientes
router.get('/', async (req, res) => {
  return ResponseService.handle(res, async () => {
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
      databaseService.client.patient.findMany({
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
      databaseService.client.patient.count({ where })
    ]);

    const patientsFormatted = patients.map(patient => ResponseService.formatData({
      ...patient,
      ultimaConsulta: patient.medicalRecords[0]?.createdAt || null,
      medicalRecords: undefined // Remove o array completo para não sobrecarregar
    }));

    return ResponseService.paginated(res, patientsFormatted, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    });

  });
});

// Buscar paciente por ID
router.get('/:id', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { id } = req.params;

    const patient = await databaseService.client.patient.findUnique({
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
      return ResponseService.notFound(res, 'Paciente', id);
    }

    return ResponseService.formatData(patient);

  }, 'Paciente encontrado com sucesso');
});

// Criar novo paciente
router.post('/', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const {
      nomeCompleto,
      cpf,
      rg,
      dataNascimento,
      telefone,
      email,
      tipoSanguineo,
      alergias,
      observacoes,
      cep,
      endereco,
      cidade,
      uf,
      profissao,
      estadoCivil
    } = req.body;

    // Validações usando ValidationService
    const errors = [];

    // Validar nome
    const nomeValidation = ValidationService.validateName(nomeCompleto, { required: true });
    if (!nomeValidation.valid) {
      errors.push(...nomeValidation.errors);
    }

    // Validar CPF
    const cpfValidation = ValidationService.validateCPF(cpf);
    if (!cpfValidation.valid) {
      errors.push(...cpfValidation.errors);
    }

    // Validar data de nascimento
    const dataValidation = ValidationService.validateDate(dataNascimento, { 
      required: true, 
      maxAge: 150,
      futureAllowed: false 
    });
    if (!dataValidation.valid) {
      errors.push(...dataValidation.errors);
    }

    // Validar email se fornecido
    let emailSanitized = null;
    if (email) {
      const emailValidation = ValidationService.validateEmail(email);
      if (!emailValidation.valid) {
        errors.push(...emailValidation.errors);
      } else {
        emailSanitized = emailValidation.sanitized;
      }
    }

    // Validar telefone se fornecido
    let telefoneSanitized = null;
    if (telefone) {
      const telefoneValidation = ValidationService.validatePhone(telefone);
      if (!telefoneValidation.valid) {
        errors.push(...telefoneValidation.errors);
      } else {
        telefoneSanitized = telefoneValidation.sanitized;
      }
    }

    if (errors.length > 0) {
      return ResponseService.validationError(res, errors);
    }

    // Verificar se CPF já existe
    const existingPatient = await databaseService.client.patient.findUnique({
      where: { cpf: cpfValidation.sanitized }
    });

    if (existingPatient) {
      return ResponseService.conflict(res, 'CPF já cadastrado no sistema', 'cpf');
    }

    // Criar paciente
    const patient = await databaseService.client.patient.create({
      data: {
        name: nomeValidation.sanitized,
        cpf: cpfValidation.sanitized,
        rg: ValidationService.sanitizeText(rg, { maxLength: 20 }) || null,
        birthDate: new Date(dataValidation.sanitized),
        phone: telefoneSanitized,
        email: emailSanitized,
        bloodType: ValidationService.sanitizeText(tipoSanguineo, { maxLength: 10 }) || null,
        observations: ValidationService.sanitizeText(observacoes, { maxLength: 1000 }) || null,
        address: ValidationService.sanitizeText(endereco, { maxLength: 255 }) || null,
        zipCode: ValidationService.sanitizeText(cep, { removeSpecialChars: true, maxLength: 10 }) || null,
        city: ValidationService.sanitizeText(cidade, { maxLength: 100 }) || null,
        state: ValidationService.sanitizeText(uf, { maxLength: 2 }) || null,
        profession: ValidationService.sanitizeText(profissao, { maxLength: 100 }) || null,
        maritalStatus: ValidationService.sanitizeText(estadoCivil, { maxLength: 20 }) || null
      }
    });

    // Criar alergias se informadas
    if (alergias && alergias.trim()) {
      const allergiesList = alergias.split(',').map(allergy => allergy.trim());
      
      for (const allergyName of allergiesList) {
        if (allergyName) {
          await databaseService.client.allergy.create({
            data: {
              patientId: patient.id,
              allergen: ValidationService.sanitizeText(allergyName, { maxLength: 100 }),
              severity: 'MODERATE', // Padrão
              description: `Alergia registrada durante cadastro: ${allergyName}`
            }
          });
        }
      }
    }

    console.log(`✅ [PATIENTS] Novo paciente cadastrado: ${patient.name} (${cpfValidation.formatted})`);

    return ResponseService.formatData({
      ...patient,
      cpf: cpfValidation.formatted
    });

  }, 'Paciente cadastrado com sucesso');
});

// Atualizar paciente
router.put('/:id', async (req, res) => {
  return ResponseService.handle(res, async () => {
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
    const existingPatient = await databaseService.client.patient.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPatient) {
      return ResponseService.notFound(res, 'Paciente', id);
    }

    // Validações usando ValidationService
    const errors = [];
    let updateData = {};

    // Validar nome se fornecido
    if (nomeCompleto !== undefined) {
      const nomeValidation = ValidationService.validateName(nomeCompleto, { required: true });
      if (!nomeValidation.valid) {
        errors.push(...nomeValidation.errors);
      } else {
        updateData.name = nomeValidation.sanitized;
      }
    }

    // Validar CPF se fornecido
    if (cpf !== undefined) {
      const cpfValidation = ValidationService.validateCPF(cpf);
      if (!cpfValidation.valid) {
        errors.push(...cpfValidation.errors);
      } else {
        // Verificar se o novo CPF já existe (se foi alterado)
        if (cpfValidation.sanitized !== existingPatient.cpf) {
          const cpfExists = await databaseService.client.patient.findUnique({
            where: { cpf: cpfValidation.sanitized }
          });

          if (cpfExists) {
            return ResponseService.conflict(res, 'CPF já cadastrado para outro paciente', 'cpf');
          }
        }
        updateData.cpf = cpfValidation.sanitized;
      }
    }

    // Validar data de nascimento se fornecida
    if (dataNascimento !== undefined) {
      const dataValidation = ValidationService.validateDate(dataNascimento, { 
        required: true, 
        maxAge: 150,
        futureAllowed: false 
      });
      if (!dataValidation.valid) {
        errors.push(...dataValidation.errors);
      } else {
        updateData.birthDate = new Date(dataValidation.sanitized);
      }
    }

    // Validar telefone se fornecido
    if (telefone !== undefined) {
      if (telefone) {
        const telefoneValidation = ValidationService.validatePhone(telefone);
        if (!telefoneValidation.valid) {
          errors.push(...telefoneValidation.errors);
        } else {
          updateData.phone = telefoneValidation.sanitized;
        }
      } else {
        updateData.phone = null;
      }
    }

    // Validar email se fornecido
    if (email !== undefined) {
      if (email) {
        const emailValidation = ValidationService.validateEmail(email);
        if (!emailValidation.valid) {
          errors.push(...emailValidation.errors);
        } else {
          updateData.email = emailValidation.sanitized;
        }
      } else {
        updateData.email = null;
      }
    }

    // Sanitizar outros campos
    if (rg !== undefined) {
      updateData.rg = ValidationService.sanitizeText(rg, { maxLength: 20 }) || null;
    }

    if (tipoSanguineo !== undefined) {
      updateData.bloodType = ValidationService.sanitizeText(tipoSanguineo, { maxLength: 10 }) || null;
    }

    if (observacoes !== undefined) {
      updateData.observations = ValidationService.sanitizeText(observacoes, { maxLength: 1000 }) || null;
    }

    if (errors.length > 0) {
      return ResponseService.validationError(res, errors);
    }

    // Atualizar paciente
    const updatedPatient = await databaseService.client.patient.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    console.log(`✅ [PATIENTS] Paciente atualizado: ${updatedPatient.name} (ID: ${id})`);

    return ResponseService.formatData(updatedPatient);

  }, 'Paciente atualizado com sucesso');
});

// Deletar paciente
router.delete('/:id', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { id } = req.params;

    // Verificar se paciente existe
    const existingPatient = await databaseService.client.patient.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPatient) {
      return ResponseService.notFound(res, 'Paciente', id);
    }

    // Deletar paciente (cascade irá remover registros relacionados)
    await databaseService.client.patient.delete({
      where: { id: parseInt(id) }
    });

    console.log(`🗑️ [PATIENTS] Paciente deletado: ${existingPatient.name} (ID: ${id})`);

    return null; // Sem dados para retornar

  }, 'Paciente deletado com sucesso');
});

// Estatísticas dos pacientes
router.get('/stats/overview', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const [
      totalPatients,
      patientsWithAllergies,
      recentConsults,
      activeRecords
    ] = await Promise.all([
      databaseService.client.patient.count(),
      databaseService.client.patient.count({
        where: {
          allergies: {
            some: {}
          }
        }
      }),
      databaseService.client.medicalRecord.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }).catch(() => 0), // Se tabela não existir
      databaseService.client.medicalRecord.count({
        where: {
          isActive: true
        }
      }).catch(() => 0) // Se tabela não existir
    ]);

    return ResponseService.statistics(res, {
      totalPacientes: totalPatients,
      pacientesAlergias: patientsWithAllergies,
      consultasHoje: recentConsults,
      prontuariosAtivos: activeRecords
    });

  });
});

// ==================== ROTAS DE ANAMNESE ====================

// Criar nova anamnese
router.post('/:id/anamnesis', async (req, res) => {
  return ResponseService.handle(res, async () => {
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
    const patient = await databaseService.client.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return ResponseService.notFound(res, 'Paciente', patientId);
    }

    // Verificar se o médico existe (usando a tabela correta)
    const doctor = await databaseService.client.usuario.findFirst({
      where: { 
        id: doctorId,
        tipo: 'MEDICO'
      }
    });

    if (!doctor) {
      return ResponseService.notFound(res, 'Médico', doctorId);
    }

    // Sanitizar dados usando ValidationService
    const sanitizedData = {
      profession: ValidationService.sanitizeText(profession, { maxLength: 100 }),
      maritalStatus: ValidationService.sanitizeText(maritalStatus, { maxLength: 50 }),
      education: ValidationService.sanitizeText(education, { maxLength: 100 }),
      lifestyle: ValidationService.sanitizeText(lifestyle, { maxLength: 500 }),
      chiefComplaint: ValidationService.sanitizeText(chiefComplaint, { maxLength: 1000 }),
      historyPresentIllness: ValidationService.sanitizeText(historyPresentIllness, { maxLength: 2000 }),
      previousIllnesses: ValidationService.sanitizeText(previousIllnesses, { maxLength: 1000 }),
      surgeries: ValidationService.sanitizeText(surgeries, { maxLength: 1000 }),
      hospitalizations: ValidationService.sanitizeText(hospitalizations, { maxLength: 1000 }),
      allergies: ValidationService.sanitizeText(allergies, { maxLength: 1000 }),
      currentMedications: ValidationService.sanitizeText(currentMedications, { maxLength: 1000 }),
      familyHistory: ValidationService.sanitizeText(familyHistory, { maxLength: 1000 }),
      smoking: ValidationService.sanitizeText(smoking, { maxLength: 200 }),
      alcohol: ValidationService.sanitizeText(alcohol, { maxLength: 200 }),
      drugs: ValidationService.sanitizeText(drugs, { maxLength: 200 }),
      physicalActivity: ValidationService.sanitizeText(physicalActivity, { maxLength: 500 }),
      generalSymptoms: ValidationService.sanitizeText(generalSymptoms, { maxLength: 1000 }),
      cardiovascular: ValidationService.sanitizeText(cardiovascular, { maxLength: 1000 }),
      respiratory: ValidationService.sanitizeText(respiratory, { maxLength: 1000 }),
      gastrointestinal: ValidationService.sanitizeText(gastrointestinal, { maxLength: 1000 }),
      genitourinary: ValidationService.sanitizeText(genitourinary, { maxLength: 1000 }),
      neurological: ValidationService.sanitizeText(neurological, { maxLength: 1000 }),
      musculoskeletal: ValidationService.sanitizeText(musculoskeletal, { maxLength: 1000 }),
      dermatological: ValidationService.sanitizeText(dermatological, { maxLength: 1000 }),
      vitalSigns: ValidationService.sanitizeText(vitalSigns, { maxLength: 500 }),
      physicalExamination: ValidationService.sanitizeText(physicalExamination, { maxLength: 2000 }),
      observations: ValidationService.sanitizeText(observations, { maxLength: 2000 })
    };

    const anamnesis = await databaseService.client.anamnesis.create({
      data: {
        patientId,
        doctorId,
        ...sanitizedData,
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
            nome: true,
            medico: {
              select: {
                crm: true,
                especialidade: true
              }
            }
          }
        }
      }
    });

    console.log(`✅ [PATIENTS] Anamnese criada para paciente ${patientId} pelo médico ${doctorId}`);

    return ResponseService.formatData(anamnesis);

  }, 'Anamnese criada com sucesso');
});

// Listar anamneses de um paciente
router.get('/:id/anamnesis', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { id } = req.params;
    const patientId = parseInt(id);
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [anamneses, total] = await Promise.all([
      databaseService.client.anamnesis.findMany({
        where: { patientId },
        skip,
        take,
        orderBy: { consultationDate: 'desc' },
        include: {
          doctor: {
            select: {
              id: true,
              nome: true,
              medico: {
                select: {
                  crm: true,
                  especialidade: true
                }
              }
            }
          }
        }
      }),
      databaseService.client.anamnesis.count({ where: { patientId } })
    ]);

    const anamnesesFormatted = anamneses.map(anamnesis => ResponseService.formatData(anamnesis));

    return ResponseService.paginated(res, anamnesesFormatted, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    });

  });
});

// Buscar anamnese específica
router.get('/:id/anamnesis/:anamnesisId', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { id, anamnesisId } = req.params;
    const patientId = parseInt(id);

    const anamnesis = await databaseService.client.anamnesis.findFirst({
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
            nome: true,
            medico: {
              select: {
                crm: true,
                especialidade: true
              }
            }
          }
        }
      }
    });

    if (!anamnesis) {
      return ResponseService.notFound(res, 'Anamnese', anamnesisId);
    }

    return ResponseService.formatData(anamnesis);

  }, 'Anamnese encontrada com sucesso');
});

// Atualizar anamnese
router.put('/:id/anamnesis/:anamnesisId', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { id, anamnesisId } = req.params;
    const patientId = parseInt(id);
    
    const updateData = { ...req.body };
    delete updateData.patientId; // Não permitir alterar o paciente
    delete updateData.doctorId;  // Não permitir alterar o médico
    delete updateData.id;        // Não permitir alterar o ID

    const anamnesis = await databaseService.client.anamnesis.findFirst({
      where: {
        id: anamnesisId,
        patientId
      }
    });

    if (!anamnesis) {
      return ResponseService.notFound(res, 'Anamnese', anamnesisId);
    }

    // Sanitizar dados de texto usando ValidationService
    Object.keys(updateData).forEach(key => {
      if (typeof updateData[key] === 'string' && updateData[key].trim()) {
        const maxLengths = {
          profession: 100,
          maritalStatus: 50,
          education: 100,
          lifestyle: 500,
          chiefComplaint: 1000,
          historyPresentIllness: 2000,
          previousIllnesses: 1000,
          surgeries: 1000,
          hospitalizations: 1000,
          allergies: 1000,
          currentMedications: 1000,
          familyHistory: 1000,
          smoking: 200,
          alcohol: 200,
          drugs: 200,
          physicalActivity: 500,
          generalSymptoms: 1000,
          cardiovascular: 1000,
          respiratory: 1000,
          gastrointestinal: 1000,
          genitourinary: 1000,
          neurological: 1000,
          musculoskeletal: 1000,
          dermatological: 1000,
          vitalSigns: 500,
          physicalExamination: 2000,
          observations: 2000
        };

        const maxLength = maxLengths[key] || 500;
        updateData[key] = ValidationService.sanitizeText(updateData[key], { maxLength });
      }
    });

    const updatedAnamnesis = await databaseService.client.anamnesis.update({
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
            nome: true,
            medico: {
              select: {
                crm: true,
                especialidade: true
              }
            }
          }
        }
      }
    });

    console.log(`✅ [PATIENTS] Anamnese ${anamnesisId} atualizada para paciente ${patientId}`);

    return ResponseService.formatData(updatedAnamnesis);

  }, 'Anamnese atualizada com sucesso');
});

// Verificar se paciente tem anamnese completa
router.get('/:id/anamnesis/check/complete', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { id } = req.params;
    const patientId = parseInt(id);

    const completedAnamnesis = await databaseService.client.anamnesis.findFirst({
      where: {
        patientId,
        isComplete: true
      },
      orderBy: { consultationDate: 'desc' }
    });

    return {
      hasCompleteAnamnesis: !!completedAnamnesis,
      lastAnamnesis: completedAnamnesis ? ResponseService.formatData(completedAnamnesis) : null
    };

  }, 'Verificação de anamnese completa realizada');
});

module.exports = router;