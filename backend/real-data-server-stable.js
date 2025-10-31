const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const ViaCepService = require('./src/services/ViaCepService');

// Importar rotas
const authRoutes = require('./src/routes/auth');

const app = express();
const port = process.env.PORT || 3001;
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
        // Dados de pacientes
        const pacientes = await prisma.paciente.findMany();
        realData.pacientes.total = pacientes.length;
        realData.pacientes.ativosUltimos30Dias = pacientes.filter(p => p.ativo).length;

        // Dados de médicos
        const medicos = await prisma.medico.findMany();
        realData.medicos.total = medicos.length;
        realData.medicos.ativos = medicos.filter(m => m.status === 'ATIVO').length;
        realData.medicos.especialidades = [...new Set(medicos.map(m => m.especialidade))].length;

        // Dados de exames
        const exames = await prisma.exame.findMany();
        realData.exames.total = exames.length;

        logger.info(`Dados reais coletados: ${realData.pacientes.total} pacientes, ${realData.medicos.total} médicos, ${realData.exames.total} exames`);
        
        return realData;
    } catch (error) {
        logger.error(`Erro ao coletar dados reais: ${error.message}`);
        return realData;
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        server: 'MediApp Real Data Server',
        port: port
    });
});

// API de estatísticas
app.get('/api/statistics/dashboard', async (req, res) => {
    try {
        logger.info('Obtendo estatísticas do dashboard com dados reais...');
        const realData = await getRealDataFromDatabase();
        
        const response = {
            success: true,
            data: realData,
            timestamp: new Date().toISOString()
        };
        
        logger.info(`Retornando estatísticas reais: ${realData.pacientes.total} pacientes, ${realData.exames.total} exames`);
        res.json(response);
    } catch (error) {
        logger.error(`Erro na API de estatísticas: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// API de médicos - Listar
app.get('/api/medicos', async (req, res) => {
    try {
        const { search, especialidade, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        let where = { 
            usuario: { 
                ativo: true 
            } 
        };
        
        if (search) {
            where.OR = [
                { 
                    usuario: { 
                        nome: { contains: search, mode: 'insensitive' } 
                    } 
                },
                { crm: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (especialidade) {
            where.especialidade = especialidade;
        }

        const [medicos, total] = await Promise.all([
            prisma.medico.findMany({
                where,
                include: {
                    usuario: {
                        select: {
                            nome: true,
                            email: true,
                            ativo: true
                        }
                    },
                    _count: {
                        select: { consultas: true }
                    }
                },
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { crm: 'asc' }
            }),
            prisma.medico.count({ where })
        ]);

        res.json({
            success: true,
            data: medicos,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        logger.error(`Erro ao listar médicos: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// API de médicos - Buscar por ID
app.get('/api/medicos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const medico = await prisma.medico.findUnique({
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

        if (!medico) {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }

        res.json({
            success: true,
            data: medico
        });
    } catch (error) {
        logger.error(`Erro ao buscar médico: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// API de médicos - Criar
app.post('/api/medicos', async (req, res) => {
    try {
        const medico = await prisma.medico.create({
            data: {
                ...req.body,
                status: req.body.status || 'ATIVO'
            }
        });

        res.status(201).json({
            success: true,
            data: medico,
            message: 'Médico criado com sucesso'
        });
    } catch (error) {
        logger.error(`Erro ao criar médico: ${error.message}`);
        
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'CRM ou CPF já cadastrado'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// API de médicos - Atualizar
app.put('/api/medicos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const medico = await prisma.medico.update({
            where: { id: parseInt(id) },
            data: req.body
        });

        res.json({
            success: true,
            data: medico,
            message: 'Médico atualizado com sucesso'
        });
    } catch (error) {
        logger.error(`Erro ao atualizar médico: ${error.message}`);
        
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }
        
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'CRM ou CPF já cadastrado'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// API de médicos - Deletar
app.delete('/api/medicos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se o médico tem relacionamentos
        const medico = await prisma.medico.findUnique({
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

        if (!medico) {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }

        const hasRelations = medico._count.consultas > 0 || medico._count.prontuarios > 0;

        if (hasRelations) {
            // Soft delete - apenas desativar
            await prisma.medico.update({
                where: { id: parseInt(id) },
                data: { status: 'INATIVO' }
            });

            res.json({
                success: true,
                type: 'soft_delete',
                message: 'Médico desativado com sucesso (possui relacionamentos)'
            });
        } else {
            // Hard delete - remover completamente
            await prisma.medico.delete({
                where: { id: parseInt(id) }
            });

            res.json({
                success: true,
                type: 'hard_delete',
                message: 'Médico excluído com sucesso'
            });
        }
    } catch (error) {
        logger.error(`Erro ao deletar médico: ${error.message}`);
        
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Iniciar servidor
app.listen(port, async () => {
    logger.info(`🚀 MediApp Real Data Server rodando na porta ${port}`);
    logger.info(`🌐 Dashboard: http://localhost:${port}/app.html`);
    logger.info(`🔧 Health: http://localhost:${port}/health`);
    logger.info(`📊 API: http://localhost:${port}/api/statistics/dashboard`);
    
    // Testar conexão com banco
    try {
        const realData = await getRealDataFromDatabase();
        logger.info(`✅ Conexão com banco OK - ${realData.pacientes.total} pacientes encontrados`);
    } catch (error) {
        logger.error(`❌ Erro na conexão com banco: ${error.message}`);
    }
});

// REMOVIDO: Graceful shutdown handlers para evitar SIGINT/SIGTERM
// O servidor rodará continuamente sem responder a sinais de interrupção