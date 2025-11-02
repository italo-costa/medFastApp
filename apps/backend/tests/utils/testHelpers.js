const request = require('supertest');

class TestHelpers {
  static createMedicoData(overrides = {}) {
    return {
      nomeCompleto: 'Dr. João Silva',
      cpf: '12345678901',
      crm: 'SP123456',
      especialidade: 'Cardiologia',
      telefone: '(11) 99999-9999',
      email: 'joao.silva@email.com',
      cep: '01310-100',
      logradouro: 'Av. Paulista',
      numero: '100',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      status: 'ATIVO',
      ...overrides
    };
  }

  static createPacienteData(overrides = {}) {
    return {
      nomeCompleto: 'Maria Santos',
      cpf: '98765432100',
      dataNascimento: '1985-05-15',
      telefone: '(11) 88888-8888',
      email: 'maria.santos@email.com',
      cep: '04038-001',
      logradouro: 'Rua Vergueiro',
      numero: '200',
      bairro: 'Vila Mariana',
      cidade: 'São Paulo',
      estado: 'SP',
      ativo: true,
      ...overrides
    };
  }

  static createConsultaData(medicoId, pacienteId, overrides = {}) {
    return {
      medicoId,
      pacienteId,
      dataConsulta: new Date(),
      tipoConsulta: 'CONSULTA_ROTINA',
      status: 'AGENDADA',
      ...overrides
    };
  }

  static createProntuarioData(medicoId, pacienteId, overrides = {}) {
    return {
      medicoId,
      pacienteId,
      dataConsulta: new Date(),
      tipoConsulta: 'CONSULTA_ROTINA',
      queixaPrincipal: 'Dor no peito',
      historiaDoenca: 'Paciente relata dor no peito há 2 dias',
      exameClinico: 'Paciente consciente e orientado',
      hipoteseDiagnostica: 'Possível angina',
      conduta: 'Solicitados exames complementares',
      ...overrides
    };
  }

  static createExameData(pacienteId, overrides = {}) {
    return {
      pacienteId,
      tipoExame: 'Eletrocardiograma',
      nomeExame: 'ECG de Repouso',
      dataRealizacao: new Date(),
      resultado: 'Ritmo sinusal normal',
      ...overrides
    };
  }

  static async makeAuthenticatedRequest(app, method, url, data = {}) {
    // Simular autenticação - pode ser expandido conforme necessário
    const req = request(app)[method.toLowerCase()](url);
    
    if (data && Object.keys(data).length > 0) {
      req.send(data);
    }
    
    return req;
  }

  static expectSuccessResponse(response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', true);
    return response.body;
  }

  static expectErrorResponse(response, expectedStatus = 400) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    return response.body;
  }

  static expectValidationError(response, field) {
    const body = this.expectErrorResponse(response, 400);
    expect(body.message.toLowerCase()).toContain(field.toLowerCase());
    return body;
  }

  static generateUniqueCPF() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const base = timestamp.slice(-8) + random;
    const cpfBase = base.slice(0, 9).padStart(9, '0');
    return this.formatCPF(cpfBase + '00'); // Simplified for testing
  }

  static generateUniqueCRM() {
    const timestamp = Date.now().toString();
    return timestamp.slice(-6);
  }

  static generateUniqueEmail() {
    const timestamp = Date.now();
    return `test${timestamp}@test.com`;
  }

  // Validações
  static isValidCPF(cpf) {
    if (!cpf) return false;
    
    // Remove pontos e traços
    const cpfClean = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpfClean.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpfClean)) return false;
    
    // Validação simplificada para testes
    return true;
  }

  static isValidCRM(crm) {
    if (!crm) return false;
    const crmClean = crm.replace(/\D/g, '');
    return crmClean.length === 6;
  }

  static isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidTelefone(telefone) {
    if (!telefone) return false;
    const telefoneClean = telefone.replace(/\D/g, '');
    return telefoneClean.length === 10 || telefoneClean.length === 11;
  }

  static isValidCEP(cep) {
    if (!cep) return false;
    const cepClean = cep.replace(/\D/g, '');
    return cepClean.length === 8;
  }

  static isValidEspecialidade(especialidade) {
    const especialidadesValidas = [
      'Cardiologia', 'Dermatologia', 'Endocrinologia', 'Gastroenterologia',
      'Ginecologia', 'Neurologia', 'Oftalmologia', 'Ortopedia', 'Pediatria',
      'Psiquiatria', 'Urologia', 'Anestesiologia', 'Cirurgia Geral',
      'Clínica Médica', 'Infectologia', 'Oncologia', 'Radiologia'
    ];
    return especialidadesValidas.includes(especialidade);
  }

  static isValidStatus(status) {
    const statusValidos = ['ATIVO', 'INATIVO', 'PENDENTE'];
    return statusValidos.includes(status);
  }

  // Formatação
  static formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  }

  static formatCPF(cpf) {
    const cpfClean = cpf.replace(/\D/g, '');
    return cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  static formatTelefone(telefone) {
    const telefoneClean = telefone.replace(/\D/g, '');
    if (telefoneClean.length === 11) {
      return telefoneClean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  static formatCEP(cep) {
    const cepClean = cep.replace(/\D/g, '');
    return cepClean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  // Sanitização
  static sanitizeData(data) {
    const sanitized = { ...data };
    
    // Trim strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      }
    });

    // Lowercase email
    if (sanitized.email) {
      sanitized.email = sanitized.email.toLowerCase();
    }

    return sanitized;
  }

  static cleanCPF(cpf) {
    return cpf.replace(/\D/g, '');
  }

  static cleanTelefone(telefone) {
    return telefone.replace(/\D/g, '');
  }

  static async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TestHelpers;