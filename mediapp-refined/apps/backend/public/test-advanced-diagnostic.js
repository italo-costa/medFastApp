// Script para diagnóstico completo de problemas no dashboard
console.log('🔧 DIAGNÓSTICO AVANÇADO - Iniciado');

// Aguardar DOM estar pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DIAGNÓSTICO COMPLETO - DOM Pronto');
    
    // Aguardar um momento para garantir que tudo foi carregado
    setTimeout(() => {
        runCompleteDiagnostic();
    }, 2000);
});

function runCompleteDiagnostic() {
    console.log('\n🔍 ======== DIAGNÓSTICO COMPLETO ========');
    
    // 1. Verificar existência dos elementos
    console.log('\n1️⃣ VERIFICAÇÃO DE ELEMENTOS:');
    const elementIds = ['stat-pacientes', 'stat-prontuarios', 'stat-exames', 'stat-medicos'];
    const elements = {};
    
    elementIds.forEach(id => {
        const el = document.getElementById(id);
        elements[id] = el;
        
        if (el) {
            console.log(`✅ ${id}: ENCONTRADO`);
            console.log(`   Conteúdo: "${el.textContent}"`);
            console.log(`   TagName: ${el.tagName}`);
            console.log(`   Classes: ${el.className}`);
            console.log(`   Parent: ${el.parentElement ? el.parentElement.tagName : 'NENHUM'}`);
            
            // Verificar estilos computados
            const styles = getComputedStyle(el);
            console.log(`   Display: ${styles.display}`);
            console.log(`   Visibility: ${styles.visibility}`);
            console.log(`   Opacity: ${styles.opacity}`);
            console.log(`   Color: ${styles.color}`);
            console.log(`   Font-size: ${styles.fontSize}`);
            
        } else {
            console.log(`❌ ${id}: NÃO ENCONTRADO`);
        }
    });
    
    // 2. Testar API
    console.log('\n2️⃣ TESTE DA API:');
    fetch('/api/statistics/dashboard')
        .then(response => {
            console.log(`📡 Status da resposta: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('📊 Dados da API:', data);
            
            if (data.success && data.data) {
                const stats = data.data;
                
                // 3. Tentativa de atualização manual
                console.log('\n3️⃣ ATUALIZAÇÃO MANUAL:');
                
                const updates = [
                    { id: 'stat-pacientes', value: stats.pacientesCadastrados.value },
                    { id: 'stat-prontuarios', value: stats.prontuariosCriados.value },
                    { id: 'stat-exames', value: stats.examesRegistrados.value },
                    { id: 'stat-medicos', value: stats.medicosAtivos.value }
                ];
                
                updates.forEach(update => {
                    const el = document.getElementById(update.id);
                    if (el) {
                        const oldValue = el.textContent;
                        
                        // Tentar diferentes métodos de atualização
                        console.log(`🔧 Testando ${update.id}:`);
                        
                        // Método 1: textContent
                        el.textContent = update.value;
                        console.log(`   textContent: "${oldValue}" → "${el.textContent}"`);
                        
                        // Método 2: innerHTML (para confirmar)
                        el.innerHTML = update.value;
                        console.log(`   innerHTML: agora "${el.textContent}"`);
                        
                        // Método 3: forçar re-render
                        el.style.display = 'none';
                        el.offsetHeight; // trigger reflow
                        el.style.display = 'block';
                        console.log(`   após reflow: "${el.textContent}"`);
                        
                    } else {
                        console.log(`❌ ${update.id}: ELEMENTO NÃO ENCONTRADO`);
                    }
                });
                
                // 4. Verificar se mudanças persistiram
                console.log('\n4️⃣ VERIFICAÇÃO FINAL:');
                setTimeout(() => {
                    elementIds.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            console.log(`🔍 ${id} final: "${el.textContent}"`);
                        }
                    });
                }, 1000);
                
            } else {
                console.log('❌ API não retornou dados válidos');
            }
        })
        .catch(error => {
            console.log('❌ Erro na API:', error);
        });
    
    // 5. Verificar se há outros scripts interferindo
    console.log('\n5️⃣ VERIFICAÇÃO DE SCRIPTS:');
    console.log('Funções globais disponíveis:');
    console.log('- loadDashboardStats:', typeof window.loadDashboardStats);
    console.log('- testStatsLoad:', typeof window.testStatsLoad);
    console.log('- forceUpdateStats:', typeof window.forceUpdateStats);
    
    // 6. Verificar evento listeners
    console.log('\n6️⃣ EVENT LISTENERS:');
    console.log('DOMContentLoaded listeners ativos:', document._allListeners?.DOMContentLoaded?.length || 'Não disponível');
    
    console.log('\n✅ DIAGNÓSTICO COMPLETO FINALIZADO');
}

// Disponibilizar função globalmente
window.runCompleteDiagnostic = runCompleteDiagnostic;

console.log('🎯 Diagnóstico avançado carregado. Use runCompleteDiagnostic() para executar.');