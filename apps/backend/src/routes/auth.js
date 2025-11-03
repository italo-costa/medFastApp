/**
 * Router de Autenticação - Refatorado com Serviços Centralizados
 * Usa AuthService, ValidationService e ResponseService
 */

const express = require('express');
const databaseService = require('../services/database');
const AuthService = require('../services/authService');
const ValidationService = require('../services/validationService');
const ResponseService = require('../services/responseService');

const router = express.Router();

// Verificar disponibilidade de email
router.post('/check-email', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { email } = req.body;

    // Validar email
    const emailValidation = ValidationService.validateEmail(email);
    if (!emailValidation.valid) {
      return ResponseService.validationError(res, emailValidation.errors);
    }

    // Verificar disponibilidade
    const available = await AuthService.isEmailAvailable(emailValidation.sanitized);

    return {
      email: emailValidation.sanitized,
      available
    };
  }, 'Verificação de disponibilidade realizada');
});

// Registrar novo médico
router.post('/register-doctor', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const {
      nomeCompleto,
      cpf,
      dataNascimento,
      telefone,
      email,
      crm,
      especialidade,
      instituicaoFormacao,
      anoFormacao,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      senha
    } = req.body;

    // Validações usando ValidationService
    const errors = [];

    // Validar nome
    const nomeValidation = ValidationService.validateName(nomeCompleto, { required: true });
    if (!nomeValidation.valid) {
      errors.push(...nomeValidation.errors);
    }

    // Validar email
    const emailValidation = ValidationService.validateEmail(email);
    if (!emailValidation.valid) {
      errors.push(...emailValidation.errors);
    }

    // Validar CPF se fornecido
    let cpfSanitized = null;
    if (cpf) {
      const cpfValidation = ValidationService.validateCPF(cpf);
      if (!cpfValidation.valid) {
        errors.push(...cpfValidation.errors);
      } else {
        cpfSanitized = cpfValidation.sanitized;
      }
    }

    // Validar CRM
    const crmValidation = ValidationService.validateCRM(crm, estado);
    if (!crmValidation.valid) {
      errors.push(...crmValidation.errors);
    }

    // Validar telefone se fornecido
    let telefoneSanitized = null;
    if (telefone) {
      const telefoneValidation = ValidationService.validatePhone(telefone);
      if (!telefoneValidation.valid) {
        errors.push(...telefoneValidation.errors);
      } else {
        telefoneSanitized = telefoneValidation.sanitized;
      }
    }

    // Validar senha
    const senhaValidation = ValidationService.validatePassword(senha, {
      minLength: 6,
      requireNumbers: false,
      requireSpecialChars: false
    });
    if (!senhaValidation.valid) {
      errors.push(...senhaValidation.errors);
    }

    // Campos obrigatórios específicos
    if (!especialidade) {
      errors.push('Especialidade é obrigatória');
    }

    if (errors.length > 0) {
      return ResponseService.validationError(res, errors);
    }

    // Verificar se email já existe
    const emailAvailable = await AuthService.isEmailAvailable(emailValidation.sanitized);
    if (!emailAvailable) {
      return ResponseService.conflict(res, 'Email já cadastrado no sistema', 'email');
    }

    // Verificar se CRM já existe
    const existingCRM = await databaseService.client.medico.findFirst({
      where: { crm: crmValidation.sanitized }
    });

    if (existingCRM) {
      return ResponseService.conflict(res, 'CRM já cadastrado no sistema', 'crm');
    }

    // Hash da senha usando AuthService
    const hashedPassword = await AuthService.hashPassword(senha);

    // Criar usuário
    const novoUsuario = await databaseService.client.usuario.create({
      data: {
        email: emailValidation.sanitized,
        senha: hashedPassword,
        nome: nomeValidation.sanitized,
        tipo: 'MEDICO'
      }
    });

    // Criar endereço formatado
    const enderecoCompleto = [
      logradouro && numero ? `${logradouro}, ${numero}` : logradouro,
      complemento,
      bairro,
      cidade && estado ? `${cidade} - ${estado}` : cidade,
      cep
    ].filter(Boolean).join(', ');

    // Criar perfil médico
    const novoMedico = await databaseService.client.medico.create({
      data: {
        usuario_id: novoUsuario.id,
        crm: crmValidation.sanitized,
        crm_uf: estado || 'SP',
        especialidade: ValidationService.sanitizeText(especialidade, { maxLength: 100 }),
        telefone: telefoneSanitized,
        celular: telefoneSanitized,
        endereco: enderecoCompleto || null,
        formacao: ValidationService.sanitizeText(instituicaoFormacao, { maxLength: 200 }) || 'Não informado',
        experiencia: `Formado em ${anoFormacao || new Date().getFullYear()}`
      }
    });

    console.log(`✅ [AUTH] Novo médico cadastrado: ${novoUsuario.nome} (${novoMedico.crm})`);

    return {
      id: novoUsuario.id,
      name: novoUsuario.nome,
      email: novoUsuario.email,
      crm: novoMedico.crm,
      specialty: novoMedico.especialidade
    };

  }, 'Médico cadastrado com sucesso');
});

// Login
router.post('/login', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { email, password } = req.body;

    if (!email || !password) {
      return ResponseService.validationError(res, 'Email e senha são obrigatórios');
    }

    // Login usando AuthService
    const loginResult = await AuthService.login(email, password);

    console.log(`✅ [AUTH] Login realizado: ${loginResult.user.email}`);

    return loginResult;

  }, 'Login realizado com sucesso');
});

// Logout
router.post('/logout', AuthService.authMiddleware(), async (req, res) => {
  return ResponseService.handle(res, async () => {
    await AuthService.logout(req.user.id);
    return null; // Sem dados para retornar
  }, 'Logout realizado com sucesso');
});

// Verificar token e obter dados do usuário
router.get('/me', AuthService.authMiddleware(), async (req, res) => {
  return ResponseService.handle(res, async () => {
    // O middleware já validou o token e populou req.user
    console.log(`🔍 [AUTH] Verificação de token: ${req.user.email}`);
    return req.user;
  }, 'Dados do usuário obtidos com sucesso');
});

// Refresh token
router.post('/refresh', async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ResponseService.validationError(res, 'Token de refresh é obrigatório');
    }

    const refreshResult = await AuthService.refreshToken(refreshToken);

    console.log(`🔄 [AUTH] Token renovado: ${refreshResult.user.email}`);

    return refreshResult;

  }, 'Token renovado com sucesso');
});

// Alterar senha
router.post('/change-password', AuthService.authMiddleware(), async (req, res) => {
  return ResponseService.handle(res, async () => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ResponseService.validationError(res, 'Senha atual e nova senha são obrigatórias');
    }

    // Buscar usuário atual
    const user = await databaseService.client.usuario.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar senha atual
    const senhaValida = await AuthService.comparePassword(currentPassword, user.senha);
    if (!senhaValida) {
      throw new Error('Senha atual incorreta');
    }

    // Validar nova senha
    const senhaValidation = ValidationService.validatePassword(newPassword, {
      minLength: 6
    });
    if (!senhaValidation.valid) {
      return ResponseService.validationError(res, senhaValidation.errors);
    }

    // Hash da nova senha
    const hashedNewPassword = await AuthService.hashPassword(newPassword);

    // Atualizar senha
    await databaseService.client.usuario.update({
      where: { id: req.user.id },
      data: { senha: hashedNewPassword }
    });

    console.log(`🔐 [AUTH] Senha alterada: ${req.user.email}`);

    return null; // Sem dados para retornar

  }, 'Senha alterada com sucesso');
});

module.exports = router;