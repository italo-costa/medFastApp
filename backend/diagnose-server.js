#!/usr/bin/env node

console.log('🔍 DIAGNÓSTICO DO SERVIDOR MEDIAPP - Iniciando...\n');

// Teste 1: Verificar Node.js
console.log('1️⃣ Testando Node.js:');
console.log(`   ✅ Versão: ${process.version}`);
console.log(`   ✅ Plataforma: ${process.platform}`);
console.log(`   ✅ Arquitetura: ${process.arch}\n`);

// Teste 2: Verificar variáveis de ambiente
console.log('2️⃣ Testando variáveis de ambiente:');
require('dotenv').config();
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurada' : '❌ Não configurada'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configurada' : '❌ Não configurada'}`);
console.log(`   PORT: ${process.env.PORT || 'Usando padrão 3001'}\n`);

// Teste 3: Verificar dependências críticas
console.log('3️⃣ Testando dependências críticas:');
const criticalDeps = ['express', 'cors', 'winston', '@prisma/client'];
let depErrors = 0;

criticalDeps.forEach(dep => {
  try {
    require(dep);
    console.log(`   ✅ ${dep}`);
  } catch (error) {
    console.log(`   ❌ ${dep} - ERRO: ${error.message}`);
    depErrors++;
  }
});

if (depErrors > 0) {
  console.log(`\n❌ ERRO: ${depErrors} dependências críticas com problema!`);
  console.log('💡 Execute: npm install\n');
  process.exit(1);
}

// Teste 4: Teste básico do servidor
console.log('\n4️⃣ Testando servidor Express básico:');
try {
  const express = require('express');
  const app = express();
  
  app.get('/test', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });
  
  const server = app.listen(3333, '0.0.0.0', () => {
    console.log('   ✅ Servidor Express funcionando na porta 3333');
    console.log('   🌐 Teste: http://localhost:3333/test');
    
    // Fechar após 5 segundos
    setTimeout(() => {
      server.close(() => {
        console.log('   ✅ Servidor de teste fechado com sucesso\n');
        
        // Teste 5: Testar conexão com banco
        testDatabase();
      });
    }, 2000);
  });
  
  server.on('error', (error) => {
    console.log(`   ❌ Erro no servidor: ${error.message}\n`);
    testDatabase();
  });
  
} catch (error) {
  console.log(`   ❌ Erro ao criar servidor: ${error.message}\n`);
  testDatabase();
}

// Função para testar banco de dados
async function testDatabase() {
  console.log('5️⃣ Testando conexão com PostgreSQL:');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Teste simples de conexão
    await prisma.$connect();
    console.log('   ✅ Conexão com PostgreSQL estabelecida');
    
    // Teste de query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Query de teste executada com sucesso');
    
    await prisma.$disconnect();
    console.log('   ✅ Conexão fechada com sucesso\n');
    
  } catch (error) {
    console.log(`   ❌ Erro de banco: ${error.message}`);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   💡 PostgreSQL pode não estar rodando. Execute: sudo service postgresql start\n');
    }
  }
  
  console.log('🎯 DIAGNÓSTICO COMPLETO!');
  console.log('📋 Próximos passos:');
  console.log('   1. Corrigir erros encontrados');
  console.log('   2. Executar: node diagnose-server.js');
  console.log('   3. Se tudo OK, executar: npm start');
}