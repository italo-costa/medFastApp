// Script para testar a função getRealDataFromDatabase
const { PrismaClient } = require('@prisma/client');

async function testGetRealDataFromDatabase() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Testando função getRealDataFromDatabase...');
        
        const realData = {
            pacientes: { total: 0, novosEsteMes: 0, ativosUltimos30Dias: 0 },
            medicos: { total: 0, ativos: 0, especialidades: 0 },
            consultas: { hoje: 0, estaSemana: 0, esteMes: 0 },
            alergias: { pacientesComAlergias: 0, contraindicacoes: 0, alertasAtivos: 0 },
            exames: { total: 0, pendentes: 0, realizadosEsteMes: 0 },
            prontuarios: { total: 0, criadosEsteMes: 0, atualizadosHoje: 0 }
        };

        // Get exams data from database (copiando a lógica exata do código)
        try {
            const totalExames = await prisma.exame.count();
            const examesPendentes = await prisma.exameSolicitado.count();
            
            // Count exams from this month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const examesEsteMes = await prisma.exame.count({
                where: {
                    criado_em: { gte: startOfMonth }
                }
            });
            
            realData.exames.total = totalExames;
            realData.exames.pendentes = examesPendentes;
            realData.exames.realizadosEsteMes = examesEsteMes;
            
            console.log(`✅ Exames reais coletados: ${totalExames} total, ${examesPendentes} pendentes, ${examesEsteMes} realizados este mês`);
        } catch (error) {
            console.log('❌ Erro ao obter dados de exames do banco:', error.message);
        }

        console.log('📊 realData.exames após coleta:');
        console.log(JSON.stringify(realData.exames, null, 2));
        
        // Testar condição de merge
        console.log('🔍 Testando condições:');
        console.log(`realData existe? ${!!realData}`);
        console.log(`realData.exames.total: ${realData.exames.total}`);
        console.log(`realData.exames.total >= 0: ${realData.exames.total >= 0}`);
        console.log(`Condição completa: ${realData && realData.exames.total >= 0}`);
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testGetRealDataFromDatabase();