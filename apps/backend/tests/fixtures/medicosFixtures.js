module.exports = {
  validMedico: {
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
    status: 'ATIVO'
  },

  invalidMedico: {
    // Faltando campos obrigatórios
    nomeCompleto: '',
    cpf: '123',
    crm: '',
    especialidade: '',
    telefone: '',
    email: 'email-invalido'
  },

  updateMedicoData: {
    nomeCompleto: 'Dr. João Silva Atualizado',
    especialidade: 'Cardiologia e Cirurgia Cardíaca',
    telefone: '(11) 88888-8888',
    status: 'ATIVO'
  },

  duplicatedMedico: {
    nomeCompleto: 'Dr. Pedro Santos',
    cpf: '12345678901', // Mesmo CPF
    crm: 'SP123456',    // Mesmo CRM
    especialidade: 'Neurologia',
    telefone: '(11) 77777-7777',
    email: 'pedro.santos@email.com'
  }
};