/**
 * 🏛️ SERVIÇO DE INTEGRAÇÃO COM DATASUS
 * 
 * Implementação do contrato SUSServiceContract para integração com o DATASUS.
 * Fornece acesso a dados públicos de saúde do Sistema Único de Saúde.
 * 
 * @author MediApp Integration Team
 * @version 1.0.0
 */

const { SUSServiceContract } = require('../contracts/ExternalServiceContracts');

class DataSUSService extends SUSServiceContract {
    constructor(config = {}) {
        super();
        this.baseUrl = config.baseUrl || 'http://tabnet.datasus.gov.br';
        this.cnesUrl = config.cnesUrl || 'http://cnes2.datasus.gov.br';
        this.cache = new Map();
        this.cacheTimeout = config.cacheTimeout || 6 * 60 * 60 * 1000; // 6 horas
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.rateLimitDelay = config.rateLimitDelay || 500; // 500ms entre requests
        this.timeout = config.timeout || 30000; // 30 segundos
        this.maxCacheSize = config.maxCacheSize || 500;
    }

    getConfig() {
        return {
            name: 'DATASUS',
            baseUrl: this.baseUrl,
            cnesUrl: this.cnesUrl,
            version: '1.0.0',
            description: 'Serviço de integração com DATASUS - Dados públicos de saúde',
            provider: 'Ministério da Saúde',
            documentation: 'https://datasus.saude.gov.br',
            compliance: ['LGPD', 'LAI'],
            rateLimit: {
                delay: this.rateLimitDelay,
                maxRequestsPerMinute: 120
            },
            cache: {
                timeout: this.cacheTimeout,
                maxSize: this.maxCacheSize
            },
            dataTypes: [
                'estabelecimentos',
                'ocupacao_hospitalar',
                'procedimentos',
                'indicadores_municipais'
            ]
        };
    }

    validateParams(params) {
        const { codigo_municipio, indicador, uf, tipo } = params;

        if (codigo_municipio) {
            if (!codigo_municipio || typeof codigo_municipio !== 'string' || codigo_municipio.length !== 7) {
                return { valid: false, error: 'Código do município deve ter 7 dígitos (IBGE)' };
            }
        }

        if (uf) {
            if (!uf || typeof uf !== 'string' || uf.length !== 2) {
                return { valid: false, error: 'UF deve ter exatamente 2 caracteres' };
            }
        }

        if (indicador) {
            const validIndicadores = [
                'ocupacao_hospitalar',
                'leitos_sus',
                'internacoes',
                'procedimentos_ambulatoriais',
                'estabelecimentos'
            ];
            
            if (!validIndicadores.includes(indicador)) {
                return { 
                    valid: false, 
                    error: `Indicador inválido. Válidos: ${validIndicadores.join(', ')}` 
                };
            }
        }

        return { valid: true };
    }

    async healthCheck() {
        try {
            const testMunicipio = '3550308'; // São Paulo - SP
            const startTime = Date.now();
            
            const result = await this.buscarEstabelecimentos(testMunicipio);
            const responseTime = Date.now() - startTime;

            if (result.success) {
                return this.successResponse({
                    status: 'healthy',
                    responseTime: `${responseTime}ms`,
                    lastTestedAt: new Date().toISOString(),
                    testMunicipio: testMunicipio,
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

    cache(key, data = undefined) {
        if (data === undefined) {
            const cached = this.cache.get(key);
            if (!cached) return null;

            if (Date.now() - cached.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
                return null;
            }

            return cached.data;
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        if (this.cache.size > this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        return data;
    }

    async makeRequest(url) {
        try {
            await this.rateLimit();

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/html',
                    'User-Agent': 'MediApp/1.0.0 (DATASUS Integration)'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // DATASUS pode retornar HTML, então tentamos JSON primeiro
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return { success: true, data };
            } else {
                const text = await response.text();
                return { success: true, data: { html: text } };
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Timeout de ${this.timeout}ms excedido`);
            }
            throw error;
        }
    }

    /**
     * Buscar estabelecimentos de saúde por município
     */
    async buscarEstabelecimentos(codigo_municipio) {
        try {
            console.log(`[DataSUSService] Buscando estabelecimentos para município: ${codigo_municipio}`);

            const validation = this.validateParams({ codigo_municipio });
            if (!validation.valid) {
                return this.handleError(new Error(validation.error));
            }

            const cacheKey = `estabelecimentos_${codigo_municipio}`;
            const cached = this.cache(cacheKey);
            if (cached) {
                console.log(`[DataSUSService] Retornando estabelecimentos do cache`);
                return this.successResponse(cached, { fromCache: true });
            }

            // Por enquanto, simulamos dados baseados em padrões reais
            const mockData = this.generateEstabelecimentosData(codigo_municipio);
            
            // Armazena no cache
            this.cache(cacheKey, mockData);

            console.log(`[DataSUSService] Encontrados ${mockData.estabelecimentos.length} estabelecimentos`);
            return this.successResponse(mockData, { fromCache: false });

        } catch (error) {
            console.error(`[DataSUSService] Erro ao buscar estabelecimentos: ${error.message}`);
            return this.handleError(error);
        }
    }

    /**
     * Consultar indicadores de saúde
     */
    async consultarIndicadores(indicador, filtros = {}) {
        try {
            console.log(`[DataSUSService] Consultando indicador: ${indicador}`);

            const validation = this.validateParams({ indicador, ...filtros });
            if (!validation.valid) {
                return this.handleError(new Error(validation.error));
            }

            const cacheKey = `indicador_${indicador}_${JSON.stringify(filtros)}`;
            const cached = this.cache(cacheKey);
            if (cached) {
                console.log(`[DataSUSService] Retornando indicador do cache`);
                return this.successResponse(cached, { fromCache: true });
            }

            // Simula dados baseados em padrões reais do DATASUS
            const mockData = this.generateIndicadorData(indicador, filtros);
            
            this.cache(cacheKey, mockData);

            console.log(`[DataSUSService] Indicador ${indicador} consultado com sucesso`);
            return this.successResponse(mockData, { fromCache: false });

        } catch (error) {
            console.error(`[DataSUSService] Erro ao consultar indicador: ${error.message}`);
            return this.handleError(error);
        }
    }

    /**
     * Integração com RNDS (placeholder para implementação futura)
     */
    async integrarRNDS(dados) {
        try {
            console.log(`[DataSUSService] Integrando com RNDS (PLACEHOLDER)`);

            // Validação básica
            if (!dados || typeof dados !== 'object') {
                return this.handleError(new Error('Dados para RNDS devem ser um objeto'));
            }

            // Por enquanto, retorna sucesso simulado
            const mockResponse = {
                protocolo: `RNDS${Date.now()}`,
                status: 'enviado',
                timestamp: new Date().toISOString(),
                dados_enviados: Object.keys(dados).length,
                observacao: 'Integração RNDS em desenvolvimento - dados não foram realmente enviados'
            };

            console.log(`[DataSUSService] RNDS integração simulada - protocolo: ${mockResponse.protocolo}`);
            return this.successResponse(mockResponse, { simulated: true });

        } catch (error) {
            console.error(`[DataSUSService] Erro na integração RNDS: ${error.message}`);
            return this.handleError(error);
        }
    }

    /**
     * Gera dados simulados de estabelecimentos baseados em padrões reais
     */
    generateEstabelecimentosData(codigo_municipio) {
        const isCapital = ['3550308', '3304557', '2304400', '5300108'].includes(codigo_municipio);
        
        const baseEstabelecimentos = isCapital ? 
            Math.floor(Math.random() * 500 + 200) : // 200-700 para capitais
            Math.floor(Math.random() * 100 + 20);   // 20-120 para interior

        return {
            codigo_municipio,
            nome_municipio: this.getMunicipioName(codigo_municipio),
            total_estabelecimentos: baseEstabelecimentos,
            estabelecimentos: Array.from({ length: Math.min(baseEstabelecimentos, 50) }, (_, i) => ({
                cnes: `${Math.random().toString().substr(2, 7)}`,
                nome: `Estabelecimento de Saúde ${i + 1}`,
                tipo: this.getRandomTipo(),
                endereco: `Endereço do estabelecimento ${i + 1}`,
                telefone: `(${Math.floor(Math.random() * 90 + 10)}) ${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
                leitos_sus: Math.floor(Math.random() * 100),
                leitos_privados: Math.floor(Math.random() * 50)
            })),
            dados_atualizados_em: new Date().toISOString(),
            fonte: 'DATASUS/CNES',
            observacao: 'Dados simulados baseados em padrões reais'
        };
    }

    /**
     * Gera dados simulados de indicadores
     */
    generateIndicadorData(indicador, filtros) {
        const baseData = {
            indicador,
            filtros,
            data_referencia: new Date().toISOString().split('T')[0],
            fonte: 'DATASUS',
            observacao: 'Dados simulados baseados em padrões reais'
        };

        switch (indicador) {
            case 'ocupacao_hospitalar':
                return {
                    ...baseData,
                    taxa_ocupacao: (Math.random() * 30 + 60).toFixed(1), // 60-90%
                    leitos_disponiveis: Math.floor(Math.random() * 1000 + 500),
                    leitos_ocupados: Math.floor(Math.random() * 800 + 400),
                    internacoes_mes: Math.floor(Math.random() * 2000 + 1000)
                };

            case 'leitos_sus':
                return {
                    ...baseData,
                    total_leitos: Math.floor(Math.random() * 5000 + 2000),
                    leitos_clinicos: Math.floor(Math.random() * 2000 + 1000),
                    leitos_cirurgicos: Math.floor(Math.random() * 1000 + 500),
                    leitos_uti: Math.floor(Math.random() * 200 + 100)
                };

            default:
                return {
                    ...baseData,
                    valor: Math.floor(Math.random() * 1000),
                    unidade: 'unidades'
                };
        }
    }

    getMunicipioName(codigo) {
        const municipios = {
            '3550308': 'São Paulo - SP',
            '3304557': 'Rio de Janeiro - RJ',
            '2304400': 'Fortaleza - CE',
            '5300108': 'Brasília - DF'
        };
        return municipios[codigo] || `Município ${codigo}`;
    }

    getRandomTipo() {
        const tipos = [
            'Hospital Geral',
            'UBS - Unidade Básica de Saúde',
            'UPA - Unidade de Pronto Atendimento',
            'Clínica Especializada',
            'Centro de Saúde',
            'Hospital Especializado'
        ];
        return tipos[Math.floor(Math.random() * tipos.length)];
    }

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

    clearCache() {
        this.cache.clear();
        console.log('[DataSUSService] Cache limpo');
        return { success: true, message: 'Cache limpo com sucesso' };
    }

    async diagnostics() {
        const health = await this.healthCheck();
        const stats = this.getStats();
        const config = this.getConfig();

        return {
            service: 'DATASUS',
            version: '1.0.0',
            health,
            stats,
            config,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = DataSUSService;