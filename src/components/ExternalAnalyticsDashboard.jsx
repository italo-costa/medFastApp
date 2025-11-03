/**
 * 📊 COMPONENTE DE GRÁFICOS PARA ANALYTICS EXTERNOS
 * 
 * Visualiza dados das integrações externas usando Chart.js
 * para o painel administrativo do MediApp.
 * 
 * @author MediApp Frontend Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Badge,
    Alert,
    AlertDescription
} from '../ui/components';

const ExternalAnalyticsChart = ({ 
    title, 
    subtitle,
    chartConfig, 
    insights = [], 
    onRefresh,
    isLoading = false 
}) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [selectedPeriod, setSelectedPeriod] = useState('30d');
    const [selectedRegion, setSelectedRegion] = useState('all');

    useEffect(() => {
        if (chartRef.current && chartConfig) {
            // Destruir gráfico anterior se existir
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            // Criar novo gráfico
            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                ...chartConfig,
                options: {
                    ...chartConfig.options,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        ...chartConfig.options?.plugins,
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#333',
                            borderWidth: 1,
                            cornerRadius: 8
                        }
                    },
                    scales: chartConfig.type !== 'pie' && chartConfig.type !== 'doughnut' ? {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    } : {}
                }
            });
        }

        // Cleanup
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [chartConfig]);

    const handleRefresh = () => {
        if (onRefresh) {
            onRefresh({
                period: selectedPeriod,
                region: selectedRegion
            });
        }
    };

    const getInsightBadgeColor = (impacto) => {
        switch (impacto) {
            case 'alto': return 'destructive';
            case 'medio': return 'warning';
            case 'baixo': return 'secondary';
            default: return 'default';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>
                
                <div className="flex items-center space-x-2">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">7 dias</SelectItem>
                            <SelectItem value="30d">30 dias</SelectItem>
                            <SelectItem value="90d">90 dias</SelectItem>
                            <SelectItem value="1y">1 ano</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="sp">São Paulo</SelectItem>
                            <SelectItem value="rj">Rio de Janeiro</SelectItem>
                            <SelectItem value="mg">Minas Gerais</SelectItem>
                            <SelectItem value="rs">Rio Grande do Sul</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Carregando...' : 'Atualizar'}
                    </Button>
                </div>
            </CardHeader>
            
            <CardContent>
                {/* Área do Gráfico */}
                <div className="relative h-64 mb-4">
                    <canvas ref={chartRef} />
                    {isLoading && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </div>
                
                {/* Insights */}
                {insights.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Insights:</h4>
                        {insights.map((insight, index) => (
                            <Alert key={index} className="p-3">
                                <AlertDescription className="flex items-center justify-between">
                                    <div>
                                        <span className="font-medium">{insight.titulo}</span>
                                        <p className="text-sm text-gray-600 mt-1">{insight.descricao}</p>
                                    </div>
                                    <Badge variant={getInsightBadgeColor(insight.impacto)}>
                                        {insight.impacto}
                                    </Badge>
                                </AlertDescription>
                            </Alert>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

/**
 * 📊 DASHBOARD DE ANALYTICS EXTERNOS
 */
const ExternalAnalyticsDashboard = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAnalyticsData();
    }, []);

    const loadAnalyticsData = async (filters = {}) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/external/analytics/consolidated', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    incluirSUS: true,
                    incluirANS: true,
                    periodo: filters.period || '30d',
                    municipios: ['355030', '431490', '230440'], // SP, Porto Alegre, Fortaleza
                    ufs: ['SP', 'RJ', 'MG', 'RS', 'CE'],
                    ...filters
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar dados de analytics');
            }

            const data = await response.json();
            setAnalyticsData(data);
        } catch (err) {
            setError(err.message);
            console.error('Erro ao carregar analytics:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Erro ao carregar dados: {error}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics de Integrações Externas</h1>
                    <p className="text-muted-foreground">
                        Insights baseados em dados do SUS, ANS e outras fontes oficiais
                    </p>
                </div>
            </div>

            {/* Resumo Executivo */}
            {analyticsData?.resumoExecutivo && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Estabelecimentos SUS
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {analyticsData.resumoExecutivo.totalEstabelecimentosAnalisados}
                                    </p>
                                </div>
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    🏥
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Operadoras ANS
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {analyticsData.resumoExecutivo.totalOperadorasAnalisadas}
                                    </p>
                                </div>
                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                    🩺
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Insights Gerados
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {analyticsData.resumoExecutivo.principaisInsights}
                                    </p>
                                </div>
                                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    💡
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Recomendações
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {analyticsData.resumoExecutivo.recomendacoesPrioritarias}
                                    </p>
                                </div>
                                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    📋
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analyticsData?.graficos?.estabelecimentosPorTipo && (
                    <ExternalAnalyticsChart
                        title="Estabelecimentos SUS por Tipo"
                        subtitle="Distribuição dos tipos de unidades de saúde"
                        chartConfig={analyticsData.graficos.estabelecimentosPorTipo}
                        insights={analyticsData?.dadosSUS?.insights || []}
                        onRefresh={loadAnalyticsData}
                        isLoading={isLoading}
                    />
                )}

                {analyticsData?.graficos?.distribuicaoGeografica && (
                    <ExternalAnalyticsChart
                        title="Distribuição Geográfica"
                        subtitle="Estabelecimentos de saúde por região"
                        chartConfig={analyticsData.graficos.distribuicaoGeografica}
                        insights={[]}
                        onRefresh={loadAnalyticsData}
                        isLoading={isLoading}
                    />
                )}

                {analyticsData?.graficos?.operadorasPorModalidade && (
                    <ExternalAnalyticsChart
                        title="Operadoras ANS por Modalidade"
                        subtitle="Distribuição das operadoras por tipo de plano"
                        chartConfig={analyticsData.graficos.operadorasPorModalidade}
                        insights={[]}
                        onRefresh={loadAnalyticsData}
                        isLoading={isLoading}
                    />
                )}

                {/* Gráfico de Tendências (exemplo adicional) */}
                <ExternalAnalyticsChart
                    title="Tendências de Integração"
                    subtitle="Volume de consultas às APIs externas"
                    chartConfig={{
                        type: 'line',
                        data: {
                            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                            datasets: [{
                                label: 'ViaCEP',
                                data: [1200, 1350, 1100, 1450, 1600, 1750],
                                borderColor: 'rgb(75, 192, 192)',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                tension: 0.4
                            }, {
                                label: 'DATASUS',
                                data: [800, 950, 750, 1100, 1250, 1400],
                                borderColor: 'rgb(255, 99, 132)',
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                tension: 0.4
                            }]
                        }
                    }}
                    insights={[
                        {
                            titulo: 'Crescimento Consistente',
                            descricao: 'Volume de consultas cresceu 45% nos últimos 6 meses',
                            impacto: 'alto'
                        }
                    ]}
                    onRefresh={loadAnalyticsData}
                    isLoading={isLoading}
                />
            </div>

            {/* Recomendações Estratégicas */}
            {analyticsData?.recomendacoes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recomendações Estratégicas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analyticsData.recomendacoes.map((recomendacao, index) => (
                                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                                    <h4 className="font-medium">{recomendacao.titulo}</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {recomendacao.descricao}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <Badge variant="outline">{recomendacao.categoria}</Badge>
                                        <span className="text-xs text-gray-500">
                                            Prazo: {recomendacao.prazo}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ExternalAnalyticsDashboard;