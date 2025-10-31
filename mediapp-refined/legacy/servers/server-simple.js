const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// CORS permissivo
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*']
}));

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

console.log(`[${new Date().toISOString()}] 📁 Static files path: ${path.join(__dirname, 'public')}`);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        server: 'MediApp Simple',
        frontend: 'Completo',
        static_path: path.join(__dirname, 'public')
    });
});

// APIs mock
app.get('/api/pacientes', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, nome: 'João Silva', idade: 45, telefone: '(11) 98765-4321' },
            { id: 2, nome: 'Maria Santos', idade: 32, telefone: '(11) 87654-3210' }
        ],
        timestamp: new Date().toISOString()
    });
});

app.get('/api/medicos', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, nome: 'Dr. Carlos Oliveira', crm: '123456-SP', especialidade: 'Cardiologia' },
            { id: 2, nome: 'Dra. Ana Costa', crm: '789012-SP', especialidade: 'Pediatria' }
        ],
        timestamp: new Date().toISOString()
    });
});

app.get('/api/prontuarios', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, paciente_id: 1, medico_id: 1, data: '2024-01-15', resumo: 'Consulta cardiológica' },
            { id: 2, paciente_id: 2, medico_id: 2, data: '2024-01-16', resumo: 'Consulta pediátrica' }
        ],
        timestamp: new Date().toISOString()
    });
});

// Rota principal
app.get('/', (req, res) => {
    const appPath = path.join(__dirname, 'public', 'app.html');
    console.log(`[${new Date().toISOString()}] 📋 Serving app.html from: ${appPath}`);
    res.sendFile(appPath);
});

// Catch-all para SPA
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const appPath = path.join(__dirname, 'public', 'app.html');
    res.sendFile(appPath);
});

// Error handler
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ❌ Error:`, err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] 🚀 =========================================`);
    console.log(`[${new Date().toISOString()}] 🏥 MediApp FRONTEND Server - Porta ${PORT}`);
    console.log(`[${new Date().toISOString()}] 🎨 Servindo: ${path.join(__dirname, 'public')}`);
    console.log(`[${new Date().toISOString()}] 🌐 Acesse: http://localhost:${PORT}`);
    console.log(`[${new Date().toISOString()}] 🔧 Health: http://localhost:${PORT}/health`);
    console.log(`[${new Date().toISOString()}] 🚀 =========================================`);
    console.log(`[${new Date().toISOString()}] ✅ FRONTEND COMPLETO DISPONÍVEL!`);
});

server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;

module.exports = app;
