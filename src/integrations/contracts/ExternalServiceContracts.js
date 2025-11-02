/**
 * 🏛️ CONTRATOS DE INTEGRAÇÃO COM ÓRGÃOS EXTERNOS
 * 
 * Define interfaces padronizadas para integração com sistemas governamentais
 * e órgãos de saúde externos, garantindo flexibilidade e manutenibilidade.
 * 
 * @author MediApp Integration Team
 * @version 1.0.0
 */

/**
 * Interface base para todos os serviços de integração externa
 */
class BaseExternalServiceContract {
    constructor() {
        if (this.constructor === BaseExternalServiceContract) {
            throw new Error('Interface BaseExternalServiceContract não pode ser instanciada diretamente');
        }
    }

    /**
     * Configuração do serviço
     * @returns {Object} Configuração básica do serviço
     */
    getConfig() {
        throw new Error('Método getConfig deve ser implementado');
    }

    /**
     * Validação de parâmetros de entrada
     * @param {*} params - Parâmetros a serem validados
     * @returns {Object} {valid: boolean, error?: string, data?: Object}
     */
    validateParams(params) {
        throw new Error('Método validateParams deve ser implementado');
    }

    /**
     * Health check do serviço externo
     * @returns {Promise<Object>} Status de saúde do serviço
     */
    async healthCheck() {
        throw new Error('Método healthCheck deve ser implementado');
    }

    /**
     * Rate limiting - controle de requisições
     * @returns {Promise<void>}
     */
    async rateLimit() {
        throw new Error('Método rateLimit deve ser implementado');
    }

    /**
     * Cache management
     * @param {string} key - Chave do cache
     * @param {*} data - Dados para cache (opcional, para set)
     * @returns {*} Dados do cache ou null
     */
    cache(key, data = undefined) {
        throw new Error('Método cache deve ser implementado');
    }

    /**
     * Tratamento de erro padrão
     * @param {Error} error - Erro capturado
     * @returns {Object} Resposta padronizada de erro
     */
    handleError(error) {
        return {
            success: false,
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            timestamp: new Date().toISOString(),
            service: this.constructor.name
        };
    }

    /**
     * Resposta de sucesso padrão
     * @param {*} data - Dados de resposta
     * @param {Object} metadata - Metadados opcionais
     * @returns {Object} Resposta padronizada de sucesso
     */
    successResponse(data, metadata = {}) {
        return {
            success: true,
            data,
            metadata: {
                timestamp: new Date().toISOString(),
                service: this.constructor.name,
                fromCache: metadata.fromCache || false,
                ...metadata
            }
        };
    }
}

/**
 * Contrato para serviços de endereçamento (ViaCEP, etc.)
 */
class AddressServiceContract extends BaseExternalServiceContract {
    /**
     * Consultar endereço por CEP
     * @param {string} cep - CEP a ser consultado
     * @returns {Promise<Object>} Dados do endereço
     */
    async consultarCep(cep) {
        throw new Error('Método consultarCep deve ser implementado');
    }

    /**
     * Buscar CEP por endereço
     * @param {string} uf - Estado
     * @param {string} cidade - Cidade
     * @param {string} logradouro - Logradouro
     * @returns {Promise<Object>} Lista de CEPs encontrados
     */
    async buscarCepPorEndereco(uf, cidade, logradouro) {
        throw new Error('Método buscarCepPorEndereco deve ser implementado');
    }
}

/**
 * Contrato para serviços SUS (DATASUS, e-SUS, RNDS)
 */
class SUSServiceContract extends BaseExternalServiceContract {
    /**
     * Buscar dados de estabelecimentos de saúde
     * @param {string} codigo_municipio - Código IBGE do município
     * @returns {Promise<Object>} Dados dos estabelecimentos
     */
    async buscarEstabelecimentos(codigo_municipio) {
        throw new Error('Método buscarEstabelecimentos deve ser implementado');
    }

    /**
     * Consultar indicadores de saúde
     * @param {string} indicador - Tipo de indicador
     * @param {Object} filtros - Filtros de busca
     * @returns {Promise<Object>} Dados do indicador
     */
    async consultarIndicadores(indicador, filtros) {
        throw new Error('Método consultarIndicadores deve ser implementado');
    }

    /**
     * Integrar com RNDS
     * @param {Object} dados - Dados para envio
     * @returns {Promise<Object>} Resposta da integração
     */
    async integrarRNDS(dados) {
        throw new Error('Método integrarRNDS deve ser implementado');
    }
}

/**
 * Contrato para serviços ANS (Saúde Suplementar)
 */
class ANSServiceContract extends BaseExternalServiceContract {
    /**
     * Consultar operadoras ativas
     * @param {string} uf - Estado (opcional)
     * @returns {Promise<Object>} Lista de operadoras
     */
    async consultarOperadoras(uf = null) {
        throw new Error('Método consultarOperadoras deve ser implementado');
    }

    /**
     * Validar beneficiário
     * @param {string} numero_cartao - Número do cartão
     * @param {string} cpf - CPF do beneficiário
     * @returns {Promise<Object>} Dados do beneficiário
     */
    async validarBeneficiario(numero_cartao, cpf) {
        throw new Error('Método validarBeneficiario deve ser implementado');
    }

    /**
     * Enviar TISS
     * @param {Object} dados_tiss - Dados no padrão TISS
     * @returns {Promise<Object>} Resposta do envio
     */
    async enviarTISS(dados_tiss) {
        throw new Error('Método enviarTISS deve ser implementado');
    }
}

/**
 * Contrato para serviços CFM (Conselho Federal de Medicina)
 */
class CFMServiceContract extends BaseExternalServiceContract {
    /**
     * Validar CRM
     * @param {string} crm - Número do CRM
     * @param {string} uf - Estado do CRM
     * @returns {Promise<Object>} Dados do médico
     */
    async validarCRM(crm, uf) {
        throw new Error('Método validarCRM deve ser implementado');
    }

    /**
     * Consultar especialidades
     * @returns {Promise<Object>} Lista de especialidades reconhecidas
     */
    async consultarEspecialidades() {
        throw new Error('Método consultarEspecialidades deve ser implementado');
    }
}

/**
 * Contrato para serviços de assinatura digital (ICP-Brasil)
 */
class ICPBrasilServiceContract extends BaseExternalServiceContract {
    /**
     * Validar certificado digital
     * @param {string} certificado - Certificado em base64
     * @returns {Promise<Object>} Dados da validação
     */
    async validarCertificado(certificado) {
        throw new Error('Método validarCertificado deve ser implementado');
    }

    /**
     * Assinar documento
     * @param {string} documento - Documento a ser assinado
     * @param {string} certificado - Certificado para assinatura
     * @returns {Promise<Object>} Documento assinado
     */
    async assinarDocumento(documento, certificado) {
        throw new Error('Método assinarDocumento deve ser implementado');
    }

    /**
     * Verificar assinatura
     * @param {string} documento_assinado - Documento com assinatura
     * @returns {Promise<Object>} Dados da verificação
     */
    async verificarAssinatura(documento_assinado) {
        throw new Error('Método verificarAssinatura deve ser implementado');
    }
}

/**
 * Contrato para serviços FHIR (HL7)
 */
class FHIRServiceContract extends BaseExternalServiceContract {
    /**
     * Buscar recurso FHIR
     * @param {string} tipo - Tipo do recurso (Patient, Practitioner, etc.)
     * @param {string} id - ID do recurso
     * @returns {Promise<Object>} Recurso FHIR
     */
    async buscarRecurso(tipo, id) {
        throw new Error('Método buscarRecurso deve ser implementado');
    }

    /**
     * Criar recurso FHIR
     * @param {string} tipo - Tipo do recurso
     * @param {Object} dados - Dados do recurso
     * @returns {Promise<Object>} Recurso criado
     */
    async criarRecurso(tipo, dados) {
        throw new Error('Método criarRecurso deve ser implementado');
    }

    /**
     * Atualizar recurso FHIR
     * @param {string} tipo - Tipo do recurso
     * @param {string} id - ID do recurso
     * @param {Object} dados - Novos dados
     * @returns {Promise<Object>} Recurso atualizado
     */
    async atualizarRecurso(tipo, id, dados) {
        throw new Error('Método atualizarRecurso deve ser implementado');
    }

    /**
     * Buscar recursos com filtros
     * @param {string} tipo - Tipo do recurso
     * @param {Object} filtros - Filtros de busca
     * @returns {Promise<Object>} Bundle com recursos encontrados
     */
    async buscarRecursos(tipo, filtros) {
        throw new Error('Método buscarRecursos deve ser implementado');
    }
}

/**
 * Factory para criação de serviços de integração
 */
class ExternalServiceFactory {
    static services = new Map();

    /**
     * Registra um serviço
     * @param {string} name - Nome do serviço
     * @param {Function} serviceClass - Classe do serviço
     */
    static register(name, serviceClass) {
        this.services.set(name, serviceClass);
    }

    /**
     * Cria instância de um serviço
     * @param {string} name - Nome do serviço
     * @param {Object} config - Configuração do serviço
     * @returns {Object} Instância do serviço
     */
    static create(name, config = {}) {
        const ServiceClass = this.services.get(name);
        if (!ServiceClass) {
            throw new Error(`Serviço '${name}' não encontrado. Serviços disponíveis: ${Array.from(this.services.keys()).join(', ')}`);
        }
        return new ServiceClass(config);
    }

    /**
     * Lista serviços registrados
     * @returns {Array} Lista de nomes dos serviços
     */
    static list() {
        return Array.from(this.services.keys());
    }
}

module.exports = {
    BaseExternalServiceContract,
    AddressServiceContract,
    SUSServiceContract,
    ANSServiceContract,
    CFMServiceContract,
    ICPBrasilServiceContract,
    FHIRServiceContract,
    ExternalServiceFactory
};