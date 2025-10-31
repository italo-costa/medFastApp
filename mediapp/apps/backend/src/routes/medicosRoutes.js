/**
 * Rotas para gerenciamento de médicos
 */

const express = require('express');
const medicosController = require('../controllers/medicosController');
const { asyncHandler } = require('../middleware/errorHandling');

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

module.exports = router;