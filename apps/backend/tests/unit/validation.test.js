const TestHelpers = require('../utils/testHelpers');
const medicosFixtures = require('../fixtures/medicosFixtures');

describe('Validações de Médicos - Testes Unitários', () => {
  describe('Validação de CPF', () => {
    test('deve aceitar CPF válido', () => {
      const cpfValido = '123.456.789-00';
      expect(TestHelpers.isValidCPF(cpfValido)).toBe(true);
    });

    test('deve rejeitar CPF inválido', () => {
      const cpfsInvalidos = [
        '123.456.789-99',  // dígito verificador incorreto
        '000.000.000-00',  // CPF conhecido como inválido
        '111.111.111-11',  // CPF com todos os dígitos iguais
        '123.456.789',     // formato incompleto
        'abc.def.ghi-jk',  // caracteres não numéricos
        ''                 // string vazia
      ];

      cpfsInvalidos.forEach(cpf => {
        expect(TestHelpers.isValidCPF(cpf)).toBe(false);
      });
    });
  });

  describe('Validação de CRM', () => {
    test('deve aceitar CRM válido', () => {
      const crmsValidos = [
        '123456',
        '654321',
        '999999'
      ];

      crmsValidos.forEach(crm => {
        expect(TestHelpers.isValidCRM(crm)).toBe(true);
      });
    });

    test('deve rejeitar CRM inválido', () => {
      const crmsInvalidos = [
        '12345',    // muito curto
        '1234567',  // muito longo
        'abcdef',   // não numérico
        '',         // string vazia
        '12345a'    // mistura letras e números
      ];

      crmsInvalidos.forEach(crm => {
        expect(TestHelpers.isValidCRM(crm)).toBe(false);
      });
    });
  });

  describe('Validação de Email', () => {
    test('deve aceitar email válido', () => {
      const emailsValidos = [
        'medico@exemplo.com',
        'dr.silva@hospital.com.br',
        'medico123@clinica.org',
        'contato+medico@saude.gov.br'
      ];

      emailsValidos.forEach(email => {
        expect(TestHelpers.isValidEmail(email)).toBe(true);
      });
    });

    test('deve rejeitar email inválido', () => {
      const emailsInvalidos = [
        'medico@',           // domínio incompleto
        '@exemplo.com',      // usuário ausente
        'medico.exemplo.com', // @ ausente
        'medico@.com',       // domínio inválido
        '',                  // string vazia
        'medico@exemplo'     // TLD ausente
      ];

      emailsInvalidos.forEach(email => {
        expect(TestHelpers.isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('Validação de Telefone', () => {
    test('deve aceitar telefone válido', () => {
      const telefonesValidos = [
        '(11) 99999-9999',
        '(21) 98765-4321',
        '(85) 91234-5678',
        '11999999999',
        '21987654321'
      ];

      telefonesValidos.forEach(telefone => {
        expect(TestHelpers.isValidTelefone(telefone)).toBe(true);
      });
    });

    test('deve rejeitar telefone inválido', () => {
      const telefonesInvalidos = [
        '(11) 9999-9999',   // 8 dígitos (celular deve ter 9)
        '(11) 3333-3333',   // fixo sem 9º dígito
        '11999999',         // muito curto
        '119999999999',     // muito longo
        'abcd-efgh',        // não numérico
        ''                  // string vazia
      ];

      telefonesInvalidos.forEach(telefone => {
        expect(TestHelpers.isValidTelefone(telefone)).toBe(false);
      });
    });
  });

  describe('Validação de CEP', () => {
    test('deve aceitar CEP válido', () => {
      const cepsValidos = [
        '01310-100',
        '20040-020',
        '30140-071',
        '01310100',
        '20040020'
      ];

      cepsValidos.forEach(cep => {
        expect(TestHelpers.isValidCEP(cep)).toBe(true);
      });
    });

    test('deve rejeitar CEP inválido', () => {
      const cepsInvalidos = [
        '0131-100',    // muito curto
        '013101000',   // muito longo
        'abcde-fgh',   // não numérico
        '01310-10a',   // mistura letras e números
        ''             // string vazia
      ];

      cepsInvalidos.forEach(cep => {
        expect(TestHelpers.isValidCEP(cep)).toBe(false);
      });
    });
  });

  describe('Geração de Dados Únicos', () => {
    test('deve gerar CPF único válido', () => {
      const cpf = TestHelpers.generateUniqueCPF();
      expect(TestHelpers.isValidCPF(cpf)).toBe(true);
      expect(cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    });

    test('deve gerar CRM único válido', () => {
      const crm = TestHelpers.generateUniqueCRM();
      expect(TestHelpers.isValidCRM(crm)).toBe(true);
      expect(crm).toMatch(/^\d{6}$/);
    });

    test('deve gerar email único válido', () => {
      const email = TestHelpers.generateUniqueEmail();
      expect(TestHelpers.isValidEmail(email)).toBe(true);
      expect(email).toContain('@test.com');
    });

    test('deve gerar múltiplos CPFs únicos', () => {
      const cpfs = new Set();
      for (let i = 0; i < 10; i++) {
        const cpf = TestHelpers.generateUniqueCPF();
        expect(cpfs.has(cpf)).toBe(false);
        cpfs.add(cpf);
      }
    });
  });

  describe('Formatação de Dados', () => {
    test('deve formatar data corretamente', () => {
      const data = new Date('2024-01-15T10:30:00Z');
      const dataFormatada = TestHelpers.formatDate(data);
      expect(dataFormatada).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    test('deve formatar CPF corretamente', () => {
      const cpfSemFormatacao = '12345678900';
      const cpfFormatado = TestHelpers.formatCPF(cpfSemFormatacao);
      expect(cpfFormatado).toBe('123.456.789-00');
    });

    test('deve formatar telefone corretamente', () => {
      const telefoneSemFormatacao = '11999999999';
      const telefoneFormatado = TestHelpers.formatTelefone(telefoneSemFormatacao);
      expect(telefoneFormatado).toBe('(11) 99999-9999');
    });

    test('deve formatar CEP corretamente', () => {
      const cepSemFormatacao = '01310100';
      const cepFormatado = TestHelpers.formatCEP(cepSemFormatacao);
      expect(cepFormatado).toBe('01310-100');
    });
  });

  describe('Validação de Especialidades', () => {
    test('deve aceitar especialidades válidas', () => {
      const especialidadesValidas = [
        'Cardiologia',
        'Dermatologia',
        'Endocrinologia',
        'Gastroenterologia',
        'Ginecologia',
        'Neurologia',
        'Oftalmologia',
        'Ortopedia',
        'Pediatria',
        'Psiquiatria',
        'Urologia',
        'Anestesiologia',
        'Cirurgia Geral',
        'Clínica Médica',
        'Infectologia',
        'Oncologia',
        'Radiologia'
      ];

      especialidadesValidas.forEach(especialidade => {
        expect(TestHelpers.isValidEspecialidade(especialidade)).toBe(true);
      });
    });

    test('deve rejeitar especialidades inválidas', () => {
      const especialidadesInvalidas = [
        'Especialidade Inexistente',
        '',
        '123',
        'cardio',  // case sensitive
        'CARDIOLOGIA'  // case sensitive
      ];

      especialidadesInvalidas.forEach(especialidade => {
        expect(TestHelpers.isValidEspecialidade(especialidade)).toBe(false);
      });
    });
  });

  describe('Validação de Status', () => {
    test('deve aceitar status válidos', () => {
      const statusValidos = ['ATIVO', 'INATIVO', 'PENDENTE'];

      statusValidos.forEach(status => {
        expect(TestHelpers.isValidStatus(status)).toBe(true);
      });
    });

    test('deve rejeitar status inválidos', () => {
      const statusInvalidos = [
        'SUSPENSO',
        'ativo',  // case sensitive
        'CANCELADO',
        '',
        '123'
      ];

      statusInvalidos.forEach(status => {
        expect(TestHelpers.isValidStatus(status)).toBe(false);
      });
    });
  });

  describe('Sanitização de Dados', () => {
    test('deve sanitizar dados de entrada', () => {
      const dadosSujos = {
        nomeCompleto: '  Dr. João Silva  ',
        cpf: '123.456.789-00',
        crm: ' 123456 ',
        especialidade: 'Cardiologia',
        telefone: '(11) 99999-9999',
        email: '  JOAO@EXEMPLO.COM  ',
        cep: '01310-100'
      };

      const dadosLimpos = TestHelpers.sanitizeData(dadosSujos);

      expect(dadosLimpos.nomeCompleto).toBe('Dr. João Silva');
      expect(dadosLimpos.crm).toBe('123456');
      expect(dadosLimpos.email).toBe('joao@exemplo.com');
    });

    test('deve remover caracteres especiais do CPF', () => {
      const cpf = '123.456.789-00';
      const cpfLimpo = TestHelpers.cleanCPF(cpf);
      expect(cpfLimpo).toBe('12345678900');
    });

    test('deve remover caracteres especiais do telefone', () => {
      const telefone = '(11) 99999-9999';
      const telefoneLimpo = TestHelpers.cleanTelefone(telefone);
      expect(telefoneLimpo).toBe('11999999999');
    });
  });
});