const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

console.log('[PERSISTENT] Servidor persistente iniciando...');
console.log('[PERSISTENT] 🚫 Sinais SIGINT/SIGTERM serão IGNORADOS para manter aplicação rodando');

// IGNORAR sinais que param o servidor - SOLUÇÃO PARA WSL
let shutdownCount = 0;
const SHUTDOWN_THRESHOLD = 3; // Só para após 3 sinais consecutivos

process.on('SIGINT', () => {
    shutdownCount++;
    console.log(`[PERSISTENT] ⚠️  SIGINT #${shutdownCount} recebido - IGNORANDO (threshold: ${SHUTDOWN_THRESHOLD})`);
    
    if (shutdownCount >= SHUTDOWN_THRESHOLD) {
        console.log('[PERSISTENT] 🛑 SHUTDOWN_THRESHOLD atingido - Parando aplicação...');
        gracefulShutdown('SIGINT');
    } else {
        console.log('[PERSISTENT] 🛡️  Continuando execução...');
    }
});

process.on('SIGTERM', () => {
    shutdownCount++;
    console.log(`[PERSISTENT] ⚠️  SIGTERM #${shutdownCount} recebido - IGNORANDO (threshold: ${SHUTDOWN_THRESHOLD})`);
    
    if (shutdownCount >= SHUTDOWN_THRESHOLD) {
        console.log('[PERSISTENT] 🛑 SHUTDOWN_THRESHOLD atingido - Parando aplicação...');
        gracefulShutdown('SIGTERM');
    } else {
        console.log('[PERSISTENT] 🛡️  Continuando execução...');
    }
});

// Resetar contador após 30 segundos sem sinais
setInterval(() => {
    if (shutdownCount > 0) {
        console.log(`[PERSISTENT] 🔄 Resetando contador de shutdown (era ${shutdownCount})`);
        shutdownCount = 0;
    }
}, 30000);

let isShuttingDown = false;

async function gracefulShutdown(signal) {
    if (isShuttingDown) {
        console.log('[PERSISTENT] ⚠️  Shutdown já em andamento...');
        return;
    }
    
    isShuttingDown = true;
    console.log(`[PERSISTENT] 🔄 Processando shutdown por ${signal}...`);
    
    try {
        // Fechar conexões do banco
        console.log('[PERSISTENT] 📊 Fechando conexão com banco de dados...');
        await prisma.$disconnect();
        
        // Fechar servidor HTTP
        console.log('[PERSISTENT] 🌐 Fechando servidor HTTP...');
        server.close(() => {
            console.log('[PERSISTENT] ✅ Servidor HTTP fechado');
        });
        
        console.log('[PERSISTENT] 🎯 Shutdown graceful concluído!');
        process.exit(0);
        
    } catch (error) {
        console.error('[PERSISTENT] ❌ Erro durante shutdown:', error.message);
        process.exit(1);
    }
}

// Prevenir que o processo pare por outros motivos
process.on('uncaughtException', (error) => {
    console.error('[PERSISTENT] ❌ Erro não capturado:', error.message);
    console.log('[PERSISTENT] 🔄 Continuando execução...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[PERSISTENT] ❌ Promise rejeitada:', reason);
    console.log('[PERSISTENT] 🔄 Continuando execução...');
});

// Heartbeat para mostrar que está vivo
setInterval(() => {
    const uptime = Math.floor(process.uptime());
    console.log(`[PERSISTENT] 💓 Heartbeat - ${new Date().toISOString()} - Uptime: ${uptime}s`);
}, 30000);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid,
        server: 'persistent'
    });
});

// API de médicos
app.get('/api/medicos', async (req, res) => {
    try {
        console.log('[PERSISTENT] 🔍 Buscando médicos...');
        
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

        console.log(`[PERSISTENT] ✅ Encontrados ${medicos.length} de ${total} médicos`);

        // Transformar dados para formato esperado pelo frontend
        const medicosFormatados = medicos.map(medico => ({
            id: medico.id,
            nomeCompleto: medico.usuario?.nome || 'Nome não disponível',
            crm: medico.crm,
            especialidade: medico.especialidade,
            telefone: medico.telefone,
            email: medico.usuario?.email || 'Email não disponível',
            status: medico.usuario?.ativo ? 'ATIVO' : 'INATIVO',
            consultas: medico._count?.consultas || 0
        }));

        res.json({
            success: true,
            data: medicosFormatados,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('[PERSISTENT] ❌ Erro ao buscar médicos:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// API de médicos - Buscar por ID
app.get('/api/medicos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[PERSISTENT] 🔍 Buscando médico ID: ${id}`);
        
        const medico = await prisma.medico.findUnique({
            where: { id },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        ativo: true
                    }
                }
            }
        });

        if (!medico) {
            console.log(`[PERSISTENT] ❌ Médico não encontrado: ${id}`);
            return res.status(404).json({
                success: false,
                message: 'Médico não encontrado'
            });
        }

        const medicoFormatado = {
            id: medico.id,
            nomeCompleto: medico.usuario?.nome || 'Nome não disponível',
            crm: medico.crm,
            crm_uf: medico.crm_uf,
            especialidade: medico.especialidade,
            telefone: medico.telefone,
            celular: medico.celular,
            endereco: medico.endereco,
            email: medico.usuario?.email || 'Email não disponível',
            status: medico.usuario?.ativo ? 'ATIVO' : 'INATIVO',
        };

        console.log(`[PERSISTENT] ✅ Médico encontrado: ${medicoFormatado.nomeCompleto}`);

        res.json({
            success: true,
            data: medicoFormatado
        });
    } catch (error) {
        console.error('[PERSISTENT] ❌ Erro ao buscar médico:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// API de estatísticas
app.get('/api/statistics/dashboard', async (req, res) => {
    try {
        console.log('[PERSISTENT] 📊 Obtendo estatísticas...');
        
        const [totalPacientes, totalMedicos, totalExames] = await Promise.all([
            prisma.paciente.count(),
            prisma.medico.count(),
            prisma.exame.count()
        ]);

        console.log(`[PERSISTENT] 📈 Stats: ${totalPacientes} pacientes, ${totalMedicos} médicos, ${totalExames} exames`);

        res.json({
            success: true,
            data: {
                totalPacientes,
                totalMedicos,
                totalExames,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[PERSISTENT] ❌ Erro ao obter estatísticas:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// API de pacientes - Listar todos
app.get('/api/patients', async (req, res) => {
    try {
        console.log('[PERSISTENT] 🔍 Buscando pacientes...');
        
        const { search, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        let where = {};
        
        if (search) {
            where.OR = [
                { nome: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [pacientes, total] = await Promise.all([
            prisma.paciente.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { nome: 'asc' }
            }),
            prisma.paciente.count({ where })
        ]);

        console.log(`[PERSISTENT] ✅ Encontrados ${pacientes.length} de ${total} pacientes`);

        res.json({
            success: true,
            patients: pacientes.map(paciente => ({
                id: paciente.id,
                name: paciente.nome,
                nomeCompleto: paciente.nome,
                cpf: paciente.cpf,
                data_nascimento: paciente.data_nascimento,
                dataNascimento: paciente.data_nascimento,
                telefone: paciente.telefone,
                email: paciente.email,
                tipo_sanguineo: paciente.tipo_sanguineo,
                tipoSanguineo: paciente.tipo_sanguineo,
                alergias: paciente.alergias || 'Nenhuma alergia conhecida'
            })),
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('[PERSISTENT] ❌ Erro ao buscar pacientes:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// API de pacientes - Buscar por ID
app.get('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[PERSISTENT] 🔍 Buscando paciente ID: ${id}`);
        
        const paciente = await prisma.paciente.findUnique({
            where: { id }
        });

        if (!paciente) {
            console.log(`[PERSISTENT] ❌ Paciente não encontrado: ${id}`);
            return res.status(404).json({
                success: false,
                message: 'Paciente não encontrado'
            });
        }

        const pacienteFormatado = {
            id: paciente.id,
            name: paciente.nome,
            nomeCompleto: paciente.nome,
            cpf: paciente.cpf,
            birthDate: paciente.data_nascimento,
            dataNascimento: paciente.data_nascimento,
            phone: paciente.telefone,
            telefone: paciente.telefone,
            email: paciente.email,
            bloodType: paciente.tipo_sanguineo,
            tipoSanguineo: paciente.tipo_sanguineo,
            observations: paciente.observacoes,
            observacoes: paciente.observacoes,
            alergias: paciente.alergias
        };

        console.log(`[PERSISTENT] ✅ Paciente encontrado: ${pacienteFormatado.name}`);

        res.json({
            success: true,
            patient: pacienteFormatado
        });
    } catch (error) {
        console.error('[PERSISTENT] ❌ Erro ao buscar paciente:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// API de pacientes - Criar novo
app.post('/api/patients', async (req, res) => {
    try {
        console.log('[PERSISTENT] 📝 Criando novo paciente...');
        
        const {
            nomeCompleto,
            cpf,
            dataNascimento,
            telefone,
            email,
            tipoSanguineo,
            alergias,
            observacoes
        } = req.body;

        // Validação básica
        if (!nomeCompleto || !cpf || !telefone) {
            return res.status(400).json({
                success: false,
                message: 'Nome, CPF e telefone são obrigatórios'
            });
        }

        const novoPaciente = await prisma.paciente.create({
            data: {
                nome: nomeCompleto,
                cpf,
                data_nascimento: dataNascimento ? new Date(dataNascimento) : null,
                telefone,
                email: email || null,
                tipo_sanguineo: tipoSanguineo || null,
                alergias: alergias || null,
                observacoes: observacoes || null
            }
        });

        console.log(`[PERSISTENT] ✅ Paciente criado: ${novoPaciente.nome}`);

        res.status(201).json({
            success: true,
            message: 'Paciente criado com sucesso',
            patient: {
                id: novoPaciente.id,
                name: novoPaciente.nome,
                cpf: novoPaciente.cpf
            }
        });
    } catch (error) {
        console.error('[PERSISTENT] ❌ Erro ao criar paciente:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// API de pacientes - Atualizar
app.put('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[PERSISTENT] 📝 Atualizando paciente ID: ${id}`);
        
        const {
            nomeCompleto,
            cpf,
            dataNascimento,
            telefone,
            email,
            tipoSanguineo,
            alergias,
            observacoes
        } = req.body;

        const pacienteAtualizado = await prisma.paciente.update({
            where: { id },
            data: {
                nome: nomeCompleto,
                cpf,
                data_nascimento: dataNascimento ? new Date(dataNascimento) : null,
                telefone,
                email: email || null,
                tipo_sanguineo: tipoSanguineo || null,
                alergias: alergias || null,
                observacoes: observacoes || null
            }
        });

        console.log(`[PERSISTENT] ✅ Paciente atualizado: ${pacienteAtualizado.nome}`);

        res.json({
            success: true,
            message: 'Paciente atualizado com sucesso',
            patient: {
                id: pacienteAtualizado.id,
                name: pacienteAtualizado.nome,
                cpf: pacienteAtualizado.cpf
            }
        });
    } catch (error) {
        console.error('[PERSISTENT] ❌ Erro ao atualizar paciente:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// API de pacientes - Excluir
app.delete('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[PERSISTENT] 🗑️ Excluindo paciente ID: ${id}`);
        
        await prisma.paciente.delete({
            where: { id }
        });

        console.log(`[PERSISTENT] ✅ Paciente excluído: ${id}`);

        res.json({
            success: true,
            message: 'Paciente excluído com sucesso'
        });
    } catch (error) {
        console.error('[PERSISTENT] ❌ Erro ao excluir paciente:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// ViaCEP API
app.get('/api/viacep/:cep', async (req, res) => {
    try {
        const { cep } = req.params;
        console.log(`[PERSISTENT] 📍 Buscando CEP: ${cep}`);
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            return res.status(404).json({
                success: false,
                message: 'CEP não encontrado'
            });
        }
        
        console.log(`[PERSISTENT] ✅ CEP encontrado: ${data.logradouro}, ${data.localidade}`);
        
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('[PERSISTENT] ❌ Erro ao buscar CEP:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// Rota catch-all para servir index.html para SPA
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ 
            success: false, 
            message: 'Endpoint não encontrado' 
        });
    }
    
    // Servir arquivos estáticos se existirem
    const filePath = path.join(__dirname, 'public', req.path === '/' ? 'index.html' : req.path);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ 
                success: false, 
                message: 'Página não encontrada' 
            });
        }
    });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`[PERSISTENT] 🚀 Servidor persistente rodando na porta ${PORT}`);
    console.log(`[PERSISTENT] 🌐 Gestão Médicos: http://localhost:${PORT}/gestao-medicos.html`);
    console.log(`[PERSISTENT] 🌐 Gestão Médicos Modernizada: http://localhost:${PORT}/gestao-medicos-modernizada.html`);
    console.log(`[PERSISTENT] 🔧 Health: http://localhost:${PORT}/health`);
    console.log(`[PERSISTENT] 📊 API Médicos: http://localhost:${PORT}/api/medicos`);
    console.log(`[PERSISTENT] 📈 API Stats: http://localhost:${PORT}/api/statistics/dashboard`);
    console.log(`[PERSISTENT] 🛡️  Servidor com proteção contra sinais SIGINT/SIGTERM`);
    console.log(`[PERSISTENT] 💡 Use Ctrl+C ${SHUTDOWN_THRESHOLD} vezes consecutivas para parar o servidor`);
    
    // Verificar conexão com banco de dados
    try {
        const [totalMedicos, totalPacientes, totalExames] = await Promise.all([
            prisma.medico.count(),
            prisma.paciente.count(), 
            prisma.exame.count()
        ]);
        
        console.log('[PERSISTENT] ✅ Conexão DB confirmada:');
        console.log(`[PERSISTENT] 👨‍⚕️  ${totalMedicos} médicos`);
        console.log(`[PERSISTENT] 👥 ${totalPacientes} pacientes`);
        console.log(`[PERSISTENT] 🔬 ${totalExames} exames`);
        console.log('[PERSISTENT] 🎯 Sistema 100% operacional!');
    } catch (error) {
        console.error('[PERSISTENT] ❌ Erro ao conectar com banco:', error.message);
    }
});

// Timeout para conexões
server.timeout = 120000; // 2 minutos