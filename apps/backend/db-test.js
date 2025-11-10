const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔌 Testando conexão...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida');
    
    console.log('📊 Contando registros...');
    const [medicos, pacientes, usuarios, exames] = await Promise.all([
      prisma.medicos.count(),
      prisma.pacientes.count(), 
      prisma.usuarios.count(),
      prisma.exames.count()
    ]);
    
    console.log('✅ Médicos:', medicos);
    console.log('✅ Pacientes:', pacientes); 
    console.log('✅ Usuários:', usuarios);
    console.log('✅ Exames:', exames);
    
    console.log('🔍 Testando queries...');
    const firstMedico = await prisma.medicos.findFirst({
      include: { usuario: true }
    });
    
    if (firstMedico) {
      console.log('✅ Query complexa funcionando');
      console.log(`📋 Primeiro médico: ${firstMedico.usuario.nome} (CRM: ${firstMedico.crm})`);
    }
    
    await prisma.$disconnect();
    console.log('✅ Desconectado com sucesso');
    console.log('🎯 Database 100% operacional!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testDatabase();