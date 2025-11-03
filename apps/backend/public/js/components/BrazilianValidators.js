/**
 * Validadores Brasileiros - MediApp
 * Funções de validação específicas para dados brasileiros
 */

class BrazilianValidators {
  /**
   * Validar CPF
   */
  static isValidCPF(cpf) {
    // Remover caracteres especiais
    cpf = cpf.replace(/\D/g, '');
    
    // Verificar se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Calcular primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;
    
    // Calcular segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;
    
    // Verificar dígitos
    return parseInt(cpf.charAt(9)) === digit1 && parseInt(cpf.charAt(10)) === digit2;
  }

  /**
   * Validar CNPJ
   */
  static isValidCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Primeiro dígito
    let sum = 0;
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }
    let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    // Segundo dígito
    sum = 0;
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }
    let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    return parseInt(cnpj.charAt(12)) === digit1 && parseInt(cnpj.charAt(13)) === digit2;
  }

  /**
   * Validar CEP
   */
  static isValidCEP(cep) {
    cep = cep.replace(/\D/g, '');
    return cep.length === 8 && /^\d{8}$/.test(cep);
  }

  /**
   * Validar telefone brasileiro
   */
  static isValidPhone(phone) {
    phone = phone.replace(/\D/g, '');
    // Aceita: 10 dígitos (fixo) ou 11 dígitos (celular)
    return /^(\d{10}|\d{11})$/.test(phone);
  }

  /**
   * Validar email
   */
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validar CRM
   */
  static isValidCRM(crm, uf = null) {
    crm = crm.replace(/\D/g, '');
    // CRM geralmente tem entre 4 e 6 dígitos
    const isValidLength = crm.length >= 4 && crm.length <= 6;
    
    if (uf) {
      // Validações específicas por UF podem ser adicionadas aqui
      const validUFs = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
        'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
        'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
      ];
      return isValidLength && validUFs.includes(uf.toUpperCase());
    }
    
    return isValidLength;
  }

  /**
   * Validar data de nascimento (não pode ser futura)
   */
  static isValidBirthDate(date) {
    const birthDate = new Date(date);
    const today = new Date();
    const minDate = new Date('1900-01-01');
    
    return birthDate <= today && birthDate >= minDate;
  }

  /**
   * Calcular idade
   */
  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
}

// Formatadores
class BrazilianFormatters {
  /**
   * Formatar CPF
   */
  static formatCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formatar CNPJ
   */
  static formatCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  /**
   * Formatar CEP
   */
  static formatCEP(cep) {
    cep = cep.replace(/\D/g, '');
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  /**
   * Formatar telefone
   */
  static formatPhone(phone) {
    phone = phone.replace(/\D/g, '');
    
    if (phone.length === 10) {
      // Fixo: (11) 1234-5678
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (phone.length === 11) {
      // Celular: (11) 91234-5678
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  }

  /**
   * Formatar data brasileira
   */
  static formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  }

  /**
   * Formatar data e hora brasileira
   */
  static formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
  }

  /**
   * Formatar moeda brasileira
   */
  static formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}

// Classe principal para validação de formulários
class FormValidator {
  constructor(form) {
    this.form = form;
    this.errors = {};
  }

  /**
   * Validar campo
   */
  validateField(fieldName, value, rules) {
    const errors = [];

    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (!value || value.toString().trim() === '') {
            errors.push(rule.message || `${fieldName} é obrigatório`);
          }
          break;

        case 'cpf':
          if (value && !BrazilianValidators.isValidCPF(value)) {
            errors.push(rule.message || 'CPF inválido');
          }
          break;

        case 'email':
          if (value && !BrazilianValidators.isValidEmail(value)) {
            errors.push(rule.message || 'Email inválido');
          }
          break;

        case 'phone':
          if (value && !BrazilianValidators.isValidPhone(value)) {
            errors.push(rule.message || 'Telefone inválido');
          }
          break;

        case 'cep':
          if (value && !BrazilianValidators.isValidCEP(value)) {
            errors.push(rule.message || 'CEP inválido');
          }
          break;

        case 'crm':
          if (value && !BrazilianValidators.isValidCRM(value, rule.uf)) {
            errors.push(rule.message || 'CRM inválido');
          }
          break;

        case 'birthDate':
          if (value && !BrazilianValidators.isValidBirthDate(value)) {
            errors.push(rule.message || 'Data de nascimento inválida');
          }
          break;

        case 'minLength':
          if (value && value.length < rule.value) {
            errors.push(rule.message || `Deve ter pelo menos ${rule.value} caracteres`);
          }
          break;

        case 'maxLength':
          if (value && value.length > rule.value) {
            errors.push(rule.message || `Deve ter no máximo ${rule.value} caracteres`);
          }
          break;
      }
    }

    if (errors.length > 0) {
      this.errors[fieldName] = errors;
      return false;
    } else {
      delete this.errors[fieldName];
      return true;
    }
  }

  /**
   * Validar formulário completo
   */
  validate(data, rules) {
    this.errors = {};
    let isValid = true;

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const fieldValue = data[fieldName];
      const fieldValid = this.validateField(fieldName, fieldValue, fieldRules);
      if (!fieldValid) {
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Obter erros
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Obter primeiro erro de um campo
   */
  getFieldError(fieldName) {
    return this.errors[fieldName] ? this.errors[fieldName][0] : null;
  }

  /**
   * Verificar se tem erros
   */
  hasErrors() {
    return Object.keys(this.errors).length > 0;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.BrazilianValidators = BrazilianValidators;
  window.BrazilianFormatters = BrazilianFormatters;
  window.FormValidator = FormValidator;
}

// Exportar para Node.js se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BrazilianValidators, BrazilianFormatters, FormValidator };
}