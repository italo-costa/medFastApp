/**
 * Middleware de Validação em Tempo Real
 * Validações avançadas e dinâmicas para dados médicos
 */

const databaseService = require('../services/database');
const { validateDoctorData } = require('../utils/validators');

class ValidacaoTempoReal {

  /**
   * Middleware para validação de médico em tempo real
   */
  static validarMedicoTempoReal() {
    return async (req, res, next) => {
      try {
        const dados = req.body;
        const { id } = req.params;

        console.log('🔍 [VALIDACAO] Validação em tempo real:', {
          operacao: id ? 'atualizar' : 'criar',
          campos: Object.keys(dados)
        });

        // Validações síncronas básicas
        const validacaoBasica = validateDoctorData(dados);
        if (!validacaoBasica.isValid) {
          return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: validacaoBasica.errors,
            tipo: 'validacao_basica'
          });
        }

        // Validações assíncronas
        const validacoesAsync = await Promise.all([
          ValidacaoTempoReal.validarCrmUnico(dados.crm, id),
          ValidacaoTempoReal.validarEmailUnico(dados.email, id),
          ValidacaoTempoReal.validarCpfUnico(dados.cpf, id),
          ValidacaoTempoReal.validarEspecialidade(dados.especialidade),
          ValidacaoTempoReal.validarCep(dados.cep),
          ValidacaoTempoReal.validarTelefone(dados.telefone),
          ValidacaoTempoReal.validarIdade(dados.data_nascimento)
        ]);

        // Compilar erros das validações assíncronas
        const errosAsync = validacoesAsync
          .filter(resultado => !resultado.valido)
          .map(resultado => resultado.erro);

        if (errosAsync.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Falha na validação avançada',
            errors: errosAsync,
            tipo: 'validacao_avancada'
          });
        }

        // Adicionar dados de validação ao request para uso posterior
        req.validacaoCompleta = {
          validacaoBasica,
          validacoesAsync
        };

        next();

      } catch (error) {
        console.error('❌ [VALIDACAO] Erro na validação em tempo real:', error.message);
        res.status(500).json({
          success: false,
          message: 'Erro interno na validação',
          error: error.message
        });
      }
    };
  }

  /**
   * Validar CRM único
   */
  static async validarCrmUnico(crm, idExcluir = null) {
    if (!crm) return { valido: true };

    try {
      const condicao = { crm };
      if (idExcluir) {
        condicao.id = { not: parseInt(idExcluir) };
      }

      const existente = await databaseService.client.medico.findFirst({
        where: condicao
      });

      return {
        valido: !existente,
        erro: existente ? 'CRM já está cadastrado no sistema' : null
      };
    } catch (error) {
      return { valido: false, erro: 'Erro ao validar CRM' };
    }
  }

  /**
   * Validar email único
   */
  static async validarEmailUnico(email, idExcluir = null) {
    if (!email) return { valido: true };

    try {
      let condicao = { email };
      if (idExcluir) {
        // Buscar usuário associado ao médico para excluir da verificação
        const medicoAtual = await databaseService.client.medico.findUnique({
          where: { id: parseInt(idExcluir) },
          include: { usuario: true }
        });

        if (medicoAtual?.usuario) {
          condicao = {
            email,
            id: { not: medicoAtual.usuario.id }
          };
        }
      }

      const existente = await databaseService.client.usuario.findFirst({
        where: condicao
      });

      return {
        valido: !existente,
        erro: existente ? 'Email já está cadastrado no sistema' : null
      };
    } catch (error) {
      return { valido: false, erro: 'Erro ao validar email' };
    }
  }

  /**
   * Validar CPF único
   */
  static async validarCpfUnico(cpf, idExcluir = null) {
    if (!cpf) return { valido: true };

    try {
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      const condicao = { cpf: cpfLimpo };
      
      if (idExcluir) {
        condicao.id = { not: parseInt(idExcluir) };
      }

      const existente = await databaseService.client.medico.findFirst({
        where: condicao
      });

      return {
        valido: !existente,
        erro: existente ? 'CPF já está cadastrado no sistema' : null
      };
    } catch (error) {
      return { valido: false, erro: 'Erro ao validar CPF' };
    }
  }

  /**
   * Validar especialidade
   */
  static async validarEspecialidade(especialidade) {
    if (!especialidade) return { valido: true };

    // Lista de especialidades válidas (pode ser expandida ou movida para configuração)
    const especialidadesValidas = [
      'Cardiologia', 'Neurologia', 'Ortopedia', 'Pediatria', 'Ginecologia',
      'Psiquiatria', 'Dermatologia', 'Oftalmologia', 'Otorrinolaringologia',
      'Urologia', 'Gastroenterologia', 'Endocrinologia', 'Pneumologia',
      'Reumatologia', 'Hematologia', 'Oncologia', 'Anestesiologia',
      'Radiologia', 'Patologia', 'Medicina Nuclear', 'Medicina do Trabalho',
      'Medicina Legal', 'Medicina Preventiva', 'Clínica Médica',
      'Cirurgia Geral', 'Medicina de Família'
    ];

    const especialidadeNormalizada = especialidade.trim().toLowerCase();
    const especialidadeValida = especialidadesValidas.some(esp => 
      esp.toLowerCase() === especialidadeNormalizada
    );

    return {
      valido: especialidadeValida,
      erro: especialidadeValida ? null : 'Especialidade não reconhecida. Verifique a grafia.'
    };
  }

  /**
   * Validar CEP via API
   */
  static async validarCep(cep) {
    if (!cep) return { valido: true };

    try {
      const cepLimpo = cep.replace(/[^\d]/g, '');
      
      if (cepLimpo.length !== 8) {
        return { valido: false, erro: 'CEP deve ter 8 dígitos' };
      }

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        return { valido: false, erro: 'CEP não encontrado' };
      }

      return { valido: true, dadosCep: data };
    } catch (error) {
      // Se a API estiver indisponível, não bloquear a validação
      return { valido: true, warning: 'Não foi possível validar o CEP automaticamente' };
    }
  }

  /**
   * Validar formato de telefone
   */
  static async validarTelefone(telefone) {
    if (!telefone) return { valido: true };

    // Regex para telefones brasileiros
    const regexTelefone = /^(\(\d{2}\)\s?)?(\d{4,5})-?(\d{4})$/;
    
    return {
      valido: regexTelefone.test(telefone),
      erro: regexTelefone.test(telefone) ? null : 'Formato de telefone inválido. Use: (11) 99999-9999'
    };
  }

  /**
   * Validar idade
   */
  static async validarIdade(dataNascimento) {
    if (!dataNascimento) return { valido: true };

    try {
      const nascimento = new Date(dataNascimento);
      const hoje = new Date();
      const idade = hoje.getFullYear() - nascimento.getFullYear();

      if (idade < 20) {
        return { valido: false, erro: 'Médico deve ter pelo menos 20 anos' };
      }

      if (idade > 100) {
        return { valido: false, erro: 'Data de nascimento inválida' };
      }

      return { valido: true };
    } catch (error) {
      return { valido: false, erro: 'Data de nascimento inválida' };
    }
  }

  /**
   * Middleware para validação de dados específicos em tempo real
   */
  static validarCampoEspecifico() {
    return async (req, res, next) => {
      try {
        const { campo, valor } = req.body;
        const { id } = req.params;

        console.log('🔍 [VALIDACAO] Validação de campo específico:', { campo, valor });

        let resultado = { valido: true };

        switch (campo) {
          case 'crm':
            resultado = await ValidacaoTempoReal.validarCrmUnico(valor, id);
            break;
          case 'email':
            resultado = await ValidacaoTempoReal.validarEmailUnico(valor, id);
            break;
          case 'cpf':
            resultado = await ValidacaoTempoReal.validarCpfUnico(valor, id);
            break;
          case 'especialidade':
            resultado = await ValidacaoTempoReal.validarEspecialidade(valor);
            break;
          case 'cep':
            resultado = await ValidacaoTempoReal.validarCep(valor);
            break;
          case 'telefone':
            resultado = await ValidacaoTempoReal.validarTelefone(valor);
            break;
          case 'data_nascimento':
            resultado = await ValidacaoTempoReal.validarIdade(valor);
            break;
          default:
            return res.status(400).json({
              success: false,
              message: 'Campo não suportado para validação'
            });
        }

        res.json({
          success: true,
          valido: resultado.valido,
          erro: resultado.erro,
          warning: resultado.warning,
          dados: resultado.dadosCep || null
        });

      } catch (error) {
        console.error('❌ [VALIDACAO] Erro na validação de campo:', error.message);
        res.status(500).json({
          success: false,
          message: 'Erro na validação',
          error: error.message
        });
      }
    };
  }
}

module.exports = ValidacaoTempoReal;