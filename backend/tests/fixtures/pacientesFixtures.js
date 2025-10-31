module.exports = {
  validPaciente: {
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
    ativo: true
  },

  invalidPaciente: {
    nomeCompleto: '',
    cpf: '123',
    telefone: '',
    email: 'email-invalido'
  },

  updatePacienteData: {
    nomeCompleto: 'Maria Santos Silva',
    telefone: '(11) 99999-9999',
    email: 'maria.silva@email.com'
  },

  inactivePaciente: {
    nomeCompleto: 'José Inativo',
    cpf: '11111111111',
    dataNascimento: '1975-10-20',
    telefone: '(11) 77777-7777',
    email: 'jose.inativo@email.com',
    ativo: false
  }
};