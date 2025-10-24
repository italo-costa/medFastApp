const express = require('express');

const app = express();
const PORT = 3001;

console.log('Starting debug server...');

app.get('/health', (req, res) => {
    console.log('Health endpoint called!');
    res.json({ status: 'OK', message: 'Server is working!' });
});

app.get('/', (req, res) => {
    console.log('Root endpoint called!');
    res.send('Debug server is working!');
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log(`🚀 DEBUG Server running on port ${PORT}`);
    console.log(`📍 Listening on 0.0.0.0:${PORT}`);
    console.log(`🔗 Test: http://localhost:${PORT}/health`);
    console.log('='.repeat(50));
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

server.on('listening', () => {
    console.log('✅ Server is actively listening');
    console.log('Address:', server.address());
});

console.log('Server setup complete, waiting for listen...');