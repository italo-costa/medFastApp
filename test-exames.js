// Script para testar conexão com banco e verificar dados de exames
const { PrismaClient } = require('@prisma/client');

async function testExamesData() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Verificando dados de exames...');
        
        // Contar total de exames
        const totalExames = await prisma.exame.count();
        console.log(`📊 Total de exames: ${totalExames}`);
        
        // Contar exames solicitados (pendentes)
        const examesPendentes = await prisma.exameSolicitado.count();
        console.log(`⏳ Exames pendentes: ${examesPendentes}`);
        
        // Ver alguns exames (primeiros 5)
        const exemplosExames = await prisma.exame.findMany({
            take: 5,
            select: {
                id: true,
                tipo_exame: true,
                nome_exame: true,
                criado_em: true
            }
        });
        
        console.log('🔬 Exemplos de exames:');
        exemplosExames.forEach((exame, index) => {
            console.log(`  ${index + 1}. ${exame.nome_exame} (${exame.tipo_exame}) - ${exame.criado_em}`);
        });
        
        // Verificar dados este mês
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const examesEsteMes = await prisma.exame.count({
            where: {
                criado_em: { gte: startOfMonth }
            }
        });
        
        console.log(`📅 Exames criados este mês: ${examesEsteMes}`);
        
        // Teste de estrutura dos dados
        const realData = {
            exames: {
                total: totalExames,
                pendentes: examesPendentes,
                realizadosEsteMes: examesEsteMes
            }
        };
        
        console.log('📋 Dados estruturados:');
        console.log(JSON.stringify(realData, null, 2));
        
        // Verificar condições para realData flag
        const shouldUseRealData = realData.exames.total >= 0;
        console.log(`✅ Deveria usar dados reais? ${shouldUseRealData}`);
        console.log(`📊 Condição (total >= 0): ${totalExames} >= 0 = ${totalExames >= 0}`);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testExamesData();