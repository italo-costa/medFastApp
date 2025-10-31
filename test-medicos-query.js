// Script para testar consulta de médicos diretamente
const { PrismaClient } = require('@prisma/client');

async function testMedicosQuery() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Testando consulta de médicos...');
        
        // Teste simples primeiro
        const count = await prisma.medico.count();
        console.log(`📊 Total de médicos: ${count}`);
        
        // Consulta básica
        const medicosBasico = await prisma.medico.findMany({
            take: 3,
            select: {
                id: true,
                crm: true,
                especialidade: true,
                criado_em: true
            }
        });
        
        console.log('\n📋 Médicos (consulta básica):');
        medicosBasico.forEach((medico, index) => {
            console.log(`${index + 1}. CRM: ${medico.crm} - ${medico.especialidade}`);
        });
        
        // Consulta com relacionamento
        console.log('\n🔍 Testando consulta com relacionamentos...');
        const medicosCompleto = await prisma.medico.findMany({
            take: 2,
            include: {
                usuario: {
                    select: {
                        nome: true,
                        email: true
                    }
                }
            }
        });
        
        console.log('\n👨‍⚕️ Médicos (com usuário):');
        medicosCompleto.forEach((medico, index) => {
            console.log(`${index + 1}. ${medico.usuario?.nome || 'Nome não disponível'} - CRM: ${medico.crm}`);
        });
        
        // Testar estrutura final para API
        const medicosAPI = await prisma.medico.findMany({
            include: {
                usuario: {
                    select: {
                        nome: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        consultas: true,
                        prontuarios: true
                    }
                }
            },
            orderBy: {
                criado_em: 'desc'
            },
            take: 2
        });
        
        console.log('\n🎯 Estrutura final para API:');
        console.log(JSON.stringify(medicosAPI[0], null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testMedicosQuery();