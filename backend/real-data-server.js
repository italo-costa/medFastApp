const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const ViaCepService = require('./src/services/ViaCepService');

// Importar rotas
const authRoutes = require('./src/routes/auth');

const app = express();
const port = 3001;
const prisma = new PrismaClient();
const viaCepService = new ViaCepService();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Logger simples
const logger = {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
    error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`)
};

// Função para obter dados reais do banco
async function getRealDataFromDatabase() {
    const realData = {
        pacientes: { total: 0, novosEsteMes: 0, ativosUltimos30Dias: 0 },
        medicos: { total: 0, ativos: 0, especialidades: 0 },
        consultas: { hoje: 0, estaSemana: 0, esteMes: 0 },
        alergias: { pacientesComAlergias: 0, contraindicacoes: 0, alertasAtivos: 0 },
        exames: { total: 0, pendentes: 0, realizadosEsteMes: 0 },
        prontuarios: { total: 0, criadosEsteMes: 0, atualizadosHoje: 0 }
    };

    try {
        // Pacientes
        const totalPacientes = await prisma.paciente.count({ where: { ativo: true } });
        realData.pacientes.total = totalPacientes;

        // Médicos  
        const totalMedicos = await prisma.medico.count();
        realData.medicos.total = totalMedicos;
        realData.medicos.ativos = totalMedicos;

        // Exames
        const totalExames = await prisma.exame.count();
        const examesPendentes = await prisma.exameSolicitado.count();
        realData.exames.total = totalExames;
        realData.exames.pendentes = examesPendentes;

        // Prontuários
        const totalProntuarios = await prisma.prontuario.count();
        realData.prontuarios.total = totalProntuarios;

        // Alergias
        const pacientesComAlergias = await prisma.paciente.count({
            where: {
                ativo: true,
                alergias: { some: {} }
            }
        });
        realData.alergias.pacientesComAlergias = pacientesComAlergias;

        logger.info(`Dados reais coletados: ${totalPacientes} pacientes, ${totalMedicos} médicos, ${totalExames} exames`);
        return realData;

    } catch (error) {
        logger.error(`Erro ao coletar dados reais: ${error.message}`);
        return null;
    }
}

// API de estatísticas usando APENAS dados reais
app.get('/api/statistics/dashboard', async (req, res) => {
    try {
        logger.info('Obtendo estatísticas do dashboard com dados reais...');
        
        const realData = await getRealDataFromDatabase();
        
        if (!realData) {
            throw new Error('Não foi possível obter dados reais do banco');
        }

        // Usar APENAS dados reais - sem simulação ou fallback
        const dashboardStats = {
            pacientesCadastrados: {
                value: realData.pacientes.total.toString(),
                label: 'Pacientes Cadastrados',
                icon: 'fas fa-users',
                color: 'blue',
                trend: `${realData.pacientes.novosEsteMes} novos este mês`,
                realData: true
            },
            prontuariosCriados: {
                value: realData.prontuarios.total.toString(),
                label: 'Prontuários Criados',
                icon: 'fas fa-file-medical',
                color: 'green', 
                trend: `${realData.prontuarios.criadosEsteMes} este mês`,
                realData: true
            },
            examesRegistrados: {
                value: realData.exames.total.toLocaleString('pt-BR'),
                label: 'Exames Registrados',
                icon: 'fas fa-x-ray',
                color: 'purple',
                trend: `${realData.exames.pendentes} pendentes`,
                realData: true
            },
            medicosAtivos: {
                value: realData.medicos.ativos,
                label: 'Médicos Ativos',
                icon: 'fas fa-user-md',
                color: 'orange',
                trend: `${realData.medicos.total} cadastrados`,
                realData: true
            }
        };

        const metadata = {
            lastUpdated: new Date().toISOString(),
            dataSource: 'real_database',
            realDataSources: {
                pacientes: true,
                medicos: true,
                prontuarios: true,
                exames: true,
                alergias: true
            }
        };

        logger.info(`Retornando estatísticas reais: ${realData.pacientes.total} pacientes, ${realData.exames.total} exames`);
        
        res.json({
            success: true,
            data: dashboardStats,
            metadata: metadata
        });

    } catch (error) {
        logger.error(`Erro na API de estatísticas: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message,
            data: null
        });
    }
});

// API de médicos
app.get('/api/medicos', async (req, res) => {
    try {
        logger.info('Obtendo lista de médicos...');
        
        const medicos = await prisma.medico.findMany({
            include: {
                usuario: {
                    select: {
                        nome: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        consultas: true,
                        prontuarios: true
                    }
                }
            },
            orderBy: {
                criado_em: 'desc'
            }
        });

        logger.info(`${medicos.length} médicos encontrados`);
        
        res.json({
            success: true,
            data: medicos,
            total: medicos.length
        });

    } catch (error) {
        logger.error(`Erro na API de médicos: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message,
            data: []
        });
    }
});

// API para obter um médico específico por ID
app.get('/api/medicos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        logger.info(`Obtendo médico com ID: ${id}`);
        
        const medico = await prisma.medico.findUnique({
            where: { id: parseInt(id) },
            include: {
                usuario: {
                    select: {
                        nome: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        consultas: true,
                        prontuarios: true
                    }
                }
            }
        });

        if (!medico) {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }

        logger.info(`Médico encontrado: ${medico.nomeCompleto}`);
        
        res.json({
            success: true,
            data: medico
        });

    } catch (error) {
        logger.error(`Erro ao obter médico: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API para criar novo médico
app.post('/api/medicos', async (req, res) => {
    try {
        const medicoData = req.body;
        logger.info(`Cadastrando novo médico: ${medicoData.nomeCompleto}`);
        
        // Validação dos campos obrigatórios
        if (!medicoData.nomeCompleto || !medicoData.cpf || !medicoData.crm || 
            !medicoData.especialidade || !medicoData.telefone || !medicoData.email) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios: nomeCompleto, cpf, crm, especialidade, telefone, email'
            });
        }

        // Verificar se já existe médico com mesmo CRM ou CPF
        const medicoExistente = await prisma.medico.findFirst({
            where: {
                OR: [
                    { crm: medicoData.crm },
                    { cpf: medicoData.cpf }
                ]
            }
        });

        if (medicoExistente) {
            return res.status(400).json({
                success: false,
                message: 'Já existe um médico cadastrado com este CRM ou CPF'
            });
        }

        const novoMedico = await prisma.medico.create({
            data: {
                nomeCompleto: medicoData.nomeCompleto,
                cpf: medicoData.cpf,
                dataNascimento: medicoData.dataNascimento ? new Date(medicoData.dataNascimento) : null,
                sexo: medicoData.sexo || null,
                crm: medicoData.crm,
                especialidade: medicoData.especialidade,
                outrasEspecialidades: medicoData.outrasEspecialidades || null,
                telefone: medicoData.telefone,
                email: medicoData.email,
                cep: medicoData.cep || null,
                logradouro: medicoData.logradouro || null,
                numero: medicoData.numero || null,
                complemento: medicoData.complemento || null,
                bairro: medicoData.bairro || null,
                cidade: medicoData.cidade || null,
                estado: medicoData.estado || null,
                status: medicoData.status || 'ATIVO',
                observacoes: medicoData.observacoes || null
            }
        });

        logger.info(`Novo médico cadastrado: ${novoMedico.nomeCompleto} (${novoMedico.cpf})`);
        
        res.status(201).json({
            success: true,
            message: 'Médico cadastrado com sucesso',
            data: novoMedico
        });

    } catch (error) {
        logger.error(`Erro ao cadastrar médico: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API para atualizar médico
app.put('/api/medicos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const medicoData = req.body;
        logger.info(`Atualizando médico com ID: ${id}`);
        
        // Verificar se o médico existe
        const medicoExistente = await prisma.medico.findUnique({
            where: { id: parseInt(id) }
        });

        if (!medicoExistente) {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }

        // Verificar se CRM ou CPF já existem em outro médico
        if (medicoData.crm || medicoData.cpf) {
            const conflito = await prisma.medico.findFirst({
                where: {
                    AND: [
                        { id: { not: parseInt(id) } },
                        {
                            OR: [
                                { crm: medicoData.crm },
                                { cpf: medicoData.cpf }
                            ]
                        }
                    ]
                }
            });

            if (conflito) {
                return res.status(400).json({
                    success: false,
                    message: 'Já existe outro médico cadastrado com este CRM ou CPF'
                });
            }
        }

        const medicoAtualizado = await prisma.medico.update({
            where: { id: parseInt(id) },
            data: {
                nomeCompleto: medicoData.nomeCompleto || medicoExistente.nomeCompleto,
                cpf: medicoData.cpf || medicoExistente.cpf,
                dataNascimento: medicoData.dataNascimento ? new Date(medicoData.dataNascimento) : medicoExistente.dataNascimento,
                sexo: medicoData.sexo !== undefined ? medicoData.sexo : medicoExistente.sexo,
                crm: medicoData.crm || medicoExistente.crm,
                especialidade: medicoData.especialidade || medicoExistente.especialidade,
                outrasEspecialidades: medicoData.outrasEspecialidades !== undefined ? medicoData.outrasEspecialidades : medicoExistente.outrasEspecialidades,
                telefone: medicoData.telefone || medicoExistente.telefone,
                email: medicoData.email || medicoExistente.email,
                cep: medicoData.cep !== undefined ? medicoData.cep : medicoExistente.cep,
                logradouro: medicoData.logradouro !== undefined ? medicoData.logradouro : medicoExistente.logradouro,
                numero: medicoData.numero !== undefined ? medicoData.numero : medicoExistente.numero,
                complemento: medicoData.complemento !== undefined ? medicoData.complemento : medicoExistente.complemento,
                bairro: medicoData.bairro !== undefined ? medicoData.bairro : medicoExistente.bairro,
                cidade: medicoData.cidade !== undefined ? medicoData.cidade : medicoExistente.cidade,
                estado: medicoData.estado !== undefined ? medicoData.estado : medicoExistente.estado,
                status: medicoData.status || medicoExistente.status,
                observacoes: medicoData.observacoes !== undefined ? medicoData.observacoes : medicoExistente.observacoes,
                atualizado_em: new Date()
            }
        });

        logger.info(`Médico atualizado: ${medicoAtualizado.nomeCompleto}`);
        
        res.json({
            success: true,
            message: 'Médico atualizado com sucesso',
            data: medicoAtualizado
        });

    } catch (error) {
        logger.error(`Erro ao atualizar médico: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API para excluir médico
app.delete('/api/medicos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        logger.info(`Excluindo médico com ID: ${id}`);
        
        // Verificar se o médico existe
        const medicoExistente = await prisma.medico.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: {
                        consultas: true,
                        prontuarios: true
                    }
                }
            }
        });

        if (!medicoExistente) {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }

        // Verificar se o médico tem consultas ou prontuários associados
        if (medicoExistente._count.consultas > 0 || medicoExistente._count.prontuarios > 0) {
            // Soft delete - apenas marcar como inativo
            await prisma.medico.update({
                where: { id: parseInt(id) },
                data: {
                    status: 'INATIVO',
                    atualizado_em: new Date()
                }
            });

            logger.info(`Médico marcado como inativo: ${medicoExistente.nomeCompleto} (tinha ${medicoExistente._count.consultas} consultas e ${medicoExistente._count.prontuarios} prontuários)`);
            
            res.json({
                success: true,
                message: 'Médico desativado com sucesso (mantido no sistema devido a consultas/prontuários associados)',
                type: 'soft_delete'
            });
        } else {
            // Hard delete - excluir completamente
            await prisma.medico.delete({
                where: { id: parseInt(id) }
            });

            logger.info(`Médico excluído permanentemente: ${medicoExistente.nomeCompleto}`);
            
            res.json({
                success: true,
                message: 'Médico excluído com sucesso',
                type: 'hard_delete'
            });
        }

    } catch (error) {
        logger.error(`Erro ao excluir médico: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API de pacientes
app.get('/api/pacientes', async (req, res) => {
    try {
        logger.info('Obtendo lista de pacientes...');
        
        const pacientes = await prisma.paciente.findMany({
            where: { ativo: true },
            include: {
                _count: {
                    select: {
                        prontuarios: true,
                        alergias: true,
                        consultas: true
                    }
                }
            },
            orderBy: {
                criado_em: 'desc'
            }
        });

        logger.info(`${pacientes.length} pacientes encontrados`);
        
        res.json({
            success: true,
            data: pacientes,
            total: pacientes.length
        });

    } catch (error) {
        logger.error(`Erro na API de pacientes: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message,
            data: []
        });
    }
});

// API de pacientes com informações da última consulta
app.get('/api/patients', async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        
        logger.info(`Obtendo lista de pacientes... Busca: "${search || 'todos'}"`);
        
        // Construir filtros
        const where = { ativo: true };
        if (search) {
            where.OR = [
                { nome: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        // Buscar pacientes com informações da última consulta
        const pacientes = await prisma.paciente.findMany({
            where,
            include: {
                consultas: {
                    include: {
                        medico: {
                            include: {
                                usuario: {
                                    select: {
                                        nome: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        data_hora: 'desc'
                    },
                    take: 1
                },
                _count: {
                    select: {
                        prontuarios: true,
                        alergias: true,
                        consultas: true
                    }
                }
            },
            orderBy: {
                criado_em: 'desc'
            },
            skip: (page - 1) * limit,
            take: parseInt(limit)
        });

        // Contar total para paginação
        const total = await prisma.paciente.count({ where });
        
        // Formatar dados com informações da última consulta
        const pacientesFormatados = pacientes.map(paciente => {
            const ultimaConsulta = paciente.consultas[0];
            
            return {
                ...paciente,
                ultimaConsulta: ultimaConsulta ? {
                    data: ultimaConsulta.data_consulta,
                    medico: ultimaConsulta.medico?.usuario?.nome || 'Médico não encontrado',
                    tipo: ultimaConsulta.tipo_consulta || 'Consulta',
                    status: ultimaConsulta.status || 'Concluída'
                } : null
            };
        });

        logger.info(`${pacientesFormatados.length} pacientes encontrados (${total} total)`);
        
        res.json({
            success: true,
            patients: pacientesFormatados,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        });

    } catch (error) {
        logger.error(`Erro na API de pacientes: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message,
            patients: []
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'MediApp Real Data Server'
    });
});

// Servir app.html como página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

app.get('/app.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// =============================================================================
// APIS DE INTEGRAÇÃO EXTERNA - VIACEP
// =============================================================================

// API para buscar CEP individual (usado no frontend)
app.get('/api/viacep/:cep', async (req, res) => {
    try {
        const { cep } = req.params;
        logger.info(`📍 Consultando CEP: ${cep}`);
        
        const resultado = await viaCepService.consultarCep(cep);
        
        if (resultado) {
            res.json({
                success: true,
                data: resultado
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'CEP não encontrado'
            });
        }

    } catch (error) {
        logger.error(`Erro ao consultar CEP ${req.params.cep}: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API para consultar CEP
app.post('/api/cep/consultar', async (req, res) => {
    try {
        const { cep } = req.body;

        if (!cep) {
            return res.status(400).json({
                success: false,
                error: 'CEP é obrigatório',
                code: 'MISSING_CEP'
            });
        }

        logger.info(`📍 Consultando CEP: ${cep}`);

        const result = await viaCepService.consultarCep(cep);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);

    } catch (error) {
        logger.error(`Erro na consulta de CEP: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// API para buscar CEP por endereço (busca reversa)
app.post('/api/cep/buscar-por-endereco', async (req, res) => {
    try {
        const { uf, cidade, logradouro } = req.body;

        if (!uf || !cidade || !logradouro) {
            return res.status(400).json({
                success: false,
                error: 'UF, cidade e logradouro são obrigatórios',
                code: 'MISSING_PARAMS'
            });
        }

        logger.info(`🔍 Buscando CEP por endereço: ${uf}/${cidade}/${logradouro}`);

        const result = await viaCepService.buscarCepPorEndereco(uf, cidade, logradouro);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);

    } catch (error) {
        logger.error(`Erro na busca por endereço: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// API para estatísticas do serviço ViaCEP
app.get('/api/cep/stats', (req, res) => {
    try {
        const stats = viaCepService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error(`Erro ao obter estatísticas do ViaCEP: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// API para limpar cache do ViaCEP (admin)
app.post('/api/cep/clear-cache', (req, res) => {
    try {
        viaCepService.clearCache();
        logger.info('🧹 Cache do ViaCEP limpo');
        res.json({
            success: true,
            message: 'Cache limpo com sucesso'
        });
    } catch (error) {
        logger.error(`Erro ao limpar cache: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', async () => {
    logger.info(`🚀 MediApp Real Data Server rodando na porta ${port}`);
    logger.info(`🌐 Dashboard: http://localhost:${port}/app.html`);
    logger.info(`🔧 Health: http://localhost:${port}/health`);
    logger.info(`📊 API: http://localhost:${port}/api/statistics/dashboard`);
    
    // Testar conexão com banco na inicialização
    try {
        const testData = await getRealDataFromDatabase();
        if (testData) {
            logger.info(`✅ Conexão com banco OK - ${testData.pacientes.total} pacientes encontrados`);
        }
    } catch (error) {
        logger.error(`❌ Erro na conexão com banco: ${error.message}`);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('🛑 Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('🛑 Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});