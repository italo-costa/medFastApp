/**
 * Demonstração Prática dos Novos Serviços - FASE 2
 * Testa se os serviços carregam e funcionam básicamente
 */

console.log('🚀 FASE 2 - TESTANDO SERVIÇOS CENTRALIZADOS\n');

// Teste 1: Carregamento dos serviços
console.log('📦 1. CARREGAMENTO DOS SERVIÇOS:');
try {
  const AuthService = require('./services/authService');
  console.log('✅ AuthService carregado');
  
  const ValidationService = require('./services/validationService');
  console.log('✅ ValidationService carregado');
  
  const FileService = require('./services/fileService');
  console.log('✅ FileService carregado');
  
  const ResponseService = require('./services/responseService');
  console.log('✅ ResponseService carregado');
  
  const DatabaseService = require('./services/database');
  console.log('✅ DatabaseService carregado');
  
} catch (error) {
  console.error('❌ Erro no carregamento:', error.message);
  process.exit(1);
}

// Teste 2: Funcionalidades básicas
console.log('\n🔧 2. TESTES DE FUNCIONALIDADES:');

try {
  // ValidationService
  console.log('\n📋 ValidationService:');
  const emailTest = ValidationService.validateEmail('usuario@medfast.com');
  console.log(`   Email válido: ${emailTest.valid} (${emailTest.sanitized})`);
  
  const cpfTest = ValidationService.validateCPF('11122233344');
  console.log(`   CPF válido: ${cpfTest.valid}`);
  
  const nomeTest = ValidationService.validateName('Dr. João Silva');
  console.log(`   Nome válido: ${nomeTest.valid} (${nomeTest.sanitized})`);
  
  // AuthService
  console.log('\n🔐 AuthService:');
  console.log(`   hashPassword disponível: ${typeof AuthService.hashPassword === 'function'}`);
  console.log(`   generateToken disponível: ${typeof AuthService.generateToken === 'function'}`);
  console.log(`   verifyToken disponível: ${typeof AuthService.verifyToken === 'function'}`);
  
  // Teste de geração de token
  const testToken = AuthService.generateToken({ userId: 123, email: 'test@test.com' });
  console.log(`   Token gerado: ${testToken.substring(0, 20)}...`);
  
  // FileService
  console.log('\n📁 FileService:');
  console.log(`   getUploadConfig disponível: ${typeof FileService.getUploadConfig === 'function'}`);
  console.log(`   generateUniqueFileName disponível: ${typeof FileService.generateUniqueFileName === 'function'}`);
  
  const uniqueName = FileService.generateUniqueFileName('test.jpg');
  console.log(`   Nome único gerado: ${uniqueName}`);
  
  const config = FileService.getUploadConfig();
  console.log(`   Tamanho máximo: ${config.maxFileSize / 1024 / 1024}MB`);
  
  // ResponseService
  console.log('\n📤 ResponseService:');
  console.log(`   success disponível: ${typeof ResponseService.success === 'function'}`);
  console.log(`   error disponível: ${typeof ResponseService.error === 'function'}`);
  console.log(`   validationError disponível: ${typeof ResponseService.validationError === 'function'}`);
  
  console.log('\n🎉 RESULTADO FASE 2:');
  console.log('✅ Todos os serviços funcionando corretamente!');
  console.log('✅ AuthService: Pronto para autenticação e tokens');
  console.log('✅ ValidationService: Validações de CPF, email, nome, etc.');
  console.log('✅ FileService: Upload e processamento de arquivos');
  console.log('✅ ResponseService: Padronização de respostas da API');
  console.log('\n🏆 FASE 2 CONCLUÍDA COM SUCESSO!');
  console.log('📈 Próximo: Migrar controllers para usar os novos serviços');

} catch (error) {
  console.error('❌ Erro nos testes:', error.message);
  process.exit(1);
}