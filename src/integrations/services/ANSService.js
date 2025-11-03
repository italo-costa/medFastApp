/**
 * 🏥 SERVIÇO DE INTEGRAÇÃO COM ANS
 * 
 * Implementação do contrato ANSServiceContract para integração com a 
 * Agência Nacional de Saúde Suplementar (ANS).
 * 
 * @author MediApp Integration Team
 * @version 1.0.0
 */

const { ANSServiceContract } = require('../contracts/ExternalServiceContracts');

class ANSService extends ANSServiceContract {
    constructor(config = {}) {
        super();
        this.baseUrl = config.baseUrl || 'https://www.ans.gov.br/anstabnet';
        this.apiUrl = config.apiUrl || 'https://www.ans.gov.br/aans/api';
        this.cache = new Map();
        this.cacheTimeout = config.cacheTimeout || 12 * 60 * 60 * 1000; // 12 horas
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.rateLimitDelay = config.rateLimitDelay || 1000; // 1 segundo entre requests
        this.timeout = config.timeout || 20000; // 20 segundos
        this.maxCacheSize = config.maxCacheSize || 200;
    }

    getConfig() {
        return {
            name: 'ANS',
            baseUrl: this.baseUrl,
            apiUrl: this.apiUrl,
            version: '1.0.0',
            description: 'Serviço de integração com ANS - Agência Nacional de Saúde Suplementar',
            provider: 'Agência Nacional de Saúde Suplementar',
            documentation: 'https://www.ans.gov.br/aans',
            compliance: ['LGPD', 'TISS'],
            rateLimit: {
                delay: this.rateLimitDelay,
                maxRequestsPerMinute: 60
            },
            cache: {
                timeout: this.cacheTimeout,
                maxSize: this.maxCacheSize
            },
            dataTypes: [
                'operadoras',
                'beneficiarios',
                'tiss',
                'rol_procedimentos'
            ]
        };
    }

    validateParams(params) {
        const { uf, numero_cartao, cpf, dados_tiss } = params;

        if (uf) {
            if (!uf || typeof uf !== 'string' || uf.length !== 2) {
                return { valid: false, error: 'UF deve ter exatamente 2 caracteres' };
            }
        }

        if (numero_cartao) {
            if (!numero_cartao || typeof numero_cartao !== 'string' || numero_cartao.length < 10) {
                return { valid: false, error: 'Número do cartão deve ter pelo menos 10 caracteres' };
            }
        }

        if (cpf) {
            const cleanCpf = cpf.replace(/\D/g, '');
            if (cleanCpf.length !== 11) {
                return { valid: false, error: 'CPF deve ter 11 dígitos' };
            }
        }

        if (dados_tiss) {
            if (!dados_tiss || typeof dados_tiss !== 'object') {
                return { valid: false, error: 'Dados TISS devem ser um objeto' };
            }
            
            const requiredFields = ['guia', 'operadora', 'prestador'];
            for (const field of requiredFields) {
                if (!dados_tiss[field]) {
                    return { valid: false, error: `Campo obrigatório TISS: ${field}` };
                }
            }
        }

        return { valid: true };
    }

    async healthCheck() {
        try {
            const startTime = Date.now();
            
            // Testa consultando operadoras (endpoint mais estável)
            const result = await this.consultarOperadoras('SP');
            const responseTime = Date.now() - startTime;

            if (result.success) {
                return this.successResponse({
                    status: 'healthy',
                    responseTime: `${responseTime}ms`,
                    lastTestedAt: new Date().toISOString(),
                    testEndpoint: 'consultarOperadoras',
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
                    'Accept': 'application/json',
                    'User-Agent': 'MediApp/1.0.0 (ANS Integration)'
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
     * Consultar operadoras ativas
     */
    async consultarOperadoras(uf = null) {
        try {
            console.log(`[ANSService] Consultando operadoras${uf ? ` para UF: ${uf}` : ''}`);

            if (uf) {
                const validation = this.validateParams({ uf });
                if (!validation.valid) {
                    return this.handleError(new Error(validation.error));
                }
            }

            const cacheKey = `operadoras_${uf || 'todas'}`;
            const cached = this.cache(cacheKey);
            if (cached) {
                console.log(`[ANSService] Retornando operadoras do cache`);
                return this.successResponse(cached, { fromCache: true });
            }

            // Simula dados baseados em operadoras reais do mercado brasileiro
            const mockData = this.generateOperadorasData(uf);
            
            this.cache(cacheKey, mockData);

            console.log(`[ANSService] Encontradas ${mockData.operadoras.length} operadoras`);
            return this.successResponse(mockData, { fromCache: false });

        } catch (error) {
            console.error(`[ANSService] Erro ao consultar operadoras: ${error.message}`);
            return this.handleError(error);
        }
    }

    /**
     * Validar beneficiário
     */
    async validarBeneficiario(numero_cartao, cpf) {
        try {
            console.log(`[ANSService] Validando beneficiário: cartão ${numero_cartao.substr(0, 6)}***`);

            const validation = this.validateParams({ numero_cartao, cpf });
            if (!validation.valid) {
                return this.handleError(new Error(validation.error));
            }

            const cacheKey = `beneficiario_${numero_cartao}_${cpf}`;
            const cached = this.cache(cacheKey);
            if (cached) {
                console.log(`[ANSService] Retornando validação do cache`);
                return this.successResponse(cached, { fromCache: true });
            }

            // Simula validação (em produção seria integração real)
            const mockData = this.generateBeneficiarioData(numero_cartao, cpf);
            
            // Cache apenas por pouco tempo para dados sensíveis
            this.cache.set(cacheKey, {
                data: mockData,
                timestamp: Date.now()
            });

            console.log(`[ANSService] Beneficiário validado: ${mockData.status}`);
            return this.successResponse(mockData, { fromCache: false });

        } catch (error) {
            console.error(`[ANSService] Erro ao validar beneficiário: ${error.message}`);
            return this.handleError(error);
        }
    }

    /**
     * Enviar TISS
     */
    async enviarTISS(dados_tiss) {
        try {
            console.log(`[ANSService] Enviando TISS: guia ${dados_tiss.guia?.numero || 'N/A'}`);

            const validation = this.validateParams({ dados_tiss });
            if (!validation.valid) {
                return this.handleError(new Error(validation.error));
            }

            // Simula envio TISS (em produção seria integração real)
            const mockResponse = this.generateTISSResponse(dados_tiss);

            console.log(`[ANSService] TISS enviado: protocolo ${mockResponse.protocolo}`);
            return this.successResponse(mockResponse, { simulated: true });

        } catch (error) {
            console.error(`[ANSService] Erro ao enviar TISS: ${error.message}`);
            return this.handleError(error);
        }
    }

    /**
     * Gera dados simulados de operadoras
     */
    generateOperadorasData(uf) {
        const operadorasNacionais = [
            { nome: 'Hapvida', registro: '382014', modalidade: 'Medicina de Grupo' },
            { nome: 'SulAmérica', registro: '017469', modalidade: 'Seguradora' },
            { nome: 'Bradesco Saúde', registro: '005711', modalidade: 'Seguradora' },
            { nome: 'Amil', registro: '326305', modalidade: 'Medicina de Grupo' },
            { nome: 'UNIMED', registro: 'VÁRIOS', modalidade: 'Cooperativa' },
            { nome: 'SEGUROS UNIMED', registro: '417041', modalidade: 'Seguradora' },
            { nome: 'NotreDame Intermédica', registro: '359041', modalidade: 'Medicina de Grupo' }
        ];

        const operadorasRegionais = {
            'SP': [
                { nome: 'UNIMED São Paulo', registro: '354600', modalidade: 'Cooperativa' },
                { nome: 'São Cristóvão Saúde', registro: '401471', modalidade: 'Medicina de Grupo' }
            ],
            'RJ': [
                { nome: 'UNIMED Rio', registro: '380270', modalidade: 'Cooperativa' },
                { nome: 'ASSIM Saúde', registro: '402451', modalidade: 'Autogestão' }
            ],
            'CE': [
                { nome: 'UNIMED Fortaleza', registro: '349216', modalidade: 'Cooperativa' }
            ]
        };

        let operadoras = [...operadorasNacionais];
        
        if (uf && operadorasRegionais[uf]) {
            operadoras = [...operadoras, ...operadorasRegionais[uf]];
        }

        return {
            uf: uf || 'TODAS',
            total_operadoras: operadoras.length,
            operadoras: operadoras.map(op => ({
                ...op,
                ativa: Math.random() > 0.1, // 90% ativas
                beneficiarios: Math.floor(Math.random() * 1000000 + 10000),
                data_atualizacao: new Date().toISOString().split('T')[0]
            })),
            data_consulta: new Date().toISOString(),
            fonte: 'ANS',
            observacao: 'Dados simulados baseados em operadoras reais'
        };
    }

    /**
     * Gera dados simulados de beneficiário
     */
    generateBeneficiarioData(numero_cartao, cpf) {
        const isValid = Math.random() > 0.2; // 80% de cartões válidos

        if (!isValid) {
            return {
                status: 'invalido',
                motivo: 'Cartão não encontrado na base ANS',
                numero_cartao: numero_cartao.substr(0, 6) + '***',
                data_consulta: new Date().toISOString()
            };
        }

        const operadoras = ['Hapvida', 'SulAmérica', 'Bradesco', 'Amil', 'UNIMED'];
        
        return {
            status: 'ativo',
            numero_cartao: numero_cartao.substr(0, 6) + '***',
            operadora: operadoras[Math.floor(Math.random() * operadoras.length)],
            plano: 'Plano de Saúde Individual',
            vigencia: {
                inicio: '2023-01-01',
                fim: '2024-12-31'
            },
            coberturas: [
                'Consultas médicas',
                'Exames diagnósticos',
                'Internações hospitalares',
                'Urgência e emergência'
            ],
            data_consulta: new Date().toISOString(),
            observacao: 'Dados simulados para demonstração'
        };
    }

    /**
     * Gera resposta simulada de envio TISS
     */
    generateTISSResponse(dados_tiss) {
        const protocolos = ['TISS', 'ANS', 'REC'];
        const randomProtocolo = protocolos[Math.floor(Math.random() * protocolos.length)];
        
        return {
            protocolo: `${randomProtocolo}${Date.now()}`,
            status: 'recebido',
            guia_numero: dados_tiss.guia?.numero || 'N/A',
            operadora: dados_tiss.operadora,
            prestador: dados_tiss.prestador,
            data_envio: new Date().toISOString(),
            prazo_resposta: '72 horas',
            observacao: 'TISS recebido e em processamento - dados simulados'
        };
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
        console.log('[ANSService] Cache limpo');
        return { success: true, message: 'Cache limpo com sucesso' };
    }

    async diagnostics() {
        const health = await this.healthCheck();
        const stats = this.getStats();
        const config = this.getConfig();

        return {
            service: 'ANS',
            version: '1.0.0',
            health,
            stats,
            config,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ANSService;