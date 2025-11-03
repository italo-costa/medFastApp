/**
 * 🔗 ADAPTADOR DE INTEGRAÇÃO EXTERNA
 * 
 * Classe principal que gerencia e orquestra todas as integrações com
 * órgãos externos. Fornece interface unificada para o sistema.
 * 
 * @author MediApp Integration Team
 * @version 1.0.0
 */

const { ExternalServiceFactory } = require('../contracts/ExternalServiceContracts');

// Importar todos os serviços disponíveis
const ViaCepService = require('../services/ViaCepService');
const DataSUSService = require('../services/DataSUSService');
const ANSService = require('../services/ANSService');
const ICPBrasilService = require('../services/ICPBrasilService');

class ExternalIntegrationAdapter {
    constructor(config = {}) {
        this.config = config;
        this.services = new Map();
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            startTime: Date.now()
        };
        
        this.initializeServices();
    }

    /**
     * Inicializa todos os serviços disponíveis
     */
    initializeServices() {
        // Registra serviços na factory
        ExternalServiceFactory.register('viacep', ViaCepService);
        ExternalServiceFactory.register('datasus', DataSUSService);
        ExternalServiceFactory.register('ans', ANSService);
        ExternalServiceFactory.register('icpbrasil', ICPBrasilService);

        // Cria instâncias dos serviços
        this.services.set('viacep', new ViaCepService(this.config.viacep || {}));
        this.services.set('datasus', new DataSUSService(this.config.datasus || {}));
        this.services.set('ans', new ANSService(this.config.ans || {}));
        this.services.set('icpbrasil', new ICPBrasilService(this.config.icpbrasil || {}));

        console.log(`[ExternalIntegrationAdapter] Inicializados ${this.services.size} serviços de integração`);
    }

    /**
     * Obtém instância de um serviço
     */
    getService(serviceName) {
        const service = this.services.get(serviceName.toLowerCase());
        if (!service) {
            throw new Error(`Serviço '${serviceName}' não encontrado. Disponíveis: ${Array.from(this.services.keys()).join(', ')}`);
        }
        return service;
    }

    /**
     * Lista todos os serviços disponíveis
     */
    listServices() {
        return Array.from(this.services.keys());
    }

    /**
     * Executa método em um serviço com tracking de estatísticas
     */
    async executeServiceMethod(serviceName, methodName, ...args) {
        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            const service = this.getService(serviceName);
            
            if (typeof service[methodName] !== 'function') {
                throw new Error(`Método '${methodName}' não encontrado no serviço '${serviceName}'`);
            }

            const result = await service[methodName](...args);
            
            if (result.success) {
                this.stats.successfulRequests++;
            } else {
                this.stats.failedRequests++;
            }

            // Adiciona metadados de rastreamento
            result.metadata = {
                ...result.metadata,
                service: serviceName,
                method: methodName,
                executionTime: Date.now() - startTime,
                requestId: `${serviceName}_${methodName}_${Date.now()}`
            };

            return result;

        } catch (error) {
            this.stats.failedRequests++;
            
            return {
                success: false,
                error: error.message,
                code: 'ADAPTER_ERROR',
                metadata: {
                    service: serviceName,
                    method: methodName,
                    executionTime: Date.now() - startTime,
                    requestId: `${serviceName}_${methodName}_${Date.now()}`
                }
            };
        }
    }

    // ========== MÉTODOS DE ENDEREÇAMENTO ==========

    /**
     * Consultar CEP via ViaCEP
     */
    async consultarCep(cep) {
        return this.executeServiceMethod('viacep', 'consultarCep', cep);
    }

    /**
     * Buscar CEP por endereço via ViaCEP
     */
    async buscarCepPorEndereco(uf, cidade, logradouro) {
        return this.executeServiceMethod('viacep', 'buscarCepPorEndereco', uf, cidade, logradouro);
    }

    // ========== MÉTODOS SUS/DATASUS ==========

    /**
     * Buscar estabelecimentos de saúde
     */
    async buscarEstabelecimentosSaude(codigoMunicipio) {
        return this.executeServiceMethod('datasus', 'buscarEstabelecimentos', codigoMunicipio);
    }

    /**
     * Consultar indicadores de saúde
     */
    async consultarIndicadoresSaude(indicador, filtros = {}) {
        return this.executeServiceMethod('datasus', 'consultarIndicadores', indicador, filtros);
    }

    /**
     * Integrar com RNDS (placeholder)
     */
    async integrarRNDS(dados) {
        return this.executeServiceMethod('datasus', 'integrarRNDS', dados);
    }

    // ========== MÉTODOS ANS ==========

    /**
     * Consultar operadoras de saúde
     */
    async consultarOperadoras(uf = null) {
        return this.executeServiceMethod('ans', 'consultarOperadoras', uf);
    }

    /**
     * Validar beneficiário de plano
     */
    async validarBeneficiario(numeroCartao, cpf) {
        return this.executeServiceMethod('ans', 'validarBeneficiario', numeroCartao, cpf);
    }

    /**
     * Enviar dados TISS
     */
    async enviarTISS(dadosTiss) {
        return this.executeServiceMethod('ans', 'enviarTISS', dadosTiss);
    }

    // ========== MÉTODOS ICP-BRASIL ==========

    /**
     * Validar certificado digital
     */
    async validarCertificadoDigital(certificado) {
        return this.executeServiceMethod('icpbrasil', 'validarCertificado', certificado);
    }

    /**
     * Assinar documento digitalmente
     */
    async assinarDocumento(documento, certificado) {
        return this.executeServiceMethod('icpbrasil', 'assinarDocumento', documento, certificado);
    }

    /**
     * Verificar assinatura digital
     */
    async verificarAssinatura(documentoAssinado) {
        return this.executeServiceMethod('icpbrasil', 'verificarAssinatura', documentoAssinado);
    }

    // ========== MÉTODOS DE MONITORAMENTO ==========

    /**
     * Health check de todos os serviços
     */
    async healthCheckAll() {
        const results = {};
        
        for (const [serviceName, service] of this.services) {
            try {
                results[serviceName] = await service.healthCheck();
            } catch (error) {
                results[serviceName] = {
                    success: false,
                    status: 'error',
                    error: error.message
                };
            }
        }

        const healthyServices = Object.values(results).filter(r => r.success).length;
        const totalServices = Object.keys(results).length;

        return {
            success: healthyServices > 0,
            overall_status: healthyServices === totalServices ? 'healthy' : 
                           healthyServices > 0 ? 'degraded' : 'unhealthy',
            healthy_services: healthyServices,
            total_services: totalServices,
            services: results,
            adapter_stats: this.getStats(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Diagnóstico completo de todos os serviços
     */
    async diagnosticsAll() {
        const results = {};
        
        for (const [serviceName, service] of this.services) {
            try {
                if (typeof service.diagnostics === 'function') {
                    results[serviceName] = await service.diagnostics();
                } else {
                    results[serviceName] = {
                        service: serviceName,
                        status: 'no_diagnostics_available',
                        config: service.getConfig ? service.getConfig() : 'no_config_available'
                    };
                }
            } catch (error) {
                results[serviceName] = {
                    service: serviceName,
                    status: 'error',
                    error: error.message
                };
            }
        }

        return {
            adapter: {
                version: '1.0.0',
                stats: this.getStats(),
                config: this.config
            },
            services: results,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Estatísticas do adapter
     */
    getStats() {
        const uptime = Date.now() - this.stats.startTime;
        const successRate = this.stats.totalRequests > 0 ? 
            (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) : 0;

        return {
            uptime: uptime,
            uptimeFormatted: this.formatUptime(uptime),
            totalRequests: this.stats.totalRequests,
            successfulRequests: this.stats.successfulRequests,
            failedRequests: this.stats.failedRequests,
            successRate: `${successRate}%`,
            servicesCount: this.services.size,
            servicesAvailable: this.listServices()
        };
    }

    /**
     * Formata tempo de uptime
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Limpar cache de todos os serviços
     */
    clearAllCaches() {
        const results = {};
        
        for (const [serviceName, service] of this.services) {
            try {
                if (typeof service.clearCache === 'function') {
                    results[serviceName] = service.clearCache();
                } else {
                    results[serviceName] = { success: false, message: 'Cache não suportado' };
                }
            } catch (error) {
                results[serviceName] = { success: false, error: error.message };
            }
        }

        return {
            success: true,
            message: 'Cache de todos os serviços processado',
            results,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Configurar um serviço específico
     */
    configureService(serviceName, newConfig) {
        const service = this.getService(serviceName);
        
        if (typeof service.configure === 'function') {
            return service.configure(newConfig);
        }
        
        // Se não tem método configure, recria o serviço
        const ServiceClass = this.services.get(serviceName).constructor;
        this.services.set(serviceName, new ServiceClass(newConfig));
        
        return {
            success: true,
            message: `Serviço '${serviceName}' reconfigurado`,
            config: newConfig
        };
    }

    /**
     * Recarregar todos os serviços
     */
    reloadServices() {
        const oldServicesCount = this.services.size;
        this.services.clear();
        this.initializeServices();
        
        return {
            success: true,
            message: 'Todos os serviços foram recarregados',
            oldCount: oldServicesCount,
            newCount: this.services.size,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ExternalIntegrationAdapter;