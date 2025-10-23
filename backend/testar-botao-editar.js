#!/usr/bin/env node

const axios = require('axios');

async function testarBotaoEditar() {
  console.log('🧪 TESTANDO BOTÃO EDITAR NA LISTA DE MÉDICOS\n');
  
  try {
    // Teste 1: Verificar se a página de lista carrega
    console.log('1️⃣ Verificando acesso à lista de médicos...');
    const listaResponse = await axios.get('http://localhost:3002/lista-medicos.html');
    console.log(`   ✅ Status: ${listaResponse.status}`);
    console.log('   📄 Página acessível com sucesso\n');

    // Teste 2: Verificar se a API de médicos retorna dados
    console.log('2️⃣ Verificando API de médicos...');
    const apiResponse = await axios.get('http://localhost:3002/api/medicos');
    const medicos = apiResponse.data.data;
    console.log(`   ✅ Status: ${apiResponse.status}`);
    console.log(`   👨‍⚕️ Total de médicos: ${medicos.length}`);
    
    if (medicos.length > 0) {
      const primeiroMedico = medicos[0];
      console.log(`   📋 Primeiro médico: ${primeiroMedico.nome} (ID: ${primeiroMedico.id})\n`);
      
      // Teste 3: Verificar se a página de edição carrega com um ID
      console.log('3️⃣ Verificando acesso à página de edição...');
      const editResponse = await axios.get(`http://localhost:3002/editar-medico.html?id=${primeiroMedico.id}`);
      console.log(`   ✅ Status: ${editResponse.status}`);
      console.log('   📝 Página de edição acessível com sucesso\n');
      
      // Teste 4: Verificar se o conteúdo da lista contém os botões
      console.log('4️⃣ Verificando conteúdo da página de lista...');
      const conteudoLista = listaResponse.data;
      
      const temBotaoEditar = conteudoLista.includes('onclick="editDoctor(');
      const temFuncaoEditDoctor = conteudoLista.includes('function editDoctor(doctorId)');
      const temRedirecionamento = conteudoLista.includes('window.location.href = `/editar-medico.html?id=${doctorId}`;') ||
                                   conteudoLista.includes('window.location.href = url;');
      
      console.log(`   🔘 Botão editar no HTML: ${temBotaoEditar ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   🔧 Função editDoctor: ${temFuncaoEditDoctor ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   🔗 Redirecionamento: ${temRedirecionamento ? '✅ SIM' : '❌ NÃO'}\n`);
      
      console.log('5️⃣ URLs para teste manual:');
      console.log(`   📋 Lista: http://localhost:3002/lista-medicos.html`);
      console.log(`   ✏️  Editar: http://localhost:3002/editar-medico.html?id=${primeiroMedico.id}\n`);
      
      console.log('🎯 INSTRUÇÕES PARA TESTE MANUAL:');
      console.log('   1. Acesse: http://localhost:3002/lista-medicos.html');
      console.log('   2. Aguarde o carregamento dos médicos');
      console.log('   3. Clique no botão "Editar" de qualquer médico');
      console.log('   4. Verifique se redirecionou para a página de edição');
      console.log('   5. Confirme se os dados foram carregados automaticamente\n');
      
      if (temBotaoEditar && temFuncaoEditDoctor && temRedirecionamento) {
        console.log('🎉 TODOS OS COMPONENTES ESTÃO FUNCIONAIS!');
        console.log('✅ O botão "Editar" deve estar funcionando corretamente');
      } else {
        console.log('⚠️  POSSÍVEL PROBLEMA DETECTADO');
        console.log('❌ Alguns componentes podem não estar funcionando');
      }
      
    } else {
      console.log('   ⚠️  Nenhum médico encontrado na base de dados');
    }

  } catch (error) {
    console.error(`❌ Erro no teste: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   URL: ${error.config?.url}`);
    }
  }
}

async function main() {
  await testarBotaoEditar();
}

main();