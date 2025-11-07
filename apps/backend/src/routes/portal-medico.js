const express = require('express');
const router = express.Router();
const databaseService = require('../services/DatabaseService');
const ResponseService = require('../services/responseService');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/portal-medico/:medicoId/dashboard - Dashboard do médico
router.get('/:medicoId/dashboard', asyncHandler(async (req, res) => {
    const medicoId = req.params.medicoId;
    
    console.log(`📊 GET /api/portal-medico/${medicoId}/dashboard - Dashboard do médico`);

    // Verificar se médico existe
    const medico = await databaseService.client.medico.findUnique({
        where: { id: medicoId },
        include: { usuario: true }
    });

    if (!medico) {
        return ResponseService.error(res, 'Médico não encontrado', 404);
    }

    // Calcular estatísticas
    const dataAtual = new Date();
    const inicioMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
    
    const [
        totalPacientes,
        consultasMes,
        prescricoesMes,
        agendamentosPendentes,
        atividadesRecentes
    ] = await Promise.all([
        // Total de pacientes únicos atendidos pelo médico
        databaseService.client.prontuario.findMany({
            where: { medico_id: medicoId },
            select: { paciente_id: true },
            distinct: ['paciente_id']
        }).then(results => results.length),
        
        // Consultas este mês
        databaseService.client.consulta.count({
            where: {
                medico_id: medicoId,
                data_hora: { gte: inicioMes }
            }
        }),
        
        // Prescrições este mês
        databaseService.client.prescricao.count({
            where: {
                medico_id: medicoId,
                criado_em: { gte: inicioMes }
            }
        }),
        
        // Agendamentos pendentes
        databaseService.client.agendamento.count({
            where: {
                medico_id: medicoId,
                status: { in: ['AGENDADO', 'CONFIRMADO'] },
                data_hora: { gte: dataAtual }
            }
        }),
        
        // Atividades recentes (últimas 10)
        databaseService.client.consulta.findMany({
            where: { medico_id: medicoId },
            include: {
                paciente: {
                    select: { nome: true }
                }
            },
            orderBy: { data_hora: 'desc' },
            take: 10
        })
    ]);

    const dashboard = {
        medico: {
            nome: medico.usuario.nome,
            crm: medico.crm,
            especialidade: medico.especialidade
        },
        estatisticas: {
            totalPacientes,
            consultasMes,
            prescricoesMes,
            agendamentosPendentes
        },
        atividadesRecentes: atividadesRecentes.map(consulta => ({
            id: consulta.id,
            tipo: 'consulta',
            paciente: consulta.paciente.nome,
            data: consulta.data_hora,
            descricao: `Consulta - ${consulta.tipo}`,
            status: consulta.status
        }))
    };

    return ResponseService.success(res, dashboard);
}));

// GET /api/portal-medico/:medicoId/pacientes - Pacientes do médico
router.get('/:medicoId/pacientes', asyncHandler(async (req, res) => {
    const medicoId = req.params.medicoId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    console.log(`👥 GET /api/portal-medico/${medicoId}/pacientes - Pacientes do médico`);

    // Buscar pacientes únicos que tiveram consultas com este médico
    const whereClause = {
        prontuarios: {
            some: { medico_id: medicoId }
        }
    };

    if (search) {
        whereClause.OR = [
            { nome: { contains: search, mode: 'insensitive' } },
            { cpf: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [pacientes, total] = await Promise.all([
        databaseService.client.paciente.findMany({
            where: whereClause,
            include: {
                prontuarios: {
                    where: { medico_id: medicoId },
                    orderBy: { data_consulta: 'desc' },
                    take: 1,
                    select: {
                        data_consulta: true,
                        tipo_consulta: true
                    }
                },
                alergias: {
                    where: { gravidade: { in: ['GRAVE', 'MUITO_GRAVE'] } },
                    select: { substancia: true, gravidade: true }
                },
                _count: {
                    select: {
                        prontuarios: {
                            where: { medico_id: medicoId }
                        }
                    }
                }
            },
            orderBy: { nome: 'asc' },
            skip,
            take: limit
        }),
        databaseService.client.paciente.count({ where: whereClause })
    ]);

    const pacientesFormatados = pacientes.map(paciente => ({
        id: paciente.id,
        nome: paciente.nome,
        cpf: paciente.cpf,
        telefone: paciente.telefone || paciente.celular,
        email: paciente.email,
        idade: calcularIdade(paciente.data_nascimento),
        ultimaConsulta: paciente.prontuarios[0]?.data_consulta || null,
        tipoUltimaConsulta: paciente.prontuarios[0]?.tipo_consulta || null,
        totalConsultas: paciente._count.prontuarios,
        alergias: paciente.alergias.map(a => a.substancia),
        temAlergiaGrave: paciente.alergias.length > 0
    }));

    const pagination = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
    };

    return ResponseService.paginated(res, pacientesFormatados, pagination);
}));

// GET /api/portal-medico/:medicoId/consultas - Consultas do médico
router.get('/:medicoId/consultas', asyncHandler(async (req, res) => {
    const medicoId = req.params.medicoId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || '';
    const dataInicio = req.query.dataInicio;
    const dataFim = req.query.dataFim;
    const skip = (page - 1) * limit;

    console.log(`📅 GET /api/portal-medico/${medicoId}/consultas - Consultas do médico`);

    const whereClause = { medico_id: medicoId };

    if (status) {
        whereClause.status = status;
    }

    if (dataInicio && dataFim) {
        whereClause.data_hora = {
            gte: new Date(dataInicio),
            lte: new Date(dataFim)
        };
    }

    const [consultas, total] = await Promise.all([
        databaseService.client.consulta.findMany({
            where: whereClause,
            include: {
                paciente: {
                    select: {
                        nome: true,
                        cpf: true,
                        telefone: true,
                        celular: true
                    }
                }
            },
            orderBy: { data_hora: 'desc' },
            skip,
            take: limit
        }),
        databaseService.client.consulta.count({ where: whereClause })
    ]);

    const consultasFormatadas = consultas.map(consulta => ({
        id: consulta.id,
        dataHora: consulta.data_hora,
        tipo: consulta.tipo,
        status: consulta.status,
        valor: consulta.valor,
        observacoes: consulta.observacoes,
        paciente: {
            nome: consulta.paciente.nome,
            cpf: consulta.paciente.cpf,
            contato: consulta.paciente.telefone || consulta.paciente.celular
        }
    }));

    const pagination = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
    };

    return ResponseService.paginated(res, consultasFormatadas, pagination);
}));

// GET /api/portal-medico/:medicoId/prescricoes - Prescrições do médico
router.get('/:medicoId/prescricoes', asyncHandler(async (req, res) => {
    const medicoId = req.params.medicoId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const validaApenas = req.query.valida === 'true';
    const skip = (page - 1) * limit;

    console.log(`💊 GET /api/portal-medico/${medicoId}/prescricoes - Prescrições do médico`);

    const whereClause = { medico_id: medicoId };

    if (validaApenas) {
        const dataAtual = new Date();
        whereClause.data_validade = {
            gte: dataAtual
        };
    }

    const [prescricoes, total] = await Promise.all([
        databaseService.client.prescricao.findMany({
            where: whereClause,
            include: {
                prontuario: {
                    include: {
                        paciente: {
                            select: {
                                nome: true,
                                cpf: true
                            }
                        }
                    }
                }
            },
            orderBy: { criado_em: 'desc' },
            skip,
            take: limit
        }),
        databaseService.client.prescricao.count({ where: whereClause })
    ]);

    const prescricoesFormatadas = prescricoes.map(prescricao => ({
        id: prescricao.id,
        dataEmissao: prescricao.criado_em,
        dataValidade: prescricao.data_validade,
        medicamentos: prescricao.medicamentos,
        observacoes: prescricao.observacoes,
        paciente: {
            nome: prescricao.prontuario.paciente.nome,
            cpf: prescricao.prontuario.paciente.cpf
        },
        prontuarioId: prescricao.prontuario_id,
        valida: prescricao.data_validade ? new Date(prescricao.data_validade) > new Date() : true
    }));

    const pagination = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
    };

    return ResponseService.paginated(res, prescricoesFormatadas, pagination);
}));

// GET /api/portal-medico/:medicoId/agendamentos - Agendamentos do médico
router.get('/:medicoId/agendamentos', asyncHandler(async (req, res) => {
    const medicoId = req.params.medicoId;
    const dataInicio = req.query.dataInicio;
    const dataFim = req.query.dataFim;
    const status = req.query.status;

    console.log(`📆 GET /api/portal-medico/${medicoId}/agendamentos - Agendamentos do médico`);

    const whereClause = { medico_id: medicoId };

    if (dataInicio && dataFim) {
        whereClause.data_hora = {
            gte: new Date(dataInicio),
            lte: new Date(dataFim)
        };
    } else {
        // Por padrão, mostrar próximos 30 dias
        const hoje = new Date();
        const proximoMes = new Date();
        proximoMes.setDate(hoje.getDate() + 30);
        
        whereClause.data_hora = {
            gte: hoje,
            lte: proximoMes
        };
    }

    if (status) {
        whereClause.status = status;
    }

    const agendamentos = await databaseService.client.agendamento.findMany({
        where: whereClause,
        include: {
            paciente: {
                select: {
                    nome: true,
                    cpf: true,
                    telefone: true,
                    celular: true
                }
            }
        },
        orderBy: { data_hora: 'asc' }
    });

    const agendamentosFormatados = agendamentos.map(agendamento => ({
        id: agendamento.id,
        dataHora: agendamento.data_hora,
        duracaoMinutos: agendamento.duracao_minutos,
        tipoConsulta: agendamento.tipo_consulta,
        status: agendamento.status,
        observacoes: agendamento.observacoes,
        paciente: {
            nome: agendamento.paciente.nome,
            cpf: agendamento.paciente.cpf,
            contato: agendamento.paciente.telefone || agendamento.paciente.celular
        }
    }));

    return ResponseService.success(res, agendamentosFormatados);
}));

// GET /api/portal-medico/:medicoId/estatisticas - Estatísticas detalhadas do médico
router.get('/:medicoId/estatisticas', asyncHandler(async (req, res) => {
    const medicoId = req.params.medicoId;
    const periodo = req.query.periodo || '30'; // dias

    console.log(`📈 GET /api/portal-medico/${medicoId}/estatisticas - Estatísticas do médico`);

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));

    const [
        consultasPorTipo,
        consultasPorStatus,
        prescricoesPorMes,
        pacientesPorIdade,
        medicoInfo
    ] = await Promise.all([
        // Consultas por tipo
        databaseService.client.consulta.groupBy({
            by: ['tipo'],
            where: {
                medico_id: medicoId,
                data_hora: { gte: dataLimite }
            },
            _count: true
        }),
        
        // Consultas por status
        databaseService.client.consulta.groupBy({
            by: ['status'],
            where: {
                medico_id: medicoId,
                data_hora: { gte: dataLimite }
            },
            _count: true
        }),
        
        // Prescrições por mês (últimos 6 meses)
        databaseService.client.prescricao.findMany({
            where: {
                medico_id: medicoId,
                criado_em: {
                    gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                }
            },
            select: { criado_em: true }
        }),
        
        // Distribuição de idade dos pacientes
        databaseService.client.paciente.findMany({
            where: {
                prontuarios: {
                    some: { medico_id: medicoId }
                }
            },
            select: { data_nascimento: true }
        }),
        
        // Informações do médico
        databaseService.client.medico.findUnique({
            where: { id: medicoId },
            include: { usuario: true }
        })
    ]);

    // Processar dados
    const estatisticas = {
        medico: {
            nome: medicoInfo.usuario.nome,
            crm: medicoInfo.crm,
            especialidade: medicoInfo.especialidade
        },
        periodo: `Últimos ${periodo} dias`,
        consultas: {
            porTipo: consultasPorTipo.reduce((acc, item) => {
                acc[item.tipo] = item._count;
                return acc;
            }, {}),
            porStatus: consultasPorStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
            }, {})
        },
        prescricoesPorMes: processarPrescricoesPorMes(prescricoesPorMes),
        pacientesPorIdade: processarIdadePacientes(pacientesPorIdade)
    };

    return ResponseService.success(res, estatisticas);
}));

// Funções auxiliares
function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    
    return idade;
}

function processarPrescricoesPorMes(prescricoes) {
    const meses = {};
    
    prescricoes.forEach(prescricao => {
        const mes = new Date(prescricao.criado_em).toISOString().slice(0, 7); // YYYY-MM
        meses[mes] = (meses[mes] || 0) + 1;
    });
    
    return meses;
}

function processarIdadePacientes(pacientes) {
    const faixas = {
        '0-18': 0,
        '19-30': 0,
        '31-50': 0,
        '51-70': 0,
        '70+': 0
    };
    
    pacientes.forEach(paciente => {
        const idade = calcularIdade(paciente.data_nascimento);
        
        if (idade <= 18) faixas['0-18']++;
        else if (idade <= 30) faixas['19-30']++;
        else if (idade <= 50) faixas['31-50']++;
        else if (idade <= 70) faixas['51-70']++;
        else faixas['70+']++;
    });
    
    return faixas;
}

module.exports = router;