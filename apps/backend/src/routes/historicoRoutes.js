/**
 * Rotas para histórico de alterações
 */

const express = require('express');
const historicoController = require('../controllers/historicoController');
const { asyncHandler } = require('../middleware/errorHandling');

const router = express.Router();

// GET /api/historico/medico/:id - Obter histórico de um médico
router.get('/medico/:id', asyncHandler(historicoController.obterHistoricoMedico));

// GET /api/historico/medico/:id/estatisticas - Estatísticas do histórico
router.get('/medico/:id/estatisticas', asyncHandler(historicoController.obterEstatisticasHistorico));

// POST /api/historico/limpeza - Limpeza manual do histórico antigo
router.post('/limpeza', asyncHandler(historicoController.limparHistoricoAntigo));

module.exports = router;