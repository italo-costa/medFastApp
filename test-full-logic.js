// Script de teste direto para verificar a lógica das estatísticas
const path = require('path');

// Simular o logger
const logger = {
    info: console.log,
    warn: console.warn,
    error: console.error
};

// Configurar path do Prisma
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/medifast_db?schema=public";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Copiar exatamente as funções do statistics.js
async function getRealDataFromDatabase() {
    const realData = {
        pacientes: { total: 0, novosEsteMes: 0, ativosUltimos30Dias: 0 },
        medicos: { total: 0, ativos: 0, especialidades: 0 },
        consultas: { hoje: 0, estaSemana: 0, esteMes: 0 },
        alergias: { pacientesComAlergias: 0, contraindicacoes: 0, alertasAtivos: 0 },
        exames: { total: 0, pendentes: 0, realizadosEsteMes: 0 },
        prontuarios: { total: 0, criadosEsteMes: 0, atualizadosHoje: 0 }
    };

    try {
        // Get exams data from database
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
            
            logger.info(`Exames reais: ${totalExames} total, ${examesPendentes} pendentes, ${examesEsteMes} realizados este mês`);
        } catch (error) {
            logger.warn('Erro ao obter dados de exames do banco:', error.message);
        }

        return realData;
    } catch (error) {
        logger.error('Erro geral ao obter dados reais:', error.message);
        return null;
    }
}

function mergeRealDataWithStats(currentStats, realData) {
    if (!realData) return currentStats;
    
    const mergedStats = { ...currentStats };
    
    if (realData.exames.total >= 0) {
        console.log(`🔄 Aplicando merge para exames: ${realData.exames.total} total, ${realData.exames.pendentes} pendentes`);
        mergedStats.exames = {
            ...mergedStats.exames,
            total: realData.exames.total,
            pendentes: realData.exames.pendentes,
            realizadosEsteMes: realData.exames.realizadosEsteMes
        };
        console.log(`✅ Exames após merge:`, mergedStats.exames);
    }
    
    return mergedStats;
}

async function testStatistics() {
    try {
        console.log('🧪 Teste da lógica de estatísticas\n');
        
        // Stats base (simulados)
        let stats = {
            exames: {
                total: 1456,  // Valor que aparece incorretamente
                pendentes: 34,
                realizadosEsteMes: 156
            }
        };
        
        console.log('📊 Stats iniciais (simulados):');
        console.log(JSON.stringify(stats.exames, null, 2));
        console.log('');
        
        // Obter dados reais
        console.log('🔍 Obtendo dados reais...');
        const realData = await getRealDataFromDatabase();
        
        if (realData) {
            console.log('📊 Dados reais obtidos:');
            console.log(JSON.stringify(realData.exames, null, 2));
            console.log('');
            
            // Aplicar merge
            console.log('🔄 Aplicando merge...');
            stats = mergeRealDataWithStats(stats, realData);
            
            console.log('📊 Stats finais após merge:');
            console.log(JSON.stringify(stats.exames, null, 2));
            console.log('');
            
            // Testar formatação final
            console.log('🎨 Formatação final para dashboard:');
            const dashboardStats = {
                examesRegistrados: {
                    value: stats.exames.total.toLocaleString('pt-BR'),
                    label: 'Exames Registrados',
                    icon: 'fas fa-x-ray',
                    color: 'purple',
                    trend: `${stats.exames.pendentes} pendentes`,
                    realData: realData && realData.exames.total >= 0
                }
            };
            
            console.log(JSON.stringify(dashboardStats, null, 2));
            
            // Verificar condições
            console.log('\n🔍 Verificação de condições:');
            console.log(`realData existe: ${!!realData}`);
            console.log(`realData.exames.total: ${realData.exames.total}`);
            console.log(`realData.exames.total >= 0: ${realData.exames.total >= 0}`);
            console.log(`Condição final: ${realData && realData.exames.total >= 0}`);
            
        } else {
            console.log('❌ Não foi possível obter dados reais');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testStatistics();