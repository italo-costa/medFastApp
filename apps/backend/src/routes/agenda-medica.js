const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Dashboard - Estatísticas da agenda
router.get('/dashboard', async (req, res) => {
    try {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23, 59, 59, 999);
        
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        fimMes.setHours(23, 59, 59, 999);

        const [agendamentosHoje, agendamentosAmanha, agendamentosSemana, agendamentosMes] = await Promise.all([
            // Agendamentos hoje
            prisma.agendamento.count({
                where: {
                    dataHora: {
                        gte: hoje,
                        lt: amanha
                    }
                }
            }),
            
            // Agendamentos amanhã
            prisma.agendamento.count({
                where: {
                    dataHora: {
                        gte: amanha,
                        lt: new Date(amanha.getTime() + 24 * 60 * 60 * 1000)
                    }
                }
            }),
            
            // Agendamentos desta semana
            prisma.agendamento.count({
                where: {
                    dataHora: {
                        gte: inicioSemana,
                        lte: fimSemana
                    }
                }
            }),
            
            // Agendamentos deste mês
            prisma.agendamento.count({
                where: {
                    dataHora: {
                        gte: inicioMes,
                        lte: fimMes
                    }
                }
            })
        ]);

        res.json({
            agendamentosHoje,
            agendamentosAmanha,
            agendamentosSemana,
            agendamentosMes
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas da agenda:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar todos os agendamentos
router.get('/agendamentos', async (req, res) => {
    try {
        const { status, tipo, dataInicio, dataFim, medicoId, pacienteId } = req.query;
        
        const whereClause = {};
        
        if (status) {
            whereClause.status = status;
        }
        
        if (tipo) {
            whereClause.tipo = tipo;
        }
        
        if (medicoId) {
            whereClause.medicoId = parseInt(medicoId);
        }
        
        if (pacienteId) {
            whereClause.pacienteId = parseInt(pacienteId);
        }
        
        if (dataInicio && dataFim) {
            whereClause.dataHora = {
                gte: new Date(dataInicio),
                lte: new Date(dataFim)
            };
        } else if (dataInicio) {
            whereClause.dataHora = {
                gte: new Date(dataInicio)
            };
        } else if (dataFim) {
            whereClause.dataHora = {
                lte: new Date(dataFim)
            };
        }

        const agendamentos = await prisma.agendamento.findMany({
            where: whereClause,
            include: {
                paciente: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        email: true
                    }
                },
                medico: {
                    select: {
                        id: true,
                        usuario: {
                            select: {
                                nome: true
                            }
                        },
                        especialidade: true,
                        crm: true
                    }
                }
            },
            orderBy: {
                data_hora: 'asc'
            }
        });

        // Formatar dados para o frontend
        const agendamentosFormatados = agendamentos.map(agendamento => {
            const dataHora = new Date(agendamento.data_hora);
            return {
                id: agendamento.id,
                pacienteId: agendamento.paciente_id,
                pacienteNome: agendamento.paciente.nome,
                medicoId: agendamento.medico_id,
                medicoNome: agendamento.medico.usuario?.nome || 'Médico',
                data: dataHora.toISOString().split('T')[0],
                hora: dataHora.toTimeString().slice(0, 5),
                tipo: agendamento.tipo_consulta,
                status: agendamento.status,
                duracao: agendamento.duracao_minutos || 60,
                observacoes: agendamento.observacoes
            };
        });

        res.json(agendamentosFormatados);
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar novo agendamento
router.post('/agendamentos', async (req, res) => {
    try {
        const { pacienteId, medicoId, data, hora, tipo, duracao, observacoes } = req.body;
        
        // Validar dados obrigatórios
        if (!pacienteId || !medicoId || !data || !hora || !tipo) {
            return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
        }

        // Combinar data e hora
        const dataHora = new Date(`${data}T${hora}:00`);
        
        // Verificar se o horário está disponível
        const agendamentoExistente = await prisma.agendamento.findFirst({
            where: {
                medico_id: medicoId,
                data_hora: dataHora
            }
        });
        
        if (agendamentoExistente) {
            return res.status(409).json({ error: 'Horário já ocupado para este médico' });
        }

        const novoAgendamento = await prisma.agendamento.create({
            data: {
                paciente_id: pacienteId,
                medico_id: medicoId,
                data_hora: dataHora,
                tipo_consulta: tipo,
                duracao_minutos: parseInt(duracao) || 60,
                observacoes: observacoes || null,
                status: 'AGENDADO'
            },
            include: {
                paciente: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true
                    }
                },
                medico: {
                    select: {
                        id: true,
                        nome: true,
                        especialidade: true
                    }
                }
            }
        });

        // Formatar resposta
        const agendamentoFormatado = {
            id: novoAgendamento.id,
            pacienteId: novoAgendamento.paciente_id,
            pacienteNome: novoAgendamento.paciente.nome,
            medicoId: novoAgendamento.medico_id,
            medicoNome: novoAgendamento.medico.usuario?.nome || 'Médico',
            data: novoAgendamento.data_hora.toISOString().split('T')[0],
            hora: novoAgendamento.data_hora.toTimeString().slice(0, 5),
            tipo: novoAgendamento.tipo_consulta,
            status: novoAgendamento.status,
            duracao: novoAgendamento.duracao_minutos,
            observacoes: novoAgendamento.observacoes
        };

        res.status(201).json(agendamentoFormatado);
    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar agendamento
router.put('/agendamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { pacienteId, medicoId, data, hora, tipo, duracao, observacoes, status } = req.body;
        
        const agendamentoExistente = await prisma.agendamento.findUnique({
            where: { id: parseInt(id) }
        });
        
        if (!agendamentoExistente) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }

        // Combinar data e hora se fornecidas
        let dataHora = agendamentoExistente.dataHora;
        if (data && hora) {
            dataHora = new Date(`${data}T${hora}:00`);
            
            // Verificar se o novo horário está disponível (exceto para o próprio agendamento)
            const conflitoHorario = await prisma.agendamento.findFirst({
                where: {
                    id: { not: parseInt(id) },
                    medicoId: parseInt(medicoId || agendamentoExistente.medicoId),
                    dataHora: dataHora
                }
            });
            
            if (conflitoHorario) {
                return res.status(409).json({ error: 'Horário já ocupado para este médico' });
            }
        }

        const agendamentoAtualizado = await prisma.agendamento.update({
            where: { id: parseInt(id) },
            data: {
                pacienteId: pacienteId ? parseInt(pacienteId) : undefined,
                medicoId: medicoId ? parseInt(medicoId) : undefined,
                dataHora: dataHora,
                tipo: tipo || undefined,
                duracao: duracao ? parseInt(duracao) : undefined,
                observacoes: observacoes !== undefined ? observacoes : undefined,
                status: status || undefined
            },
            include: {
                paciente: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true
                    }
                },
                medico: {
                    select: {
                        id: true,
                        nome: true,
                        especialidade: true
                    }
                }
            }
        });

        // Formatar resposta
        const agendamentoFormatado = {
            id: agendamentoAtualizado.id,
            pacienteId: agendamentoAtualizado.pacienteId,
            pacienteNome: agendamentoAtualizado.paciente.nome,
            medicoId: agendamentoAtualizado.medicoId,
            medicoNome: agendamentoAtualizado.medico.nome,
            data: agendamentoAtualizado.dataHora.toISOString().split('T')[0],
            hora: agendamentoAtualizado.dataHora.toTimeString().slice(0, 5),
            tipo: agendamentoAtualizado.tipo,
            status: agendamentoAtualizado.status,
            duracao: agendamentoAtualizado.duracao,
            observacoes: agendamentoAtualizado.observacoes
        };

        res.json(agendamentoFormatado);
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Confirmar agendamento
router.patch('/agendamentos/:id/confirmar', async (req, res) => {
    try {
        const { id } = req.params;
        
        const agendamentoAtualizado = await prisma.agendamento.update({
            where: { id: parseInt(id) },
            data: { status: 'confirmado' },
            include: {
                paciente: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                medico: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            }
        });

        res.json({ 
            message: 'Agendamento confirmado com sucesso',
            agendamento: agendamentoAtualizado
        });
    } catch (error) {
        console.error('Erro ao confirmar agendamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Cancelar agendamento
router.delete('/agendamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const agendamentoExistente = await prisma.agendamento.findUnique({
            where: { id: parseInt(id) }
        });
        
        if (!agendamentoExistente) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }

        await prisma.agendamento.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Agendamento cancelado com sucesso' });
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar pacientes para seleção
router.get('/pacientes', async (req, res) => {
    try {
        const pacientes = await prisma.paciente.findMany({
            select: {
                id: true,
                nome: true,
                telefone: true,
                email: true
            },
            orderBy: {
                nome: 'asc'
            }
        });

        res.json(pacientes);
    } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar médicos para seleção
router.get('/medicos', async (req, res) => {
    try {
        const medicos = await prisma.medico.findMany({
            select: {
                id: true,
                nome: true,
                especialidade: true,
                crm: true
            },
            orderBy: {
                nome: 'asc'
            }
        });

        res.json(medicos);
    } catch (error) {
        console.error('Erro ao buscar médicos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Verificar disponibilidade de horário
router.get('/disponibilidade', async (req, res) => {
    try {
        const { medicoId, data } = req.query;
        
        if (!medicoId || !data) {
            return res.status(400).json({ error: 'Médico e data são obrigatórios' });
        }

        const inicioData = new Date(`${data}T00:00:00`);
        const fimData = new Date(`${data}T23:59:59`);

        const agendamentosOcupados = await prisma.agendamento.findMany({
            where: {
                medicoId: parseInt(medicoId),
                dataHora: {
                    gte: inicioData,
                    lte: fimData
                }
            },
            select: {
                dataHora: true,
                duracao: true
            }
        });

        // Gerar horários disponíveis (8h às 18h, intervalos de 30 min)
        const horariosDisponiveis = [];
        for (let hora = 8; hora < 18; hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                const horario = new Date(inicioData);
                horario.setHours(hora, minuto, 0, 0);
                
                // Verificar se o horário está ocupado
                const ocupado = agendamentosOcupados.some(ag => {
                    const inicioAgendamento = new Date(ag.dataHora);
                    const fimAgendamento = new Date(ag.dataHora);
                    fimAgendamento.setMinutes(fimAgendamento.getMinutes() + (ag.duracao || 60));
                    
                    return horario >= inicioAgendamento && horario < fimAgendamento;
                });
                
                if (!ocupado) {
                    horariosDisponiveis.push(horario.toTimeString().slice(0, 5));
                }
            }
        }

        res.json({ horariosDisponiveis });
    } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Relatório de agendamentos
router.get('/relatorio', async (req, res) => {
    try {
        const { dataInicio, dataFim, medicoId, tipo } = req.query;
        
        const whereClause = {};
        
        if (dataInicio && dataFim) {
            whereClause.dataHora = {
                gte: new Date(dataInicio),
                lte: new Date(dataFim)
            };
        }
        
        if (medicoId) {
            whereClause.medicoId = parseInt(medicoId);
        }
        
        if (tipo) {
            whereClause.tipo = tipo;
        }

        const [agendamentos, estatisticas] = await Promise.all([
            prisma.agendamento.findMany({
                where: whereClause,
                include: {
                    paciente: {
                        select: {
                            id: true,
                            nome: true,
                            telefone: true
                        }
                    },
                    medico: {
                        select: {
                            id: true,
                            nome: true,
                            especialidade: true
                        }
                    }
                },
                orderBy: {
                    dataHora: 'asc'
                }
            }),
            
            prisma.agendamento.groupBy({
                by: ['status'],
                where: whereClause,
                _count: {
                    status: true
                }
            })
        ]);

        res.json({
            agendamentos,
            estatisticas: {
                total: agendamentos.length,
                porStatus: estatisticas.reduce((acc, item) => {
                    acc[item.status] = item._count.status;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;