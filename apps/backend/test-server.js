const express = require('express');

console.log('🏥 MediApp - Servidor de Teste Básico');
console.log('📁 Diretório atual:', process.cwd());
console.log('🔍 Versão Node:', process.version);

const app = express();

// Rota simples de teste
app.get('/health', (req, res) => {
    console.log('✅ Health check chamado');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'MediApp teste está funcionando!'
    });
});

// Rota raiz
app.get('/', (req, res) => {
    console.log('🏠 Rota raiz chamada');
    res.send('<h1>🏥 MediApp v3.0.0 - Teste</h1><p>Servidor básico funcionando!</p>');
});

const PORT = 3003;

console.log(`🚀 Iniciando servidor na porta ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor teste rodando na porta ${PORT}`);
    console.log(`🔗 Acesse: http://localhost:${PORT}`);
    console.log(`💊 Health: http://localhost:${PORT}/health`);
    console.log('✅ Pronto para testar!');
});

// Tratamento de sinais
process.on('SIGTERM', () => {
    console.log('📴 Recebido SIGTERM, fechando servidor...');
    server.close();
});

process.on('SIGINT', () => {
    console.log('📴 Recebido SIGINT (Ctrl+C), fechando servidor...');
    server.close();
    process.exit(0);
});