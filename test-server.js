const http = require('http');

// Teste simples de servidor
const server = http.createServer((req, res) => {
    console.log('[TEST] Request:', req.method, req.url);
    
    if (req.url === '/test') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'OK',
            message: 'Servidor de teste funcionando!',
            timestamp: new Date().toISOString()
        }));
        return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <h1>🏥 MediApp - Teste de Conectividade</h1>
        <p>Servidor funcionando em WSL!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <a href="/test">Testar API JSON</a>
    `);
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log('==========================================');
    console.log('🧪 SERVIDOR DE TESTE - Porta ' + PORT);
    console.log('🌐 Escutando em: 0.0.0.0:' + PORT);
    console.log('✅ Pronto para testes de conectividade!');
    console.log('==========================================');
});

server.on('error', (err) => {
    console.error('❌ Erro no servidor:', err);
    if (err.code === 'EADDRINUSE') {
        console.error('❌ Porta ' + PORT + ' já está em uso');
        process.exit(1);
    }
});