// Teste do comportamento de edição de médico
// Execute este código no console do navegador para testar

console.log('🧪 Testando função de edição de médico...');

// Simular dados que vêm da API (formato atual)
const dadosApiMedico = {
    "id": 1,
    "nome": "Dr. João Silva",  // ← API retorna 'nome'
    "crm": "CRM123456",
    "especialidade": "Cardiologia",
    "telefone": "(11) 99999-1111",
    "email": "joao.silva@mediapp.com",
    "endereco": "Rua das Flores, 123 - São Paulo/SP",  // ← API retorna 'endereco'
    "status": "ativo",
    "created_at": "2024-01-15T10:30:00.000Z"
};

// Testar função populateForm
function testarPopulateForm() {
    console.log('📋 Testando populateForm com dados:', dadosApiMedico);
    
    // Verificar se os elementos existem
    const elementos = {
        nomeCompleto: document.getElementById('nomeCompleto'),
        logradouro: document.getElementById('logradouro'),
        medicoId: document.getElementById('medicoId')
    };
    
    console.log('🔍 Elementos encontrados:', {
        nomeCompleto: !!elementos.nomeCompleto,
        logradouro: !!elementos.logradouro,
        medicoId: !!elementos.medicoId
    });
    
    if (elementos.nomeCompleto && elementos.logradouro && elementos.medicoId) {
        // Simular a função populateForm
        elementos.medicoId.value = dadosApiMedico.id || '';
        elementos.nomeCompleto.value = dadosApiMedico.nome || dadosApiMedico.nomeCompleto || '';
        elementos.logradouro.value = dadosApiMedico.endereco || dadosApiMedico.logradouro || '';
        
        console.log('✅ Valores preenchidos:');
        console.log('  ID:', elementos.medicoId.value);
        console.log('  Nome:', elementos.nomeCompleto.value);
        console.log('  Endereço:', elementos.logradouro.value);
        
        return {
            sucesso: true,
            valores: {
                id: elementos.medicoId.value,
                nome: elementos.nomeCompleto.value,
                endereco: elementos.logradouro.value
            }
        };
    } else {
        console.log('❌ Elementos não encontrados na página');
        return { sucesso: false, erro: 'Elementos não encontrados' };
    }
}

// Executar teste
const resultado = testarPopulateForm();
console.log('🎯 Resultado do teste:', resultado);

// Teste adicional: verificar se a API está respondendo
fetch('/api/medicos/1')
    .then(response => response.json())
    .then(data => {
        console.log('🌐 Dados da API:', data);
        if (data.success && data.data) {
            console.log('✅ API funcionando - Campos disponíveis:', Object.keys(data.data));
            console.log('📝 Campo nome:', data.data.nome);
            console.log('📝 Campo endereco:', data.data.endereco);
        }
    })
    .catch(error => {
        console.log('❌ Erro na API:', error);
    });