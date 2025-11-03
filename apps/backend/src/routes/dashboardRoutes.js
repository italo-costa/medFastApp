/**
 * Rotas para dashboard
 */

const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { asyncHandler } = require('../middleware/errorHandling');

const router = express.Router();

// GET /api/dashboard - Obter dados completos do dashboard
router.get('/', asyncHandler(dashboardController.obterDashboard));

// GET /api/dashboard/metricas - Obter apenas métricas principais
router.get('/metricas', asyncHandler(dashboardController.obterMetricas));

// GET /api/dashboard/graficos - Obter dados para gráficos
router.get('/graficos', asyncHandler(dashboardController.obterGraficos));

// GET /api/dashboard/atividades - Obter atividades recentes
router.get('/atividades', asyncHandler(dashboardController.obterAtividades));

// GET /api/dashboard/estatisticas - Obter estatísticas detalhadas
router.get('/estatisticas', asyncHandler(dashboardController.obterEstatisticasDetalhadas));

module.exports = router;