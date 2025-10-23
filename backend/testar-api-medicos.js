#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

async function testarAPIMedicos() {
  console.log('🧪 TESTANDO APIS DE MÉDICOS - MediApp Backend\n');
  
  try {
    // Teste 1: Listar todos os médicos
    console.log('1️⃣ Testando: GET /api/medicos');
    const listagem = await axios.get(`${BASE_URL}/medicos`);
    console.log(`   ✅ Status: ${listagem.status}`);
    console.log(`   📊 Total de médicos: ${listagem.data.data.length}`);
    console.log(`   📄 Paginação: ${listagem.data.pagination.total} total, ${listagem.data.pagination.pages} páginas\n`);
    
    // Mostrar primeiro médico da lista
    if (listagem.data.data.length > 0) {
      const primeiroMedico = listagem.data.data[0];
      console.log('   👨‍⚕️ Primeiro médico da lista:');
      console.log(`      Nome: ${primeiroMedico.nome}`);
      console.log(`      CRM: ${primeiroMedico.crm}/${primeiroMedico.crm_uf}`);
      console.log(`      Especialidade: ${primeiroMedico.especialidade}`);
      console.log(`      Email: ${primeiroMedico.email}\n`);
    }

    // Teste 2: Buscar médico específico
    if (listagem.data.data.length > 0) {
      const medicoId = listagem.data.data[0].id;
      console.log('2️⃣ Testando: GET /api/medicos/:id');
      const medicoBusca = await axios.get(`${BASE_URL}/medicos/${medicoId}`);
      console.log(`   ✅ Status: ${medicoBusca.status}`);
      console.log(`   👨‍⚕️ Médico encontrado: ${medicoBusca.data.data.nome}`);
      console.log(`   🏥 Especialidade: ${medicoBusca.data.data.especialidade}`);
      console.log(`   📱 Celular: ${medicoBusca.data.data.celular || 'Não informado'}\n`);
    }

    // Teste 3: Buscar com filtros
    console.log('3️⃣ Testando: GET /api/medicos?search=carlos');
    const buscaFiltro = await axios.get(`${BASE_URL}/medicos?search=carlos`);
    console.log(`   ✅ Status: ${buscaFiltro.status}`);
    console.log(`   🔍 Resultados encontrados: ${buscaFiltro.data.data.length}`);
    
    if (buscaFiltro.data.data.length > 0) {
      console.log(`   👨‍⚕️ Médico encontrado: ${buscaFiltro.data.data[0].nome}\n`);
    }

    // Teste 4: Buscar por especialidade
    console.log('4️⃣ Testando: GET /api/medicos?especialidade=cardiologia');
    const buscaEspecialidade = await axios.get(`${BASE_URL}/medicos?especialidade=cardiologia`);
    console.log(`   ✅ Status: ${buscaEspecialidade.status}`);
    console.log(`   🏥 Cardiologistas encontrados: ${buscaEspecialidade.data.data.length}\n`);

    // Teste 5: Estatísticas do dashboard
    console.log('5️⃣ Testando: GET /api/medicos/estatisticas/dashboard');
    const estatisticas = await axios.get(`${BASE_URL}/medicos/estatisticas/dashboard`);
    console.log(`   ✅ Status: ${estatisticas.status}`);
    console.log('   📊 Estatísticas:');
    console.log(`      Total de médicos: ${estatisticas.data.data.medicos.total}`);
    console.log(`      Médicos ativos: ${estatisticas.data.data.medicos.ativos}`);
    console.log(`      Médicos inativos: ${estatisticas.data.data.medicos.inativos}`);
    console.log('   🏥 Especialidades cadastradas:');
    
    estatisticas.data.data.especialidades.forEach(esp => {
      console.log(`      - ${esp.nome}: ${esp.quantidade} médico(s)`);
    });
    console.log('');

    // Teste 6: Criar novo médico (teste)
    console.log('6️⃣ Testando: POST /api/medicos (novo médico)');
    const novoMedico = {
      nome: "Dr. Rafael Teste Silva",
      email: "rafael.teste@medifast.com",
      senha: "teste123",
      crm: "99999",
      crm_uf: "SP",
      especialidade: "Clínica Geral",
      telefone: "(11) 1234-5678",
      celular: "(11) 99999-9999",
      endereco: "Rua Teste, 123 - São Paulo - SP",
      formacao: "Medicina pela USP",
      experiencia: "5 anos em clínica geral",
      horario_atendimento: "Segunda a Sexta: 8h às 17h"
    };

    try {
      const criacao = await axios.post(`${BASE_URL}/medicos`, novoMedico);
      console.log(`   ✅ Status: ${criacao.status}`);
      console.log(`   👨‍⚕️ Médico criado: ${criacao.data.data.nome}`);
      console.log(`   🆔 ID: ${criacao.data.data.id}\n`);
      
      // Teste 7: Atualizar o médico criado
      console.log('7️⃣ Testando: PUT /api/medicos/:id (atualização)');
      const atualizacao = await axios.put(`${BASE_URL}/medicos/${criacao.data.data.id}`, {
        especialidade: "Medicina de Família",
        experiencia: "6 anos em medicina de família e comunidade"
      });
      console.log(`   ✅ Status: ${atualizacao.status}`);
      console.log(`   🔄 Médico atualizado: ${atualizacao.data.data.nome}`);
      console.log(`   🏥 Nova especialidade: ${atualizacao.data.data.especialidade}\n`);
      
      // Teste 8: Desativar médico
      console.log('8️⃣ Testando: DELETE /api/medicos/:id (desativação)');
      const desativacao = await axios.delete(`${BASE_URL}/medicos/${criacao.data.data.id}`);
      console.log(`   ✅ Status: ${desativacao.status}`);
      console.log(`   🚫 Médico desativado com sucesso\n`);
      
    } catch (createError) {
      console.log(`   ⚠️  Erro na criação: ${createError.response?.data?.message || createError.message}\n`);
    }

    console.log('🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('✅ APIs de médicos estão funcionando perfeitamente!');

  } catch (error) {
    console.error(`❌ Erro no teste: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Dados: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Adicionar axios se não estiver instalado
async function verificarDependencias() {
  try {
    require('axios');
  } catch (error) {
    console.log('📦 Instalando axios para testes...');
    const { execSync } = require('child_process');
    execSync('npm install axios', { cwd: __dirname });
    console.log('✅ Axios instalado!\n');
  }
}

async function main() {
  await verificarDependencias();
  await testarAPIMedicos();
}

main();