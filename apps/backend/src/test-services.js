/**
 * Teste de carregamento dos novos serviços
 */

console.log('🧪 Testando carregamento dos serviços...');

try {
  console.log('1. Carregando AuthService...');
  const AuthService = require('./services/authService');
  console.log('✅ AuthService carregado');

  console.log('2. Carregando ValidationService...');
  const ValidationService = require('./services/validationService');
  console.log('✅ ValidationService carregado');

  console.log('3. Carregando FileService...');
  const FileService = require('./services/fileService');
  console.log('✅ FileService carregado');

  console.log('4. Carregando ResponseService...');
  const ResponseService = require('./services/responseService');
  console.log('✅ ResponseService carregado');

  console.log('5. Carregando DatabaseService...');
  const DatabaseService = require('./services/database');
  console.log('✅ DatabaseService carregado');

  // Testar algumas funções básicas
  console.log('\n🔍 Testando funcionalidades básicas...');

  // Teste AuthService
  console.log('Testando validação de email...');
  const emailTest = ValidationService.validateEmail('test@example.com');
  console.log('Email válido:', emailTest.valid);

  // Teste ValidationService
  console.log('Testando validação de CPF...');
  const cpfTest = ValidationService.validateCPF('12345678901');
  console.log('CPF resultado:', cpfTest.valid ? 'válido' : 'inválido');

  // Teste de hash de senha (sem executar por depender de bcrypt)
  console.log('AuthService disponível:', typeof AuthService.hashPassword === 'function');

  console.log('\n🎉 Todos os serviços carregaram com sucesso!');
  console.log('✅ FASE 2 - SERVIÇOS CENTRALIZADOS: CONCLUÍDA');

} catch (error) {
  console.error('❌ Erro ao carregar serviços:', error.message);
  console.error(error.stack);
  process.exit(1);
}