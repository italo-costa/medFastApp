const { PrismaClient } = require('@prisma/client');

async function verificarEstatisticas() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Verificando estatísticas no banco de dados...');
        
        // Verificar se a tabela existe e tem dados
        const count = await prisma.estatisticaDashboard.count();
        console.log(`📊 Total de registros na tabela: ${count}`);
        
        if (count > 0) {
            const estatisticas = await prisma.estatisticaDashboard.findMany({
                orderBy: { criado_em: 'desc' },
                take: 10
            });
            
            console.log('\n📋 Últimas estatísticas:');
            estatisticas.forEach((stat, index) => {
                console.log(`${index + 1}. ${stat.tipo_estatistica}: ${stat.valor} (${stat.dados_reais ? 'Real' : 'Simulado'})`);
                console.log(`   Trend: ${stat.trend}`);
                console.log(`   Criado em: ${stat.criado_em.toLocaleString('pt-BR')}`);
                console.log(`   Ativo: ${stat.ativo ? 'Sim' : 'Não'}`);
                console.log('---');
            });
        } else {
            console.log('⚠️ Nenhuma estatística encontrada no banco');
        }
        
        // Verificar outras tabelas relacionadas
        const pacientesCount = await prisma.paciente.count();
        const medicosCount = await prisma.medico.count();
        const prontuariosCount = await prisma.prontuario.count();
        const examesesCount = await prisma.exame.count();
        
        console.log('\n📈 Dados reais nas tabelas:');
        console.log(`👥 Pacientes: ${pacientesCount}`);
        console.log(`👨‍⚕️ Médicos: ${medicosCount}`);
        console.log(`📋 Prontuários: ${prontuariosCount}`);
        console.log(`🔬 Exames: ${examesesCount}`);
        
    } catch (error) {
        console.error('❌ Erro ao verificar estatísticas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarEstatisticas();