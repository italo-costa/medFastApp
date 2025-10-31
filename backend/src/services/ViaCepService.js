/**
 * Serviço de Integração com ViaCEP
 * 
 * Baseado no contrato OpenAPI 3.0: /docs/api-contracts/viacep-api.yaml
 * 
 * Funcionalidades:
 * - Consulta de endereço por CEP
 * - Busca reversa (CEP por endereço)
 * - Cache local de consultas
 * - Validação robusta de dados
 * - Fallback em caso de falha
 * - Rate limiting automático
 * 
 * @author MediApp Development Team
 * @version 1.0.0
 */

class ViaCepService {
    constructor() {
        this.baseUrl = 'https://viacep.com.br/ws';
        this.cache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 horas
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.rateLimitDelay = 100; // 100ms entre requests
    }

    /**
     * Valida formato de CEP
     * @param {string} cep - CEP a ser validado
     * @returns {Object} - {valid: boolean, formatted: string, error?: string}
     */
    validateCep(cep) {
        if (!cep || typeof cep !== 'string') {
            return { valid: false, error: 'CEP deve ser uma string' };
        }

        // Remove caracteres não numéricos
        const cleanCep = cep.replace(/\D/g, '');

        // Verifica se tem 8 dígitos
        if (cleanCep.length !== 8) {
            return { valid: false, error: 'CEP deve conter exatamente 8 dígitos' };
        }

        // Verifica se não é um CEP inválido conhecido
        const invalidCeps = ['00000000', '11111111', '22222222', '33333333', 
                           '44444444', '55555555', '66666666', '77777777', 
                           '88888888', '99999999'];
        
        if (invalidCeps.includes(cleanCep)) {
            return { valid: false, error: 'CEP inválido' };
        }

        // Formata o CEP
        const formatted = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;

        return { valid: true, formatted, clean: cleanCep };
    }

    /**
     * Valida parâmetros para busca por endereço
     * @param {string} uf - Estado (2 caracteres)
     * @param {string} cidade - Nome da cidade (min 3 caracteres)
     * @param {string} logradouro - Nome do logradouro (min 3 caracteres)
     * @returns {Object} - {valid: boolean, error?: string}
     */
    validateAddressParams(uf, cidade, logradouro) {
        if (!uf || typeof uf !== 'string' || uf.length !== 2) {
            return { valid: false, error: 'UF deve ter exatamente 2 caracteres' };
        }

        if (!cidade || typeof cidade !== 'string' || cidade.length < 3) {
            return { valid: false, error: 'Cidade deve ter pelo menos 3 caracteres' };
        }

        if (!logradouro || typeof logradouro !== 'string' || logradouro.length < 3) {
            return { valid: false, error: 'Logradouro deve ter pelo menos 3 caracteres' };
        }

        return { valid: true };
    }

    /**
     * Implementa rate limiting simples
     */
    async rateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(resolve => 
                setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
            );
        }
        
        this.lastRequestTime = Date.now();
        this.requestCount++;
    }

    /**
     * Obtém item do cache
     * @param {string} key - Chave do cache
     * @returns {Object|null} - Dados do cache ou null
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        // Verifica se o cache expirou
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Armazena item no cache
     * @param {string} key - Chave do cache
     * @param {Object} data - Dados para armazenar
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Limita o tamanho do cache
        if (this.cache.size > 1000) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * Realiza requisição HTTP com tratamento de erro
     * @param {string} url - URL para requisição
     * @returns {Promise<Object>} - Resposta da API
     */
    async makeRequest(url) {
        try {
            await this.rateLimit();

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'MediApp/1.0.0'
                },
                timeout: 10000 // 10 segundos
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data };

        } catch (error) {
            console.error(`[ViaCepService] Erro na requisição: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Consulta endereço por CEP
     * @param {string} cep - CEP a ser consultado
     * @returns {Promise<Object>} - Resultado da consulta
     */
    async consultarCep(cep) {
        console.log(`[ViaCepService] Consultando CEP: ${cep}`);

        // Validação
        const validation = this.validateCep(cep);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
                code: 'INVALID_CEP'
            };
        }

        const cleanCep = validation.clean;
        const cacheKey = `cep_${cleanCep}`;

        // Verifica cache
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log(`[ViaCepService] Retornando do cache: ${cleanCep}`);
            return { success: true, data: cached, fromCache: true };
        }

        // Faz requisição
        const url = `${this.baseUrl}/${cleanCep}/json/`;
        const result = await this.makeRequest(url);

        if (!result.success) {
            return {
                success: false,
                error: `Erro ao consultar ViaCEP: ${result.error}`,
                code: 'REQUEST_FAILED'
            };
        }

        // Verifica se CEP foi encontrado
        if (result.data.erro) {
            return {
                success: false,
                error: 'CEP não encontrado na base de dados',
                code: 'CEP_NOT_FOUND'
            };
        }

        // Armazena no cache
        this.setCache(cacheKey, result.data);

        console.log(`[ViaCepService] CEP encontrado: ${result.data.localidade}/${result.data.uf}`);
        return { success: true, data: result.data, fromCache: false };
    }

    /**
     * Busca CEPs por endereço (busca reversa)
     * @param {string} uf - Estado
     * @param {string} cidade - Cidade
     * @param {string} logradouro - Logradouro
     * @returns {Promise<Object>} - Resultado da busca
     */
    async buscarCepPorEndereco(uf, cidade, logradouro) {
        console.log(`[ViaCepService] Buscando CEP: ${uf}/${cidade}/${logradouro}`);

        // Validação
        const validation = this.validateAddressParams(uf, cidade, logradouro);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
                code: 'INVALID_PARAMS'
            };
        }

        // Normaliza parâmetros
        const normalizedUf = uf.toUpperCase();
        const normalizedCidade = cidade.trim();
        const normalizedLogradouro = logradouro.trim();

        const cacheKey = `endereco_${normalizedUf}_${normalizedCidade}_${normalizedLogradouro}`;

        // Verifica cache
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log(`[ViaCepService] Retornando busca do cache`);
            return { success: true, data: cached, fromCache: true };
        }

        // Codifica parâmetros para URL
        const encodedCidade = encodeURIComponent(normalizedCidade);
        const encodedLogradouro = encodeURIComponent(normalizedLogradouro);

        // Faz requisição
        const url = `${this.baseUrl}/${normalizedUf}/${encodedCidade}/${encodedLogradouro}/json/`;
        const result = await this.makeRequest(url);

        if (!result.success) {
            return {
                success: false,
                error: `Erro ao buscar no ViaCEP: ${result.error}`,
                code: 'REQUEST_FAILED'
            };
        }

        // Verifica se encontrou resultados
        if (!Array.isArray(result.data) || result.data.length === 0) {
            return {
                success: false,
                error: 'Nenhum CEP encontrado para este endereço',
                code: 'NO_RESULTS'
            };
        }

        // Armazena no cache
        this.setCache(cacheKey, result.data);

        console.log(`[ViaCepService] Encontrados ${result.data.length} resultados`);
        return { success: true, data: result.data, fromCache: false };
    }

    /**
     * Retorna estatísticas do serviço
     * @returns {Object} - Estatísticas de uso
     */
    getStats() {
        return {
            requestCount: this.requestCount,
            cacheSize: this.cache.size,
            lastRequestTime: this.lastRequestTime,
            uptime: Date.now() - (this.lastRequestTime || Date.now())
        };
    }

    /**
     * Limpa o cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[ViaCepService] Cache limpo');
    }
}

module.exports = ViaCepService;