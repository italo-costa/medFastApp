/**
 * Rotas para gerenciamento de médicos
 */

const express = require('express');
const medicosController = require('../controllers/medicosController');
const { asyncHandler } = require('../middleware/errorHandling');
const { uploadMedicoFoto, handleUploadError, validarUploadFoto } = require('../middleware/uploadMiddleware');
const { uploadImportacao, handleUploadErrors, validateFilePresence } = require('../middleware/importUploadMiddleware');

const router = express.Router();

// GET /api/medicos - Listar médicos com filtros e paginação
router.get('/', asyncHandler(medicosController.listar));

// GET /api/medicos/:id - Buscar médico por ID
router.get('/:id', asyncHandler(medicosController.buscarPorId));

// POST /api/medicos - Criar novo médico
router.post('/', asyncHandler(medicosController.criar));

// PUT /api/medicos/:id - Atualizar médico
router.put('/:id', asyncHandler(medicosController.atualizar));

// DELETE /api/medicos/:id - Remover médico (soft delete)
router.delete('/:id', asyncHandler(medicosController.remover));

// POST /api/medicos/:id/foto - Upload de foto
router.post('/:id/foto', 
  uploadMedicoFoto, 
  handleUploadError, 
  validarUploadFoto,
  asyncHandler(medicosController.uploadFoto)
);

// DELETE /api/medicos/:id/foto - Remover foto
router.delete('/:id/foto', asyncHandler(medicosController.removerFoto));

// GET /api/medicos/relatorios/excel - Gerar relatório Excel
router.get('/relatorios/excel', asyncHandler(medicosController.gerarRelatorioExcel));

// GET /api/medicos/relatorios/especialidades - Relatório por especialidades
router.get('/relatorios/especialidades', asyncHandler(medicosController.gerarRelatorioEspecialidades));

// GET /api/medicos/relatorios/estatisticas - Estatísticas detalhadas
router.get('/relatorios/estatisticas', asyncHandler(medicosController.obterEstatisticas));

// POST /api/medicos/importar - Importar médicos em lote
router.post('/importar', 
  uploadImportacao,
  handleUploadErrors,
  validateFilePresence,
  asyncHandler(medicosController.importarMedicos)
);

// GET /api/medicos/importar/template - Baixar template de importação
router.get('/importar/template', asyncHandler(medicosController.baixarTemplateImportacao));

module.exports = router;