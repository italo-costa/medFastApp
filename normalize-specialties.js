const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function normalizeSpecialties() {
  try {
    console.log('🔄 Iniciando normalização das especialidades...');
    
    // Buscar todos os médicos
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, name: true, specialty: true }
    });
    
    console.log(`📋 Encontrados ${doctors.length} médicos`);
    
    for (const doctor of doctors) {
      if (doctor.specialty) {
        // Normalizar: primeira letra maiúscula, resto minúsculo
        const normalizedSpecialty = doctor.specialty.charAt(0).toUpperCase() + doctor.specialty.slice(1).toLowerCase();
        
        if (doctor.specialty !== normalizedSpecialty) {
          console.log(`🔧 Atualizando ${doctor.name}: "${doctor.specialty}" → "${normalizedSpecialty}"`);
          
          await prisma.user.update({
            where: { id: doctor.id },
            data: { specialty: normalizedSpecialty }
          });
        } else {
          console.log(`✅ ${doctor.name}: "${doctor.specialty}" já está normalizada`);
        }
      }
    }
    
    console.log('✅ Normalização concluída!');
    
    // Verificar resultado
    const updatedDoctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { name: true, specialty: true }
    });
    
    console.log('\n📊 Especialidades após normalização:');
    updatedDoctors.forEach(doctor => {
      console.log(`- ${doctor.name}: ${doctor.specialty}`);
    });
    
    // Contar especialidades únicas
    const uniqueSpecialties = [...new Set(updatedDoctors.map(d => d.specialty))];
    console.log(`\n🎯 Total de especialidades únicas: ${uniqueSpecialties.length}`);
    uniqueSpecialties.forEach(specialty => {
      console.log(`- ${specialty}`);
    });
    
  } catch (error) {
    console.error('❌ Erro na normalização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

normalizeSpecialties();