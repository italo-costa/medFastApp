/**
 * Teste simples do servidor sem middleware centralizado
 */

const express = require('express');
const databaseService = require('./services/database');
const config = require('./config');

const app = express();

// Middlewares básicos
app.use(express.json());

// Health check simples
app.get('/health', async (req, res) => {
  try {
    const stats = await databaseService.getSystemStats();
    res.json({
      success: true,
      data: {
        server: 'MediApp Test',
        status: 'OK',
        database: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Iniciar servidor
async function startTestServer() {
  try {
    await databaseService.connect();
    
    const server = app.listen(3003, () => {
      console.log('🧪 [TEST] Servidor de teste iniciado na porta 3003');
      console.log('🔗 [TEST] Health: http://localhost:3003/health');
    });
    
    return server;
  } catch (error) {
    console.error('❌ [TEST] Erro:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startTestServer();
}

module.exports = { app, startTestServer };