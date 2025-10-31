// 🧪 Script de Teste das Funcionalidades das Páginas MediApp
// Execute este script no console do navegador para testar as funcionalidades

console.log('🚀 Iniciando testes das funcionalidades MediApp...');

// Função para testar se uma página carrega corretamente
async function testPage(url, description) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            console.log(`✅ ${description}: ${url}`);
            return true;
        } else {
            console.log(`❌ ${description}: ${url} - Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${description}: ${url} - Erro: ${error.message}`);
        return false;
    }
}

// Função para testar API
async function testAPI() {
    console.log('\n📡 Testando API...');
    
    try {
        const response = await fetch('/api/medicos');
        const data = await response.json();
        
        if (data.success && data.data) {
            console.log(`✅ API funcionando - ${data.data.length} médicos encontrados`);
            return data.data;
        } else {
            console.log('❌ API retornou erro:', data.message);
            return [];
        }
    } catch (error) {
        console.log('❌ Erro na API:', error.message);
        return [];
    }
}

// Função para testar botões das páginas
function testPageButtons() {
    console.log('\n🔘 Testando botões da página atual...');
    
    // Testar se as funções existem
    if (typeof viewDoctorDetails === 'function') {
        console.log('✅ Função viewDoctorDetails encontrada');
    } else {
        console.log('❌ Função viewDoctorDetails não encontrada');
    }
    
    if (typeof editDoctor === 'function') {
        console.log('✅ Função editDoctor encontrada');
    } else {
        console.log('❌ Função editDoctor não encontrada');
    }
    
    // Contar botões de ação
    const detailButtons = document.querySelectorAll('button[onclick*="viewDoctorDetails"]');
    const editButtons = document.querySelectorAll('button[onclick*="editDoctor"]');
    
    console.log(`📊 Botões "Ver Detalhes" encontrados: ${detailButtons.length}`);
    console.log(`📊 Botões "Editar" encontrados: ${editButtons.length}`);
}

// Função principal de teste
async function runAllTests() {
    console.log('🏥 MediApp - Teste de Funcionalidades\n');
    
    // Testar API
    const medicos = await testAPI();
    
    if (medicos.length > 0) {
        console.log('\n🔗 Testando URLs das páginas...');
        
        // Testar página de lista
        await testPage('/lista-medicos.html', 'Página de Lista');
        
        // Testar páginas de detalhes e edição com o primeiro médico
        const primeiroMedico = medicos[0];
        await testPage(`/detalhes-medico.html?id=${primeiroMedico.id}`, 'Página de Detalhes');
        await testPage(`/editar-medico.html?id=${primeiroMedico.id}`, 'Página de Edição');
        
        console.log(`\n📋 Exemplos de URLs funcionais:`);
        console.log(`   Lista: /lista-medicos.html`);
        console.log(`   Detalhes: /detalhes-medico.html?id=${primeiroMedico.id}`);
        console.log(`   Edição: /editar-medico.html?id=${primeiroMedico.id}`);
    }
    
    // Testar botões da página atual
    testPageButtons();
    
    console.log('\n🎉 Testes concluídos!');
    console.log('\n💡 Para testar os botões:');
    console.log('   1. Acesse: /lista-medicos.html');
    console.log('   2. Clique em "Ver Detalhes" ou "Editar" em qualquer médico');
    console.log('   3. Verifique se as páginas carregam corretamente');
}

// Executar testes
runAllTests();

// Função utilitária para testar um médico específico
function testDoctor(doctorId) {
    console.log(`\n🔍 Testando médico ID: ${doctorId}`);
    console.log(`👁️ Ver Detalhes: /detalhes-medico.html?id=${doctorId}`);
    console.log(`✏️ Editar: /editar-medico.html?id=${doctorId}`);
    
    // Se as funções existirem, simular clique
    if (typeof viewDoctorDetails === 'function') {
        console.log('🟢 Simulando clique em "Ver Detalhes"...');
        // viewDoctorDetails(doctorId); // Descomente para testar
    }
    
    if (typeof editDoctor === 'function') {
        console.log('🟢 Simulando clique em "Editar"...');
        // editDoctor(doctorId); // Descomente para testar
    }
}

// Exportar para uso global
window.mediAppTests = {
    runAllTests,
    testDoctor,
    testAPI,
    testPage
};

console.log('\n📝 Funções disponíveis:');
console.log('   mediAppTests.runAllTests() - Executar todos os testes');
console.log('   mediAppTests.testDoctor(id) - Testar médico específico');
console.log('   mediAppTests.testAPI() - Testar apenas a API');