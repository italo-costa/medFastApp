const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

// ========================================
// MIDDLEWARE
// ========================================

app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const usuario = await prisma.usuario.findUnique({
            where: { id: decoded.userId },
            include: { medico: true, enfermeiro: true }
        });

        if (!usuario || !usuario.ativo) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        req.user = usuario;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

// ========================================
// AUTH ROUTES
// ========================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        const usuario = await prisma.usuario.findUnique({
            where: { email },
            include: { medico: true, enfermeiro: true }
        });

        if (!usuario || !usuario.ativo) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Atualizar último login
        await prisma.usuario.update({
            where: { id: usuario.id },
            data: { ultimo_login: new Date() }
        });

        // Gerar token JWT
        const token = jwt.sign(
            { userId: usuario.id, tipo: usuario.tipo },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Criar sessão
        await prisma.sessao.create({
            data: {
                usuario_id: usuario.id,
                token,
                data_expiracao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                dispositivo: req.headers['x-device-type'] || 'web'
            }
        });

        res.json({
            success: true,
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo,
                medico: usuario.medico,
                enfermeiro: usuario.enfermeiro
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        await prisma.sessao.updateMany({
            where: { token, ativo: true },
            data: { ativo: false }
        });

        res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (error) {
        console.error('Erro no logout:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ========================================
// MÉDICOS ROUTES
// ========================================

// Listar médicos
app.get('/api/medicos', async (req, res) => {
    try {
        const medicos = await prisma.medico.findMany({
            include: {
                usuario: {
                    select: { nome: true, email: true, ativo: true }
                }
            },
            orderBy: { usuario: { nome: 'asc' } }
        });

        const medicosFormatados = medicos.map(medico => ({
            id: medico.id,
            nome: medico.usuario.nome,
            email: medico.usuario.email,
            crm: `${medico.crm}-${medico.crm_uf}`,
            especialidade: medico.especialidade,
            telefone: medico.telefone,
            celular: medico.celular,
            endereco: medico.endereco,
            formacao: medico.formacao,
            experiencia: medico.experiencia,
            atendimento: medico.horario_atendimento,
            ativo: medico.usuario.ativo
        }));

        res.json({
            success: true,
            data: medicosFormatados,
            total: medicosFormatados.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erro ao buscar médicos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar médico
app.post('/api/medicos', async (req, res) => {
    try {
        const { nome, email, crm, crm_uf, especialidade, telefone, celular, endereco, formacao, experiencia, horario_atendimento } = req.body;

        // Verificar se email já existe
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { email }
        });

        if (usuarioExistente) {
            return res.status(400).json({ error: 'Email já está em uso' });
        }

        // Verificar se CRM já existe
        const crmExistente = await prisma.medico.findUnique({
            where: { crm }
        });

        if (crmExistente) {
            return res.status(400).json({ error: 'CRM já está cadastrado' });
        }

        const senhaHash = await bcrypt.hash('123456', 12); // Senha padrão

        const usuario = await prisma.usuario.create({
            data: {
                email,
                senha: senhaHash,
                nome,
                tipo: 'MEDICO'
            }
        });

        const medico = await prisma.medico.create({
            data: {
                usuario_id: usuario.id,
                crm,
                crm_uf,
                especialidade,
                telefone,
                celular,
                endereco,
                formacao,
                experiencia,
                horario_atendimento
            }
        });

        res.status(201).json({
            success: true,
            data: {
                id: medico.id,
                nome: usuario.nome,
                email: usuario.email,
                crm: `${medico.crm}-${medico.crm_uf}`,
                especialidade: medico.especialidade
            },
            message: 'Médico criado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao criar médico:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ========================================
// PACIENTES ROUTES
// ========================================

// Listar pacientes
app.get('/api/pacientes', async (req, res) => {
    try {
        const pacientes = await prisma.paciente.findMany({
            where: { ativo: true },
            include: {
                _count: {
                    select: {
                        prontuarios: true,
                        consultas: true,
                        exames: true
                    }
                }
            },
            orderBy: { nome: 'asc' }
        });

        const pacientesFormatados = pacientes.map(paciente => ({
            id: paciente.id,
            nome: paciente.nome,
            cpf: paciente.cpf,
            idade: Math.floor((new Date() - new Date(paciente.data_nascimento)) / (365.25 * 24 * 60 * 60 * 1000)),
            dataNascimento: paciente.data_nascimento.toISOString().split('T')[0],
            sexo: paciente.sexo,
            telefone: paciente.telefone,
            celular: paciente.celular,
            email: paciente.email,
            endereco: paciente.endereco,
            profissao: paciente.profissao,
            estadoCivil: paciente.estado_civil,
            nomeContato: paciente.nome_contato,
            telefoneContato: paciente.telefone_contato,
            convenio: paciente.convenio,
            numeroConvenio: paciente.numero_convenio,
            observacoes: paciente.observacoes,
            stats: {
                prontuarios: paciente._count.prontuarios,
                consultas: paciente._count.consultas,
                exames: paciente._count.exames
            }
        }));

        res.json({
            success: true,
            data: pacientesFormatados,
            total: pacientesFormatados.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar paciente por ID
app.get('/api/pacientes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const paciente = await prisma.paciente.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        prontuarios: true,
                        consultas: true,
                        exames: true
                    }
                }
            }
        });

        if (!paciente) {
            return res.status(404).json({ error: 'Paciente não encontrado' });
        }

        res.json({
            success: true,
            data: {
                id: paciente.id,
                nome: paciente.nome,
                cpf: paciente.cpf,
                idade: Math.floor((new Date() - new Date(paciente.data_nascimento)) / (365.25 * 24 * 60 * 60 * 1000)),
                dataNascimento: paciente.data_nascimento.toISOString().split('T')[0],
                sexo: paciente.sexo,
                telefone: paciente.telefone,
                celular: paciente.celular,
                email: paciente.email,
                endereco: paciente.endereco,
                profissao: paciente.profissao,
                estadoCivil: paciente.estado_civil,
                nomeContato: paciente.nome_contato,
                telefoneContato: paciente.telefone_contato,
                convenio: paciente.convenio,
                numeroConvenio: paciente.numero_convenio,
                observacoes: paciente.observacoes,
                stats: {
                    prontuarios: paciente._count.prontuarios,
                    consultas: paciente._count.consultas,
                    exames: paciente._count.exames
                }
            }
        });
    } catch (error) {
        console.error('Erro ao buscar paciente:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar paciente por CPF
app.get('/api/pacientes/buscar/:cpf', authenticateToken, async (req, res) => {
    try {
        const { cpf } = req.params;
        
        const paciente = await prisma.paciente.findUnique({
            where: { cpf }
        });

        if (!paciente) {
            return res.status(404).json({ error: 'Paciente não encontrado' });
        }

        res.json({
            success: true,
            data: {
                id: paciente.id,
                nome: paciente.nome,
                cpf: paciente.cpf,
                idade: Math.floor((new Date() - new Date(paciente.data_nascimento)) / (365.25 * 24 * 60 * 60 * 1000)),
                dataNascimento: paciente.data_nascimento.toISOString().split('T')[0],
                sexo: paciente.sexo,
                telefone: paciente.telefone,
                email: paciente.email
            }
        });
    } catch (error) {
        console.error('Erro ao buscar paciente por CPF:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Histórico de consultas do paciente
app.get('/api/pacientes/:id/consultas', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const consultas = await prisma.consulta.findMany({
            where: { paciente_id: id },
            include: {
                medico: {
                    include: {
                        usuario: {
                            select: { nome: true }
                        }
                    }
                }
            },
            orderBy: { data_hora: 'desc' }
        });

        res.json({
            success: true,
            data: consultas.map(consulta => ({
                id: consulta.id,
                data_hora: consulta.data_hora,
                tipo: consulta.tipo,
                status: consulta.status,
                observacoes: consulta.observacoes,
                medico: consulta.medico.usuario.nome,
                valor: consulta.valor
            }))
        });
    } catch (error) {
        console.error('Erro ao buscar histórico de consultas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
app.post('/api/pacientes', async (req, res) => {
    try {
        const pacienteData = req.body;
        
        // Verificar se CPF já existe
        if (pacienteData.cpf) {
            const cpfExistente = await prisma.paciente.findUnique({
                where: { cpf: pacienteData.cpf }
            });

            if (cpfExistente) {
                return res.status(400).json({ error: 'CPF já está cadastrado' });
            }
        }

        const paciente = await prisma.paciente.create({
            data: {
                ...pacienteData,
                data_nascimento: new Date(pacienteData.data_nascimento)
            }
        });

        res.status(201).json({
            success: true,
            data: paciente,
            message: 'Paciente criado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao criar paciente:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ========================================
// CONSULTAS ROUTES
// ========================================

// Listar consultas
app.get('/api/consultas', authenticateToken, async (req, res) => {
    try {
        const consultas = await prisma.consulta.findMany({
            include: {
                paciente: {
                    select: { nome: true, cpf: true }
                },
                medico: {
                    include: {
                        usuario: {
                            select: { nome: true }
                        }
                    }
                }
            },
            orderBy: { data_hora: 'desc' }
        });

        res.json({
            success: true,
            data: consultas.map(consulta => ({
                id: consulta.id,
                paciente_id: consulta.paciente_id,
                medico_id: consulta.medico_id,
                data_hora: consulta.data_hora,
                tipo: consulta.tipo,
                status: consulta.status,
                observacoes: consulta.observacoes,
                valor: consulta.valor,
                paciente: consulta.paciente.nome,
                medico: consulta.medico.usuario.nome
            })),
            total: consultas.length
        });
    } catch (error) {
        console.error('Erro ao listar consultas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar consulta
app.post('/api/consultas', authenticateToken, async (req, res) => {
    try {
        const { paciente_id, data_hora, tipo, observacoes, valor } = req.body;

        const consulta = await prisma.consulta.create({
            data: {
                paciente_id,
                medico_id: req.user.medico?.id || req.user.id,
                data_hora: new Date(data_hora),
                tipo: tipo || 'CONSULTA_ROTINA',
                status: 'AGENDADA',
                observacoes,
                valor: valor ? parseFloat(valor) : null
            },
            include: {
                paciente: {
                    select: { nome: true }
                },
                medico: {
                    include: {
                        usuario: {
                            select: { nome: true }
                        }
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: {
                id: consulta.id,
                paciente_id: consulta.paciente_id,
                medico_id: consulta.medico_id,
                data_hora: consulta.data_hora,
                tipo: consulta.tipo,
                status: consulta.status,
                observacoes: consulta.observacoes,
                valor: consulta.valor,
                paciente: consulta.paciente.nome,
                medico: consulta.medico.usuario.nome
            }
        });
    } catch (error) {
        console.error('Erro ao criar consulta:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar consulta
app.put('/api/consultas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.data_hora) {
            updateData.data_hora = new Date(updateData.data_hora);
        }

        if (updateData.valor) {
            updateData.valor = parseFloat(updateData.valor);
        }

        const consulta = await prisma.consulta.update({
            where: { id },
            data: updateData,
            include: {
                paciente: {
                    select: { nome: true }
                },
                medico: {
                    include: {
                        usuario: {
                            select: { nome: true }
                        }
                    }
                }
            }
        });

        res.json({
            success: true,
            data: {
                id: consulta.id,
                paciente_id: consulta.paciente_id,
                medico_id: consulta.medico_id,
                data_hora: consulta.data_hora,
                tipo: consulta.tipo,
                status: consulta.status,
                observacoes: consulta.observacoes,
                valor: consulta.valor,
                paciente: consulta.paciente.nome,
                medico: consulta.medico.usuario.nome
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar consulta:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ========================================
// ESTATÍSTICAS ROUTES  
// ========================================

app.get('/api/estatisticas/resumo', authenticateToken, async (req, res) => {
    try {
        const [totalMedicos, totalPacientes, totalConsultas] = await Promise.all([
            prisma.medico.count(),
            prisma.paciente.count({ where: { ativo: true } }),
            prisma.consulta.count()
        ]);

        res.json({
            success: true,
            data: {
                total_medicos: totalMedicos,
                total_pacientes: totalPacientes,
                total_consultas: totalConsultas,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar prontuários
app.get('/api/prontuarios', async (req, res) => {
    try {
        const prontuarios = await prisma.prontuario.findMany({
            include: {
                paciente: {
                    select: { nome: true, cpf: true }
                },
                medico: {
                    include: {
                        usuario: {
                            select: { nome: true }
                        }
                    }
                }
            },
            orderBy: { data_consulta: 'desc' }
        });

        const prontuariosFormatados = prontuarios.map(prontuario => ({
            id: prontuario.id,
            paciente_id: prontuario.paciente_id,
            medico_id: prontuario.medico_id,
            data: prontuario.data_consulta.toISOString().split('T')[0],
            hora: prontuario.data_consulta.toTimeString().split(' ')[0].substring(0, 5),
            tipo: prontuario.tipo_consulta,
            queixaPrincipal: prontuario.queixa_principal,
            historiaDoencaAtual: prontuario.historia_doenca_atual,
            exameClinico: prontuario.exame_clinico,
            hipoteseDiagnostica: prontuario.hipotese_diagnostica,
            conduta: prontuario.conduta,
            cid: prontuario.cid,
            retorno: prontuario.data_retorno?.toISOString().split('T')[0],
            observacoes: prontuario.observacoes,
            pacienteNome: prontuario.paciente.nome,
            medicoCrm: `${prontuario.medico.crm}-${prontuario.medico.crm_uf}`,
            medicoNome: prontuario.medico.usuario.nome
        }));

        res.json({
            success: true,
            data: prontuariosFormatados,
            total: prontuariosFormatados.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erro ao buscar prontuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ========================================
// ESTATÍSTICAS
// ========================================

app.get('/api/patients/stats/overview', async (req, res) => {
    try {
        const totalPacientes = await prisma.paciente.count({ where: { ativo: true } });
        const totalMedicos = await prisma.medico.count();
        const totalProntuarios = await prisma.prontuario.count();
        
        const pacientesRecentes = await prisma.paciente.findMany({
            where: { ativo: true },
            take: 5,
            orderBy: { criado_em: 'desc' },
            select: { nome: true, criado_em: true }
        });

        const idadeMedia = await prisma.$queryRaw`
            SELECT AVG(EXTRACT(YEAR FROM AGE(data_nascimento))) as idade_media
            FROM pacientes WHERE ativo = true
        `;

        res.json({
            success: true,
            totalPatients: totalPacientes,
            totalRecords: totalProntuarios,
            totalDoctors: totalMedicos,
            recentPatients: pacientesRecentes.map(p => ({
                nome: p.nome,
                data: p.criado_em
            })),
            stats: {
                newThisMonth: pacientesRecentes.length,
                activeToday: totalPacientes,
                avgAge: Math.round(Number(idadeMedia[0]?.idade_media) || 0)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ========================================
// HEALTH CHECK
// ========================================

app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'OK',
            message: 'MediApp Prisma Server is running',
            timestamp: new Date().toISOString(),
            server: 'MediApp Prisma Server',
            database: 'Connected',
            version: '2.0',
            pid: process.pid,
            uptime: Math.floor(process.uptime())
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            database: 'Disconnected',
            error: error.message
        });
    }
});

// ========================================
// STATIC FILES & SPA
// ========================================

const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '../public');

app.use(express.static(PUBLIC_DIR));

app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const appPath = path.join(PUBLIC_DIR, 'app.html');
    if (fs.existsSync(appPath)) {
        res.sendFile(appPath);
    } else {
        res.status(404).send('Page not found');
    }
});

// ========================================
// ERROR HANDLING
// ========================================

app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// ========================================
// SERVER START
// ========================================

// Só iniciar servidor se não estiver em modo de teste
if (require.main === module) {
    const server = app.listen(PORT, '0.0.0.0', async () => {
        console.log('==========================================');
        console.log('🏥 MediApp Prisma Server - Port ' + PORT);
        console.log('📊 Database: PostgreSQL + Prisma');
        console.log('🔐 Auth: JWT + Sessions');
        console.log('📱 Mobile/Desktop Ready');
        console.log('🌐 URL: http://localhost:' + PORT);
        console.log('❤️  Health: http://localhost:' + PORT + '/health');
        console.log('==========================================');
        
        try {
            await prisma.$connect();
            console.log('✅ Database connected successfully!');
        } catch (error) {
            console.error('❌ Database connection failed:', error);
        }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('🛑 SIGTERM received - Shutting down gracefully...');
        await prisma.$disconnect();
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', async () => {
        console.log('🛑 SIGINT received - Shutting down gracefully...');
        await prisma.$disconnect();
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    });
}

// Export para testes
module.exports = app;