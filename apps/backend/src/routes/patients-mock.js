const express = require('express');
const { logger } = require('../utils/logger');

const router = express.Router();

// Mock data para demonstração
let patientsDB = [
  {
    id: 1,
    name: 'João Silva Santos',
    cpf: '123.456.789-01',
    birthDate: '1985-05-15T00:00:00.000Z',
    phone: '(11) 99999-1234',
    email: 'joao.silva@email.com',
    bloodType: 'O+',
    observations: 'Paciente com histórico de hipertensão',
    address: {
      cep: '01310-100',
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Apto 101',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP'
    },
    insurance: {
      type: 'convenio',
      provider: 'Unimed',
      cardNumber: '123456789',
      validUntil: '2025-12-31',
      holder: 'João Silva Santos'
    },
    photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SlM8L3RleHQ+PC9zdmc+',
    createdAt: '2024-01-15T10:30:00.000Z',
    ultimaConsulta: '2024-10-20T14:30:00.000Z'
  },
  {
    id: 2,
    name: 'Maria Fernanda Oliveira',
    cpf: '987.654.321-09',
    birthDate: '1992-08-22T00:00:00.000Z',
    phone: '(11) 88888-5678',
    email: 'maria.oliveira@email.com',
    bloodType: 'A-',
    observations: 'Paciente diabética tipo 2',
    address: {
      cep: '04567-890',
      street: 'Rua das Flores',
      number: '250',
      complement: '',
      neighborhood: 'Jardim Europa',
      city: 'São Paulo',
      state: 'SP'
    },
    insurance: {
      type: 'sus'
    },
    photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI2VjNDg5OSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TUY8L3RleHQ+PC9zdmc+',
    createdAt: '2024-02-10T09:15:00.000Z',
    ultimaConsulta: '2024-10-18T11:00:00.000Z'
  },
  {
    id: 3,
    name: 'Carlos Eduardo Mendes',
    cpf: '456.789.123-45',
    birthDate: '1978-12-03T00:00:00.000Z',
    phone: '(11) 77777-9012',
    email: 'carlos.mendes@email.com',
    bloodType: 'B+',
    observations: 'Paciente com histórico de cirurgia cardíaca',
    address: {
      cep: '02345-678',
      street: 'Av. Brigadeiro Faria Lima',
      number: '1500',
      complement: 'Sala 301',
      neighborhood: 'Itaim Bibi',
      city: 'São Paulo',
      state: 'SP'
    },
    insurance: {
      type: 'convenio',
      provider: 'Bradesco Saúde',
      cardNumber: '987654321',
      validUntil: '2025-06-30',
      holder: 'Carlos Eduardo Mendes'
    },
    photo: null,
    createdAt: '2024-03-05T16:20:00.000Z',
    ultimaConsulta: null
  }
];

// Contador para IDs
let nextId = patientsDB.length + 1;

// Listar todos os pacientes com paginação e busca
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    let filteredPatients = [...patientsDB];
    
    // Aplicar filtro de busca
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPatients = patientsDB.filter(patient => 
        patient.name.toLowerCase().includes(searchLower) ||
        patient.cpf.includes(search) ||
        (patient.email && patient.email.toLowerCase().includes(searchLower))
      );
    }
    
    // Aplicar paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
    
    logger.info(`Listando pacientes - Página: ${page}, Busca: ${search || 'N/A'}`);
    
    res.json({
      success: true,
      patients: paginatedPatients,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(filteredPatients.length / parseInt(limit)),
        totalRecords: filteredPatients.length
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
    const patient = patientsDB.find(p => p.id == id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    logger.info(`Buscando paciente ID: ${id}`);
    
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
      dataNascimento,
      telefone,
      email,
      tipoSanguineo,
      observacoes,
      address,
      insurance,
      photo
    } = req.body;

    // Verificar se CPF já existe
    const existingPatient = patientsDB.find(p => p.cpf === cpf);
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'CPF já cadastrado no sistema'
      });
    }

    // Criar novo paciente
    const newPatient = {
      id: nextId++,
      name: nomeCompleto,
      cpf,
      birthDate: new Date(dataNascimento).toISOString(),
      phone: telefone,
      email: email || null,
      bloodType: tipoSanguineo || null,
      observations: observacoes || null,
      address: address || null,
      insurance: insurance || { type: 'sus' },
      photo: photo || null,
      createdAt: new Date().toISOString(),
      ultimaConsulta: null
    };

    patientsDB.push(newPatient);

    logger.info(`Novo paciente cadastrado: ${newPatient.name} (CPF: ${cpf})`);

    res.status(201).json({
      success: true,
      message: 'Paciente cadastrado com sucesso',
      patient: newPatient
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
    const patientIndex = patientsDB.findIndex(p => p.id == id);

    if (patientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    const {
      nomeCompleto,
      cpf,
      dataNascimento,
      telefone,
      email,
      tipoSanguineo,
      observacoes,
      address,
      insurance,
      photo
    } = req.body;

    // Verificar se o novo CPF já existe em outro paciente
    if (cpf !== patientsDB[patientIndex].cpf) {
      const cpfExists = patientsDB.find(p => p.cpf === cpf && p.id != id);
      if (cpfExists) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado para outro paciente'
        });
      }
    }

    // Atualizar paciente
    const updatedPatient = {
      ...patientsDB[patientIndex],
      name: nomeCompleto,
      cpf,
      birthDate: new Date(dataNascimento).toISOString(),
      phone: telefone,
      email: email || null,
      bloodType: tipoSanguineo || null,
      observations: observacoes || null,
      address: address || null,
      insurance: insurance || { type: 'sus' },
      photo: photo !== undefined ? photo : patientsDB[patientIndex].photo
    };

    patientsDB[patientIndex] = updatedPatient;

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
    const patientIndex = patientsDB.findIndex(p => p.id == id);

    if (patientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    const deletedPatient = patientsDB.splice(patientIndex, 1)[0];

    logger.info(`Paciente deletado: ${deletedPatient.name} (ID: ${id})`);

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
    const totalPatients = patientsDB.length;
    const patientsWithAllergies = patientsDB.filter(p => 
      p.observations && p.observations.toLowerCase().includes('alergia')
    ).length;
    
    // Simular consultas de hoje
    const today = new Date().toISOString().split('T')[0];
    const consultasHoje = patientsDB.filter(p => 
      p.ultimaConsulta && p.ultimaConsulta.startsWith(today)
    ).length;
    
    const prontuariosAtivos = patientsDB.filter(p => p.ultimaConsulta).length;

    logger.info('Consultando estatísticas de pacientes');

    res.json({
      success: true,
      stats: {
        totalPacientes: totalPatients,
        pacientesAlergias: patientsWithAllergies,
        consultasHoje: consultasHoje,
        prontuariosAtivos: prontuariosAtivos
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