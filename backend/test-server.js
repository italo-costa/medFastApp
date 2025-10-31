const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

console.log('[TEST] Servidor de teste iniciando...');

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API de médicos simplificada
app.get('/api/medicos', async (req, res) => {
    try {
        console.log('[TEST] Buscando médicos...');
        
        const medicos = await prisma.medico.findMany({
            include: {
                usuario: {
                    select: {
                        nome: true,
                        email: true,
                        ativo: true
                    }
                }
            },
            take: 10 // Limitar a 10 resultados para teste
        });

        console.log(`[TEST] Encontrados ${medicos.length} médicos`);

        // Transformar dados para formato esperado pelo frontend
        const medicosFormatados = medicos.map(medico => ({
            id: medico.id,
            nomeCompleto: medico.usuario?.nome || 'Nome não disponível',
            crm: medico.crm,
            especialidade: medico.especialidade,
            telefone: medico.telefone,
            email: medico.usuario?.email || 'Email não disponível',
            status: medico.usuario?.ativo ? 'ATIVO' : 'INATIVO'
        }));

        res.json({
            success: true,
            data: medicosFormatados,
            total: medicosFormatados.length
        });
    } catch (error) {
        console.error('[TEST] Erro ao buscar médicos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`[TEST] 🚀 Servidor de teste rodando na porta ${PORT}`);
    console.log(`[TEST] 🌐 Gestão Médicos: http://localhost:${PORT}/gestao-medicos.html`);
    console.log(`[TEST] 🔧 Health: http://localhost:${PORT}/health`);
    console.log(`[TEST] 📊 API Médicos: http://localhost:${PORT}/api/medicos`);
});

// Test database connection
prisma.medico.count()
    .then(count => console.log(`[TEST] ✅ Conexão DB OK - ${count} médicos no banco`))
    .catch(err => console.error('[TEST] ❌ Erro conexão DB:', err.message));