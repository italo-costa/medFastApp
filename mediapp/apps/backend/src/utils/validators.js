/**
 * Validadores para Produção - MediFast
 * 
 * Biblioteca de validações para garantir integridade dos dados
 * e conformidade com padrões brasileiros.
 */

/**
 * Valida CPF brasileiro
 * @param {string} cpf - CPF para validar
 * @returns {boolean} - True se válido
 */
function validateCPF(cpf) {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf[i]) * (10 - i);
    }
    let digit1 = ((sum * 10) % 11) % 10;
    
    if (digit1 !== parseInt(cpf[9])) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf[i]) * (11 - i);
    }
    let digit2 = ((sum * 10) % 11) % 10;
    
    return digit2 === parseInt(cpf[10]);
}

/**
 * Valida CNPJ brasileiro
 * @param {string} cnpj - CNPJ para validar
 * @returns {boolean} - True se válido
 */
function validateCNPJ(cnpj) {
    if (!cnpj) return false;
    
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Validação primeiro dígito
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cnpj[i]) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }
    let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    if (digit1 !== parseInt(cnpj[12])) return false;
    
    // Validação segundo dígito
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cnpj[i]) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }
    let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    return digit2 === parseInt(cnpj[13]);
}

/**
 * Valida email
 * @param {string} email - Email para validar
 * @returns {boolean} - True se válido
 */
function validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida telefone brasileiro
 * @param {string} phone - Telefone para validar
 * @returns {boolean} - True se válido
 */
function validatePhone(phone) {
    if (!phone) return false;
    
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Aceita formatos: 
    // 11987654321 (celular com DDD)
    // 1133334444 (fixo com DDD)
    // 87654321 (local sem DDD)
    return /^(\d{10,11}|\d{8})$/.test(cleanPhone);
}

/**
 * Valida CEP brasileiro
 * @param {string} cep - CEP para validar
 * @returns {boolean} - True se válido
 */
function validateCEP(cep) {
    if (!cep) return false;
    const cleanCEP = cep.replace(/[^\d]/g, '');
    return /^\d{8}$/.test(cleanCEP);
}

/**
 * Valida CRM (Conselho Regional de Medicina)
 * @param {string} crm - CRM para validar
 * @param {string} uf - UF do CRM
 * @returns {boolean} - True se válido
 */
function validateCRM(crm, uf) {
    if (!crm || !uf) return false;
    
    // CRM deve ter entre 4 e 6 dígitos
    const cleanCRM = crm.replace(/[^\d]/g, '');
    if (!/^\d{4,6}$/.test(cleanCRM)) return false;
    
    // UF deve ser válida
    const validUFs = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
        'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
        'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];
    
    return validUFs.includes(uf.toUpperCase());
}

/**
 * Valida COREN (Conselho Regional de Enfermagem)
 * @param {string} coren - COREN para validar
 * @param {string} uf - UF do COREN
 * @returns {boolean} - True se válido
 */
function validateCOREN(coren, uf) {
    if (!coren || !uf) return false;
    
    // COREN deve ter entre 5 e 7 dígitos
    const cleanCOREN = coren.replace(/[^\d]/g, '');
    if (!/^\d{5,7}$/.test(cleanCOREN)) return false;
    
    // UF deve ser válida (mesmo array do CRM)
    const validUFs = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
        'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
        'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];
    
    return validUFs.includes(uf.toUpperCase());
}

/**
 * Valida data de nascimento
 * @param {string|Date} birthDate - Data de nascimento
 * @returns {boolean} - True se válido
 */
function validateBirthDate(birthDate) {
    if (!birthDate) return false;
    
    const date = new Date(birthDate);
    const now = new Date();
    
    // Verifica se é uma data válida
    if (isNaN(date.getTime())) return false;
    
    // Não pode ser no futuro
    if (date > now) return false;
    
    // Não pode ser muito antiga (150 anos)
    const maxAge = new Date();
    maxAge.setFullYear(maxAge.getFullYear() - 150);
    if (date < maxAge) return false;
    
    return true;
}

/**
 * Valida idade mínima
 * @param {string|Date} birthDate - Data de nascimento
 * @param {number} minAge - Idade mínima (padrão: 0)
 * @returns {boolean} - True se válido
 */
function validateMinAge(birthDate, minAge = 0) {
    if (!validateBirthDate(birthDate)) return false;
    
    const birth = new Date(birthDate);
    const now = new Date();
    const age = Math.floor((now - birth) / (365.25 * 24 * 60 * 60 * 1000));
    
    return age >= minAge;
}

/**
 * Sanitiza string removendo caracteres especiais
 * @param {string} str - String para sanitizar
 * @returns {string} - String sanitizada
 */
function sanitizeString(str) {
    if (!str) return '';
    return str.trim().replace(/[<>]/g, '');
}

/**
 * Formata CPF
 * @param {string} cpf - CPF para formatar
 * @returns {string} - CPF formatado
 */
function formatCPF(cpf) {
    if (!cpf) return '';
    const clean = cpf.replace(/[^\d]/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 * @param {string} cnpj - CNPJ para formatar
 * @returns {string} - CNPJ formatado
 */
function formatCNPJ(cnpj) {
    if (!cnpj) return '';
    const clean = cnpj.replace(/[^\d]/g, '');
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone
 * @param {string} phone - Telefone para formatar
 * @returns {string} - Telefone formatado
 */
function formatPhone(phone) {
    if (!phone) return '';
    const clean = phone.replace(/[^\d]/g, '');
    
    if (clean.length === 11) {
        return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (clean.length === 10) {
        return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (clean.length === 8) {
        return clean.replace(/(\d{4})(\d{4})/, '$1-$2');
    }
    
    return phone;
}

/**
 * Formata CEP
 * @param {string} cep - CEP para formatar
 * @returns {string} - CEP formatado
 */
function formatCEP(cep) {
    if (!cep) return '';
    const clean = cep.replace(/[^\d]/g, '');
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Middleware de validação para pacientes
 * @param {Object} data - Dados do paciente
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validatePatientData(data) {
    const errors = [];
    
    // Nome obrigatório
    if (!data.nomeCompleto || data.nomeCompleto.trim().length < 2) {
        errors.push('Nome completo é obrigatório (mínimo 2 caracteres)');
    }
    
    // CPF obrigatório e válido
    if (!data.cpf) {
        errors.push('CPF é obrigatório');
    } else if (!validateCPF(data.cpf)) {
        errors.push('CPF inválido');
    }
    
    // Data de nascimento obrigatória e válida
    if (!data.dataNascimento) {
        errors.push('Data de nascimento é obrigatória');
    } else if (!validateBirthDate(data.dataNascimento)) {
        errors.push('Data de nascimento inválida');
    }
    
    // Telefone obrigatório e válido
    if (!data.telefone) {
        errors.push('Telefone é obrigatório');
    } else if (!validatePhone(data.telefone)) {
        errors.push('Formato de telefone inválido');
    }
    
    // Email opcional, mas se informado deve ser válido
    if (data.email && !validateEmail(data.email)) {
        errors.push('Email inválido');
    }
    
    // CEP opcional, mas se informado deve ser válido
    if (data.cep && !validateCEP(data.cep)) {
        errors.push('CEP inválido');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Middleware de validação para médicos
 * @param {Object} data - Dados do médico
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validateDoctorData(data) {
    const errors = [];
    
    // Validações básicas de usuário
    const userValidation = validatePatientData(data);
    if (!userValidation.isValid) {
        errors.push(...userValidation.errors);
    }
    
    // CRM obrigatório e válido
    if (!data.crm) {
        errors.push('CRM é obrigatório');
    } else if (!validateCRM(data.crm, data.crm_uf)) {
        errors.push('CRM inválido');
    }
    
    // Especialidade obrigatória
    if (!data.especialidade || data.especialidade.trim().length < 3) {
        errors.push('Especialidade é obrigatória (mínimo 3 caracteres)');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    // Validadores
    validateCPF,
    validateCNPJ,
    validateEmail,
    validatePhone,
    validateCEP,
    validateCRM,
    validateCOREN,
    validateBirthDate,
    validateMinAge,
    
    // Formatadores
    formatCPF,
    formatCNPJ,
    formatPhone,
    formatCEP,
    
    // Utilitários
    sanitizeString,
    
    // Validadores de dados completos
    validatePatientData,
    validateDoctorData
};