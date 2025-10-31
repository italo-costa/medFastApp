/**
 * Middleware de Sanitização para Analytics
 * Remove dados sensíveis e aplica CSP específico para dados públicos
 */

const crypto = require('crypto');
const { logger } = require('../utils/logger');

class AnalyticsDataSanitizer {
  constructor() {
    // Campos permitidos para exposição pública
    this.allowedFields = {
      // Identificação geográfica (dados públicos)
      'municipio_nome': true,
      'municipio_codigo': false, // Hash para anonimização
      'uf': true,
      'tipo': true,
      'latitude': true,
      'longitude': true,
      
      // Indicadores agregados (não sensíveis)
      'ocupacao_hospitalar': true,
      'penetracao_planos': true,
      'conectividade_mbps': true,
      'resolutividade_local': true,
      'cobertura_4g': true,
      
      // Dados demográficos públicos
      'populacao': true,
      'leitos_sus': true,
      
      // Metadados técnicos
      'data_atualizacao': true,
      'fontes': true,
      'qualidade_dados': true,
      'fonte': true,
      'data_coleta': true,
      'url_fonte': true
    };

    // Campos que devem ser removidos completamente
    this.sensitiveFields = [
      'user_agent',
      'ip_address',
      'session_id',
      'auth_token',
      'personal_data',
      'cpf',
      'cnpj',
      'email',
      'telefone',
      'endereco',
      'nome_paciente',
      'numero_prontuario'
    ];

    // Campos que devem ser agregados/anonimizados
    this.aggregateFields = [
      'municipio_codigo',
      'dataDirectory', // Não expor paths do servidor
      'availableFiles' // Não expor estrutura de arquivos
    ];
  }

  /**
   * Sanitiza dados de analytics removendo informações sensíveis
   */
  sanitizeAnalyticsData(data, userPermissions = 'public') {
    if (!data) return data;

    // Se for array, sanitizar cada item
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeObject(item, userPermissions));
    }

    // Se for objeto, sanitizar recursivamente
    if (typeof data === 'object') {
      return this.sanitizeObject(data, userPermissions);
    }

    return data;
  }

  /**
   * Sanitiza um objeto removendo campos sensíveis
   */
  sanitizeObject(obj, userPermissions) {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      // Remover campos explicitamente sensíveis
      if (this.sensitiveFields.includes(key)) {
        logger.debug(`Campo sensível removido: ${key}`);
        continue;
      }

      // Verificar se campo é permitido
      if (key in this.allowedFields) {
        if (this.allowedFields[key]) {
          // Campo permitido, incluir com sanitização adicional se necessário
          sanitized[key] = this.sanitizeValue(key, value, userPermissions);
        } else if (this.aggregateFields.includes(key)) {
          // Campo requer agregação/hash
          sanitized[`${key}_hash`] = this.hashValue(value);
        }
      } else {
        // Campo não definido - aplicar sanitização conservadora
        if (this.isValueSafe(key, value)) {
          sanitized[key] = this.sanitizeValue(key, value, userPermissions);
        } else {
          logger.debug(`Campo não permitido removido: ${key}`);
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitiza valores específicos
   */
  sanitizeValue(key, value, userPermissions) {
    // Tratar arrays recursivamente
    if (Array.isArray(value)) {
      return value.map(item => 
        typeof item === 'object' ? this.sanitizeObject(item, userPermissions) : item
      );
    }

    // Tratar objetos recursivamente
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value, userPermissions);
    }

    // Sanitização específica por campo
    switch (key) {
      case 'dataDirectory':
        // Não expor paths do servidor
        return '[REDACTED]';
      
      case 'availableFiles':
        // Não expor lista completa de arquivos
        return Array.isArray(value) ? { count: value.length } : '[REDACTED]';
      
      case 'error':
        // Não expor stack traces em produção
        return process.env.NODE_ENV === 'development' ? value : '[ERROR_DETAILS_HIDDEN]';
      
      case 'municipio_codigo':
        // Hash códigos de município para anonimização parcial
        return this.hashValue(value);
      
      default:
        return value;
    }
  }

  /**
   * Verifica se um valor é seguro para exposição
   */
  isValueSafe(key, value) {
    // Verificar se key contém termos sensíveis
    const sensitiveTerms = ['password', 'token', 'secret', 'key', 'auth', 'session', 'private'];
    const keyLower = key.toLowerCase();
    
    if (sensitiveTerms.some(term => keyLower.includes(term))) {
      return false;
    }

    // Verificar se value parece ser sensível
    if (typeof value === 'string') {
      // CPF pattern
      if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value)) return false;
      // CNPJ pattern
      if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value)) return false;
      // Email pattern
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false;
      // Phone pattern
      if (/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value)) return false;
    }

    return true;
  }

  /**
   * Cria hash anonimizado de um valor
   */
  hashValue(value) {
    if (!value) return null;
    
    const hash = crypto.createHash('sha256')
      .update(String(value))
      .digest('hex')
      .substring(0, 8); // Apenas 8 chars para não ser identificável
    
    return `anon_${hash}`;
  }

  /**
   * Middleware Express para sanitização automática
   */
  middleware() {
    return (req, res, next) => {
      // Guardar método json original
      const originalJson = res.json.bind(res);

      // Sobrescrever res.json para aplicar sanitização
      res.json = (data) => {
        try {
          // Aplicar sanitização baseada na rota
          let sanitizedData = data;
          
          if (req.path.includes('/analytics/')) {
            // Determinar nível de permissão do usuário
            const userPermissions = this.getUserPermissions(req);
            
            // Sanitizar dados
            sanitizedData = this.sanitizeAnalyticsData(data, userPermissions);
            
            // Log de auditoria
            logger.info('Analytics data sanitized', {
              path: req.path,
              method: req.method,
              user_permissions: userPermissions,
              original_fields: Object.keys(data || {}),
              sanitized_fields: Object.keys(sanitizedData || {}),
              timestamp: new Date().toISOString()
            });
          }

          // Aplicar headers de segurança específicos para analytics
          this.setSecurityHeaders(res, req.path);

          return originalJson(sanitizedData);
          
        } catch (error) {
          logger.error('Erro na sanitização de dados:', error);
          return originalJson({
            success: false,
            message: 'Erro no processamento de dados',
            timestamp: new Date().toISOString()
          });
        }
      };

      next();
    };
  }

  /**
   * Determina permissões do usuário baseado no request
   */
  getUserPermissions(req) {
    // Em produção, isso viria do sistema de autenticação
    // Por enquanto, assumir permissões públicas para analytics
    return 'public';
  }

  /**
   * Aplica headers de segurança específicos
   */
  setSecurityHeaders(res, path) {
    // Headers específicos para dados de analytics
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Cache policy para dados públicos
    if (path.includes('/analytics/')) {
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200');
      res.setHeader('Vary', 'Accept-Encoding');
    }
    
    // Headers de conformidade LGPD
    res.setHeader('X-Data-Classification', 'PUBLIC_AGGREGATED');
    res.setHeader('X-Privacy-Policy', 'https://medfast.com/privacy');
    res.setHeader('X-Data-Retention', '2_YEARS');
    res.setHeader('X-Legal-Basis', 'LEGITIMATE_INTEREST');
  }

  /**
   * Valida estrutura de dados antes da sanitização
   */
  validateDataStructure(data) {
    const validation = {
      valid: true,
      issues: [],
      recommendations: []
    };

    if (!data) {
      validation.valid = false;
      validation.issues.push('Dados nulos ou indefinidos');
      return validation;
    }

    // Verificar se há campos sensíveis
    const sensitiveFound = [];
    this.findSensitiveFields(data, sensitiveFound, '');

    if (sensitiveFound.length > 0) {
      validation.issues.push(`Campos sensíveis encontrados: ${sensitiveFound.join(', ')}`);
      validation.recommendations.push('Aplicar sanitização antes da exposição');
    }

    // Verificar tamanho dos dados
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 1000000) { // 1MB
      validation.recommendations.push('Considerar paginação para datasets grandes');
    }

    return validation;
  }

  /**
   * Busca recursivamente por campos sensíveis
   */
  findSensitiveFields(obj, found, prefix) {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (this.sensitiveFields.includes(key)) {
        found.push(fullKey);
      }
      
      if (typeof value === 'object' && value !== null) {
        this.findSensitiveFields(value, found, fullKey);
      }
    }
  }
}

module.exports = AnalyticsDataSanitizer;