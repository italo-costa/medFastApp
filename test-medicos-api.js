// Script para testar API de médicos
async function testMedicosAPI() {
    try {
        console.log('🔍 Testando API de médicos...');
        
        const response = await fetch('http://localhost:3001/api/medicos');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Resposta da API:');
        console.log('Success:', data.success);
        console.log('Total:', data.total);
        console.log('Número de médicos:', data.data ? data.data.length : 0);
        
        if (data.data && data.data.length > 0) {
            console.log('\n📋 Exemplo de médico:');
            console.log(JSON.stringify(data.data[0], null, 2));
            
            console.log('\n👨‍⚕️ Lista de médicos:');
            data.data.forEach((medico, index) => {
                console.log(`${index + 1}. ${medico.usuario?.nome || 'Nome não disponível'} - CRM: ${medico.crm} - ${medico.especialidade}`);
            });
        } else {
            console.log('❌ Nenhum médico encontrado nos dados');
        }
        
    } catch (error) {
        console.error('❌ Erro ao testar API:', error.message);
    }
}

testMedicosAPI();