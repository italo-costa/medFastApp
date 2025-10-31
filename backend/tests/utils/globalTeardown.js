module.exports = async () => {
  console.log('🧪 Teardown global dos testes iniciado');
  
  if (global.__PRISMA__) {
    await global.__PRISMA__.$disconnect();
    console.log('✅ Conexão de teste com banco fechada');
  }
  
  console.log('🧪 Teardown global dos testes finalizado');
};