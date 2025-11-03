/**
 * Rotas para validação em tempo real
 */

const express = require('express');
const ValidacaoTempoReal = require('../middleware/validacaoTempoReal');
const centralMiddleware = require('../middleware/centralMiddleware');

const router = express.Router();

// POST /api/validacao/campo/:id? - Validar campo específico
router.post('/campo/:id?', centralMiddleware.asyncHandler(ValidacaoTempoReal.validarCampoEspecifico()));

// POST /api/validacao/medico/:id? - Validar dados completos do médico
router.post('/medico/:id?', ValidacaoTempoReal.validarMedicoTempoReal(), (req, res) => {
  // Se chegou até aqui, a validação passou
  res.json({
    success: true,
    message: 'Dados válidos',
    validacao: req.validacaoCompleta
  });
});

module.exports = router;
