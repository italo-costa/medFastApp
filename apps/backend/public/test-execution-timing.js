// Script para testar timing de execução das funções de estatísticas
console.log('📊 TESTE DE TIMING - Script carregado');

// Monitorar estado do DOM
let domReadyTime = null;
let windowLoadTime = null;
let functionsCalledTime = [];

// Interceptar console.log para capturar logs das funções
const originalLog = console.log;
console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('loadDashboardStats') || message.includes('estatísticas')) {
        functionsCalledTime.push({
            time: new Date().toISOString(),
            message: message,
            domReady: domReadyTime !== null,
            windowLoaded: windowLoadTime !== null
        });
    }
    originalLog.apply(console, args);
};

// Marcar quando DOM está pronto
document.addEventListener('DOMContentLoaded', function() {
    domReadyTime = new Date().toISOString();
    console.log('🎯 DOM READY registrado em:', domReadyTime);
    
    // Verificar se elementos existem
    const elements = [
        'stat-pacientes',
        'stat-prontuarios', 
        'stat-exames',
        'stat-medicos'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`🔍 Elemento ${id}:`, el ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
        if (el) {
            console.log(`   Conteúdo atual: "${el.textContent}"`);
            console.log(`   Display: ${getComputedStyle(el).display}`);
            console.log(`   Visibility: ${getComputedStyle(el).visibility}`);
        }
    });
});

// Marcar quando window está carregada
window.addEventListener('load', function() {
    windowLoadTime = new Date().toISOString();
    console.log('🏁 WINDOW LOAD registrado em:', windowLoadTime);
    
    // Aguardar um pouco e verificar novamente os elementos
    setTimeout(() => {
        console.log('🔍 VERIFICAÇÃO FINAL DOS ELEMENTOS:');
        const elements = [
            'stat-pacientes',
            'stat-prontuarios', 
            'stat-exames',
            'stat-medicos'
        ];
        
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                console.log(`✅ ${id}: "${el.textContent}"`);
            } else {
                console.log(`❌ ${id}: NÃO ENCONTRADO`);
            }
        });
        
        // Mostrar resumo do timing
        console.log('\n📋 RESUMO DO TIMING:');
        console.log('DOM Ready:', domReadyTime);
        console.log('Window Load:', windowLoadTime);
        console.log('Funções chamadas:', functionsCalledTime.length);
        functionsCalledTime.forEach((call, index) => {
            console.log(`  ${index + 1}. ${call.time} - ${call.message}`);
            console.log(`     DOM Ready: ${call.domReady}, Window Loaded: ${call.windowLoaded}`);
        });
    }, 1000);
});

// Função de teste manual que pode ser chamada pelo console
window.testExecutionTiming = function() {
    console.log('\n🧪 TESTE MANUAL DE EXECUÇÃO:');
    
    // Testar API diretamente
    fetch('/api/statistics/dashboard')
        .then(response => response.json())
        .then(data => {
            console.log('📡 API Response:', data);
            
            if (data.success && data.data) {
                const stats = data.data;
                console.log('📊 Dados recebidos:');
                console.log('  Pacientes:', stats.pacientesCadastrados.value);
                console.log('  Prontuários:', stats.prontuariosCriados.value);
                console.log('  Exames:', stats.examesRegistrados.value);
                console.log('  Médicos:', stats.medicosAtivos.value);
                
                // Tentar atualizar elementos manualmente
                console.log('\n🔧 ATUALIZANDO ELEMENTOS MANUALMENTE:');
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
                        el.textContent = update.value;
                        console.log(`✅ ${update.id}: "${oldValue}" → "${update.value}"`);
                    } else {
                        console.log(`❌ ${update.id}: ELEMENTO NÃO ENCONTRADO`);
                    }
                });
            }
        })
        .catch(error => {
            console.error('❌ Erro na API:', error);
        });
};

console.log('🎯 Script de timing carregado. Use testExecutionTiming() para teste manual.');