const request = require('supertest');

class TestHelpers {
  static createMedicoData(overrides = {}) {
    return {
      nomeCompleto: 'Dr. João Silva',
      cpf: '11144477735', // CPF válido
      crm: '123456',
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
      cpf: '22288833309', // CPF válido
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
    // Gera um CPF válido usando timestamp + random para garantir unicidade
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 900000).toString().padStart(6, '0');
    const sequence = (timestamp + random).slice(-9);
    
    // Calcula os dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(sequence[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;
    
    sum = 0;
    const sequenceWithDigit1 = sequence + digit1.toString();
    for (let i = 0; i < 10; i++) {
      sum += parseInt(sequenceWithDigit1[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;
    
    const cpf = sequence + digit1.toString() + digit2.toString();
    return this.formatCPF(cpf);
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
    
    // CPFs conhecidamente inválidos
    const invalidCPFs = [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999'
    ];
    
    if (invalidCPFs.includes(cpfClean)) return false;
    
    // Algoritmo de validação do CPF (dígitos verificadores)
    let sum = 0;
    let remainder;
    
    // Primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum = sum + parseInt(cpfClean.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpfClean.substring(9, 10))) return false;
    
    // Segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum = sum + parseInt(cpfClean.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpfClean.substring(10, 11))) return false;
    
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
    
    // Verifica se tem 10 ou 11 dígitos
    if (telefoneClean.length !== 10 && telefoneClean.length !== 11) return false;
    
    // Verifica se não são todos os dígitos iguais
    if (/^(\d)\1+$/.test(telefoneClean)) return false;
    
    // Regras para celular (11 dígitos)
    if (telefoneClean.length === 11) {
      // DDD válido (primeiro e segundo dígito)
      const ddd = parseInt(telefoneClean.substring(0, 2));
      if (ddd < 11 || ddd > 99) return false;
      
      // Terceiro dígito deve ser 9 para celular
      if (telefoneClean.charAt(2) !== '9') return false;
    }
    
    // Regras para telefone fixo (10 dígitos)  
    if (telefoneClean.length === 10) {
      // DDD válido (primeiro e segundo dígito)
      const ddd = parseInt(telefoneClean.substring(0, 2));
      if (ddd < 11 || ddd > 99) return false;
      
      // Terceiro dígito não pode ser 9 para fixo (seria celular)
      if (telefoneClean.charAt(2) === '9') return false;
      
      // Terceiro dígito deve ser entre 2-5 para fixos na maioria das regiões
      const terceiroDigito = parseInt(telefoneClean.charAt(2));
      if (terceiroDigito < 2 || terceiroDigito > 5) return false;
    }
    
    return true;
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
  /**
   * Configurar ambiente de teste
   */
  static async testDatabaseSetup() {
    const databaseService = require('../../src/services/database');
    
    try {
      // Conectar ao banco de teste se não estiver conectado
      if (!databaseService.isConnected) {
        await databaseService.connect();
      }
      
      // Executar migrations se necessário
      // Aqui assumimos que as migrations já foram executadas no setup global
      
      return true;
    } catch (error) {
      console.error('❌ [TEST] Erro ao configurar banco de teste:', error);
      throw error;
    }
  }

  /**
   * Criar usuário de teste
   */
  static async createTestUser(userData = {}) {
    const databaseService = require('../../src/services/database');
    const AuthService = require('../../src/services/authService');
    
    const defaultUserData = {
      nome: 'Usuário Teste',
      email: 'teste@test.com',
      password: 'Teste123@',
      tipo: 'MEDICO', // Usar valor correto do enum
      crm: 'TEST123',
      especialidade: 'Clínica Geral'
    };
    
    const finalUserData = { ...defaultUserData, ...userData };
    
    try {
      // Hash da senha
      const hashedPassword = await AuthService.hashPassword(finalUserData.password);
      
      // Criar usuário
      const usuario = await databaseService.client.usuario.create({
        data: {
          nome: finalUserData.nome,
          email: finalUserData.email,
          senha: hashedPassword,
          tipo: finalUserData.tipo,
          ativo: true
        }
      });
      
      // Criar médico se o tipo for médico
      if (finalUserData.tipo === 'MEDICO') {
        const medico = await databaseService.client.medico.create({
          data: {
            usuario_id: usuario.id,
            crm: finalUserData.crm,
            crm_uf: 'SP', // Valor padrão
            especialidade: finalUserData.especialidade
          }
        });
        
        usuario.medico = medico;
      }
      
      return usuario;
    } catch (error) {
      console.error('❌ [TEST] Erro ao criar usuário de teste:', error);
      throw error;
    }
  }

  /**
   * Limpar dados de teste
   */
  static async cleanupTestData() {
    const databaseService = require('../../src/services/database');
    
    try {
      // Conectar se não estiver conectado
      if (!databaseService.isConnected) {
        await databaseService.connect();
      }
      
      // Limpar dados em ordem (respeitando foreign keys)
      await databaseService.client.consulta.deleteMany({});
      await databaseService.client.medico.deleteMany({});
      await databaseService.client.paciente.deleteMany({});
      await databaseService.client.usuario.deleteMany({
        where: {
          email: {
            contains: 'test'
          }
        }
      });
      
      console.log('✅ [TEST] Dados de teste limpos');
    } catch (error) {
      console.error('❌ [TEST] Erro ao limpar dados de teste:', error);
      // Não fazer throw aqui para não quebrar o teardown
    }
  }
}

module.exports = TestHelpers;

// Exportar funções individuais para compatibilidade
module.exports.testDatabaseSetup = TestHelpers.testDatabaseSetup;
module.exports.createTestUser = TestHelpers.createTestUser;
module.exports.cleanupTestData = TestHelpers.cleanupTestData;