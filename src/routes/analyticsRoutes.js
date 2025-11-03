/**
 * 🚀 ROTAS DE ANALYTICS PARA DADOS EXTERNOS
 * 
 * API endpoints para coleta e análise de dados das integrações externas
 * no backend Express.js do MediApp.
 * 
 * @author MediApp Backend Team
 * @version 1.0.0
 */

const express = require('express');
const { ExternalIntegration } = require('../integrations');
const ExternalDataAnalytics = require('../analytics/ExternalDataAnalytics');

const router = express.Router();
const analytics = new ExternalDataAnalytics();

/**
 * 📊 RELATÓRIO CONSOLIDADO DE ANALYTICS
 */
router.post('/consolidated', async (req, res) => {
    try {
        const {
            incluirSUS = true,
            incluirANS = true,
            incluirViaCEP = false,
            incluirICP = false,
            periodo = '30d',
            municipios = ['355030', '431490', '230440'],
            ufs = ['SP', 'RJ', 'MG'],
            ...filtros
        } = req.body;

        console.log(`[Analytics] Gerando relatório consolidado - Período: ${periodo}`);

        const opcoes = {
            incluirSUS,
            incluirANS,
            incluirViaCEP,
            incluirICP,
            periodo,
            municipios,
            ufs,
            ...filtros
        };

        const relatorio = await analytics.gerarRelatorioConsolidado(opcoes);

        res.json({
            success: true,
            data: relatorio,
            metadata: {
                geradoEm: new Date().toISOString(),
                parametros: opcoes,
                versao: '1.0.0'
            }
        });

    } catch (error) {
        console.error('[Analytics] Erro ao gerar relatório consolidado:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao gerar relatório',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 🏥 ANALYTICS ESPECÍFICOS DO SUS
 */
router.get('/sus/estabelecimentos', async (req, res) => {
    try {
        const { municipios } = req.query;
        const municipiosList = municipios ? municipios.split(',') : ['355030'];

        console.log(`[Analytics SUS] Analisando estabelecimentos: ${municipiosList.join(', ')}`);

        const analise = await analytics.analizarEstabelecimentosSaude(municipiosList);

        res.json({
            success: true,
            data: analise,
            metadata: {
                municipiosAnalisados: municipiosList.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Analytics SUS] Erro ao analisar estabelecimentos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao analisar estabelecimentos SUS'
        });
    }
});

router.post('/sus/indicadores', async (req, res) => {
    try {
        const { 
            indicadores = ['mortalidade_infantil', 'cobertura_vacinal'], 
            filtros = {} 
        } = req.body;

        console.log(`[Analytics SUS] Analisando indicadores: ${indicadores.join(', ')}`);

        const analise = await analytics.analizarIndicadoresSaude(indicadores, filtros);

        res.json({
            success: true,
            data: analise,
            metadata: {
                indicadoresAnalisados: indicadores.length,
                filtros,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Analytics SUS] Erro ao analisar indicadores:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao analisar indicadores de saúde'
        });
    }
});

/**
 * 🩺 ANALYTICS ESPECÍFICOS DA ANS
 */
router.get('/ans/operadoras', async (req, res) => {
    try {
        const { ufs } = req.query;
        const ufsList = ufs ? ufs.split(',') : ['SP', 'RJ'];

        console.log(`[Analytics ANS] Analisando operadoras: ${ufsList.join(', ')}`);

        const analise = await analytics.analizarOperadorasSaude(ufsList);

        res.json({
            success: true,
            data: analise,
            metadata: {
                ufsAnalisadas: ufsList.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Analytics ANS] Erro ao analisar operadoras:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao analisar operadoras ANS'
        });
    }
});

router.get('/ans/tiss/tendencias', async (req, res) => {
    try {
        const { periodo = 30 } = req.query;

        console.log(`[Analytics ANS] Analisando tendências TISS - Período: ${periodo} dias`);

        const analise = await analytics.analizarTendenciasTISS(parseInt(periodo));

        res.json({
            success: true,
            data: analise,
            metadata: {
                periodoAnalisado: `${periodo} dias`,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Analytics ANS] Erro ao analisar tendências TISS:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao analisar tendências TISS'
        });
    }
});

/**
 * 📍 ANALYTICS ESPECÍFICOS DO VIACEP
 */
router.post('/viacep/padroes', async (req, res) => {
    try {
        const { ceps = [] } = req.body;

        if (!Array.isArray(ceps) || ceps.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Lista de CEPs é obrigatória'
            });
        }

        console.log(`[Analytics ViaCEP] Analisando ${ceps.length} CEPs`);

        const analise = await analytics.analizarPadroesEndereco(ceps);

        res.json({
            success: true,
            data: analise,
            metadata: {
                cepsAnalisados: ceps.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Analytics ViaCEP] Erro ao analisar padrões:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao analisar padrões de endereço'
        });
    }
});

/**
 * 🔐 ANALYTICS ESPECÍFICOS DO ICP-BRASIL
 */
router.post('/icp/certificacao', async (req, res) => {
    try {
        const { certificados = [] } = req.body;

        if (!Array.isArray(certificados)) {
            return res.status(400).json({
                success: false,
                error: 'Lista de certificados é obrigatória'
            });
        }

        console.log(`[Analytics ICP] Analisando ${certificados.length} certificados`);

        const analise = await analytics.analizarCertificacaoDigital(certificados);

        res.json({
            success: true,
            data: analise,
            metadata: {
                certificadosAnalisados: certificados.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Analytics ICP] Erro ao analisar certificação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao analisar certificação digital'
        });
    }
});

/**
 * 📊 DASHBOARD DATA - DADOS AGREGADOS PARA DASHBOARD
 */
router.get('/dashboard', async (req, res) => {
    try {
        const { periodo = '7d' } = req.query;

        console.log(`[Analytics Dashboard] Carregando dados - Período: ${periodo}`);

        // Obter estatísticas das integrações
        const statsExternas = ExternalIntegration.getStats();

        // Simular dados do dashboard (em produção, viria do banco)
        const dashboardData = {
            resumo: {
                totalConsultas: statsExternas.totalRequests || 0,
                taxaSucesso: Math.round((statsExternas.successRate || 0.95) * 100),
                tempoMedioResposta: Math.round(statsExternas.averageResponseTime || 450),
                cacheHitRate: Math.round((statsExternas.cacheHitRate || 0.78) * 100)
            },
            utilizacaoServicos: statsExternas.serviceUsage || {
                viacep: 0,
                datasus: 0,
                ans: 0,
                icpbrasil: 0
            },
            tendenciasSemanal: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
                datasets: [
                    {
                        label: 'Consultas',
                        data: [120, 150, 180, 200, 170, 90, 60],
                        backgroundColor: 'rgba(54, 162, 235, 0.6)'
                    }
                ]
            },
            alertasAtivos: [
                {
                    tipo: 'performance',
                    titulo: 'Latência elevada no DATASUS',
                    descricao: 'Tempo de resposta acima de 2s nos últimos 30 minutos',
                    severidade: 'warning',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
                }
            ]
        };

        res.json({
            success: true,
            data: dashboardData,
            metadata: {
                periodo,
                atualizadoEm: new Date().toISOString(),
                versao: '1.0.0'
            }
        });

    } catch (error) {
        console.error('[Analytics Dashboard] Erro ao carregar dados:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao carregar dados do dashboard'
        });
    }
});

/**
 * 🔍 BUSCA E FILTROS AVANÇADOS
 */
router.post('/search', async (req, res) => {
    try {
        const {
            servico,
            filtros = {},
            periodo = '30d',
            limit = 100,
            offset = 0
        } = req.body;

        console.log(`[Analytics Search] Busca em ${servico} com filtros:`, filtros);

        let resultados = [];

        switch (servico) {
            case 'sus':
                if (filtros.municipios) {
                    const analise = await analytics.analizarEstabelecimentosSaude(filtros.municipios);
                    resultados = Object.entries(analise.tiposUnidade).map(([tipo, quantidade]) => ({
                        tipo: 'estabelecimento',
                        categoria: tipo,
                        quantidade,
                        detalhes: { fonte: 'DATASUS' }
                    }));
                }
                break;

            case 'ans':
                if (filtros.ufs) {
                    const analise = await analytics.analizarOperadorasSaude(filtros.ufs);
                    resultados = Object.entries(analise.porModalidade).map(([modalidade, quantidade]) => ({
                        tipo: 'operadora',
                        categoria: modalidade,
                        quantidade,
                        detalhes: { fonte: 'ANS' }
                    }));
                }
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Serviço não suportado para busca'
                });
        }

        // Aplicar paginação
        const total = resultados.length;
        const paginados = resultados.slice(offset, offset + limit);

        res.json({
            success: true,
            data: paginados,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            },
            metadata: {
                servico,
                filtros,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Analytics Search] Erro na busca:', error);
        res.status(500).json({
            success: false,
            error: 'Erro na busca de dados'
        });
    }
});

/**
 * �️ ROTAS ESPECÍFICAS PARA MAPAS GEOGRÁFICOS
 */
router.get('/maps/establishments', async (req, res) => {
    try {
        const { municipios, incluirCoordenadas = true } = req.query;
        const municipiosList = municipios ? municipios.split(',') : ['355030'];

        console.log(`[Analytics Maps] Carregando estabelecimentos para mapa: ${municipiosList.join(', ')}`);

        const analise = await analytics.analizarEstabelecimentosSaude(municipiosList);
        
        // Adicionar coordenadas geográficas para plotting
        const estabelecimentosComCoordenadas = analise.tiposUnidade;
        
        if (incluirCoordenadas) {
            // Gerar coordenadas baseadas nos dados reais
            const coordenadas = await analytics.gerarCoordenadasEstabelecimentos(municipiosList);
            
            res.json({
                success: true,
                data: {
                    ...analise,
                    coordenadas,
                    mapConfig: {
                        center: [-14.2350, -51.9253],
                        zoom: 5,
                        type: 'markers',
                        editMode: true
                    }
                },
                metadata: {
                    municipiosAnalisados: municipiosList.length,
                    totalCoordenadas: coordenadas.length,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.json({
                success: true,
                data: analise,
                metadata: {
                    municipiosAnalisados: municipiosList.length,
                    timestamp: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        console.error('[Analytics Maps] Erro ao carregar estabelecimentos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao carregar dados do mapa de estabelecimentos'
        });
    }
});

router.post('/maps/marker/update', async (req, res) => {
    try {
        const { markerId, position, data } = req.body;

        if (!markerId || !position) {
            return res.status(400).json({
                success: false,
                error: 'markerId e position são obrigatórios'
            });
        }

        console.log(`[Analytics Maps] Atualizando marker ${markerId}:`, position);

        // Em produção, salvar no banco de dados
        const updatedMarker = {
            id: markerId,
            position,
            data,
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: updatedMarker,
            message: 'Marker atualizado com sucesso'
        });

    } catch (error) {
        console.error('[Analytics Maps] Erro ao atualizar marker:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar marker'
        });
    }
});

router.post('/maps/marker/create', async (req, res) => {
    try {
        const { position, title, description, category, data } = req.body;

        if (!position || !title) {
            return res.status(400).json({
                success: false,
                error: 'position e title são obrigatórios'
            });
        }

        console.log(`[Analytics Maps] Criando novo marker:`, { position, title, category });

        const newMarker = {
            id: `marker_${Date.now()}`,
            position,
            title,
            description: description || 'Estabelecimento adicionado pelo usuário',
            category: category || 'clinica',
            color: '#2ecc71',
            icon: '🏢',
            data: data || {},
            createdAt: new Date().toISOString(),
            editavel: true
        };

        res.json({
            success: true,
            data: newMarker,
            message: 'Marker criado com sucesso'
        });

    } catch (error) {
        console.error('[Analytics Maps] Erro ao criar marker:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao criar marker'
        });
    }
});

router.delete('/maps/marker/:markerId', async (req, res) => {
    try {
        const { markerId } = req.params;

        console.log(`[Analytics Maps] Removendo marker ${markerId}`);

        // Em produção, remover do banco de dados
        res.json({
            success: true,
            message: 'Marker removido com sucesso'
        });

    } catch (error) {
        console.error('[Analytics Maps] Erro ao remover marker:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao remover marker'
        });
    }
});

router.get('/maps/heatmap/:tipo', async (req, res) => {
    try {
        const { tipo } = req.params;
        const { intensidade = 0.5 } = req.query;

        console.log(`[Analytics Maps] Gerando heatmap ${tipo} com intensidade ${intensidade}`);

        let heatmapData = [];

        switch (tipo) {
            case 'estabelecimentos':
                heatmapData = await analytics.gerarHeatmapEstabelecimentos();
                break;
            case 'consultas':
                heatmapData = await analytics.gerarHeatmapConsultas();
                break;
            case 'operadoras':
                heatmapData = await analytics.gerarHeatmapOperadoras();
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de heatmap não suportado'
                });
        }

        // Aplicar intensidade
        const heatmapAjustado = heatmapData.map(point => ({
            ...point,
            weight: point.weight * parseFloat(intensidade)
        }));

        res.json({
            success: true,
            data: heatmapAjustado,
            config: {
                type: 'heatmap',
                center: [-14.2350, -51.9253],
                zoom: 5,
                intensidade: parseFloat(intensidade)
            },
            metadata: {
                tipo,
                pontos: heatmapAjustado.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Analytics Maps] Erro ao gerar heatmap:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar dados do heatmap'
        });
    }
});

router.get('/maps/regions/:tipo', async (req, res) => {
    try {
        const { tipo } = req.params;
        const { ufs } = req.query;

        console.log(`[Analytics Maps] Carregando dados regionais ${tipo}`);

        let regionData = {};

        switch (tipo) {
            case 'operadoras':
                const ufsList = ufs ? ufs.split(',') : ['SP', 'RJ', 'MG'];
                const analiseOperadoras = await analytics.analizarOperadorasSaude(ufsList);
                regionData = await analytics.gerarRegioesOperadoras(analiseOperadoras);
                break;
            case 'sus':
                regionData = await analytics.gerarRegioesSUS();
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de região não suportado'
                });
        }

        res.json({
            success: true,
            data: regionData,
            config: {
                type: 'regions',
                center: [-14.2350, -51.9253],
                zoom: 5
            },
            metadata: {
                tipo,
                regioes: Object.keys(regionData).length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Analytics Maps] Erro ao carregar dados regionais:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao carregar dados regionais'
        });
    }
});

/**
 * �📈 EXPORTAÇÃO DE RELATÓRIOS
 */
router.post('/export', async (req, res) => {
    try {
        const {
            tipo = 'pdf',
            dados,
            formato = 'completo'
        } = req.body;

        console.log(`[Analytics Export] Exportando relatório em ${tipo}`);

        // Em produção, implementar geração real de PDF/Excel
        const mockExport = {
            url: `/downloads/relatorio-analytics-${Date.now()}.${tipo}`,
            tamanho: '2.5MB',
            geradoEm: new Date().toISOString(),
            formato,
            expiresEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
        };

        res.json({
            success: true,
            data: mockExport,
            message: `Relatório ${tipo.toUpperCase()} gerado com sucesso`
        });

    } catch (error) {
        console.error('[Analytics Export] Erro na exportação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao exportar relatório'
        });
    }
});

/**
 * 🔄 HEALTH CHECK DAS INTEGRAÇÕES
 */
router.get('/health', async (req, res) => {
    try {
        console.log('[Analytics Health] Verificando saúde das integrações');

        const health = await ExternalIntegration.healthCheck();
        const stats = ExternalIntegration.getStats();

        const statusGeral = Object.values(health).every(s => s.status === 'healthy') 
            ? 'healthy' 
            : Object.values(health).some(s => s.status === 'healthy')
            ? 'degraded'
            : 'unhealthy';

        res.status(statusGeral === 'unhealthy' ? 503 : 200).json({
            status: statusGeral,
            services: health,
            statistics: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Analytics Health] Erro no health check:', error);
        res.status(500).json({
            status: 'error',
            error: 'Erro ao verificar saúde das integrações'
        });
    }
});

module.exports = router;