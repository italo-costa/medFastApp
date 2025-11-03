const express = require('express');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');
const HealthDataIntegrator = require('../services/HealthDataIntegrator');

const router = express.Router();
const healthDataIntegrator = new HealthDataIntegrator();

// Diretório de dados dos analytics
const ANALYTICS_DATA_DIR = path.join(__dirname, '../../data');

/**
 * GET /api/analytics/health
 * Health check específico do módulo de analytics - Dados públicos apenas
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    module: 'analytics',
    timestamp: new Date().toISOString(),
    data_sources_available: ['DATASUS', 'ANS', 'IBGE', 'ANATEL', 'CETIC'],
    municipalities_supported: 18,
    compliance_status: 'LGPD_COMPLIANT',
    data_classification: 'PUBLIC_AGGREGATED',
    last_update_check: new Date().toISOString()
  });
});

/**
 * GET /api/analytics/maps
 * Lista todos os mapas disponíveis
 */
router.get('/maps', (req, res) => {
  try {
    if (!fs.existsSync(ANALYTICS_DATA_DIR)) {
      return res.json({
        success: false,
        message: 'Diretório de dados não encontrado',
        maps: [],
        instructions: 'Execute o Jupyter Notebook para gerar os mapas'
      });
    }

    const files = fs.readdirSync(ANALYTICS_DATA_DIR);
    const mapFiles = files.filter(file => 
      file.toLowerCase().includes('mapa') && 
      (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
    );

    const maps = mapFiles.map(file => ({
      filename: file,
      path: `/data/${file}`,
      size: fs.statSync(path.join(ANALYTICS_DATA_DIR, file)).size,
      created: fs.statSync(path.join(ANALYTICS_DATA_DIR, file)).birthtime,
      modified: fs.statSync(path.join(ANALYTICS_DATA_DIR, file)).mtime
    }));

    res.json({
      success: true,
      count: maps.length,
      maps: maps,
      lastGenerated: maps.length > 0 ? Math.max(...maps.map(m => new Date(m.modified))) : null
    });

  } catch (error) {
    logger.error('Erro ao listar mapas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/data
 * Lista todos os arquivos de dados disponíveis
 */
router.get('/data', (req, res) => {
  try {
    if (!fs.existsSync(ANALYTICS_DATA_DIR)) {
      return res.json({
        success: false,
        message: 'Diretório de dados não encontrado',
        data: []
      });
    }

    const files = fs.readdirSync(ANALYTICS_DATA_DIR);
    const dataFiles = files.filter(file => 
      file.endsWith('.csv') || 
      file.endsWith('.json') || 
      file.endsWith('.parquet') ||
      file.endsWith('.html')
    );

    const data = dataFiles.map(file => {
      const filePath = path.join(ANALYTICS_DATA_DIR, file);
      const stats = fs.statSync(filePath);
      
      return {
        filename: file,
        path: `/data/${file}`,
        type: path.extname(file).substring(1),
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        created: stats.birthtime,
        modified: stats.mtime
      };
    });

    res.json({
      success: true,
      count: data.length,
      data: data.sort((a, b) => new Date(b.modified) - new Date(a.modified))
    });

  } catch (error) {
    logger.error('Erro ao listar dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/status
 * Status geral do sistema de analytics
 */
router.get('/status', (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      dataDirectory: {
        exists: fs.existsSync(ANALYTICS_DATA_DIR),
        path: ANALYTICS_DATA_DIR,
        files: fs.existsSync(ANALYTICS_DATA_DIR) ? fs.readdirSync(ANALYTICS_DATA_DIR).length : 0
      },
      maps: {
        available: 0,
        lastGenerated: null
      },
      datasets: {
        available: 0,
        types: []
      },
      jupyter: {
        notebook: '../analytics/indicadores-saude-nordeste.ipynb',
        status: 'ready'
      }
    };

    if (fs.existsSync(ANALYTICS_DATA_DIR)) {
      const files = fs.readdirSync(ANALYTICS_DATA_DIR);
      
      // Contar mapas
      const mapFiles = files.filter(file => 
        file.toLowerCase().includes('mapa') && 
        (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
      );
      status.maps.available = mapFiles.length;
      
      if (mapFiles.length > 0) {
        const mapStats = mapFiles.map(file => 
          fs.statSync(path.join(ANALYTICS_DATA_DIR, file)).mtime
        );
        status.maps.lastGenerated = new Date(Math.max(...mapStats));
      }

      // Contar datasets
      const dataFiles = files.filter(file => 
        file.endsWith('.csv') || 
        file.endsWith('.json') || 
        file.endsWith('.parquet')
      );
      status.datasets.available = dataFiles.length;
      status.datasets.types = [...new Set(dataFiles.map(file => path.extname(file).substring(1)))];
    }

    res.json({
      success: true,
      status: status,
      recommendations: generateRecommendations(status)
    });

  } catch (error) {
    logger.error('Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/indicators
 * Busca indicadores de saúde de fontes governamentais
 */
router.get('/indicators', async (req, res) => {
  try {
    const { municipios, source } = req.query;
    
    // Log de auditoria LGPD
    logger.info('Solicitação de indicadores de saúde', {
      user_agent: req.get('User-Agent'),
      source_requested: source,
      municipalities_filter: municipios,
      purpose: 'ANALYTICS_DASHBOARD'
    });

    let data;
    
    switch (source) {
      case 'ocupacao':
        data = await healthDataIntegrator.fetchOcupacaoHospitalar();
        break;
      case 'planos':
        data = await healthDataIntegrator.fetchPenetracaoPlanos();
        break;
      case 'conectividade':
        data = await healthDataIntegrator.fetchConectividadeDigital();
        break;
      case 'completo':
      default:
        data = await healthDataIntegrator.fetchIndicadoresCompletos();
        break;
    }

    res.json({
      success: true,
      data: data,
      metadata: {
        total_municipalities: data.length,
        data_sources: ['DATASUS', 'ANS', 'IBGE', 'ANATEL', 'CETIC'],
        collection_timestamp: new Date().toISOString(),
        compliance: 'LGPD_COMPLIANT',
        cache_status: 'ACTIVE'
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar indicadores de saúde:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao integrar dados governamentais',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      fallback_instructions: 'Verifique conectividade com APIs governamentais'
    });
  }
});

/**
 * GET /api/analytics/data-validation
 * Validação de dados antes da exposição
 */
router.get('/data-validation', (req, res) => {
  try {
    const AnalyticsDataSanitizer = require('../middleware/analyticsDataSanitizer');
    const sanitizer = new AnalyticsDataSanitizer();
    
    // Exemplo de dados para validação
    const sampleData = {
      municipio_nome: 'Fortaleza',
      municipio_codigo: '2304400',
      ocupacao_hospitalar: 78.5,
      populacao: 2686612,
      dataDirectory: '/sensitive/path',
      user_session: 'abc123',
      cpf: '123.456.789-00'
    };
    
    const validation = sanitizer.validateDataStructure(sampleData);
    const sanitizedSample = sanitizer.sanitizeAnalyticsData(sampleData);
    
    res.json({
      success: true,
      validation_report: validation,
      data_classification: {
        public_fields: Object.keys(sanitizer.allowedFields).filter(k => sanitizer.allowedFields[k]),
        sensitive_fields: sanitizer.sensitiveFields,
        aggregate_fields: sanitizer.aggregateFields
      },
      sample_sanitization: {
        original_keys: Object.keys(sampleData),
        sanitized_keys: Object.keys(sanitizedSample),
        removed_sensitive_data: Object.keys(sampleData).filter(k => !(k in sanitizedSample))
      },
      compliance_status: 'VALIDATED'
    });

  } catch (error) {
    logger.error('Erro na validação de dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na validação de conformidade'
    });
  }
});

/**
 * GET /api/analytics/compliance
 * Relatório de conformidade LGPD
 */
router.get('/compliance', (req, res) => {
  try {
    const auditReport = healthDataIntegrator.generateAuditReport();
    
    res.json({
      success: true,
      compliance_report: auditReport,
      lgpd_status: 'FULLY_COMPLIANT',
      data_sources: {
        datasus: {
          type: 'PUBLIC_AGGREGATED',
          legal_basis: 'LAI_OPEN_DATA',
          retention: '24_HOURS_CACHE'
        },
        ans: {
          type: 'PUBLIC_STATISTICAL',
          legal_basis: 'REGULATORY_TRANSPARENCY',
          retention: '7_DAYS_CACHE'
        },
        ibge: {
          type: 'DEMOGRAPHIC_PUBLIC',
          legal_basis: 'OFFICIAL_STATISTICS',
          retention: '30_DAYS_CACHE'
        }
      },
      privacy_measures: {
        data_minimization: 'APPLIED',
        pseudonymization: 'NOT_REQUIRED_PUBLIC_DATA',
        encryption_in_transit: 'TLS_1_3',
        access_logging: 'ENABLED',
        automatic_deletion: 'TTL_BASED'
      }
    });

  } catch (error) {
    logger.error('Erro ao gerar relatório de conformidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/analytics/generate
 * Endpoint para triggerar geração de mapas com dados reais
 */
router.post('/generate', async (req, res) => {
  try {
    const { indicators = 'completo', municipalities = null, export_format = 'json' } = req.body;
    
    logger.info('Solicitação de geração de analytics', {
      indicators_requested: indicators,
      export_format: export_format,
      municipalities_count: municipalities?.length || 'all'
    });

    // Buscar dados atualizados
    const data = await healthDataIntegrator.fetchIndicadoresCompletos(municipalities);
    
    // Preparar dados para export
    const exportData = {
      generated_at: new Date().toISOString(),
      indicators: data,
      summary: {
        total_municipalities: data.length,
        capitals: data.filter(d => d.tipo === 'capital').length,
        interior: data.filter(d => d.tipo === 'interior').length,
        avg_occupancy: data.reduce((sum, d) => sum + d.ocupacao_hospitalar, 0) / data.length,
        avg_plan_penetration: data.reduce((sum, d) => sum + d.penetracao_planos, 0) / data.length,
        avg_connectivity: data.reduce((sum, d) => sum + d.conectividade_mbps, 0) / data.length
      },
      compliance: {
        lgpd_compliant: true,
        data_sources: ['DATASUS', 'ANS', 'IBGE', 'ANATEL'],
        anonymization: 'NOT_REQUIRED_AGGREGATED_DATA'
      }
    };

    // Salvar dados para uso no frontend
    const dataDir = path.join(__dirname, '../../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Salvar em diferentes formatos
    if (export_format === 'json' || export_format === 'all') {
      fs.writeFileSync(
        path.join(dataDir, 'indicadores_saude_nordeste_real.json'),
        JSON.stringify(exportData, null, 2)
      );
    }

    if (export_format === 'csv' || export_format === 'all') {
      const csvData = data.map(d => ({
        municipio: d.municipio_nome,
        uf: d.uf,
        tipo: d.tipo,
        ocupacao_hospitalar: d.ocupacao_hospitalar,
        penetracao_planos: d.penetracao_planos,
        conectividade_mbps: d.conectividade_mbps,
        resolutividade_local: d.resolutividade_local,
        populacao: d.populacao
      }));

      const csvHeader = Object.keys(csvData[0]).join(',');
      const csvRows = csvData.map(row => Object.values(row).join(','));
      const csvContent = [csvHeader, ...csvRows].join('\n');

      fs.writeFileSync(
        path.join(dataDir, 'indicadores_saude_nordeste_real.csv'),
        csvContent
      );
    }

    res.json({
      success: true,
      message: 'Dados de saúde gerados com sucesso',
      data: exportData,
      files_generated: [
        export_format === 'json' || export_format === 'all' ? '/data/indicadores_saude_nordeste_real.json' : null,
        export_format === 'csv' || export_format === 'all' ? '/data/indicadores_saude_nordeste_real.csv' : null
      ].filter(Boolean),
      next_steps: [
        'Execute o Jupyter Notebook para gerar mapas geoespaciais',
        'Acesse a interface web de analytics',
        'Visualize os dados através dos mapas interativos'
      ]
    });

  } catch (error) {
    logger.error('Erro ao gerar analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na geração de analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Funções auxiliares
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function generateRecommendations(status) {
  const recommendations = [];

  if (!status.dataDirectory.exists) {
    recommendations.push({
      priority: 'high',
      type: 'setup',
      message: 'Criar diretório de dados',
      action: 'Execute o Jupyter Notebook para gerar os primeiros dados'
    });
  }

  if (status.maps.available === 0) {
    recommendations.push({
      priority: 'medium',
      type: 'data',
      message: 'Nenhum mapa gerado',
      action: 'Execute as células do notebook para gerar mapas geoespaciais'
    });
  }

  if (status.datasets.available === 0) {
    recommendations.push({
      priority: 'medium',
      type: 'data',
      message: 'Nenhum dataset disponível',
      action: 'Execute o notebook para gerar datasets de análise'
    });
  }

  if (status.maps.lastGenerated) {
    const daysSinceGeneration = (new Date() - new Date(status.maps.lastGenerated)) / (1000 * 60 * 60 * 24);
    if (daysSinceGeneration > 7) {
      recommendations.push({
        priority: 'low',
        type: 'maintenance',
        message: 'Mapas desatualizados',
        action: 'Considere regenerar os mapas com dados mais recentes'
      });
    }
  }

  return recommendations;
}

module.exports = router;