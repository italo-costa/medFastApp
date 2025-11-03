/**
 * 🏠 SERVIÇO DE INTEGRAÇÃO COM VIACEP
 * 
 * Implementação do contrato AddressServiceContract para o serviço ViaCEP.
 * Refatorado para seguir a nova arquitetura de integração.
 * 
 * @author MediApp Integration Team
 * @version 2.0.0
 */

const { AddressServiceContract } = require('../contracts/ExternalServiceContracts');

class ViaCepService extends AddressServiceContract {
    constructor(config = {}) {
        super();
        this.baseUrl = config.baseUrl || 'https://viacep.com.br/ws';
        this.cache = new Map();
        this.cacheTimeout = config.cacheTimeout || 24 * 60 * 60 * 1000; // 24 horas
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.rateLimitDelay = config.rateLimitDelay || 100; // 100ms entre requests
        this.timeout = config.timeout || 10000; // 10 segundos
        this.maxCacheSize = config.maxCacheSize || 1000;
    }

    /**
     * Configuração do serviço
     */
    getConfig() {
        return {
            name: 'ViaCEP',
            baseUrl: this.baseUrl,
            version: '2.0.0',
            description: 'Serviço de consulta de CEPs brasileiro',
            provider: 'ViaCEP',
            documentation: 'https://viacep.com.br',
            rateLimit: {
                delay: this.rateLimitDelay,
                maxRequestsPerMinute: 600
            },
            cache: {
                timeout: this.cacheTimeout,
                maxSize: this.maxCacheSize
            }
        };
    }

    /**
     * Validação de parâmetros de entrada
     */
    validateParams(params) {
        const { cep, uf, cidade, logradouro } = params;

        // Validação de CEP
        if (cep) {
            return this.validateCep(cep);
        }

        // Validação de endereço
        if (uf && cidade && logradouro) {
            return this.validateAddressParams(uf, cidade, logradouro);
        }

        return {
            valid: false,
            error: 'Parâmetros insuficientes. Forneça CEP ou (UF + cidade + logradouro)'
        };
    }

    /**
     * Health check do serviço
     */
    async healthCheck() {
        try {
            const testCep = '01310-100'; // CEP da Avenida Paulista, SP
            const startTime = Date.now();
            
            const result = await this.consultarCep(testCep);
            const responseTime = Date.now() - startTime;

            if (result.success) {
                return this.successResponse({
                    status: 'healthy',
                    responseTime: `${responseTime}ms`,
                    lastTestedAt: new Date().toISOString(),
                    testCep: testCep,
                    cache: {
                        size: this.cache.size,
                        maxSize: this.maxCacheSize
                    },
                    stats: this.getStats()
                });
            } else {
                return {
                    success: false,
                    status: 'unhealthy',
                    error: result.error,
                    responseTime: `${responseTime}ms`,
                    lastTestedAt: new Date().toISOString()
                };
            }
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Rate limiting
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
     * Cache management
     */
    cache(key, data = undefined) {
        // Get do cache
        if (data === undefined) {
            const cached = this.cache.get(key);
            if (!cached) return null;

            // Verifica expiração
            if (Date.now() - cached.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
                return null;
            }

            return cached.data;
        }

        // Set do cache
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Limita tamanho do cache
        if (this.cache.size > this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        return data;
    }

    /**
     * Validação específica de CEP
     */
    validateCep(cep) {
        if (!cep || typeof cep !== 'string') {
            return { valid: false, error: 'CEP deve ser uma string' };
        }

        const cleanCep = cep.replace(/\D/g, '');

        if (cleanCep.length !== 8) {
            return { valid: false, error: 'CEP deve conter exatamente 8 dígitos' };
        }

        const invalidCeps = ['00000000', '11111111', '22222222', '33333333', 
                           '44444444', '55555555', '66666666', '77777777', 
                           '88888888', '99999999'];
        
        if (invalidCeps.includes(cleanCep)) {
            return { valid: false, error: 'CEP inválido' };
        }

        const formatted = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
        return { valid: true, formatted, clean: cleanCep };
    }

    /**
     * Validação de parâmetros de endereço
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
     * Requisição HTTP genérica
     */
    async makeRequest(url) {
        try {
            await this.rateLimit();

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'MediApp/2.0.0 (Integration Service)'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data };

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Timeout de ${this.timeout}ms excedido`);
            }
            throw error;
        }
    }

    /**
     * Consultar endereço por CEP
     */
    async consultarCep(cep) {
        try {
            console.log(`[ViaCepService] Consultando CEP: ${cep}`);

            const validation = this.validateParams({ cep });
            if (!validation.valid) {
                return this.handleError(new Error(validation.error));
            }

            const cleanCep = validation.clean;
            const cacheKey = `cep_${cleanCep}`;

            // Verifica cache
            const cached = this.cache(cacheKey);
            if (cached) {
                console.log(`[ViaCepService] Retornando do cache: ${cleanCep}`);
                return this.successResponse(cached, { fromCache: true });
            }

            // Faz requisição
            const url = `${this.baseUrl}/${cleanCep}/json/`;
            const result = await this.makeRequest(url);

            if (!result.success) {
                throw new Error(`Erro na requisição: ${result.error}`);
            }

            // Verifica se CEP foi encontrado
            if (result.data.erro) {
                const error = new Error('CEP não encontrado na base de dados');
                error.code = 'CEP_NOT_FOUND';
                throw error;
            }

            // Armazena no cache
            this.cache(cacheKey, result.data);

            console.log(`[ViaCepService] CEP encontrado: ${result.data.localidade}/${result.data.uf}`);
            return this.successResponse(result.data, { fromCache: false });

        } catch (error) {
            console.error(`[ViaCepService] Erro ao consultar CEP: ${error.message}`);
            return this.handleError(error);
        }
    }

    /**
     * Buscar CEP por endereço
     */
    async buscarCepPorEndereco(uf, cidade, logradouro) {
        try {
            console.log(`[ViaCepService] Buscando CEP: ${uf}/${cidade}/${logradouro}`);

            const validation = this.validateParams({ uf, cidade, logradouro });
            if (!validation.valid) {
                return this.handleError(new Error(validation.error));
            }

            const normalizedUf = uf.toUpperCase();
            const normalizedCidade = cidade.trim();
            const normalizedLogradouro = logradouro.trim();

            const cacheKey = `endereco_${normalizedUf}_${normalizedCidade}_${normalizedLogradouro}`;

            // Verifica cache
            const cached = this.cache(cacheKey);
            if (cached) {
                console.log(`[ViaCepService] Retornando busca do cache`);
                return this.successResponse(cached, { fromCache: true });
            }

            // Codifica parâmetros para URL
            const encodedCidade = encodeURIComponent(normalizedCidade);
            const encodedLogradouro = encodeURIComponent(normalizedLogradouro);

            // Faz requisição
            const url = `${this.baseUrl}/${normalizedUf}/${encodedCidade}/${encodedLogradouro}/json/`;
            const result = await this.makeRequest(url);

            if (!result.success) {
                throw new Error(`Erro na requisição: ${result.error}`);
            }

            // Verifica se encontrou resultados
            if (!Array.isArray(result.data) || result.data.length === 0) {
                const error = new Error('Nenhum CEP encontrado para este endereço');
                error.code = 'NO_RESULTS';
                throw error;
            }

            // Armazena no cache
            this.cache(cacheKey, result.data);

            console.log(`[ViaCepService] Encontrados ${result.data.length} resultados`);
            return this.successResponse(result.data, { 
                fromCache: false,
                resultsCount: result.data.length 
            });

        } catch (error) {
            console.error(`[ViaCepService] Erro ao buscar por endereço: ${error.message}`);
            return this.handleError(error);
        }
    }

    /**
     * Estatísticas do serviço
     */
    getStats() {
        return {
            requestCount: this.requestCount,
            cacheSize: this.cache.size,
            maxCacheSize: this.maxCacheSize,
            lastRequestTime: this.lastRequestTime,
            uptime: Date.now() - (this.startTime || Date.now()),
            rateLimitDelay: this.rateLimitDelay,
            config: this.getConfig()
        };
    }

    /**
     * Limpar cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[ViaCepService] Cache limpo');
        return { success: true, message: 'Cache limpo com sucesso' };
    }

    /**
     * Diagnóstico completo do serviço
     */
    async diagnostics() {
        const health = await this.healthCheck();
        const stats = this.getStats();
        const config = this.getConfig();

        return {
            service: 'ViaCEP',
            version: '2.0.0',
            health,
            stats,
            config,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ViaCepService;