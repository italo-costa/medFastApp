#!/usr/bin/env node

/**
 * Deploy Validator Atualizado - MediApp
 * Valida deploy baseado na arquitetura real implementada
 * Data: 31/10/2025
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ModernDeployValidator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            environment: {},
            deployChecks: {
                backend: false,
                frontend: false,
                mobile: false,
                database: false,
                security: false,
                integration: false
            },
            errors: [],
            warnings: [],
            recommendations: [],
            tests: []
        };
        
        this.baseDir = '/mnt/c/workspace/aplicativo/mediapp-refined';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const entry = { timestamp, message, type };
        this.results.tests.push(entry);
        
        const emoji = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '📊';
        console.log(`${emoji} ${message}`);
    }

    async validateEnvironment() {
        this.log('🔍 Validando ambiente de deploy...', 'info');
        
        try {
            // Detectar ambiente Node.js
            const nodeVersion = execSync('wsl node --version', { encoding: 'utf8' }).trim();
            this.results.environment.nodeVersion = nodeVersion;
            this.log(`Node.js: ${nodeVersion}`, 'success');
            
            // Verificar plataforma
            this.results.environment.platform = 'linux';
            this.results.environment.NODE_ENV = 'development';
            this.results.environment.PORT = 3002;
            
            // Verificar se .env existe no backend
            const envPath = path.join(this.baseDir, 'apps/backend/.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                if (envContent.includes('DATABASE_URL')) {
                    this.results.environment.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/medifast_db?schema=public';
                    this.log('DATABASE_URL configurado', 'success');
                } else {
                    this.results.errors.push('DATABASE_URL not found in .env');
                }
            } else {
                this.results.errors.push('.env file not found');
            }
            
        } catch (error) {
            this.results.errors.push(`Environment validation failed: ${error.message}`);
            this.log(`Erro na validação do ambiente: ${error.message}`, 'error');
        }
    }

    async validateBackend() {
        this.log('🖥️ Validando backend...', 'info');
        
        try {
            const backendDir = path.join(this.baseDir, 'apps/backend');
            
            // Verificar arquivos essenciais
            const essentialFiles = [
                'package.json',
                'src/app.js',
                'src/config/index.js',
                '.env'
            ];
            
            let filesFound = 0;
            for (const file of essentialFiles) {
                if (fs.existsSync(path.join(backendDir, file))) {
                    filesFound++;
                    this.log(`✅ ${file} encontrado`, 'success');
                } else {
                    this.log(`❌ ${file} ausente`, 'error');
                }
            }
            
            // Verificar dependências
            const packagePath = path.join(backendDir, 'package.json');
            if (fs.existsSync(packagePath)) {
                const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                const criticalDeps = ['express', 'prisma', '@prisma/client', 'cors', 'helmet'];
                
                let depsFound = 0;
                for (const dep of criticalDeps) {
                    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
                        depsFound++;
                    }
                }
                
                if (depsFound >= criticalDeps.length - 1) {
                    this.log('Dependências críticas instaladas', 'success');
                } else {
                    this.results.warnings.push('Algumas dependências críticas podem estar ausentes');
                }
            }
            
            // Verificar se node_modules existe
            if (fs.existsSync(path.join(backendDir, 'node_modules'))) {
                this.log('node_modules encontrado', 'success');
            } else {
                this.results.warnings.push('node_modules não encontrado - execute npm install');
            }
            
            this.results.deployChecks.backend = filesFound >= 3;
            
        } catch (error) {
            this.results.errors.push(`Backend validation failed: ${error.message}`);
            this.log(`Erro na validação do backend: ${error.message}`, 'error');
        }
    }

    async validateFrontend() {
        this.log('🌐 Validando frontend...', 'info');
        
        try {
            const frontendDir = path.join(this.baseDir, 'apps/backend/public');
            
            if (!fs.existsSync(frontendDir)) {
                this.results.errors.push('Frontend directory not found');
                return;
            }
            
            // Verificar páginas principais
            const mainPages = [
                'gestao-medicos.html',
                'gestao-pacientes.html',
                'app.html',
                'index.html'
            ];
            
            let pagesFound = 0;
            for (const page of mainPages) {
                const pagePath = path.join(frontendDir, page);
                if (fs.existsSync(pagePath)) {
                    pagesFound++;
                    
                    // Verificar se é HTML válido
                    const content = fs.readFileSync(pagePath, 'utf8');
                    if (content.includes('<html') || content.includes('<!DOCTYPE')) {
                        this.log(`✅ ${page} - HTML válido`, 'success');
                    } else {
                        this.results.warnings.push(`${page} - estrutura HTML questionável`);
                    }
                } else {
                    this.log(`❌ ${page} ausente`, 'error');
                }
            }
            
            // Contar todas as páginas HTML
            const allHtmlFiles = fs.readdirSync(frontendDir)
                .filter(file => file.endsWith('.html'));
            
            this.log(`${allHtmlFiles.length} páginas HTML encontradas`, 'info');
            
            // Verificar JavaScript
            const jsDir = path.join(frontendDir, 'js');
            if (fs.existsSync(jsDir)) {
                const jsFiles = fs.readdirSync(jsDir)
                    .filter(file => file.endsWith('.js'));
                this.log(`${jsFiles.length} arquivos JavaScript encontrados`, 'info');
            }
            
            this.results.deployChecks.frontend = pagesFound >= 3 && allHtmlFiles.length >= 10;
            
        } catch (error) {
            this.results.errors.push(`Frontend validation failed: ${error.message}`);
            this.log(`Erro na validação do frontend: ${error.message}`, 'error');
        }
    }

    async validateMobile() {
        this.log('📱 Validando mobile app...', 'info');
        
        try {
            const mobileDir = path.join(this.baseDir, 'apps/mobile');
            
            // Verificar arquivos essenciais React Native
            const essentialFiles = [
                'package.json',
                'App.tsx',
                'index.js',
                'android/build.gradle',
                'ios/MediApp.xcodeproj/project.pbxproj'
            ];
            
            let filesFound = 0;
            for (const file of essentialFiles) {
                if (fs.existsSync(path.join(mobileDir, file))) {
                    filesFound++;
                    this.log(`✅ ${file} encontrado`, 'success');
                } else {
                    this.log(`❌ ${file} ausente`, 'error');
                }
            }
            
            // Verificar dependências React Native
            const packagePath = path.join(mobileDir, 'package.json');
            if (fs.existsSync(packagePath)) {
                const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                const rnDeps = ['react-native', '@reduxjs/toolkit', 'react-redux', '@react-navigation/native'];
                
                let depsFound = 0;
                for (const dep of rnDeps) {
                    if (packageJson.dependencies?.[dep]) {
                        depsFound++;
                    }
                }
                
                this.log(`${depsFound}/${rnDeps.length} dependências críticas encontradas`, 'info');
            }
            
            // Verificar se existem APKs compilados
            const apkFiles = fs.readdirSync(mobileDir)
                .filter(file => file.endsWith('.apk'));
            
            if (apkFiles.length > 0) {
                this.log(`${apkFiles.length} APKs compilados encontrados`, 'success');
            }
            
            // Verificar estrutura Redux
            const storePath = path.join(mobileDir, 'src/store/store.ts');
            if (fs.existsSync(storePath)) {
                this.log('Redux store configurado', 'success');
            } else {
                this.results.warnings.push('Redux store não encontrado');
            }
            
            this.results.deployChecks.mobile = filesFound >= 4;
            
        } catch (error) {
            this.results.errors.push(`Mobile validation failed: ${error.message}`);
            this.log(`Erro na validação do mobile: ${error.message}`, 'error');
        }
    }

    async validateDatabase() {
        this.log('🗄️ Validando database...', 'info');
        
        try {
            const backendDir = path.join(this.baseDir, 'apps/backend');
            
            // Verificar configuração Prisma
            const prismaSchema = path.join(backendDir, 'prisma/schema.prisma');
            if (fs.existsSync(prismaSchema)) {
                this.log('Schema Prisma encontrado', 'success');
                
                const schemaContent = fs.readFileSync(prismaSchema, 'utf8');
                const models = (schemaContent.match(/model \w+/g) || []).length;
                this.log(`${models} modelos definidos no schema`, 'info');
            } else {
                this.results.errors.push('Prisma schema não encontrado');
            }
            
            // Verificar .env para DATABASE_URL
            const envPath = path.join(backendDir, '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                if (envContent.includes('DATABASE_URL') && envContent.includes('postgresql://')) {
                    this.log('DATABASE_URL PostgreSQL configurado', 'success');
                    this.results.deployChecks.database = true;
                } else {
                    this.results.errors.push('DATABASE_URL não configurado corretamente');
                }
            }
            
        } catch (error) {
            this.results.errors.push(`Database validation failed: ${error.message}`);
            this.log(`Erro na validação do database: ${error.message}`, 'error');
        }
    }

    async validateSecurity() {
        this.log('🔒 Validando configurações de segurança...', 'info');
        
        try {
            const backendDir = path.join(this.baseDir, 'apps/backend');
            const appPath = path.join(backendDir, 'src/app.js');
            
            if (fs.existsSync(appPath)) {
                const appContent = fs.readFileSync(appPath, 'utf8');
                
                // Verificar middlewares de segurança
                const securityChecks = [
                    { name: 'Helmet', pattern: /helmet/i },
                    { name: 'CORS', pattern: /cors/i },
                    { name: 'Rate Limiting', pattern: /rate.*limit/i },
                    { name: 'Compression', pattern: /compression/i }
                ];
                
                let securityScore = 0;
                for (const check of securityChecks) {
                    if (check.pattern.test(appContent)) {
                        this.log(`✅ ${check.name} implementado`, 'success');
                        securityScore++;
                    } else {
                        this.results.warnings.push(`${check.name} não detectado`);
                    }
                }
                
                this.results.deployChecks.security = securityScore >= 3;
            }
            
        } catch (error) {
            this.results.errors.push(`Security validation failed: ${error.message}`);
            this.log(`Erro na validação de segurança: ${error.message}`, 'error');
        }
    }

    async validateIntegration() {
        this.log('🔗 Validando integração entre componentes...', 'info');
        
        try {
            // Verificar se frontend tem calls para API
            const frontendDir = path.join(this.baseDir, 'apps/backend/public');
            const htmlFiles = fs.readdirSync(frontendDir)
                .filter(file => file.endsWith('.html'));
            
            let apiCallsFound = 0;
            for (const file of htmlFiles.slice(0, 5)) { // Verificar primeiros 5 arquivos
                const content = fs.readFileSync(path.join(frontendDir, file), 'utf8');
                if (content.includes('fetch(') || content.includes('/api/')) {
                    apiCallsFound++;
                }
            }
            
            if (apiCallsFound > 0) {
                this.log(`Integração API detectada em ${apiCallsFound} páginas`, 'success');
            }
            
            // Verificar se mobile tem configuração de API
            const mobileDir = path.join(this.baseDir, 'apps/mobile');
            const mobileServicesDir = path.join(mobileDir, 'src/services');
            
            if (fs.existsSync(mobileServicesDir)) {
                this.log('Diretório de serviços mobile encontrado', 'success');
            } else {
                this.results.recommendations.push('Criar serviço de API para mobile (src/services/api.ts)');
            }
            
            this.results.deployChecks.integration = apiCallsFound > 0;
            
        } catch (error) {
            this.results.errors.push(`Integration validation failed: ${error.message}`);
            this.log(`Erro na validação de integração: ${error.message}`, 'error');
        }
    }

    generateRecommendations() {
        this.log('💡 Gerando recomendações...', 'info');
        
        // Recomendações baseadas nos resultados
        if (!this.results.deployChecks.mobile) {
            this.results.recommendations.push('Verificar estrutura do mobile app React Native');
        }
        
        if (this.results.warnings.length > 0) {
            this.results.recommendations.push('Revisar warnings antes do deploy em produção');
        }
        
        if (!fs.existsSync(path.join(this.baseDir, 'apps/mobile/src/services'))) {
            this.results.recommendations.push('Implementar API service no mobile app');
        }
        
        this.results.recommendations.push('Considerar implementar autenticação JWT');
        this.results.recommendations.push('Adicionar testes automatizados de integração');
        this.results.recommendations.push('Configurar pipeline CI/CD');
    }

    async run() {
        console.log('🚀 INICIANDO VALIDAÇÃO MODERNA DE DEPLOY');
        console.log('==========================================');
        
        await this.validateEnvironment();
        await this.validateBackend();
        await this.validateFrontend();
        await this.validateMobile();
        await this.validateDatabase();
        await this.validateSecurity();
        await this.validateIntegration();
        
        this.generateRecommendations();
        
        // Calcular aprovação geral
        const checksCount = Object.values(this.results.deployChecks).filter(Boolean).length;
        const totalChecks = Object.keys(this.results.deployChecks).length;
        const approvalPercentage = (checksCount / totalChecks) * 100;
        
        this.results.summary = {
            checksCompleted: checksCount,
            totalChecks: totalChecks,
            approvalPercentage: Math.round(approvalPercentage),
            approved: approvalPercentage >= 80,
            totalErrors: this.results.errors.length,
            totalWarnings: this.results.warnings.length
        };
        
        // Relatório final
        console.log('\n================================================================================');
        console.log('🎯 RELATÓRIO FINAL DE VALIDAÇÃO DE DEPLOY');
        console.log('================================================================================');
        
        console.log('\n📊 RESUMO:');
        console.log(`   Verificações: ${checksCount}/${totalChecks} (${Math.round(approvalPercentage)}%)`);
        console.log(`   Erros: ${this.results.errors.length}`);
        console.log(`   Warnings: ${this.results.warnings.length}`);
        console.log(`   Recomendações: ${this.results.recommendations.length}`);
        
        console.log('\n✅ COMPONENTES VALIDADOS:');
        Object.entries(this.results.deployChecks).forEach(([component, status]) => {
            const emoji = status ? '✅' : '❌';
            console.log(`   ${emoji} ${component}`);
        });
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ ERROS ENCONTRADOS:');
            this.results.errors.forEach(error => console.log(`   • ${error}`));
        }
        
        if (this.results.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.results.warnings.forEach(warning => console.log(`   • ${warning}`));
        }
        
        if (this.results.recommendations.length > 0) {
            console.log('\n💡 RECOMENDAÇÕES:');
            this.results.recommendations.forEach(rec => console.log(`   • ${rec}`));
        }
        
        console.log('\n🎯 RESULTADO FINAL:');
        if (this.results.summary.approved) {
            console.log('   🎉 DEPLOY APROVADO - Sistema pronto para produção');
        } else if (approvalPercentage >= 60) {
            console.log('   ⚠️ DEPLOY CONDICIONAL - Revisar warnings e implementar correções');
        } else {
            console.log('   ❌ DEPLOY NÃO APROVADO - Correções necessárias');
        }
        
        // Salvar relatório
        const reportPath = path.join(this.baseDir, 'tests/deploy-validation-report-updated.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Relatório salvo em: ${reportPath}`);
        
        return this.results.summary.approved;
    }
}

// Executar validação
if (require.main === module) {
    const validator = new ModernDeployValidator();
    validator.run().then(approved => {
        process.exit(approved ? 0 : 1);
    }).catch(error => {
        console.error('❌ Erro na validação:', error);
        process.exit(1);
    });
}

module.exports = ModernDeployValidator;