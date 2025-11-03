/**
 * 📊 SISTEMA DE ANALYTICS PARA DADOS EXTERNOS
 * 
 * Coleta, processa e visualiza dados das integrações externas
 * para gerar insights e relatórios para o MediApp.
 * 
 * @author MediApp Analytics Team
 * @version 1.0.0
 */

const { ExternalIntegration } = require('../integrations');

class ExternalDataAnalytics {
    constructor() {
        this.cache = new Map();
        this.historicalData = [];
        this.metrics = {
            sus: {
                estabelecimentosPorTipo: {},
                indicadoresSaude: {},
                coberturaPorRegiao: {}
            },
            ans: {
                operadorasPorUF: {},
                beneficiariosPorOperadora: {},
                procedimentosTISS: {}
            },
            viacep: {
                consultas: {},
                regioesMaisConsultadas: {}
            },
            icp: {
                certificadosValidados: 0,
                documentosAssinados: 0,
                taxaValidacao: 0
            }
        };
    }

    /**
     * 🏥 ANALYTICS SUS/DATASUS
     */
    async analizarEstabelecimentosSaude(municipios = []) {
        const resultados = {
            totalEstabelecimentos: 0,
            tiposUnidade: {},
            distribuicaoGeografica: {},
            especialidades: {},
            capacidadeAtendimento: {},
            tendencias: []
        };

        for (const municipio of municipios) {
            try {
                const estabelecimentos = await ExternalIntegration.buscarEstabelecimentosSaude(municipio);
                
                resultados.totalEstabelecimentos += estabelecimentos.length;
                
                // Análise por tipo de unidade
                estabelecimentos.forEach(est => {
                    const tipo = est.tipoUnidade;
                    resultados.tiposUnidade[tipo] = (resultados.tiposUnidade[tipo] || 0) + 1;
                    
                    // Distribuição geográfica
                    const regiao = est.endereco?.uf || 'N/A';
                    resultados.distribuicaoGeografica[regiao] = 
                        (resultados.distribuicaoGeografica[regiao] || 0) + 1;
                    
                    // Especialidades
                    if (est.especialidades) {
                        est.especialidades.forEach(esp => {
                            resultados.especialidades[esp] = 
                                (resultados.especialidades[esp] || 0) + 1;
                        });
                    }
                    
                    // Capacidade de atendimento
                    if (est.leitos) {
                        const faixaLeitos = this.categorizarLeitos(est.leitos);
                        resultados.capacidadeAtendimento[faixaLeitos] = 
                            (resultados.capacidadeAtendimento[faixaLeitos] || 0) + 1;
                    }
                });
                
            } catch (error) {
                console.warn(`Erro ao analisar município ${municipio}:`, error.message);
            }
        }

        // Calcular insights
        resultados.insights = this.gerarInsightsSUS(resultados);
        
        return resultados;
    }

    async analizarIndicadoresSaude(indicadores, filtros = {}) {
        const analise = {
            indicadores: {},
            comparativos: {},
            tendencias: {},
            alertas: []
        };

        for (const indicador of indicadores) {
            try {
                const dados = await ExternalIntegration.consultarIndicadoresSaude(indicador, filtros);
                
                analise.indicadores[indicador] = {
                    valor: dados.valor,
                    unidade: dados.unidade,
                    periodo: dados.periodo,
                    fonte: dados.fonte
                };

                // Análise comparativa (se tiver dados históricos)
                const historico = this.getHistoricoIndicador(indicador, filtros);
                if (historico.length > 0) {
                    analise.comparativos[indicador] = this.calcularTendencia(historico, dados);
                }

                // Verificar alertas
                const alerta = this.verificarAlertaIndicador(indicador, dados);
                if (alerta) {
                    analise.alertas.push(alerta);
                }

            } catch (error) {
                console.warn(`Erro ao analisar indicador ${indicador}:`, error.message);
            }
        }

        return analise;
    }

    /**
     * 🩺 ANALYTICS ANS
     */
    async analizarOperadorasSaude(ufs = []) {
        const analise = {
            totalOperadoras: 0,
            porModalidade: {},
            porUF: {},
            participacaoMercado: {},
            qualificacao: {},
            recomendacoes: []
        };

        for (const uf of ufs) {
            try {
                const operadoras = await ExternalIntegration.consultarOperadoras(uf);
                
                analise.totalOperadoras += operadoras.length;
                analise.porUF[uf] = operadoras.length;

                operadoras.forEach(op => {
                    // Por modalidade
                    const modalidade = op.modalidade;
                    analise.porModalidade[modalidade] = 
                        (analise.porModalidade[modalidade] || 0) + 1;

                    // Participação de mercado (simulado)
                    if (op.beneficiarios) {
                        analise.participacaoMercado[op.nomeFantasia] = op.beneficiarios;
                    }

                    // Qualificação (se disponível)
                    if (op.qualificacaoANS) {
                        analise.qualificacao[op.registroANS] = op.qualificacaoANS;
                    }
                });

            } catch (error) {
                console.warn(`Erro ao analisar operadoras da UF ${uf}:`, error.message);
            }
        }

        // Gerar recomendações
        analise.recomendacoes = this.gerarRecomendacoesANS(analise);

        return analise;
    }

    async analizarTendenciasTISS(periodo = 30) {
        // Simulação de análise de tendências TISS
        const analise = {
            procedimentosMaisFrequentes: {},
            valorMedioProcedimento: {},
            tendenciasMensais: [],
            eficienciaProcessamento: {},
            alertasCompliance: []
        };

        // Em produção, isso viria de dados reais do TISS
        analise.procedimentosMaisFrequentes = {
            '10101012': { descricao: 'Consulta médica', frequencia: 1500 },
            '20104030': { descricao: 'Hemograma completo', frequencia: 800 },
            '30901014': { descricao: 'Raio-X tórax', frequencia: 600 }
        };

        analise.insights = this.gerarInsightsTISS(analise);

        return analise;
    }

    /**
     * 📍 ANALYTICS VIACEP
     */
    async analizarPadroesEndereco(ceps = []) {
        const analise = {
            distribuicaoGeografica: {},
            tiposLogradouro: {},
            regioesMaisConsultadas: {},
            padroesUso: {}
        };

        for (const cep of ceps) {
            try {
                const endereco = await ExternalIntegration.consultarCep(cep);
                
                // Distribuição por UF
                const uf = endereco.uf;
                analise.distribuicaoGeografica[uf] = 
                    (analise.distribuicaoGeografica[uf] || 0) + 1;

                // Tipos de logradouro
                const tipoLogradouro = this.extrairTipoLogradouro(endereco.logradouro);
                analise.tiposLogradouro[tipoLogradouro] = 
                    (analise.tiposLogradouro[tipoLogradouro] || 0) + 1;

                // Regiões mais consultadas
                const regiao = `${endereco.localidade} - ${endereco.uf}`;
                analise.regioesMaisConsultadas[regiao] = 
                    (analise.regioesMaisConsultadas[regiao] || 0) + 1;

            } catch (error) {
                console.warn(`Erro ao analisar CEP ${cep}:`, error.message);
            }
        }

        return analise;
    }

    /**
     * 🔐 ANALYTICS ICP-BRASIL
     */
    async analizarCertificacaoDigital(certificados = []) {
        const analise = {
            certificadosValidos: 0,
            certificadosExpirados: 0,
            emissoresPrincipais: {},
            tiposCertificado: {},
            alertasSeguranca: []
        };

        for (const certificado of certificados) {
            try {
                const validacao = await ExternalIntegration.validarCertificadoDigital(certificado);
                
                if (validacao.valido) {
                    analise.certificadosValidos++;
                } else {
                    analise.certificadosExpirados++;
                }

                // Emissores
                const emissor = validacao.emissor;
                analise.emissoresPrincipais[emissor] = 
                    (analise.emissoresPrincipais[emissor] || 0) + 1;

                // Tipos de certificado
                const tipo = validacao.tipo || 'A1';
                analise.tiposCertificado[tipo] = 
                    (analise.tiposCertificado[tipo] || 0) + 1;

                // Alertas de segurança
                if (validacao.proximoVencimento) {
                    analise.alertasSeguranca.push({
                        tipo: 'vencimento_proximo',
                        certificado: validacao.titular,
                        vencimento: validacao.validade.fim
                    });
                }

            } catch (error) {
                console.warn(`Erro ao analisar certificado:`, error.message);
            }
        }

        analise.taxaValidacao = analise.certificadosValidos / 
            (analise.certificadosValidos + analise.certificadosExpirados);

        return analise;
    }

    /**
     * 📊 GERAÇÃO DE RELATÓRIOS CONSOLIDADOS
     */
    async gerarRelatorioConsolidado(opcoes = {}) {
        const relatorio = {
            timestamp: new Date().toISOString(),
            periodo: opcoes.periodo || '30 dias',
            resumoExecutivo: {},
            dadosSUS: null,
            dadosANS: null,
            dadosEndereco: null,
            dadosCertificacao: null,
            insights: [],
            recomendacoes: [],
            graficos: {}
        };

        try {
            // Coletar dados SUS
            if (opcoes.incluirSUS) {
                relatorio.dadosSUS = await this.analizarEstabelecimentosSaude(
                    opcoes.municipios || ['355030', '431490', '230440']
                );
            }

            // Coletar dados ANS
            if (opcoes.incluirANS) {
                relatorio.dadosANS = await this.analizarOperadorasSaude(
                    opcoes.ufs || ['SP', 'RJ', 'MG']
                );
            }

            // Preparar dados para gráficos
            relatorio.graficos = this.prepararDadosGraficos(relatorio);

            // Preparar dados para mapas geográficos
            relatorio.mapas = this.prepararDadosMapas(relatorio);

            // Gerar insights consolidados
            relatorio.insights = this.gerarInsightsConsolidados(relatorio);

            // Gerar recomendações estratégicas
            relatorio.recomendacoes = this.gerarRecomendacoesEstrategicas(relatorio);

            // Resumo executivo
            relatorio.resumoExecutivo = this.gerarResumoExecutivo(relatorio);

        } catch (error) {
            console.error('Erro ao gerar relatório consolidado:', error);
            throw error;
        }

        return relatorio;
    }

    /**
     * 📈 PREPARAÇÃO DE DADOS PARA GRÁFICOS
     */
    prepararDadosGraficos(relatorio) {
        const graficos = {};

        // Gráfico de estabelecimentos SUS por tipo
        if (relatorio.dadosSUS) {
            graficos.estabelecimentosPorTipo = {
                type: 'bar',
                data: {
                    labels: Object.keys(relatorio.dadosSUS.tiposUnidade),
                    datasets: [{
                        label: 'Estabelecimentos',
                        data: Object.values(relatorio.dadosSUS.tiposUnidade),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribuição de Estabelecimentos SUS por Tipo'
                        }
                    }
                }
            };

            // Gráfico de distribuição geográfica
            graficos.distribuicaoGeografica = {
                type: 'pie',
                data: {
                    labels: Object.keys(relatorio.dadosSUS.distribuicaoGeografica),
                    datasets: [{
                        data: Object.values(relatorio.dadosSUS.distribuicaoGeografica),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribuição Geográfica dos Estabelecimentos'
                        }
                    }
                }
            };
        }

        // Gráfico de operadoras ANS por modalidade
        if (relatorio.dadosANS) {
            graficos.operadorasPorModalidade = {
                type: 'doughnut',
                data: {
                    labels: Object.keys(relatorio.dadosANS.porModalidade),
                    datasets: [{
                        data: Object.values(relatorio.dadosANS.porModalidade),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Operadoras de Saúde por Modalidade'
                        }
                    }
                }
            };
        }

        return graficos;
    }

    /**
     * �️ PREPARAÇÃO DE DADOS PARA MAPAS GEOGRÁFICOS
     */
    prepararDadosMapas(relatorio) {
        const mapas = {};

        // Mapa de estabelecimentos SUS por localização
        if (relatorio.dadosSUS) {
            mapas.estabelecimentosSUS = {
                type: 'markers',
                center: [-14.2350, -51.9253], // Centro do Brasil
                zoom: 5,
                markers: this.gerarMarkersEstabelecimentos(relatorio.dadosSUS),
                heatmapData: this.gerarHeatmapEstabelecimentos(relatorio.dadosSUS),
                layers: {
                    markers: true,
                    heatmap: false,
                    clusters: true
                },
                config: {
                    title: 'Estabelecimentos de Saúde SUS',
                    description: 'Mapa interativo dos estabelecimentos de saúde cadastrados no SUS',
                    editMode: true,
                    allowNewMarkers: true,
                    markerCategories: [
                        { id: 'hospital', name: 'Hospital', color: '#e74c3c', icon: '🏥' },
                        { id: 'ubs', name: 'UBS', color: '#3498db', icon: '🏪' },
                        { id: 'clinica', name: 'Clínica', color: '#2ecc71', icon: '🏢' },
                        { id: 'laboratorio', name: 'Laboratório', color: '#f39c12', icon: '🔬' }
                    ]
                }
            };

            // Mapa de densidade populacional vs. estabelecimentos
            mapas.densidadeAtendimento = {
                type: 'choropleth',
                center: [-14.2350, -51.9253],
                zoom: 5,
                data: this.gerarDadosChoropleth(relatorio.dadosSUS),
                config: {
                    title: 'Densidade de Atendimento por Região',
                    description: 'Relação entre população e estabelecimentos de saúde',
                    colorScale: ['#feedde', '#fdd0a2', '#fdae6b', '#fd8d3c', '#e6550d', '#a63603'],
                    valueProperty: 'densidade',
                    editMode: false
                }
            };
        }

        // Mapa de operadoras ANS
        if (relatorio.dadosANS) {
            mapas.operadorasANS = {
                type: 'regions',
                center: [-14.2350, -51.9253],
                zoom: 5,
                regions: this.gerarRegioesOperadoras(relatorio.dadosANS),
                config: {
                    title: 'Operadoras de Saúde por Estado',
                    description: 'Distribuição das operadoras de planos de saúde',
                    editMode: true,
                    allowRegionEdit: true,
                    colorProperty: 'quantidadeOperadoras'
                }
            };
        }

        // Mapa de integração com dados de CEP
        mapas.distribuicaoConsultas = {
            type: 'heatmap',
            center: [-23.5505, -46.6333], // São Paulo como centro
            zoom: 6,
            data: this.gerarHeatmapConsultas(),
            config: {
                title: 'Distribuição de Consultas por Região',
                description: 'Mapa de calor das consultas de CEP realizadas',
                editMode: false,
                gradient: {
                    0.2: 'blue',
                    0.4: 'cyan',
                    0.6: 'lime',
                    0.8: 'yellow',
                    1.0: 'red'
                }
            }
        };

        return mapas;
    }

    /**
     * 📍 GERAÇÃO DE MARKERS PARA ESTABELECIMENTOS
     */
    gerarMarkersEstabelecimentos(dadosSUS) {
        const markers = [];
        let index = 0;

        // Dados simulados baseados em estrutura real do DATASUS
        const estabelecimentosExemplo = [
            { nome: 'Hospital das Clínicas - SP', lat: -23.5489, lng: -46.6388, tipo: 'hospital', cnes: '2077915' },
            { nome: 'UBS Vila Madalena', lat: -23.5505, lng: -46.6825, tipo: 'ubs', cnes: '2078000' },
            { nome: 'Hospital São Paulo', lat: -23.5986, lng: -46.6412, tipo: 'hospital', cnes: '2078100' },
            { nome: 'Clínica Médica Paulista', lat: -23.5505, lng: -46.6333, tipo: 'clinica', cnes: '2078200' },
            { nome: 'Laboratório Central', lat: -23.5629, lng: -46.6544, tipo: 'laboratorio', cnes: '2078300' },
            
            // Rio de Janeiro
            { nome: 'Hospital Municipal Souza Aguiar', lat: -22.9068, lng: -43.1729, tipo: 'hospital', cnes: '2079000' },
            { nome: 'UBS Copacabana', lat: -22.9711, lng: -43.1822, tipo: 'ubs', cnes: '2079100' },
            { nome: 'Hospital Federal do Andaraí', lat: -22.9249, lng: -43.2581, tipo: 'hospital', cnes: '2079200' },
            
            // Belo Horizonte
            { nome: 'Hospital das Clínicas UFMG', lat: -19.9191, lng: -43.9386, tipo: 'hospital', cnes: '2080000' },
            { nome: 'UBS Barreiro', lat: -19.9500, lng: -44.0389, tipo: 'ubs', cnes: '2080100' },
            
            // Porto Alegre
            { nome: 'Hospital de Clínicas POA', lat: -30.0346, lng: -51.2177, tipo: 'hospital', cnes: '2081000' },
            { nome: 'UBS Restinga', lat: -30.1103, lng: -51.0624, tipo: 'ubs', cnes: '2081100' }
        ];

        estabelecimentosExemplo.forEach(est => {
            const categoria = this.getMarkerCategory(est.tipo);
            markers.push({
                id: `marker_${index++}`,
                position: [est.lat, est.lng],
                category: est.tipo,
                title: est.nome,
                description: `CNES: ${est.cnes}`,
                color: categoria.color,
                icon: categoria.icon,
                dados: {
                    cnes: est.cnes,
                    tipo: est.tipo,
                    endereco: 'Endereço simulado',
                    telefone: '(11) 99999-9999',
                    horarios: '24 horas',
                    especialidades: this.getEspecialidadesPorTipo(est.tipo)
                },
                editavel: true,
                popup: {
                    title: est.nome,
                    content: this.gerarConteudoPopup(est)
                }
            });
        });

        return markers;
    }

    /**
     * 🔥 GERAÇÃO DE HEATMAP PARA ESTABELECIMENTOS
     */
    gerarHeatmapEstabelecimentos(dadosSUS) {
        return [
            // São Paulo
            { lat: -23.5505, lng: -46.6333, weight: 0.9 },
            { lat: -23.5489, lng: -46.6388, weight: 0.8 },
            { lat: -23.5629, lng: -46.6544, weight: 0.7 },
            
            // Rio de Janeiro
            { lat: -22.9068, lng: -43.1729, weight: 0.8 },
            { lat: -22.9711, lng: -43.1822, weight: 0.6 },
            
            // Belo Horizonte
            { lat: -19.9191, lng: -43.9386, weight: 0.7 },
            
            // Porto Alegre
            { lat: -30.0346, lng: -51.2177, weight: 0.6 },
            
            // Brasília
            { lat: -15.7975, lng: -47.8919, weight: 0.5 },
            
            // Salvador
            { lat: -12.9714, lng: -38.5014, weight: 0.6 },
            
            // Fortaleza
            { lat: -3.7319, lng: -38.5267, weight: 0.5 }
        ];
    }

    /**
     * 🗺️ GERAÇÃO DE DADOS CHOROPLETH
     */
    gerarDadosChoropleth(dadosSUS) {
        return {
            'SP': { nome: 'São Paulo', densidade: 0.85, estabelecimentos: 12500, populacao: 46649132 },
            'RJ': { nome: 'Rio de Janeiro', densidade: 0.72, estabelecimentos: 8200, populacao: 17463349 },
            'MG': { nome: 'Minas Gerais', densidade: 0.68, estabelecimentos: 9800, populacao: 21411923 },
            'RS': { nome: 'Rio Grande do Sul', densidade: 0.75, estabelecimentos: 6500, populacao: 11466630 },
            'PR': { nome: 'Paraná', densidade: 0.71, estabelecimentos: 5800, populacao: 11597484 },
            'SC': { nome: 'Santa Catarina', densidade: 0.77, estabelecimentos: 4200, populacao: 7338473 },
            'BA': { nome: 'Bahia', densidade: 0.45, estabelecimentos: 7100, populacao: 14985284 },
            'GO': { nome: 'Goiás', densidade: 0.52, estabelecimentos: 3800, populacao: 7206589 },
            'PE': { nome: 'Pernambuco', densidade: 0.48, estabelecimentos: 4500, populacao: 9674793 },
            'CE': { nome: 'Ceará', densidade: 0.43, estabelecimentos: 4100, populacao: 9240580 }
        };
    }

    /**
     * 🏥 GERAÇÃO DE REGIÕES PARA OPERADORAS
     */
    gerarRegioesOperadoras(dadosANS) {
        return {
            'SP': { 
                quantidadeOperadoras: 284,
                operadorasAtivas: 261,
                beneficiarios: 18500000,
                modalidadePrincipal: 'Medicina de Grupo'
            },
            'RJ': { 
                quantidadeOperadoras: 156,
                operadorasAtivas: 142,
                beneficiarios: 8200000,
                modalidadePrincipal: 'Cooperativa Médica'
            },
            'MG': { 
                quantidadeOperadoras: 189,
                operadorasAtivas: 175,
                beneficiarios: 6800000,
                modalidadePrincipal: 'Medicina de Grupo'
            },
            'RS': { 
                quantidadeOperadoras: 98,
                operadorasAtivas: 89,
                beneficiarios: 4100000,
                modalidadePrincipal: 'Cooperativa Médica'
            },
            'PR': { 
                quantidadeOperadoras: 87,
                operadorasAtivas: 81,
                beneficiarios: 3900000,
                modalidadePrincipal: 'Medicina de Grupo'
            }
        };
    }

    /**
     * 🔥 GERAÇÃO DE HEATMAP PARA CONSULTAS
     */
    gerarHeatmapConsultas() {
        return [
            // Principais centros urbanos com intensidade baseada em população
            { lat: -23.5505, lng: -46.6333, weight: 1.0 }, // São Paulo
            { lat: -22.9068, lng: -43.1729, weight: 0.85 }, // Rio de Janeiro
            { lat: -19.9191, lng: -43.9386, weight: 0.7 }, // Belo Horizonte
            { lat: -30.0346, lng: -51.2177, weight: 0.6 }, // Porto Alegre
            { lat: -25.4284, lng: -49.2733, weight: 0.55 }, // Curitiba
            { lat: -27.5954, lng: -48.5480, weight: 0.5 }, // Florianópolis
            { lat: -15.7975, lng: -47.8919, weight: 0.6 }, // Brasília
            { lat: -12.9714, lng: -38.5014, weight: 0.65 }, // Salvador
            { lat: -8.0476, lng: -34.8770, weight: 0.45 }, // Recife
            { lat: -3.7319, lng: -38.5267, weight: 0.5 }, // Fortaleza
            { lat: -1.4558, lng: -48.5044, weight: 0.4 }, // Belém
            { lat: -20.3155, lng: -40.3128, weight: 0.4 }, // Vitória
            { lat: -16.6869, lng: -49.2648, weight: 0.45 }, // Goiânia
            { lat: -20.4697, lng: -54.6201, weight: 0.4 } // Campo Grande
        ];
    }

    /**
     * 🏷️ MÉTODOS AUXILIARES PARA MAPAS
     */
    getMarkerCategory(tipo) {
        const categorias = {
            hospital: { color: '#e74c3c', icon: '🏥' },
            ubs: { color: '#3498db', icon: '🏪' },
            clinica: { color: '#2ecc71', icon: '🏢' },
            laboratorio: { color: '#f39c12', icon: '🔬' }
        };
        return categorias[tipo] || { color: '#95a5a6', icon: '📍' };
    }

    getEspecialidadesPorTipo(tipo) {
        const especialidades = {
            hospital: ['Cardiologia', 'Neurologia', 'Oncologia', 'Cirurgia Geral', 'UTI'],
            ubs: ['Clínica Geral', 'Pediatria', 'Ginecologia', 'Enfermagem', 'Farmácia'],
            clinica: ['Clínica Geral', 'Dermatologia', 'Oftalmologia', 'Ortopedia'],
            laboratorio: ['Análises Clínicas', 'Patologia', 'Imagem', 'Microbiologia']
        };
        return especialidades[tipo] || ['Não especificado'];
    }

    gerarConteudoPopup(estabelecimento) {
        return `
            <div class="popup-content">
                <h3>${estabelecimento.nome}</h3>
                <p><strong>CNES:</strong> ${estabelecimento.cnes}</p>
                <p><strong>Tipo:</strong> ${estabelecimento.tipo}</p>
                <p><strong>Coordenadas:</strong> ${estabelecimento.lat}, ${estabelecimento.lng}</p>
                <div class="popup-actions">
                    <button onclick="editarEstabelecimento('${estabelecimento.cnes}')">Editar</button>
                    <button onclick="verDetalhes('${estabelecimento.cnes}')">Detalhes</button>
                </div>
            </div>
        `;
    }

    /**
     * �️ MÉTODOS AUXILIARES PARA COORDENADAS E MAPAS
     */
    async gerarCoordenadasEstabelecimentos(municipios) {
        const coordenadas = [];
        
        // Simulação baseada em dados reais do DATASUS
        const estabelecimentosExemplo = [
            // São Paulo (355030)
            { cnes: '2077915', nome: 'Hospital das Clínicas - SP', lat: -23.5489, lng: -46.6388, tipo: 'hospital' },
            { cnes: '2078000', nome: 'UBS Vila Madalena', lat: -23.5505, lng: -46.6825, tipo: 'ubs' },
            { cnes: '2078100', nome: 'Hospital São Paulo', lat: -23.5986, lng: -46.6412, tipo: 'hospital' },
            { cnes: '2078200', nome: 'Clínica Médica Paulista', lat: -23.5505, lng: -46.6333, tipo: 'clinica' },
            { cnes: '2078300', nome: 'Laboratório Central SP', lat: -23.5629, lng: -46.6544, tipo: 'laboratorio' },
            
            // Porto Alegre (431490) 
            { cnes: '2081000', nome: 'Hospital de Clínicas POA', lat: -30.0346, lng: -51.2177, tipo: 'hospital' },
            { cnes: '2081100', nome: 'UBS Restinga', lat: -30.1103, lng: -51.0624, tipo: 'ubs' },
            { cnes: '2081200', nome: 'Hospital Moinhos de Vento', lat: -30.0277, lng: -51.1920, tipo: 'hospital' },
            
            // Fortaleza (230440)
            { cnes: '2082000', nome: 'Hospital Geral de Fortaleza', lat: -3.7319, lng: -38.5267, tipo: 'hospital' },
            { cnes: '2082100', nome: 'UBS Barra do Ceará', lat: -3.7235, lng: -38.5615, tipo: 'ubs' },
            { cnes: '2082200', nome: 'Hospital São José', lat: -3.7275, lng: -38.5126, tipo: 'hospital' }
        ];

        municipios.forEach(municipio => {
            const estabelecimentosMunicipio = estabelecimentosExemplo.filter(est => {
                // Lógica para filtrar por município (simplificada)
                if (municipio === '355030') return est.cnes.startsWith('2078'); // SP
                if (municipio === '431490') return est.cnes.startsWith('2081'); // POA
                if (municipio === '230440') return est.cnes.startsWith('2082'); // Fortaleza
                return false;
            });

            coordenadas.push(...estabelecimentosMunicipio);
        });

        return coordenadas;
    }

    async gerarHeatmapOperadoras() {
        return [
            // Concentração de operadoras por região
            { lat: -23.5505, lng: -46.6333, weight: 0.95 }, // São Paulo - maior concentração
            { lat: -22.9068, lng: -43.1729, weight: 0.80 }, // Rio de Janeiro
            { lat: -19.9191, lng: -43.9386, weight: 0.65 }, // Belo Horizonte
            { lat: -30.0346, lng: -51.2177, weight: 0.60 }, // Porto Alegre
            { lat: -25.4284, lng: -49.2733, weight: 0.55 }, // Curitiba
            { lat: -27.5954, lng: -48.5480, weight: 0.45 }, // Florianópolis
            { lat: -15.7975, lng: -47.8919, weight: 0.50 }, // Brasília
            { lat: -12.9714, lng: -38.5014, weight: 0.55 }, // Salvador
            { lat: -8.0476, lng: -34.8770, weight: 0.40 }, // Recife
            { lat: -3.7319, lng: -38.5267, weight: 0.45 }  // Fortaleza
        ];
    }

    async gerarRegioesSUS() {
        return {
            'Norte': {
                estados: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
                estabelecimentosSUS: 8450,
                populacao: 18906962,
                coberturaSUS: 0.89,
                investimentoPerCapita: 1250
            },
            'Nordeste': {
                estados: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
                estabelecimentosSUS: 22100,
                populacao: 57071654,
                coberturaSUS: 0.92,
                investimentoPerCapita: 1180
            },
            'Sudeste': {
                estados: ['ES', 'MG', 'RJ', 'SP'],
                estabelecimentosSUS: 28900,
                populacao: 89012240,
                coberturaSUS: 0.78,
                investimentoPerCapita: 1680
            },
            'Sul': {
                estados: ['PR', 'RS', 'SC'],
                estabelecimentosSUS: 12200,
                populacao: 30402587,
                coberturaSUS: 0.82,
                investimentoPerCapita: 1560
            },
            'Centro-Oeste': {
                estados: ['DF', 'GO', 'MT', 'MS'],
                estabelecimentosSUS: 6800,
                populacao: 16707336,
                coberturaSUS: 0.85,
                investimentoPerCapita: 1420
            }
        };
    }

    /**
     * �🔍 MÉTODOS AUXILIARES
     */
    categorizarLeitos(numeroLeitos) {
        if (numeroLeitos <= 50) return 'Pequeno porte (até 50 leitos)';
        if (numeroLeitos <= 150) return 'Médio porte (51-150 leitos)';
        if (numeroLeitos <= 300) return 'Grande porte (151-300 leitos)';
        return 'Especial (mais de 300 leitos)';
    }

    extrairTipoLogradouro(logradouro) {
        const tipos = ['Rua', 'Avenida', 'Praça', 'Alameda', 'Travessa', 'Estrada'];
        for (const tipo of tipos) {
            if (logradouro.startsWith(tipo)) return tipo;
        }
        return 'Outros';
    }

    gerarInsightsSUS(dados) {
        const insights = [];
        
        // Insight sobre concentração de tipos
        const tipoMaisComum = Object.entries(dados.tiposUnidade)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (tipoMaisComum) {
            insights.push({
                tipo: 'concentracao',
                titulo: 'Tipo de Estabelecimento Predominante',
                descricao: `${tipoMaisComum[0]} representa ${Math.round(tipoMaisComum[1] / dados.totalEstabelecimentos * 100)}% dos estabelecimentos`,
                impacto: 'alto'
            });
        }

        return insights;
    }

    gerarRecomendacoesANS(analise) {
        const recomendacoes = [];

        // Recomendação baseada em diversidade de operadoras
        if (Object.keys(analise.porModalidade).length < 3) {
            recomendacoes.push({
                categoria: 'diversificacao',
                titulo: 'Ampliar Parcerias com Operadoras',
                descricao: 'Considere parcerias com operadoras de diferentes modalidades para ampliar cobertura',
                prioridade: 'media'
            });
        }

        return recomendacoes;
    }

    gerarInsightsConsolidados(relatorio) {
        const insights = [];

        // Análise cruzada de dados
        if (relatorio.dadosSUS && relatorio.dadosANS) {
            insights.push({
                tipo: 'correlacao',
                titulo: 'Oportunidade de Mercado',
                descricao: 'Regiões com alta concentração de estabelecimentos SUS e poucas operadoras privadas representam oportunidades de expansão',
                dados: {
                    sus: relatorio.dadosSUS.totalEstabelecimentos,
                    ans: relatorio.dadosANS.totalOperadoras
                }
            });
        }

        return insights;
    }

    gerarRecomendacoesEstrategicas(relatorio) {
        return [
            {
                categoria: 'expansao',
                titulo: 'Focar em Regiões Subatendidas',
                descricao: 'Identifique regiões com poucos estabelecimentos privados mas boa infraestrutura SUS',
                prazo: '3-6 meses'
            },
            {
                categoria: 'parcerias',
                titulo: 'Integração com Operadoras Locais',
                descricao: 'Estabeleça parcerias preferenciais com operadoras bem avaliadas pela ANS',
                prazo: '1-3 meses'
            }
        ];
    }

    gerarResumoExecutivo(relatorio) {
        return {
            totalEstabelecimentosAnalisados: relatorio.dadosSUS?.totalEstabelecimentos || 0,
            totalOperadorasAnalisadas: relatorio.dadosANS?.totalOperadoras || 0,
            principaisInsights: relatorio.insights.length,
            recomendacoesPrioritarias: relatorio.recomendacoes.filter(r => r.prioridade === 'alta').length
        };
    }
}

module.exports = ExternalDataAnalytics;