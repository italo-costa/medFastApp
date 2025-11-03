/**
 * Validador da Refatoração - Fase 5
 * Script específico para validar que a refatoração foi bem-sucedida
 */

const fs = require('fs');
const path = require('path');

class RefactorValidator {
  
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.results = {
      services: {},
      controllers: {},
      middleware: {},
      dependencies: {}
    };
  }
  
  async validate() {
    console.log('🔍 [VALIDATOR] Iniciando validação da refatoração...\n');
    
    await this.validateServices();
    await this.validateControllers();
    await this.validateMiddleware();
    await this.validateDependencies();
    await this.validateCodeQuality();
    
    this.generateReport();
  }
  
  async validateServices() {
    console.log('📦 [SERVICES] Validando serviços centralizados...');
    
    const services = [
      'authService.js',
      'validationService.js', 
      'responseService.js',
      'fileService.js',
      'database.js'
    ];
    
    for (const service of services) {
      const servicePath = path.join(__dirname, '../src/services', service);
      
      if (!fs.existsSync(servicePath)) {
        this.errors.push(`❌ Serviço não encontrado: ${service}`);
        continue;
      }
      
      const content = fs.readFileSync(servicePath, 'utf8');
      const size = Math.round(content.length / 1024);
      
      // Verificar se tem as funções esperadas
      const requiredFunctions = this.getRequiredFunctions(service);
      const missingFunctions = requiredFunctions.filter(fn => !content.includes(fn));
      
      if (missingFunctions.length > 0) {
        this.errors.push(`❌ ${service} faltando funções: ${missingFunctions.join(', ')}`);
      } else {
        console.log(`  ✅ ${service} (${size}KB) - Todas as funções presentes`);
      }
      
      this.results.services[service] = {
        exists: true,
        size: `${size}KB`,
        functions: requiredFunctions.length - missingFunctions.length,
        missing: missingFunctions
      };
    }
  }
  
  async validateControllers() {
    console.log('\n🎛️ [CONTROLLERS] Validando controllers refatorados...');
    
    const controllers = [
      { file: 'auth.js', path: 'routes' },
      { file: 'medicos.js', path: 'routes' }, 
      { file: 'patients.js', path: 'routes' }
    ];
    
    for (const controller of controllers) {
      const controllerPath = path.join(__dirname, `../src/${controller.path}`, controller.file);
      
      if (!fs.existsSync(controllerPath)) {
        this.errors.push(`❌ Controller não encontrado: ${controller.file}`);
        continue;
      }
      
      const content = fs.readFileSync(controllerPath, 'utf8');
      
      // Verificar se usa os serviços centralizados
      const usesAuthService = content.includes('AuthService');
      const usesValidationService = content.includes('ValidationService');
      const usesResponseService = content.includes('ResponseService');
      
      // Verificar se não tem código duplicado (indicadores)
      const hasManualValidation = content.includes('validator.isEmail') || content.includes('bcrypt.hash');
      const hasManualResponse = content.includes('res.status(').length > 2; // Apenas algumas são ok
      
      let status = '✅';
      let issues = [];
      
      if (!usesAuthService && controller.file !== 'auth.js') {
        issues.push('Não usa AuthService');
        status = '⚠️';
      }
      
      if (!usesValidationService) {
        issues.push('Não usa ValidationService');
        status = '❌';
      }
      
      if (!usesResponseService) {
        issues.push('Não usa ResponseService');
        status = '❌';
      }
      
      if (hasManualValidation) {
        issues.push('Ainda tem validação manual');
        status = '⚠️';
      }
      
      const size = Math.round(content.length / 1024);
      console.log(`  ${status} ${controller.file} (${size}KB)${issues.length ? ' - ' + issues.join(', ') : ''}`);
      
      this.results.controllers[controller.file] = {
        size: `${size}KB`,
        usesServices: { auth: usesAuthService, validation: usesValidationService, response: usesResponseService },
        issues: issues
      };
    }
  }
  
  async validateMiddleware() {
    console.log('\n🔧 [MIDDLEWARE] Validando middleware centralizado...');
    
    const middlewarePath = path.join(__dirname, '../src/middleware/centralMiddleware.js');
    
    if (!fs.existsSync(middlewarePath)) {
      this.errors.push('❌ Middleware centralizado não encontrado');
      return;
    }
    
    const content = fs.readFileSync(middlewarePath, 'utf8');
    const size = Math.round(content.length / 1024);
    
    const features = [
      'cors',
      'helmet',
      'compression',
      'express-rate-limit',
      'morgan',
      'applyBasicMiddlewares',
      'applyFinalMiddlewares',
      'globalErrorHandler'
    ];
    
    const presentFeatures = features.filter(feature => content.includes(feature));
    const missingFeatures = features.filter(feature => !content.includes(feature));
    
    if (missingFeatures.length === 0) {
      console.log(`  ✅ centralMiddleware.js (${size}KB) - Todas as funcionalidades presentes`);
    } else {
      console.log(`  ⚠️ centralMiddleware.js (${size}KB) - Faltando: ${missingFeatures.join(', ')}`);
    }
    
    this.results.middleware.central = {
      size: `${size}KB`,
      features: presentFeatures.length,
      missing: missingFeatures
    };
  }
  
  async validateDependencies() {
    console.log('\n📋 [DEPENDENCIES] Validando dependências...');
    
    const packagePath = path.join(__dirname, '../package.json');
    
    if (!fs.existsSync(packagePath)) {
      this.errors.push('❌ package.json não encontrado');
      return;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = [
      'express',
      'prisma',
      '@prisma/client',
      'bcryptjs',
      'jsonwebtoken',
      'cors',
      'helmet',
      'compression',
      'express-rate-limit',
      'morgan',
      'joi',
      'multer',
      'sharp',
      'jest',
      'supertest'
    ];
    
    const missingDeps = requiredDeps.filter(dep => !deps[dep]);
    const presentDeps = requiredDeps.filter(dep => deps[dep]);
    
    if (missingDeps.length === 0) {
      console.log(`  ✅ Todas as ${requiredDeps.length} dependências presentes`);
    } else {
      console.log(`  ⚠️ Dependências faltando: ${missingDeps.join(', ')}`);
    }
    
    this.results.dependencies = {
      total: requiredDeps.length,
      present: presentDeps.length,
      missing: missingDeps
    };
  }
  
  async validateCodeQuality() {
    console.log('\n🎯 [QUALITY] Analisando qualidade do código...');
    
    const srcPath = path.join(__dirname, '../src');
    const totalFiles = this.countFiles(srcPath, '.js');
    const totalLines = this.countLines(srcPath);
    
    // Analisar duplicações (aproximado)
    const duplications = await this.findDuplications();
    
    console.log(`  📊 Total de arquivos JS: ${totalFiles}`);
    console.log(`  📊 Total de linhas: ${totalLines}`);
    console.log(`  📊 Possíveis duplicações: ${duplications}`);
    
    this.results.quality = {
      files: totalFiles,
      lines: totalLines,
      duplications: duplications
    };
  }
  
  getRequiredFunctions(service) {
    const functions = {
      'authService.js': ['hashPassword', 'comparePassword', 'generateToken', 'verifyToken', 'authMiddleware'],
      'validationService.js': ['validateEmail', 'validateCPF', 'validateCRM', 'validatePhone', 'sanitizeText'],
      'responseService.js': ['success', 'error', 'validationError', 'notFound', 'handle', 'formatData'],
      'fileService.js': ['uploadProfilePhoto', 'processImage', 'generateUniqueFileName'],
      'database.js': ['connect', 'disconnect', 'getSystemStats']
    };
    
    return functions[service] || [];
  }
  
  countFiles(dir, extension) {
    let count = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        count += this.countFiles(fullPath, extension);
      } else if (file.endsWith(extension)) {
        count++;
      }
    }
    
    return count;
  }
  
  countLines(dir) {
    let lines = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        lines += this.countLines(fullPath);
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        lines += content.split('\n').length;
      }
    }
    
    return lines;
  }
  
  async findDuplications() {
    // Buscar por padrões comuns de duplicação
    const patterns = [
      'bcrypt.hash',
      'jwt.sign',
      'res.status(400)',
      'res.status(500)',
      'new Date().toISOString()',
      'process.env.JWT_SECRET'
    ];
    
    let duplications = 0;
    const srcPath = path.join(__dirname, '../src');
    
    for (const pattern of patterns) {
      const count = this.countPatternInDirectory(srcPath, pattern);
      if (count > 1) {
        duplications += count - 1; // Subtrair 1 porque 1 ocorrência é normal
      }
    }
    
    return duplications;
  }
  
  countPatternInDirectory(dir, pattern) {
    let count = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        count += this.countPatternInDirectory(fullPath, pattern);
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
        if (matches) {
          count += matches.length;
        }
      }
    }
    
    return count;
  }
  
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 RELATÓRIO FINAL DA REFATORAÇÃO');
    console.log('='.repeat(60));
    
    if (this.errors.length === 0) {
      console.log('✅ REFATORAÇÃO BEM-SUCEDIDA! Todos os componentes validados.');
    } else {
      console.log('❌ PROBLEMAS ENCONTRADOS:');
      this.errors.forEach(error => console.log(`  ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ AVISOS:');
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    console.log('\n📊 RESUMO:');
    console.log(`  🔧 Serviços centralizados: ${Object.keys(this.results.services).length}/5`);
    console.log(`  🎛️ Controllers refatorados: ${Object.keys(this.results.controllers).length}/3`);
    console.log(`  🔧 Middleware centralizado: ${this.results.middleware.central ? '✅' : '❌'}`);
    console.log(`  📦 Dependências: ${this.results.dependencies.present}/${this.results.dependencies.total}`);
    console.log(`  📊 Arquivos JS: ${this.results.quality.files}`);
    console.log(`  📊 Linhas de código: ${this.results.quality.lines}`);
    console.log(`  🔄 Duplicações estimadas: ${this.results.quality.duplications}`);
    
    const score = this.calculateScore();
    console.log(`\n🎯 PONTUAÇÃO FINAL: ${score}/100`);
    
    if (score >= 90) {
      console.log('🏆 EXCELENTE! Refatoração de alta qualidade.');
    } else if (score >= 75) {
      console.log('👍 BOM! Refatoração bem-sucedida com pequenos ajustes.');
    } else if (score >= 60) {
      console.log('⚠️ ACEITÁVEL! Precisa de alguns ajustes.');
    } else {
      console.log('❌ NECESSITA CORREÇÕES! Refatoração incompleta.');
    }
    
    console.log('='.repeat(60));
  }
  
  calculateScore() {
    let score = 100;
    
    // Penalizar por erros
    score -= this.errors.length * 15;
    
    // Penalizar por avisos
    score -= this.warnings.length * 5;
    
    // Penalizar por dependências faltando
    score -= (this.results.dependencies.total - this.results.dependencies.present) * 3;
    
    // Penalizar por duplicações
    score -= this.results.quality.duplications * 2;
    
    return Math.max(0, score);
  }
}

// Executar validação se chamado diretamente
if (require.main === module) {
  const validator = new RefactorValidator();
  validator.validate().catch(console.error);
}

module.exports = RefactorValidator;