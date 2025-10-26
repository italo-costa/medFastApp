const { PrismaClient } = require('@prisma/client');

async function testarSalvamento() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🧪 Testando salvamento de estatísticas...');
        
        // Criar uma estatística de teste
        const estatisticaTeste = await prisma.estatisticaDashboard.create({
            data: {
                tipo_estatistica: 'PACIENTES_CADASTRADOS',
                valor: '5',
                valor_numerico: 5,
                label: 'Pacientes Cadastrados',
                trend: '+0 este mês',
                icon: 'fas fa-users',
                color: 'blue',
                dados_reais: true,
                metadados: {
                    fonte: 'teste',
                    criado_por: 'script_teste'
                }
            }
        });
        
        console.log('✅ Estatística de teste criada:', estatisticaTeste.id);
        
        // Verificar se foi salva
        const count = await prisma.estatisticaDashboard.count();
        console.log(`📊 Total de registros após teste: ${count}`);
        
        // Listar todas
        const todas = await prisma.estatisticaDashboard.findMany();
        console.log('📋 Estatísticas encontradas:');
        todas.forEach(stat => {
            console.log(`- ${stat.tipo_estatistica}: ${stat.valor} (ID: ${stat.id})`);
        });
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testarSalvamento();