// Mock para simulação de API
export class MockApiService {
  static baseURL = 'http://localhost:3002/api';
  
  // Mock de login
  static async login(email: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simular delay
    
    if (email === 'dr.teste@mediapp.com' && password === 'medico123') {
      return {
        success: true,
        data: {
          user: {
            id: '1',
            name: 'Dr. João Teste',
            email: 'dr.teste@mediapp.com',
            specialty: 'Cardiologia',
            crm: 'CRM123456'
          },
          token: 'mock_jwt_token_123'
        }
      };
    } else {
      throw new Error('Credenciais inválidas');
    }
  }

  // Mock de lista de pacientes
  static async getPatients() {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      data: [
        {
          id: '1',
          name: 'Maria Silva Santos',
          cpf: '12345678901',
          birth_date: '1985-03-15',
          gender: 'FEMININO',
          phone: '(11) 98765-4321',
          email: 'maria.santos@email.com'
        },
        {
          id: '2',
          name: 'Carlos Eduardo Lima',
          cpf: '98765432109',
          birth_date: '1975-08-22',
          gender: 'MASCULINO',
          phone: '(11) 95432-1098',
          email: 'carlos.lima@email.com'
        }
      ]
    };
  }

  // Mock de busca de paciente por CPF
  static async searchPatientByCPF(cpf: string) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const patients = await this.getPatients();
    const patient = patients.data.find(p => p.cpf === cpf);
    
    if (patient) {
      return {
        success: true,
        data: patient
      };
    } else {
      throw new Error('Paciente não encontrado');
    }
  }

  // Mock de consultas
  static async getConsultations() {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      data: [
        {
          id: '1',
          patient_id: '1',
          doctor_id: '1',
          date: '2025-10-15',
          time: '14:30',
          type: 'CONSULTA',
          status: 'AGENDADA',
          notes: 'Consulta de cardiologia - primeira vez'
        }
      ]
    };
  }

  // Mock de estatísticas
  static async getStatistics() {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      data: {
        total_patients: 25,
        total_consultations: 48,
        consultations_today: 6,
        consultations_week: 23
      }
    };
  }
}

// Testes da API Mock
describe('MockApiService', () => {
  test('deve fazer login com credenciais válidas', async () => {
    const result = await MockApiService.login('dr.teste@mediapp.com', 'medico123');
    
    expect(result.success).toBe(true);
    expect(result.data.user.email).toBe('dr.teste@mediapp.com');
    expect(result.data.token).toBe('mock_jwt_token_123');
  });

  test('deve rejeitar login com credenciais inválidas', async () => {
    await expect(MockApiService.login('wrong@email.com', 'wrongpass'))
      .rejects.toThrow('Credenciais inválidas');
  });

  test('deve retornar lista de pacientes', async () => {
    const result = await MockApiService.getPatients();
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('Maria Silva Santos');
  });

  test('deve buscar paciente por CPF', async () => {
    const result = await MockApiService.searchPatientByCPF('12345678901');
    
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Maria Silva Santos');
  });

  test('deve rejeitar busca por CPF inexistente', async () => {
    await expect(MockApiService.searchPatientByCPF('00000000000'))
      .rejects.toThrow('Paciente não encontrado');
  });

  test('deve retornar consultas', async () => {
    const result = await MockApiService.getConsultations();
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].type).toBe('CONSULTA');
  });

  test('deve retornar estatísticas', async () => {
    const result = await MockApiService.getStatistics();
    
    expect(result.success).toBe(true);
    expect(result.data.total_patients).toBe(25);
    expect(result.data.total_consultations).toBe(48);
  });
});