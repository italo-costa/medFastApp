// Mock API Server para demonstração
// Simula as rotas de API necessárias para a interface de gestão de pacientes

// Mock data dos pacientes
const patientsData = [
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

// Mock API Object
window.MockAPI = {
  baseURL: 'http://localhost:8080',
  
  // Interceptar fetch requests
  install() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(url, options = {}) {
      console.log('🔄 Interceptando chamada para:', url);
      
      // Se for uma chamada para API, simular resposta
      if (url.includes('/api/patients')) {
        return MockAPI.handlePatientsAPI(url, options);
      }
      
      // Para outras chamadas, usar fetch original
      return originalFetch.call(this, url, options);
    };
    
    console.log('✅ Mock API instalada com sucesso');
  },
  
  // Manipular chamadas para a API de pacientes
  async handlePatientsAPI(url, options) {
    const method = options.method || 'GET';
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Parse URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const params = urlObj.searchParams;
    
    try {
      let responseData;
      
      // Rota: GET /api/patients (listar com paginação)
      if (pathname === '/api/patients' && method === 'GET') {
        const page = parseInt(params.get('page')) || 1;
        const limit = parseInt(params.get('limit')) || 10;
        const search = params.get('search') || '';
        
        let filteredPatients = [...patientsData];
        
        // Aplicar filtro de busca
        if (search) {
          const searchLower = search.toLowerCase();
          filteredPatients = patientsData.filter(patient => 
            patient.name.toLowerCase().includes(searchLower) ||
            patient.cpf.includes(search) ||
            (patient.email && patient.email.toLowerCase().includes(searchLower))
          );
        }
        
        // Aplicar paginação
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
        
        responseData = {
          success: true,
          patients: paginatedPatients,
          pagination: {
            current: page,
            total: Math.ceil(filteredPatients.length / limit),
            totalRecords: filteredPatients.length
          }
        };
      }
      
      // Rota: GET /api/patients/stats/overview
      else if (pathname === '/api/patients/stats/overview' && method === 'GET') {
        const totalPatients = patientsData.length;
        const patientsWithAllergies = patientsData.filter(p => 
          p.observations && p.observations.toLowerCase().includes('alergia')
        ).length;
        
        const today = new Date().toISOString().split('T')[0];
        const consultasHoje = patientsData.filter(p => 
          p.ultimaConsulta && p.ultimaConsulta.startsWith(today)
        ).length;
        
        const prontuariosAtivos = patientsData.filter(p => p.ultimaConsulta).length;
        
        responseData = {
          success: true,
          stats: {
            totalPacientes: totalPatients,
            pacientesAlergias: patientsWithAllergies,
            consultasHoje: consultasHoje,
            prontuariosAtivos: prontuariosAtivos
          }
        };
      }
      
      // Rota: GET /api/patients/:id (buscar por ID)
      else if (pathname.match(/^\/api\/patients\/\d+$/) && method === 'GET') {
        const id = parseInt(pathname.split('/').pop());
        const patient = patientsData.find(p => p.id === id);
        
        if (patient) {
          responseData = {
            success: true,
            patient
          };
        } else {
          return new Response(JSON.stringify({
            success: false,
            message: 'Paciente não encontrado'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Rota: POST /api/patients (criar novo paciente)
      else if (pathname === '/api/patients' && method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        
        // Verificar CPF duplicado
        const existingPatient = patientsData.find(p => p.cpf === body.cpf);
        if (existingPatient) {
          return new Response(JSON.stringify({
            success: false,
            message: 'CPF já cadastrado no sistema'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Criar novo paciente
        const newPatient = {
          id: Math.max(...patientsData.map(p => p.id)) + 1,
          name: body.nomeCompleto,
          cpf: body.cpf,
          birthDate: new Date(body.dataNascimento).toISOString(),
          phone: body.telefone,
          email: body.email || null,
          bloodType: body.tipoSanguineo || null,
          observations: body.observacoes || null,
          address: body.address || null,
          insurance: body.insurance || { type: 'sus' },
          photo: body.photo || null,
          createdAt: new Date().toISOString(),
          ultimaConsulta: null
        };
        
        patientsData.push(newPatient);
        
        responseData = {
          success: true,
          message: 'Paciente cadastrado com sucesso',
          patient: newPatient
        };
      }
      
      // Rota: PUT /api/patients/:id (atualizar paciente)
      else if (pathname.match(/^\/api\/patients\/\d+$/) && method === 'PUT') {
        const id = parseInt(pathname.split('/').pop());
        const patientIndex = patientsData.findIndex(p => p.id === id);
        
        if (patientIndex === -1) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Paciente não encontrado'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const body = JSON.parse(options.body || '{}');
        
        // Verificar CPF duplicado (se alterado)
        if (body.cpf !== patientsData[patientIndex].cpf) {
          const cpfExists = patientsData.find(p => p.cpf === body.cpf && p.id !== id);
          if (cpfExists) {
            return new Response(JSON.stringify({
              success: false,
              message: 'CPF já cadastrado para outro paciente'
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        // Atualizar paciente
        const updatedPatient = {
          ...patientsData[patientIndex],
          name: body.nomeCompleto,
          cpf: body.cpf,
          birthDate: new Date(body.dataNascimento).toISOString(),
          phone: body.telefone,
          email: body.email || null,
          bloodType: body.tipoSanguineo || null,
          observations: body.observacoes || null,
          address: body.address || null,
          insurance: body.insurance || { type: 'sus' },
          photo: body.photo !== undefined ? body.photo : patientsData[patientIndex].photo
        };
        
        patientsData[patientIndex] = updatedPatient;
        
        responseData = {
          success: true,
          message: 'Paciente atualizado com sucesso',
          patient: updatedPatient
        };
      }
      
      // Rota: DELETE /api/patients/:id (deletar paciente)
      else if (pathname.match(/^\/api\/patients\/\d+$/) && method === 'DELETE') {
        const id = parseInt(pathname.split('/').pop());
        const patientIndex = patientsData.findIndex(p => p.id === id);
        
        if (patientIndex === -1) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Paciente não encontrado'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        patientsData.splice(patientIndex, 1);
        
        responseData = {
          success: true,
          message: 'Paciente deletado com sucesso'
        };
      }
      
      // Rota não encontrada
      else {
        return new Response(JSON.stringify({
          success: false,
          message: 'Rota não encontrada'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Retornar resposta simulada
      console.log('✅ Mock API respondendo:', responseData);
      
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('❌ Erro no Mock API:', error);
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Erro interno do servidor'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// Auto-instalar quando o script for carregado
if (typeof window !== 'undefined') {
  // Aguardar carregamento da página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => MockAPI.install(), 100);
    });
  } else {
    setTimeout(() => MockAPI.install(), 100);
  }
}

console.log('🔧 Mock API carregado - versão demonstração');