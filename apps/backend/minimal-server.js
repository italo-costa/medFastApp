// 🏥 MediApp - Servidor Mínimo de Teste

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3002;

console.log('🏥 MediApp - Inicializando servidor mínimo...');

// Middlewares básicos
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rotas básicas de teste
app.get('/', (req, res) => {
    res.send(`
        <h1>🏥 MediApp v3.0.0</h1>
        <p>Servidor funcionando!</p>
        <ul>
            <li><a href="/health">Health Check</a></li>
            <li><a href="/api/medicos">API Médicos</a></li>
            <li><a href="/gestao-medicos.html">Gestão Médicos</a></li>
        </ul>
    `);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'MediApp está funcionando!',
        version: '3.0.0'
    });
});

app.get('/api/medicos', (req, res) => {
    res.json({
        message: 'API Médicos funcionando',
        count: 0,
        data: []
    });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor MediApp rodando na porta ${PORT}`);
    console.log(`🔗 Acesse: http://localhost:${PORT}`);
    console.log(`💊 Health: http://localhost:${PORT}/health`);
    console.log('🎯 Servidor mínimo operacional!');
});

// Tratamento de erros
server.on('error', (error) => {
    console.error('❌ Erro no servidor:', error.message);
    process.exit(1);
});

// Tratamento de sinais
process.on('SIGTERM', () => {
    console.log('📴 Recebido SIGTERM, fechando servidor...');
    server.close(() => {
        console.log('✅ Servidor fechado graciosamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n📴 Recebido SIGINT (Ctrl+C), fechando servidor...');
    server.close(() => {
        console.log('✅ Servidor fechado graciosamente');
        process.exit(0);
    });
});

console.log('🚀 Servidor mínimo configurado e aguardando conexões...');