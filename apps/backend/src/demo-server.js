/**
 * MediApp - Servidor de Demonstração para Teste de Exploração
 * Servidor simplificado para permitir testes das funcionalidades
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3002;

// Middleware básico
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Dados mock para demonstração
const mockMedicos = [
  {
    id: '1',
    nomeCompleto: 'Dr. João Silva Santos',
    cpf: '12345678901',
    crm: 'CRM123456-SP',
    especialidade: 'Cardiologia',
    telefone: '(11) 99999-1111',
    email: 'joao.silva@mediapp.com',
    instituicaoFormacao: 'USP - Universidade de São Paulo',
    anoFormacao: 2010,
    cep: '01234-567',
    logradouro: 'Rua das Flores, 123',
    numero: '123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    uf: 'SP',
    status: 'ATIVO',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    nomeCompleto: 'Dra. Maria Oliveira Costa',
    cpf: '98765432109',
    crm: 'CRM987654-RJ',
    especialidade: 'Pediatria',
    telefone: '(21) 88888-2222',
    email: 'maria.costa@mediapp.com',
    instituicaoFormacao: 'UFRJ - Universidade Federal do Rio de Janeiro',
    anoFormacao: 2012,
    cep: '20000-123',
    logradouro: 'Avenida Copacabana, 456',
    numero: '456',
    bairro: 'Copacabana',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    status: 'ATIVO',
    createdAt: '2024-01-20T14:20:00Z',
    updatedAt: '2024-01-20T14:20:00Z'
  },
  {
    id: '3',
    nomeCompleto: 'Dr. Carlos Eduardo Lima',
    cpf: '55566677788',
    crm: 'CRM555666-MG',
    especialidade: 'Ortopedia',
    telefone: '(31) 77777-3333',
    email: 'carlos.lima@mediapp.com',
    instituicaoFormacao: 'UFMG - Universidade Federal de Minas Gerais',
    anoFormacao: 2008,
    cep: '30000-789',
    logradouro: 'Rua da Liberdade, 789',
    numero: '789',
    bairro: 'Savassi',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    status: 'ATIVO',
    createdAt: '2024-02-01T09:15:00Z',
    updatedAt: '2024-02-01T09:15:00Z'
  }
];

const mockPacientes = [
  {
    id: '1',
    nome: 'Ana Paula Santos Silva',
    cpf: '11122233344',
    dataNascimento: '1985-03-15',
    sexo: 'FEMININO',
    telefone: '(11) 91234-5678',
    email: 'ana.santos@email.com',
    cep: '01234-567',
    endereco: 'Rua das Palmeiras, 100, Apt 45',
    cidade: 'São Paulo',
    uf: 'SP',
    contatoEmergencia: 'José Santos (marido) - (11) 98765-4321',
    convenio: 'Unimed',
    numeroConvenio: 'UNI123456789',
    status: 'ATIVO',
    createdAt: '2024-01-10T08:30:00Z',
    updatedAt: '2024-01-10T08:30:00Z'
  },
  {
    id: '2',
    nome: 'Roberto Carlos Oliveira',
    cpf: '99988877766',
    dataNascimento: '1978-11-22',
    sexo: 'MASCULINO',
    telefone: '(21) 92345-6789',
    email: 'roberto.oliveira@email.com',
    cep: '20000-123',
    endereco: 'Avenida Atlântica, 200, Cobertura',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    contatoEmergencia: 'Marcia Oliveira (esposa) - (21) 99876-5432',
    convenio: 'Bradesco Saúde',
    numeroConvenio: 'BRA987654321',
    status: 'ATIVO',
    createdAt: '2024-01-15T10:45:00Z',
    updatedAt: '2024-01-15T10:45:00Z'
  }
];

const mockEstatisticas = {
  medicos: {
    total: 25,
    ativos: 23,
    inativos: 2,
    novosMes: 3
  },
  pacientes: {
    total: 147,
    ativos: 145,
    inativos: 2,
    novosMes: 12
  },
  consultas: {
    hoje: 8,
    semana: 45,
    mes: 189,
    total: 1256
  },
  prontuarios: {
    total: 1089,
    novosMes: 156
  }
};

// Rotas da API

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    server: 'MediApp Demo Server',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rotas de médicos
app.get('/api/medicos', (req, res) => {
  res.json({
    success: true,
    data: mockMedicos,
    total: mockMedicos.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/medicos/:id', (req, res) => {
  const medico = mockMedicos.find(m => m.id === req.params.id);
  if (medico) {
    res.json({
      success: true,
      data: medico,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Médico não encontrado',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/medicos', (req, res) => {
  const novoMedico = {
    id: String(mockMedicos.length + 1),
    ...req.body,
    status: 'ATIVO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockMedicos.push(novoMedico);
  
  res.status(201).json({
    success: true,
    data: novoMedico,
    message: 'Médico cadastrado com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Rotas de pacientes
app.get('/api/pacientes', (req, res) => {
  res.json({
    success: true,
    data: mockPacientes,
    total: mockPacientes.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/pacientes/:id', (req, res) => {
  const paciente = mockPacientes.find(p => p.id === req.params.id);
  if (paciente) {
    res.json({
      success: true,
      data: paciente,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Paciente não encontrado',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/pacientes', (req, res) => {
  const novoPaciente = {
    id: String(mockPacientes.length + 1),
    ...req.body,
    status: 'ATIVO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockPacientes.push(novoPaciente);
  
  res.status(201).json({
    success: true,
    data: novoPaciente,
    message: 'Paciente cadastrado com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Rota de estatísticas do dashboard
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      medicosAtivos: mockEstatisticas.medicos,
      pacientesCadastrados: mockEstatisticas.pacientes,
      consultasAgendadas: mockEstatisticas.consultas,
      prontuariosAtivos: mockEstatisticas.prontuarios,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Rota de busca de especialidades
app.get('/api/medicos/especialidades', (req, res) => {
  const especialidades = [...new Set(mockMedicos.map(m => m.especialidade))];
  res.json({
    success: true,
    data: especialidades,
    total: especialidades.length,
    timestamp: new Date().toISOString()
  });
});

// Rota de busca de médicos
app.get('/api/medicos/buscar', (req, res) => {
  const { q } = req.query;
  let resultados = mockMedicos;
  
  if (q) {
    resultados = mockMedicos.filter(medico => 
      medico.nomeCompleto.toLowerCase().includes(q.toLowerCase()) ||
      medico.crm.toLowerCase().includes(q.toLowerCase()) ||
      medico.especialidade.toLowerCase().includes(q.toLowerCase())
    );
  }
  
  res.json({
    success: true,
    data: resultados,
    total: resultados.length,
    query: q,
    timestamp: new Date().toISOString()
  });
});

// Rota de busca de pacientes
app.get('/api/pacientes/buscar', (req, res) => {
  const { q } = req.query;
  let resultados = mockPacientes;
  
  if (q) {
    resultados = mockPacientes.filter(paciente => 
      paciente.nome.toLowerCase().includes(q.toLowerCase()) ||
      paciente.cpf.includes(q) ||
      paciente.email?.toLowerCase().includes(q.toLowerCase())
    );
  }
  
  res.json({
    success: true,
    data: resultados,
    total: resultados.length,
    query: q,
    timestamp: new Date().toISOString()
  });
});

// Rotas de autenticação (mock)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock de autenticação simples
  if (email && password) {
    res.json({
      success: true,
      data: {
        user: {
          id: '1',
          name: 'Dr. Demonstração',
          email: email,
          specialty: 'Medicina Geral',
          crm: 'CRM-DEMO'
        },
        token: 'demo-jwt-token-12345'
      },
      message: 'Login realizado com sucesso',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email e senha são obrigatórios',
      timestamp: new Date().toISOString()
    });
  }
});

// Rota para servir o dashboard principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota para servir a aplicação principal
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/app.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('❌ [ERROR]', err.message);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏥 ==========================================`);
  console.log(`🏥 MediApp Demo Server v2.0.0`);
  console.log(`🏥 ==========================================`);
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 URLs disponíveis:`);
  console.log(`   📊 Dashboard: http://localhost:${PORT}`);
  console.log(`   🏥 App: http://localhost:${PORT}/app`);
  console.log(`   👨‍⚕️ Médicos: http://localhost:${PORT}/gestao-medicos.html`);
  console.log(`   👥 Pacientes: http://localhost:${PORT}/gestao-pacientes.html`);
  console.log(`   🔧 Health: http://localhost:${PORT}/health`);
  console.log(`   📡 API Base: http://localhost:${PORT}/api`);
  console.log(`🏥 ==========================================`);
  console.log(`✨ Pronto para exploração das funcionalidades!`);
  console.log(`🏥 ==========================================`);
});

module.exports = app;