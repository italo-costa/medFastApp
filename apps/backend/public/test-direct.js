// Script de teste para verificar carregamento das estatísticas
console.log('🔥 TESTE DIRETO: Iniciando verificação das estatísticas...');

// Função para testar diretamente
async function testDirectAPI() {
    console.log('📡 Testando API diretamente...');
    
    try {
        const response = await fetch('/api/statistics/dashboard');
        console.log('📊 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        
        if (data.success && data.data) {
            console.log('📈 Estatísticas disponíveis:');
            console.log('👥 Pacientes:', data.data.pacientesCadastrados.value);
            console.log('📋 Prontuários:', data.data.prontuariosCriados.value);
            console.log('🔬 Exames:', data.data.examesRegistrados.value);
            console.log('👨‍⚕️ Médicos:', data.data.medicosAtivos.value);
            
            return data;
        } else {
            console.error('❌ Dados inválidos');
            return null;
        }
    } catch (error) {
        console.error('❌ Erro na API:', error);
        return null;
    }
}

// Função para atualizar elementos diretamente
function updateElementsDirectly(data) {
    console.log('🎯 Atualizando elementos diretamente...');
    
    if (!data || !data.data) {
        console.error('❌ Dados inválidos para atualização');
        return false;
    }
    
    const stats = data.data;
    let updated = 0;
    
    // Atualizar pacientes
    const pacientesEl = document.getElementById('stat-pacientes');
    if (pacientesEl) {
        pacientesEl.textContent = stats.pacientesCadastrados.value;
        pacientesEl.style.color = '#2d3748';
        pacientesEl.style.fontSize = '1.5rem';
        pacientesEl.style.fontWeight = '700';
        console.log('✅ Pacientes atualizado:', stats.pacientesCadastrados.value);
        updated++;
    } else {
        console.error('❌ Elemento stat-pacientes não encontrado');
    }
    
    // Atualizar prontuários
    const prontuariosEl = document.getElementById('stat-prontuarios');
    if (prontuariosEl) {
        prontuariosEl.textContent = stats.prontuariosCriados.value;
        prontuariosEl.style.color = '#2d3748';
        prontuariosEl.style.fontSize = '1.5rem';
        prontuariosEl.style.fontWeight = '700';
        console.log('✅ Prontuários atualizado:', stats.prontuariosCriados.value);
        updated++;
    } else {
        console.error('❌ Elemento stat-prontuarios não encontrado');
    }
    
    // Atualizar exames
    const examesEl = document.getElementById('stat-exames');
    if (examesEl) {
        examesEl.textContent = stats.examesRegistrados.value;
        examesEl.style.color = '#2d3748';
        examesEl.style.fontSize = '1.5rem';
        examesEl.style.fontWeight = '700';
        console.log('✅ Exames atualizado:', stats.examesRegistrados.value);
        updated++;
    } else {
        console.error('❌ Elemento stat-exames não encontrado');
    }
    
    // Atualizar médicos
    const medicosEl = document.getElementById('stat-medicos');
    if (medicosEl) {
        medicosEl.textContent = stats.medicosAtivos.value;
        medicosEl.style.color = '#2d3748';
        medicosEl.style.fontSize = '1.5rem';
        medicosEl.style.fontWeight = '700';
        console.log('✅ Médicos atualizado:', stats.medicosAtivos.value);
        updated++;
    } else {
        console.error('❌ Elemento stat-medicos não encontrado');
    }
    
    console.log(`📊 Total de elementos atualizados: ${updated}/4`);
    return updated === 4;
}

// Função principal de teste
async function runFullTest() {
    console.log('🚀 EXECUTANDO TESTE COMPLETO...');
    
    // 1. Testar API
    const data = await testDirectAPI();
    if (!data) {
        console.error('❌ Falha no teste da API');
        return false;
    }
    
    // 2. Aguardar um pouco para garantir que o DOM está pronto
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Verificar elementos DOM
    console.log('🔍 Verificando elementos DOM...');
    const elementos = ['stat-pacientes', 'stat-prontuarios', 'stat-exames', 'stat-medicos'];
    let elementosEncontrados = 0;
    
    elementos.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            console.log(`✅ Elemento ${id} encontrado: "${el.textContent}"`);
            elementosEncontrados++;
        } else {
            console.error(`❌ Elemento ${id} NÃO encontrado`);
        }
    });
    
    console.log(`📋 Elementos encontrados: ${elementosEncontrados}/${elementos.length}`);
    
    // 4. Atualizar elementos
    const success = updateElementsDirectly(data);
    
    // 5. Verificar se a atualização funcionou
    setTimeout(() => {
        console.log('🔍 Verificação pós-atualização:');
        elementos.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                console.log(`📊 ${id}: "${el.textContent}"`);
            }
        });
    }, 500);
    
    return success;
}

// Aguardar o DOM estar pronto e executar teste
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM carregado, executando teste...');
        setTimeout(runFullTest, 2000);
    });
} else {
    console.log('📄 DOM já está pronto, executando teste...');
    setTimeout(runFullTest, 1000);
}

// Tornar função disponível globalmente para teste manual
window.testDirectAPI = testDirectAPI;
window.updateElementsDirectly = updateElementsDirectly;
window.runFullTest = runFullTest;

console.log('✅ Script de teste carregado. Use runFullTest() para executar manualmente.');