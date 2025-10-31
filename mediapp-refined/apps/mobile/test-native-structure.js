const fs = require('fs');
const path = require('path');

// Teste da estrutura Android e iOS
const testNativeStructure = () => {
  console.log('🧪 TESTE DE ESTRUTURA ANDROID/iOS');
  console.log('=====================================');
  
  const errors = [];
  const warnings = [];
  
  // Diretório base
  const mobileDir = path.join(__dirname, '.');
  
  // ===== TESTES ANDROID =====
  console.log('\n📱 TESTANDO ESTRUTURA ANDROID...');
  
  const androidRequiredFiles = [
    'android/build.gradle',
    'android/app/build.gradle',
    'android/app/src/main/AndroidManifest.xml',
    'android/app/src/main/java/com/mediapp/MainActivity.java',
    'android/app/src/main/java/com/mediapp/MainApplication.java',
    'android/app/src/main/res/values/strings.xml',
    'android/app/src/main/res/values/styles.xml',
    'android/gradlew'
  ];
  
  androidRequiredFiles.forEach(file => {
    const filePath = path.join(mobileDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      errors.push(`❌ Android: ${file} não encontrado`);
    }
  });
  
  // Verificar conteúdo do AndroidManifest
  const manifestPath = path.join(mobileDir, 'android/app/src/main/AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    const manifest = fs.readFileSync(manifestPath, 'utf8');
    if (manifest.includes('com.mediapp')) {
      console.log('  ✅ Package name correto no AndroidManifest');
    } else {
      warnings.push('⚠️ Package name pode estar incorreto no AndroidManifest');
    }
    
    if (manifest.includes('CAMERA') && manifest.includes('WRITE_EXTERNAL_STORAGE')) {
      console.log('  ✅ Permissões médicas configuradas');
    } else {
      warnings.push('⚠️ Permissões médicas podem estar faltando');
    }
  }
  
  // ===== TESTES iOS =====
  console.log('\n🍎 TESTANDO ESTRUTURA iOS...');
  
  const iosRequiredFiles = [
    'ios/MediApp.xcodeproj',
    'ios/MediApp/AppDelegate.h',
    'ios/MediApp/AppDelegate.mm',
    'ios/MediApp/Info.plist',
    'ios/MediApp/main.m',
    'ios/MediApp/LaunchScreen.storyboard',
    'ios/MediApp/Images.xcassets',
    'ios/Podfile'
  ];
  
  iosRequiredFiles.forEach(file => {
    const filePath = path.join(mobileDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      errors.push(`❌ iOS: ${file} não encontrado`);
    }
  });
  
  // Verificar conteúdo do Info.plist
  const infoPlistPath = path.join(mobileDir, 'ios/MediApp/Info.plist');
  if (fs.existsSync(infoPlistPath)) {
    const infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
    if (infoPlist.includes('MediApp')) {
      console.log('  ✅ Nome do app correto no Info.plist');
    } else {
      warnings.push('⚠️ Nome do app pode estar incorreto no Info.plist');
    }
    
    if (infoPlist.includes('NSCameraUsageDescription') && infoPlist.includes('NSFaceIDUsageDescription')) {
      console.log('  ✅ Permissões médicas configuradas no iOS');
    } else {
      warnings.push('⚠️ Permissões médicas podem estar faltando no iOS');
    }
  }
  
  // ===== TESTES REACT NATIVE =====
  console.log('\n⚛️ TESTANDO CONFIGURAÇÃO REACT NATIVE...');
  
  const packageJsonPath = path.join(mobileDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.dependencies && packageJson.dependencies['react-native']) {
      console.log(`  ✅ React Native: ${packageJson.dependencies['react-native']}`);
    } else {
      errors.push('❌ React Native não encontrado nas dependências');
    }
    
    if (packageJson.scripts && packageJson.scripts.android && packageJson.scripts.ios) {
      console.log('  ✅ Scripts Android e iOS configurados');
    } else {
      warnings.push('⚠️ Scripts de build podem estar faltando');
    }
  }
  
  // ===== RESULTADOS =====
  console.log('\n📊 RESULTADOS DOS TESTES');
  console.log('========================');
  
  if (errors.length === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Estrutura Android completa');
    console.log('✅ Estrutura iOS completa'); 
    console.log('✅ Configuração React Native OK');
    
    if (warnings.length > 0) {
      console.log('\n⚠️ AVISOS:');
      warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    return true;
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM:');
    errors.forEach(error => console.log(`  ${error}`));
    
    if (warnings.length > 0) {
      console.log('\n⚠️ AVISOS:');
      warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    return false;
  }
};

// Executar teste
const success = testNativeStructure();

console.log('\n' + '='.repeat(50));
if (success) {
  console.log('✅ ESTRUTURA ANDROID/iOS VALIDADA COM SUCESSO!');
  process.exit(0);
} else {
  console.log('❌ ESTRUTURA ANDROID/iOS POSSUI PROBLEMAS!');
  process.exit(1);
}