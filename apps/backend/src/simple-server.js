/**
 * MediApp - Servidor Ultra Simples para Demonstração
 * Versão minimalista para garantir estabilidade
 */

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

const PORT = 3002;

// Dados mock simplificados
const mockData = {
  medicos: [
    { id: 1, nome: 'Dr. João Silva', crm: 'CRM123456', especialidade: 'Cardiologia' },
    { id: 2, nome: 'Dra. Maria Costa', crm: 'CRM789012', especialidade: 'Pediatria' },
    { id: 3, nome: 'Dr. Carlos Lima', crm: 'CRM345678', especialidade: 'Ortopedia' }
  ],
  pacientes: [
    { id: 1, nome: 'Ana Santos', cpf: '111.222.333-44', telefone: '(11) 99999-1111' },
    { id: 2, nome: 'Roberto Oliveira', cpf: '555.666.777-88', telefone: '(21) 88888-2222' }
  ],
  stats: {
    medicosAtivos: { value: 25, trend: '+3 este mês' },
    pacientesCadastrados: { value: 147, trend: '+12 este mês' },
    consultasHoje: { value: 8, trend: 'Normal' },
    prontuariosAtivos: { value: 1089, trend: '+156 este mês' }
  }
};

// Função para servir arquivos estáticos
function serveStatic(filePath, res) {
  const fullPath = path.join(__dirname, '../public', filePath);
  
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Arquivo não encontrado');
      return;
    }
    
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (ext) {
      case '.css': contentType = 'text/css'; break;
      case '.js': contentType = 'application/javascript'; break;
      case '.json': contentType = 'application/json'; break;
      case '.png': contentType = 'image/png'; break;
      case '.jpg': contentType = 'image/jpeg'; break;
    }
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(content);
  });
}

// Função para responder JSON
function jsonResponse(res, data, status = 200) {
  res.writeHead(status, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify({
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  }));
}

// Servidor principal
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`${new Date().toISOString()} - ${method} ${pathname}`);

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // Rotas da API
  if (pathname === '/health') {
    jsonResponse(res, {
      status: 'healthy',
      server: 'MediApp Simple Server',
      version: '1.0.0',
      uptime: process.uptime()
    });
    return;
  }

  if (pathname === '/api/medicos') {
    jsonResponse(res, mockData.medicos);
    return;
  }

  if (pathname === '/api/pacientes') {
    jsonResponse(res, mockData.pacientes);
    return;
  }

  if (pathname === '/api/dashboard/stats') {
    jsonResponse(res, mockData.stats);
    return;
  }

  if (pathname.startsWith('/api/medicos/buscar')) {
    const query = parsedUrl.query.q || '';
    const filtered = mockData.medicos.filter(m => 
      m.nome.toLowerCase().includes(query.toLowerCase()) ||
      m.crm.toLowerCase().includes(query.toLowerCase()) ||
      m.especialidade.toLowerCase().includes(query.toLowerCase())
    );
    jsonResponse(res, filtered);
    return;
  }

  if (pathname.startsWith('/api/pacientes/buscar')) {
    const query = parsedUrl.query.q || '';
    const filtered = mockData.pacientes.filter(p => 
      p.nome.toLowerCase().includes(query.toLowerCase()) ||
      p.cpf.includes(query)
    );
    jsonResponse(res, filtered);
    return;
  }

  // Rotas de arquivos estáticos
  if (pathname === '/') {
    serveStatic('index.html', res);
    return;
  }

  if (pathname === '/app') {
    serveStatic('app.html', res);
    return;
  }

  if (pathname.endsWith('.html') || pathname.endsWith('.css') || pathname.endsWith('.js')) {
    serveStatic(pathname.substring(1), res);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Página não encontrada');
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log('🏥 ==========================================');
  console.log('🏥 MediApp Simple Server v1.0.0');
  console.log('🏥 ==========================================');
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log('🌐 URLs disponíveis:');
  console.log(`   📊 Dashboard: http://localhost:${PORT}`);
  console.log(`   🏥 App: http://localhost:${PORT}/app`);
  console.log(`   👨‍⚕️ Médicos: http://localhost:${PORT}/gestao-medicos.html`);
  console.log(`   👥 Pacientes: http://localhost:${PORT}/gestao-pacientes.html`);
  console.log(`   🔧 Health: http://localhost:${PORT}/health`);
  console.log(`   📡 API Base: http://localhost:${PORT}/api`);
  console.log('🏥 ==========================================');
  console.log('✨ Servidor estável e pronto!');
  console.log('🏥 ==========================================');
});

// Tratamento de erros
server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err.message);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Parando servidor...');
  server.close(() => {
    console.log('✅ Servidor parado com sucesso');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ Erro não capturado:', err.message);
});

module.exports = server;