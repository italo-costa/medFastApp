/**
 * Rotas para gerenciamento de médicos
 */

const express = require('express');
const medicosController = require('../controllers/medicosController');
const centralMiddleware = require('../middleware/centralMiddleware');
const { uploadMedicoFoto, handleUploadError, validarUploadFoto } = require('../middleware/uploadMiddleware');
const { uploadImportacao, handleUploadErrors, validateFilePresence } = require('../middleware/importUploadMiddleware');

const router = express.Router();

// GET /api/medicos - Listar médicos com filtros e paginação
router.get('/', centralMiddleware.centralMiddleware.asyncHandler(medicosController.listar));

// GET /api/medicos/:id - Buscar médico por ID
router.get('/:id', centralMiddleware.asyncHandler(medicosController.buscarPorId));

// POST /api/medicos - Criar novo médico
router.post('/', centralMiddleware.asyncHandler(medicosController.criar));

// PUT /api/medicos/:id - Atualizar médico
router.put('/:id', centralMiddleware.asyncHandler(medicosController.atualizar));

// DELETE /api/medicos/:id - Remover médico (soft delete)
router.delete('/:id', centralMiddleware.asyncHandler(medicosController.remover));

// POST /api/medicos/:id/foto - Upload de foto
router.post('/:id/foto', 
  uploadMedicoFoto, 
  handleUploadError, 
  validarUploadFoto,
  centralMiddleware.asyncHandler(medicosController.uploadFoto)
);

// DELETE /api/medicos/:id/foto - Remover foto
router.delete('/:id/foto', centralMiddleware.asyncHandler(medicosController.removerFoto));

// GET /api/medicos/relatorios/excel - Gerar relatório Excel
router.get('/relatorios/excel', centralMiddleware.asyncHandler(medicosController.gerarRelatorioExcel));

// GET /api/medicos/relatorios/especialidades - Relatório por especialidades
router.get('/relatorios/especialidades', centralMiddleware.asyncHandler(medicosController.gerarRelatorioEspecialidades));

// GET /api/medicos/relatorios/estatisticas - Estatísticas detalhadas
router.get('/relatorios/estatisticas', centralMiddleware.asyncHandler(medicosController.obterEstatisticas));

// POST /api/medicos/importar - Importar médicos em lote
router.post('/importar', 
  uploadImportacao,
  handleUploadErrors,
  validateFilePresence,
  centralMiddleware.asyncHandler(medicosController.importarMedicos)
);

// GET /api/medicos/importar/template - Baixar template de importação
router.get('/importar/template', centralMiddleware.asyncHandler(medicosController.baixarTemplateImportacao));

module.exports = router;
