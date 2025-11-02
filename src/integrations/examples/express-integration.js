/**
 * 🚀 EXEMPLO DE INTEGRAÇÃO COM EXPRESS.JS
 * 
 * Demonstra como integrar o sistema de integração externa
 * com uma aplicação Express.js existente.
 * 
 * @author MediApp Integration Team
 * @version 1.0.0
 */

const express = require('express');
const { ExternalIntegration } = require('../index');

const app = express();
app.use(express.json());

// Inicializar sistema de integrações na inicialização do servidor
ExternalIntegration.init({
    viacep: {
        cacheTimeout: 24 * 60 * 60 * 1000, // 24 horas
        rateLimitDelay: 100
    },
    datasus: {
        cacheTimeout: 6 * 60 * 60 * 1000, // 6 horas
        rateLimitDelay: 500
    },
    ans: {
        cacheTimeout: 12 * 60 * 60 * 1000, // 12 horas
        rateLimitDelay: 1000
    },
    icpbrasil: {
        cacheTimeout: 1 * 60 * 60 * 1000, // 1 hora
        rateLimitDelay: 2000
    }
});

/**
 * 🏥 MIDDLEWARE DE MONITORAMENTO
 */
app.use('/api/external', (req, res, next) => {
    req.startTime = Date.now();
    next();
});

app.use('/api/external', (req, res, next) => {
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        console.log(`[External API] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

/**
 * 📍 ROTAS DE ENDEREÇAMENTO (ViaCEP)
 */

// Consultar CEP específico
app.get('/api/external/cep/:cep', async (req, res) => {
    try {
        const { cep } = req.params;
        
        // Validação básica
        if (!/^\d{5}-?\d{3}$/.test(cep)) {
            return res.status(400).json({
                error: 'CEP inválido',
                message: 'O CEP deve ter o formato 12345-678 ou 12345678'
            });
        }
        
        const endereco = await ExternalIntegration.consultarCep(cep);
        
        res.json({
            success: true,
            data: endereco,
            source: 'viacep',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na consulta de CEP:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'CEP_CONSULTATION_ERROR'
        });
    }
});

// Buscar CEPs por endereço
app.get('/api/external/cep', async (req, res) => {
    try {
        const { uf, cidade, logradouro } = req.query;
        
        if (!uf || !cidade || !logradouro) {
            return res.status(400).json({
                error: 'Parâmetros obrigatórios',
                message: 'Informe uf, cidade e logradouro'
            });
        }
        
        const ceps = await ExternalIntegration.buscarCepPorEndereco(uf, cidade, logradouro);
        
        res.json({
            success: true,
            data: ceps,
            count: ceps.length,
            source: 'viacep',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na busca de CEPs:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'CEP_SEARCH_ERROR'
        });
    }
});

/**
 * 🏥 ROTAS SUS/DATASUS
 */

// Buscar estabelecimentos de saúde
app.get('/api/external/sus/estabelecimentos/:municipio', async (req, res) => {
    try {
        const { municipio } = req.params;
        const { tipo, especialidade } = req.query;
        
        const estabelecimentos = await ExternalIntegration.buscarEstabelecimentosSaude(municipio);
        
        // Aplicar filtros se fornecidos
        let resultado = estabelecimentos;
        
        if (tipo) {
            resultado = resultado.filter(est => 
                est.tipoUnidade.toLowerCase().includes(tipo.toLowerCase())
            );
        }
        
        if (especialidade) {
            resultado = resultado.filter(est => 
                est.especialidades && est.especialidades.some(esp => 
                    esp.toLowerCase().includes(especialidade.toLowerCase())
                )
            );
        }
        
        res.json({
            success: true,
            data: resultado,
            count: resultado.length,
            filters: { tipo, especialidade },
            source: 'datasus',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na busca de estabelecimentos:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'SUS_ESTABLISHMENTS_ERROR'
        });
    }
});

// Consultar indicadores de saúde
app.get('/api/external/sus/indicadores/:indicador', async (req, res) => {
    try {
        const { indicador } = req.params;
        const filtros = req.query;
        
        const resultado = await ExternalIntegration.consultarIndicadoresSaude(indicador, filtros);
        
        res.json({
            success: true,
            data: resultado,
            filters: filtros,
            source: 'datasus',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na consulta de indicadores:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'SUS_INDICATORS_ERROR'
        });
    }
});

// Integração com RNDS
app.post('/api/external/sus/rnds', async (req, res) => {
    try {
        const dadosRNDS = req.body;
        
        // Validação básica
        if (!dadosRNDS.paciente || !dadosRNDS.procedimento) {
            return res.status(400).json({
                error: 'Dados obrigatórios',
                message: 'Informe paciente e procedimento'
            });
        }
        
        const resultado = await ExternalIntegration.integrarRNDS(dadosRNDS);
        
        res.json({
            success: true,
            data: resultado,
            source: 'rnds',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na integração RNDS:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'RNDS_INTEGRATION_ERROR'
        });
    }
});

/**
 * 🩺 ROTAS ANS
 */

// Consultar operadoras de saúde
app.get('/api/external/ans/operadoras', async (req, res) => {
    try {
        const { uf } = req.query;
        
        const operadoras = await ExternalIntegration.consultarOperadoras(uf);
        
        res.json({
            success: true,
            data: operadoras,
            count: operadoras.length,
            filter: { uf },
            source: 'ans',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na consulta de operadoras:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'ANS_OPERATORS_ERROR'
        });
    }
});

// Validar beneficiário
app.post('/api/external/ans/beneficiario/validar', async (req, res) => {
    try {
        const { numeroCartao, cpf } = req.body;
        
        if (!numeroCartao || !cpf) {
            return res.status(400).json({
                error: 'Dados obrigatórios',
                message: 'Informe numeroCartao e cpf'
            });
        }
        
        const beneficiario = await ExternalIntegration.validarBeneficiario(numeroCartao, cpf);
        
        res.json({
            success: true,
            data: beneficiario,
            source: 'ans',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na validação de beneficiário:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'ANS_BENEFICIARY_ERROR'
        });
    }
});

// Enviar dados TISS
app.post('/api/external/ans/tiss', async (req, res) => {
    try {
        const dadosTiss = req.body;
        
        // Validação básica
        if (!dadosTiss.operadora || !dadosTiss.prestador || !dadosTiss.procedimentos) {
            return res.status(400).json({
                error: 'Dados obrigatórios',
                message: 'Informe operadora, prestador e procedimentos'
            });
        }
        
        const resultado = await ExternalIntegration.enviarTISS(dadosTiss);
        
        res.json({
            success: true,
            data: resultado,
            source: 'tiss',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro no envio TISS:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'TISS_SUBMISSION_ERROR'
        });
    }
});

/**
 * 🔐 ROTAS ICP-BRASIL
 */

// Validar certificado digital
app.post('/api/external/icp/certificado/validar', async (req, res) => {
    try {
        const { certificado } = req.body;
        
        if (!certificado) {
            return res.status(400).json({
                error: 'Certificado obrigatório',
                message: 'Informe o certificado em formato PEM ou Base64'
            });
        }
        
        const validacao = await ExternalIntegration.validarCertificadoDigital(certificado);
        
        res.json({
            success: true,
            data: validacao,
            source: 'icp-brasil',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na validação de certificado:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'CERTIFICATE_VALIDATION_ERROR'
        });
    }
});

// Assinar documento
app.post('/api/external/icp/documento/assinar', async (req, res) => {
    try {
        const { documento, certificado } = req.body;
        
        if (!documento || !certificado) {
            return res.status(400).json({
                error: 'Dados obrigatórios',
                message: 'Informe documento e certificado'
            });
        }
        
        const documentoAssinado = await ExternalIntegration.assinarDocumento(documento, certificado);
        
        res.json({
            success: true,
            data: documentoAssinado,
            source: 'icp-brasil',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na assinatura de documento:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'DOCUMENT_SIGNING_ERROR'
        });
    }
});

// Verificar assinatura
app.post('/api/external/icp/assinatura/verificar', async (req, res) => {
    try {
        const documentoAssinado = req.body;
        
        if (!documentoAssinado.documentoOriginal || !documentoAssinado.assinatura) {
            return res.status(400).json({
                error: 'Dados obrigatórios',
                message: 'Informe documentoOriginal e assinatura'
            });
        }
        
        const verificacao = await ExternalIntegration.verificarAssinatura(documentoAssinado);
        
        res.json({
            success: true,
            data: verificacao,
            source: 'icp-brasil',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na verificação de assinatura:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'SIGNATURE_VERIFICATION_ERROR'
        });
    }
});

/**
 * 🔍 ROTAS DE MONITORAMENTO
 */

// Health check de todos os serviços
app.get('/api/external/health', async (req, res) => {
    try {
        const health = await ExternalIntegration.healthCheck();
        
        const overallStatus = Object.values(health).every(service => 
            service.status === 'healthy'
        ) ? 'healthy' : Object.values(health).some(service => 
            service.status === 'healthy'
        ) ? 'degraded' : 'unhealthy';
        
        res.status(overallStatus === 'unhealthy' ? 503 : 200).json({
            status: overallStatus,
            services: health,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro no health check:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Diagnósticos detalhados
app.get('/api/external/diagnostics', async (req, res) => {
    try {
        const diagnostics = await ExternalIntegration.diagnostics();
        
        res.json({
            success: true,
            data: diagnostics,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro nos diagnósticos:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: 'DIAGNOSTICS_ERROR'
        });
    }
});

// Estatísticas de uso
app.get('/api/external/stats', (req, res) => {
    try {
        const stats = ExternalIntegration.getStats();
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro nas estatísticas:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: 'STATS_ERROR'
        });
    }
});

// Limpar cache
app.post('/api/external/cache/clear', (req, res) => {
    try {
        ExternalIntegration.clearCache();
        
        res.json({
            success: true,
            message: 'Cache limpo com sucesso',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na limpeza de cache:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: 'CACHE_CLEAR_ERROR'
        });
    }
});

/**
 * 🚨 MIDDLEWARE DE TRATAMENTO DE ERROS
 */
app.use('/api/external', (error, req, res, next) => {
    console.error('Erro não tratado na API externa:', error);
    
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
    });
});

/**
 * 📊 ROTA DE INFORMAÇÕES DA API
 */
app.get('/api/external', (req, res) => {
    res.json({
        name: 'MediApp External Integration API',
        version: '1.0.0',
        description: 'API para integração com órgãos e sistemas externos',
        services: ['ViaCEP', 'DATASUS', 'ANS', 'ICP-Brasil'],
        endpoints: {
            viacep: [
                'GET /api/external/cep/:cep',
                'GET /api/external/cep?uf=:uf&cidade=:cidade&logradouro=:logradouro'
            ],
            datasus: [
                'GET /api/external/sus/estabelecimentos/:municipio',
                'GET /api/external/sus/indicadores/:indicador',
                'POST /api/external/sus/rnds'
            ],
            ans: [
                'GET /api/external/ans/operadoras',
                'POST /api/external/ans/beneficiario/validar',
                'POST /api/external/ans/tiss'
            ],
            icpbrasil: [
                'POST /api/external/icp/certificado/validar',
                'POST /api/external/icp/documento/assinar',
                'POST /api/external/icp/assinatura/verificar'
            ],
            monitoring: [
                'GET /api/external/health',
                'GET /api/external/diagnostics',
                'GET /api/external/stats',
                'POST /api/external/cache/clear'
            ]
        },
        docs: 'https://github.com/mediapp/integration-docs',
        timestamp: new Date().toISOString()
    });
});

module.exports = app;

// Exemplo de uso para inicializar o servidor
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    
    app.listen(PORT, () => {
        console.log(`🚀 Servidor MediApp External Integration iniciado na porta ${PORT}`);
        console.log(`📋 Health Check: http://localhost:${PORT}/api/external/health`);
        console.log(`📊 Estatísticas: http://localhost:${PORT}/api/external/stats`);
        console.log(`📖 Documentação: http://localhost:${PORT}/api/external`);
    });
}