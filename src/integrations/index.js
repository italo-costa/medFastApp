/**
 * 🔗 MÓDULO PRINCIPAL DE INTEGRAÇÃO EXTERNA
 * 
 * Ponto de entrada para todas as integrações com órgãos externos.
 * Exporta interface unificada para uso em toda a aplicação.
 * 
 * @author MediApp Integration Team
 * @version 1.0.0
 */

const ExternalIntegrationAdapter = require('./adapters/ExternalIntegrationAdapter');
const { ExternalServiceFactory } = require('./contracts/ExternalServiceContracts');

// Configurações padrão para produção
const defaultConfig = {
    viacep: {
        baseUrl: 'https://viacep.com.br/ws',
        cacheTimeout: 24 * 60 * 60 * 1000, // 24 horas
        rateLimitDelay: 100,
        timeout: 10000,
        maxCacheSize: 1000
    },
    datasus: {
        baseUrl: 'http://tabnet.datasus.gov.br',
        cnesUrl: 'http://cnes2.datasus.gov.br',
        cacheTimeout: 6 * 60 * 60 * 1000, // 6 horas
        rateLimitDelay: 500,
        timeout: 30000,
        maxCacheSize: 500
    },
    ans: {
        baseUrl: 'https://www.ans.gov.br/anstabnet',
        apiUrl: 'https://www.ans.gov.br/aans/api',
        cacheTimeout: 12 * 60 * 60 * 1000, // 12 horas
        rateLimitDelay: 1000,
        timeout: 20000,
        maxCacheSize: 200
    },
    icpbrasil: {
        validatorUrl: 'https://acraiz.icpbrasil.gov.br',
        timestampUrl: 'http://timestamp.iti.gov.br',
        cacheTimeout: 1 * 60 * 60 * 1000, // 1 hora
        rateLimitDelay: 2000,
        timeout: 15000,
        maxCacheSize: 100
    }
};

/**
 * Classe singleton para gerenciar integração externa
 */
class ExternalIntegrationManager {
    constructor() {
        if (ExternalIntegrationManager.instance) {
            return ExternalIntegrationManager.instance;
        }
        
        this.adapter = null;
        this.isInitialized = false;
        ExternalIntegrationManager.instance = this;
    }

    /**
     * Inicializa o gerenciador com configurações
     */
    initialize(config = {}) {
        if (this.isInitialized) {
            console.warn('[ExternalIntegrationManager] Já foi inicializado');
            return this.adapter;
        }

        const finalConfig = { ...defaultConfig, ...config };
        this.adapter = new ExternalIntegrationAdapter(finalConfig);
        this.isInitialized = true;

        console.log('[ExternalIntegrationManager] Inicializado com sucesso');
        return this.adapter;
    }

    /**
     * Obtém instância do adapter
     */
    getAdapter() {
        if (!this.isInitialized) {
            console.warn('[ExternalIntegrationManager] Inicializando com configurações padrão');
            return this.initialize();
        }
        return this.adapter;
    }

    /**
     * Reinicializa com novas configurações
     */
    reinitialize(config = {}) {
        this.isInitialized = false;
        this.adapter = null;
        return this.initialize(config);
    }
}

// Instância singleton
const integrationManager = new ExternalIntegrationManager();

/**
 * Interface simplificada para uso direto
 */
const ExternalIntegration = {
    // Inicialização
    init: (config) => integrationManager.initialize(config),
    getAdapter: () => integrationManager.getAdapter(),
    
    // Endereçamento
    consultarCep: async (cep) => {
        const adapter = integrationManager.getAdapter();
        return adapter.consultarCep(cep);
    },
    
    buscarCepPorEndereco: async (uf, cidade, logradouro) => {
        const adapter = integrationManager.getAdapter();
        return adapter.buscarCepPorEndereco(uf, cidade, logradouro);
    },
    
    // SUS/DATASUS
    buscarEstabelecimentosSaude: async (codigoMunicipio) => {
        const adapter = integrationManager.getAdapter();
        return adapter.buscarEstabelecimentosSaude(codigoMunicipio);
    },
    
    consultarIndicadoresSaude: async (indicador, filtros = {}) => {
        const adapter = integrationManager.getAdapter();
        return adapter.consultarIndicadoresSaude(indicador, filtros);
    },
    
    integrarRNDS: async (dados) => {
        const adapter = integrationManager.getAdapter();
        return adapter.integrarRNDS(dados);
    },
    
    // ANS
    consultarOperadoras: async (uf = null) => {
        const adapter = integrationManager.getAdapter();
        return adapter.consultarOperadoras(uf);
    },
    
    validarBeneficiario: async (numeroCartao, cpf) => {
        const adapter = integrationManager.getAdapter();
        return adapter.validarBeneficiario(numeroCartao, cpf);
    },
    
    enviarTISS: async (dadosTiss) => {
        const adapter = integrationManager.getAdapter();
        return adapter.enviarTISS(dadosTiss);
    },
    
    // ICP-Brasil
    validarCertificadoDigital: async (certificado) => {
        const adapter = integrationManager.getAdapter();
        return adapter.validarCertificadoDigital(certificado);
    },
    
    assinarDocumento: async (documento, certificado) => {
        const adapter = integrationManager.getAdapter();
        return adapter.assinarDocumento(documento, certificado);
    },
    
    verificarAssinatura: async (documentoAssinado) => {
        const adapter = integrationManager.getAdapter();
        return adapter.verificarAssinatura(documentoAssinado);
    },
    
    // Monitoramento
    healthCheck: async () => {
        const adapter = integrationManager.getAdapter();
        return adapter.healthCheckAll();
    },
    
    diagnostics: async () => {
        const adapter = integrationManager.getAdapter();
        return adapter.diagnosticsAll();
    },
    
    getStats: () => {
        const adapter = integrationManager.getAdapter();
        return adapter.getStats();
    },
    
    clearCache: () => {
        const adapter = integrationManager.getAdapter();
        return adapter.clearAllCaches();
    }
};

// Exportações
module.exports = {
    // Interface principal
    ExternalIntegration,
    
    // Classes para uso avançado
    ExternalIntegrationAdapter,
    ExternalIntegrationManager,
    ExternalServiceFactory,
    
    // Configurações padrão
    defaultConfig,
    
    // Utilitários
    createAdapter: (config) => new ExternalIntegrationAdapter(config),
    createService: (name, config) => ExternalServiceFactory.create(name, config),
    
    // Constantes
    SERVICES: {
        VIACEP: 'viacep',
        DATASUS: 'datasus',
        ANS: 'ans',
        ICP_BRASIL: 'icpbrasil'
    },
    
    STATUS: {
        HEALTHY: 'healthy',
        DEGRADED: 'degraded',
        UNHEALTHY: 'unhealthy'
    }
};