const express = require('express');
const router = express.Router();
const databaseService = require('../services/database');
const ResponseService = require('../services/responseService');
const ValidationService = require('../services/validationService');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/allergies - Listar alergias
router.get('/', asyncHandler(async (req, res) => {
    console.log('📋 GET /api/allergies - Listando alergias');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const tipo = req.query.tipo || '';
    const gravidade = req.query.gravidade || '';
    const skip = (page - 1) * limit;

    // Construir filtros
    const where = {};
    
    if (search) {
        where.OR = [
            { nome: { contains: search, mode: 'insensitive' } },
            { sintomas: { contains: search, mode: 'insensitive' } },
            { paciente: { nome: { contains: search, mode: 'insensitive' } } }
        ];
    }
    
    if (tipo) {
        where.tipo = tipo;
    }
    
    if (gravidade) {
        where.gravidade = gravidade;
    }

    // Buscar alergias
    const [alergias, total] = await Promise.all([
        databaseService.client.allergy.findMany({
            where,
            include: {
                paciente: {
                    select: {
                        id: true,
                        nome: true,
                        cpf: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        databaseService.client.allergy.count({ where })
    ]);

    const pagination = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
    };

    return ResponseService.paginated(res, alergias, pagination);
}));

// POST /api/allergies - Criar nova alergia
router.post('/', asyncHandler(async (req, res) => {
    console.log('💾 POST /api/allergies - Criando nova alergia');
    
    const {
        pacienteId,
        nome,
        tipo,
        gravidade,
        status = 'ATIVO',
        sintomas,
        observacoes,
        dataIdentificacao
    } = req.body;

    // Validação básica
    if (!pacienteId || !nome || !tipo || !gravidade) {
        return ResponseService.error(res, 'Campos obrigatórios: pacienteId, nome, tipo, gravidade', 400);
    }

    // Verificar se paciente existe
    const paciente = await databaseService.client.paciente.findUnique({
        where: { id: parseInt(pacienteId) }
    });

    if (!paciente) {
        return ResponseService.error(res, 'Paciente não encontrado', 404);
    }

    // Criar alergia
    const alergia = await databaseService.client.allergy.create({
        data: {
            pacienteId: parseInt(pacienteId),
            nome: ValidationService.sanitizeText(nome, { maxLength: 200 }),
            tipo: tipo.toUpperCase(),
            gravidade: gravidade.toUpperCase(),
            status: status.toUpperCase(),
            sintomas: sintomas ? ValidationService.sanitizeText(sintomas, { maxLength: 500 }) : null,
            observacoes: observacoes ? ValidationService.sanitizeText(observacoes, { maxLength: 1000 }) : null,
            dataIdentificacao: dataIdentificacao ? new Date(dataIdentificacao) : new Date()
        },
        include: {
            paciente: {
                select: {
                    id: true,
                    nome: true,
                    cpf: true
                }
            }
        }
    });

    console.log('✅ Alergia criada com sucesso:', alergia.id);
    return ResponseService.success(res, alergia, 'Alergia registrada com sucesso', 201);
}));

// GET /api/allergies/:id - Obter alergia específica
router.get('/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (!id) {
        return ResponseService.error(res, 'ID da alergia inválido', 400);
    }

    const alergia = await databaseService.client.allergy.findUnique({
        where: { id },
        include: {
            paciente: {
                select: {
                    id: true,
                    nome: true,
                    cpf: true,
                    telefone: true,
                    email: true
                }
            }
        }
    });

    if (!alergia) {
        return ResponseService.error(res, 'Alergia não encontrada', 404);
    }

    return ResponseService.success(res, alergia);
}));

// PUT /api/allergies/:id - Atualizar alergia
router.put('/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (!id) {
        return ResponseService.error(res, 'ID da alergia inválido', 400);
    }

    const {
        nome,
        tipo,
        gravidade,
        status,
        sintomas,
        observacoes,
        dataIdentificacao
    } = req.body;

    // Verificar se alergia existe
    const alergiaExistente = await databaseService.client.allergy.findUnique({
        where: { id }
    });

    if (!alergiaExistente) {
        return ResponseService.error(res, 'Alergia não encontrada', 404);
    }

    // Atualizar dados
    const dadosAtualizacao = {};
    
    if (nome) dadosAtualizacao.nome = ValidationService.sanitizeText(nome, { maxLength: 200 });
    if (tipo) dadosAtualizacao.tipo = tipo.toUpperCase();
    if (gravidade) dadosAtualizacao.gravidade = gravidade.toUpperCase();
    if (status) dadosAtualizacao.status = status.toUpperCase();
    if (sintomas !== undefined) dadosAtualizacao.sintomas = sintomas ? ValidationService.sanitizeText(sintomas, { maxLength: 500 }) : null;
    if (observacoes !== undefined) dadosAtualizacao.observacoes = observacoes ? ValidationService.sanitizeText(observacoes, { maxLength: 1000 }) : null;
    if (dataIdentificacao) dadosAtualizacao.dataIdentificacao = new Date(dataIdentificacao);

    const alergia = await databaseService.client.allergy.update({
        where: { id },
        data: dadosAtualizacao,
        include: {
            paciente: {
                select: {
                    id: true,
                    nome: true,
                    cpf: true
                }
            }
        }
    });

    console.log('✅ Alergia atualizada com sucesso:', id);
    return ResponseService.success(res, alergia, 'Alergia atualizada com sucesso');
}));

// DELETE /api/allergies/:id - Excluir alergia
router.delete('/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (!id) {
        return ResponseService.error(res, 'ID da alergia inválido', 400);
    }

    // Verificar se alergia existe
    const alergia = await databaseService.client.allergy.findUnique({
        where: { id }
    });

    if (!alergia) {
        return ResponseService.error(res, 'Alergia não encontrada', 404);
    }

    // Excluir alergia
    await databaseService.client.allergy.delete({
        where: { id }
    });

    console.log('✅ Alergia excluída com sucesso:', id);
    return ResponseService.success(res, null, 'Alergia excluída com sucesso');
}));

// GET /api/allergies/patient/:pacienteId - Obter alergias de um paciente específico
router.get('/patient/:pacienteId', asyncHandler(async (req, res) => {
    const pacienteId = parseInt(req.params.pacienteId);
    
    if (!pacienteId) {
        return ResponseService.error(res, 'ID do paciente inválido', 400);
    }

    const alergias = await databaseService.client.allergy.findMany({
        where: { pacienteId },
        include: {
            paciente: {
                select: {
                    id: true,
                    nome: true,
                    cpf: true
                }
            }
        },
        orderBy: { gravidade: 'desc' }
    });

    return ResponseService.success(res, alergias);
}));

// GET /api/allergies/statistics - Estatísticas de alergias
router.get('/statistics', asyncHandler(async (req, res) => {
    const [
        totalAlergias,
        pacientesComAlergias,
        alergiasPorTipo,
        alergiasPorGravidade,
        alergiasAtivas
    ] = await Promise.all([
        databaseService.client.allergy.count(),
        databaseService.client.paciente.count({
            where: {
                alergias: {
                    some: {}
                }
            }
        }),
        databaseService.client.allergy.groupBy({
            by: ['tipo'],
            _count: true
        }),
        databaseService.client.allergy.groupBy({
            by: ['gravidade'],
            _count: true
        }),
        databaseService.client.allergy.count({
            where: { status: 'ATIVO' }
        })
    ]);

    const estatisticas = {
        total: totalAlergias,
        pacientesAfetados: pacientesComAlergias,
        ativas: alergiasAtivas,
        porTipo: alergiasPorTipo.reduce((acc, item) => {
            acc[item.tipo] = item._count;
            return acc;
        }, {}),
        porGravidade: alergiasPorGravidade.reduce((acc, item) => {
            acc[item.gravidade] = item._count;
            return acc;
        }, {})
    };

    return ResponseService.success(res, estatisticas);
}));

module.exports = router;