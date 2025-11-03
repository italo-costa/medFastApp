/**
 * Serviço de Validação Centralizado
 * Consolida todas as validações da aplicação
 */

class ValidationService {

  /**
   * Validações de Email
   */
  static validateEmail(email) {
    const errors = [];
    
    if (!email) {
      errors.push('Email é obrigatório');
      return { valid: false, errors };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Email deve ter um formato válido');
    }

    if (email.length > 255) {
      errors.push('Email não pode exceder 255 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: email.toLowerCase().trim()
    };
  }

  /**
   * Validações de Senha
   */
  static validatePassword(password, options = {}) {
    const {
      minLength = 6,
      requireNumbers = false,
      requireSpecialChars = false,
      requireUppercase = false
    } = options;

    const errors = [];
    
    if (!password) {
      errors.push('Senha é obrigatória');
      return { valid: false, errors };
    }

    if (password.length < minLength) {
      errors.push(`Senha deve ter pelo menos ${minLength} caracteres`);
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validações de CPF
   */
  static validateCPF(cpf) {
    const errors = [];
    
    if (!cpf) {
      errors.push('CPF é obrigatório');
      return { valid: false, errors };
    }

    // Remove formatação
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    
    if (cleanCPF.length !== 11) {
      errors.push('CPF deve ter 11 dígitos');
      return { valid: false, errors, sanitized: cleanCPF };
    }

    // Verifica sequências inválidas
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      errors.push('CPF inválido');
      return { valid: false, errors, sanitized: cleanCPF };
    }

    // Algoritmo de validação do CPF
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let digito1 = 11 - (soma % 11);
    if (digito1 > 9) digito1 = 0;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    let digito2 = 11 - (soma % 11);
    if (digito2 > 9) digito2 = 0;

    if (parseInt(cleanCPF.charAt(9)) !== digito1 || parseInt(cleanCPF.charAt(10)) !== digito2) {
      errors.push('CPF inválido');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: cleanCPF,
      formatted: cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    };
  }

  /**
   * Validações de CRM
   */
  static validateCRM(crm, estado = null) {
    const errors = [];
    
    if (!crm) {
      errors.push('CRM é obrigatório');
      return { valid: false, errors };
    }

    const cleanCRM = crm.replace(/[^\d]/g, '');
    
    if (cleanCRM.length < 4 || cleanCRM.length > 8) {
      errors.push('CRM deve ter entre 4 e 8 dígitos');
    }

    if (estado && !estado.match(/^[A-Z]{2}$/)) {
      errors.push('Estado deve ter 2 letras maiúsculas');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: cleanCRM,
      formatted: estado ? `${cleanCRM}/${estado}` : cleanCRM
    };
  }

  /**
   * Validações de Telefone
   */
  static validatePhone(phone) {
    const errors = [];
    
    if (!phone) {
      errors.push('Telefone é obrigatório');
      return { valid: false, errors };
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.push('Telefone deve ter 10 ou 11 dígitos');
    }

    // Valida se é celular (9 como segundo dígito para números de 11 dígitos)
    if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') {
      errors.push('Número de celular deve ter 9 como terceiro dígito');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: cleanPhone,
      formatted: cleanPhone.length === 11 
        ? cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
        : cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    };
  }

  /**
   * Validações de Data
   */
  static validateDate(date, options = {}) {
    const {
      required = true,
      minAge = null,
      maxAge = null,
      futureAllowed = false
    } = options;

    const errors = [];
    
    if (!date) {
      if (required) {
        errors.push('Data é obrigatória');
      }
      return { valid: !required, errors };
    }

    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      errors.push('Data deve ser válida');
      return { valid: false, errors };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);

    if (!futureAllowed && dateObj > today) {
      errors.push('Data não pode ser no futuro');
    }

    // Validações de idade
    if (minAge !== null || maxAge !== null) {
      const age = Math.floor((today - dateObj) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (minAge !== null && age < minAge) {
        errors.push(`Idade mínima de ${minAge} anos`);
      }
      
      if (maxAge !== null && age > maxAge) {
        errors.push(`Idade máxima de ${maxAge} anos`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: dateObj.toISOString().split('T')[0]
    };
  }

  /**
   * Validações de Nome
   */
  static validateName(name, options = {}) {
    const {
      minLength = 2,
      maxLength = 100,
      required = true,
      allowNumbers = false
    } = options;

    const errors = [];
    
    if (!name) {
      if (required) {
        errors.push('Nome é obrigatório');
      }
      return { valid: !required, errors };
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length < minLength) {
      errors.push(`Nome deve ter pelo menos ${minLength} caracteres`);
    }

    if (trimmedName.length > maxLength) {
      errors.push(`Nome não pode exceder ${maxLength} caracteres`);
    }

    if (!allowNumbers && /\d/.test(trimmedName)) {
      errors.push('Nome não pode conter números');
    }

    // Verifica se contém apenas letras, espaços e acentos
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmedName)) {
      errors.push('Nome deve conter apenas letras e espaços');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: trimmedName.replace(/\s+/g, ' ') // Remove espaços extras
    };
  }

  /**
   * Validação de Arquivo
   */
  static validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      required = false
    } = options;

    const errors = [];
    
    if (!file) {
      if (required) {
        errors.push('Arquivo é obrigatório');
      }
      return { valid: !required, errors };
    }

    if (file.size > maxSize) {
      errors.push(`Arquivo muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`Tipo de arquivo não permitido. Aceitos: ${allowedTypes.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitização de texto
   */
  static sanitizeText(text, options = {}) {
    const {
      maxLength = null,
      removeHtml = true,
      removeSpecialChars = false
    } = options;

    if (!text) return null;

    let sanitized = text.trim();

    if (removeHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    if (removeSpecialChars) {
      sanitized = sanitized.replace(/[^\w\s\-\.]/g, '');
    }

    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Validação de dados do médico
   */
  static validateMedicoData(data) {
    const errors = [];
    
    // Validar nome
    const nomeValidation = this.validateName(data.nome, { required: true });
    if (!nomeValidation.valid) {
      errors.push(...nomeValidation.errors);
    }

    // Validar CRM
    const crmValidation = this.validateCRM(data.crm, data.estado_crm);
    if (!crmValidation.valid) {
      errors.push(...crmValidation.errors);
    }

    // Validar telefone
    if (data.telefone) {
      const telefoneValidation = this.validatePhone(data.telefone);
      if (!telefoneValidation.valid) {
        errors.push(...telefoneValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: {
        nome: nomeValidation.sanitized || data.nome,
        crm: crmValidation.sanitized || data.crm,
        estado_crm: data.estado_crm,
        telefone: data.telefone ? this.validatePhone(data.telefone).sanitized : null,
        especialidade: this.sanitizeText(data.especialidade, { maxLength: 100 })
      }
    };
  }

  /**
   * Validação de dados do paciente
   */
  static validatePacienteData(data) {
    const errors = [];
    
    // Validar nome
    const nomeValidation = this.validateName(data.nome, { required: true });
    if (!nomeValidation.valid) {
      errors.push(...nomeValidation.errors);
    }

    // Validar CPF
    const cpfValidation = this.validateCPF(data.cpf);
    if (!cpfValidation.valid) {
      errors.push(...cpfValidation.errors);
    }

    // Validar data de nascimento
    const dataNascValidation = this.validateDate(data.data_nascimento, { 
      required: true, 
      maxAge: 150,
      futureAllowed: false 
    });
    if (!dataNascValidation.valid) {
      errors.push(...dataNascValidation.errors);
    }

    // Validar telefone
    if (data.telefone) {
      const telefoneValidation = this.validatePhone(data.telefone);
      if (!telefoneValidation.valid) {
        errors.push(...telefoneValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: {
        nome: nomeValidation.sanitized || data.nome,
        cpf: cpfValidation.sanitized || data.cpf,
        data_nascimento: dataNascValidation.sanitized || data.data_nascimento,
        telefone: data.telefone ? this.validatePhone(data.telefone).sanitized : null,
        endereco: this.sanitizeText(data.endereco, { maxLength: 255 })
      }
    };
  }

  /**
   * Middleware de validação para Express
   */
  static validationMiddleware(schema) {
    return (req, res, next) => {
      const errors = [];
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];
        
        if (rules.required && !value) {
          errors.push(`${field} é obrigatório`);
          continue;
        }

        if (value) {
          switch (rules.type) {
            case 'email':
              const emailValidation = ValidationService.validateEmail(value);
              if (!emailValidation.valid) {
                errors.push(...emailValidation.errors);
              } else {
                req.body[field] = emailValidation.sanitized;
              }
              break;
              
            case 'cpf':
              const cpfValidation = ValidationService.validateCPF(value);
              if (!cpfValidation.valid) {
                errors.push(...cpfValidation.errors);
              } else {
                req.body[field] = cpfValidation.sanitized;
              }
              break;
              
            // Adicionar mais tipos conforme necessário
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação',
          errors
        });
      }

      next();
    };
  }
}

module.exports = ValidationService;