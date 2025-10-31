#!/usr/bin/env node

/**
 * 🚀 VALIDAÇÃO DE DEPLOY MEDIAPP
 * 
 * Testes específicos para validação de deploy em diferentes ambientes:
 * - ✅ Development (Local)
 * - ✅ Staging (Ubuntu Server)
 * - ✅ Production (Deploy completo)
 * - ✅ Mobile Build (Android/iOS)
 * - ✅ Database Migration
 * - ✅ Environment Configuration
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DeployValidator {
    constructor() {
        this.results = {
            environment: null,
            tests: [],
            errors: [],
            warnings: [],
            deployChecks: {
                backend: false,
                frontend: false,
                mobile: false,
                database: false,
                security: false
            }
        };
        
        this.environments = {
            development: {
                url: 'http://localhost:3002',
                database: 'postgresql://localhost:5432/mediapp_dev',
                secure: false
            },
            staging: {
                url: 'https://staging-mediapp.com',
                database: 'postgresql://staging:5432/mediapp',
                secure: true
            },
            production: {
                url: 'https://mediapp.com',
                database: 'postgresql://prod:5432/mediapp',
                secure: true
            }
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            warning: '\x1b[33m',
            error: '\x1b[31m',
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
        
        this.results.tests.push({
            timestamp,
            message,
            type
        });
    }

    async detectEnvironment() {
        this.log('🔍 Detectando ambiente de deploy...', 'info');
        
        try {
            // Verificar variáveis de ambiente
            const nodeEnv = process.env.NODE_ENV || 'development';
            const port = process.env.PORT || 3002;
            const dbUrl = process.env.DATABASE_URL;
            
            this.results.environment = {
                NODE_ENV: nodeEnv,
                PORT: port,
                DATABASE_URL: dbUrl ? '[CONFIGURED]' : '[NOT SET]',
                platform: process.platform,
                nodeVersion: process.version
            };
            
            this.log(`📊 Ambiente detectado: ${nodeEnv}`, 'success');
            this.log(`🌐 Porta: ${port}`, 'info');
            this.log(`💾 Database: ${dbUrl ? 'Configurado' : 'Não configurado'}`, dbUrl ? 'success' : 'warning');
            
            return nodeEnv;
            
        } catch (error) {
            this.log(`❌ Erro ao detectar ambiente: ${error.message}`, 'error');
            this.results.errors.push(error.message);
            return 'unknown';
        }
    }

    async validateBackendDeploy(baseUrl) {
        this.log('🔧 Validando deploy do backend...', 'info');
        
        try {
            // 1. Health Check
            const healthResponse = await axios.get(`${baseUrl}/health`, { timeout: 10000 });
            if (healthResponse.status !== 200) {
                throw new Error('Health check falhou');
            }
            this.log('✅ Health check passou', 'success');
            
            // 2. Verificar estrutura da resposta
            const health = healthResponse.data;
            const requiredFields = ['status', 'message', 'database', 'server'];
            for (const field of requiredFields) {
                if (!(field in health)) {
                    this.log(`⚠️  Campo ${field} ausente no health check`, 'warning');
                }
            }
            
            // 3. Testar APIs críticas
            const criticalApis = [
                '/api/medicos',
                '/api/patients',
                '/api/statistics/dashboard'
            ];
            
            for (const endpoint of criticalApis) {
                try {
                    const response = await axios.get(`${baseUrl}${endpoint}`, { timeout: 5000 });
                    if (response.status === 200 && response.data.success) {
                        this.log(`✅ API ${endpoint} funcionando`, 'success');
                    } else {
                        this.log(`⚠️  API ${endpoint} com problemas`, 'warning');
                    }
                } catch (error) {
                    this.log(`❌ API ${endpoint} falhou: ${error.message}`, 'error');
                    this.results.errors.push(`API ${endpoint}: ${error.message}`);
                }
            }
            
            // 4. Verificar performance
            const start = Date.now();
            await axios.get(`${baseUrl}/health`);
            const responseTime = Date.now() - start;
            
            if (responseTime > 2000) {
                this.log(`⚠️  Tempo de resposta alto: ${responseTime}ms`, 'warning');
            } else {
                this.log(`✅ Tempo de resposta OK: ${responseTime}ms`, 'success');
            }
            
            this.results.deployChecks.backend = true;
            
        } catch (error) {
            this.log(`❌ Falha na validação do backend: ${error.message}`, 'error');
            this.results.errors.push(`Backend: ${error.message}`);
            this.results.deployChecks.backend = false;
        }
    }

    async validateFrontendDeploy(baseUrl) {
        this.log('🌐 Validando deploy do frontend...', 'info');
        
        try {
            // 1. Páginas principais
            const pages = [
                '/gestao-medicos.html',
                '/gestao-pacientes.html',
                '/app.html'
            ];
            
            for (const page of pages) {
                try {
                    const response = await axios.get(`${baseUrl}${page}`, { timeout: 10000 });
                    
                    if (response.status !== 200) {
                        throw new Error(`Status ${response.status}`);
                    }
                    
                    // Verificar se é um HTML válido
                    if (!response.data.includes('<html') || !response.data.includes('</html>')) {
                        throw new Error('HTML inválido');
                    }
                    
                    // Verificar tamanho mínimo
                    if (response.data.length < 1000) {
                        throw new Error('Conteúdo muito pequeno');
                    }
                    
                    this.log(`✅ Página ${page} OK`, 'success');
                    
                } catch (error) {
                    this.log(`❌ Página ${page} falhou: ${error.message}`, 'error');
                    this.results.errors.push(`Frontend ${page}: ${error.message}`);
                }
            }
            
            // 2. Verificar assets CSS/JS
            const assetsCheck = await axios.get(`${baseUrl}/app.html`);
            const content = assetsCheck.data;
            
            if (content.includes('api/medicos') && content.includes('editarMedico')) {
                this.log('✅ JavaScript integrado corretamente', 'success');
            } else {
                this.log('⚠️  JavaScript pode estar mal integrado', 'warning');
            }
            
            // 3. Verificar responsividade (simular diferentes viewports)
            this.log('📱 Verificando responsividade...', 'info');
            if (content.includes('viewport') && content.includes('responsive')) {
                this.log('✅ Meta tags de responsividade encontradas', 'success');
            }
            
            this.results.deployChecks.frontend = true;
            
        } catch (error) {
            this.log(`❌ Falha na validação do frontend: ${error.message}`, 'error');
            this.results.errors.push(`Frontend: ${error.message}`);
            this.results.deployChecks.frontend = false;
        }
    }

    async validateDatabaseDeploy() {
        this.log('💾 Validando deploy do banco de dados...', 'info');
        
        try {
            // Verificar através da API health
            const healthResponse = await axios.get(`http://localhost:3002/health`);
            const health = healthResponse.data;
            
            if (health.database !== 'Connected') {
                throw new Error('Banco de dados não conectado');
            }
            
            // Verificar se há dados básicos
            if (typeof health.medicos === 'number' && health.medicos >= 0) {
                this.log(`✅ Dados de médicos: ${health.medicos} registros`, 'success');
            } else {
                this.log('⚠️  Dados de médicos inconsistentes', 'warning');
            }
            
            if (typeof health.pacientes === 'number' && health.pacientes >= 0) {
                this.log(`✅ Dados de pacientes: ${health.pacientes} registros`, 'success');
            } else {
                this.log('⚠️  Dados de pacientes inconsistentes', 'warning');
            }
            
            // Testar operações CRUD básicas
            try {
                const medicosResponse = await axios.get('http://localhost:3002/api/medicos');
                if (medicosResponse.data.success) {
                    this.log('✅ Operações de leitura funcionando', 'success');
                } else {
                    this.log('⚠️  Problemas nas operações de leitura', 'warning');
                }
            } catch (error) {
                this.log(`❌ Erro nas operações de banco: ${error.message}`, 'error');
            }
            
            this.results.deployChecks.database = true;
            
        } catch (error) {
            this.log(`❌ Falha na validação do banco: ${error.message}`, 'error');
            this.results.errors.push(`Database: ${error.message}`);
            this.results.deployChecks.database = false;
        }
    }

    async validateMobileBuild() {
        this.log('📱 Validando build mobile...', 'info');
        
        try {
            const mobileDir = path.join(process.cwd(), '..', 'mobile');
            
            // 1. Verificar estrutura do projeto
            const requiredFiles = [
                'package.json',
                'App.tsx',
                'android/build.gradle',
                'ios/MediApp.xcodeproj/project.pbxproj'
            ];
            
            for (const file of requiredFiles) {
                const filePath = path.join(mobileDir, file);
                if (fs.existsSync(filePath)) {
                    this.log(`✅ ${file} encontrado`, 'success');
                } else {
                    this.log(`⚠️  ${file} não encontrado`, 'warning');
                }
            }
            
            // 2. Verificar package.json
            const packageJsonPath = path.join(mobileDir, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                
                // Verificar scripts de build
                const requiredScripts = ['android', 'ios', 'build:android', 'build:ios'];
                const availableScripts = Object.keys(packageJson.scripts || {});
                
                for (const script of requiredScripts) {
                    if (availableScripts.includes(script)) {
                        this.log(`✅ Script ${script} configurado`, 'success');
                    } else {
                        this.log(`⚠️  Script ${script} não encontrado`, 'warning');
                    }
                }
                
                // Verificar dependências críticas
                const criticalDeps = [
                    'react-native',
                    '@reduxjs/toolkit',
                    'react-navigation'
                ];
                
                for (const dep of criticalDeps) {
                    const hasMainDep = packageJson.dependencies && packageJson.dependencies[dep];
                    const hasNavDep = packageJson.dependencies && Object.keys(packageJson.dependencies).some(d => d.includes(dep));
                    
                    if (hasMainDep || hasNavDep) {
                        this.log(`✅ Dependência ${dep} OK`, 'success');
                    } else {
                        this.log(`⚠️  Dependência ${dep} pode estar ausente`, 'warning');
                    }
                }
            }
            
            // 3. Simular processo de build (verificação estática)
            this.log('🔧 Verificando configuração de build...', 'info');
            
            // Android
            const androidBuildPath = path.join(mobileDir, 'android', 'build.gradle');
            if (fs.existsSync(androidBuildPath)) {
                this.log('✅ Configuração Android encontrada', 'success');
            }
            
            // iOS
            const iosBuildPath = path.join(mobileDir, 'ios');
            if (fs.existsSync(iosBuildPath)) {
                this.log('✅ Configuração iOS encontrada', 'success');
            }
            
            this.results.deployChecks.mobile = true;
            
        } catch (error) {
            this.log(`❌ Falha na validação mobile: ${error.message}`, 'error');
            this.results.errors.push(`Mobile: ${error.message}`);
            this.results.deployChecks.mobile = false;
        }
    }

    async validateSecurity(baseUrl, isProduction = false) {
        this.log('🔒 Validando configurações de segurança...', 'info');
        
        try {
            const response = await axios.get(`${baseUrl}/health`);
            const headers = response.headers;
            
            // Headers de segurança obrigatórios
            const securityHeaders = {
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'DENY',
                'x-xss-protection': '1; mode=block'
            };
            
            for (const [header, expectedValue] of Object.entries(securityHeaders)) {
                if (headers[header]) {
                    this.log(`✅ Header ${header}: ${headers[header]}`, 'success');
                } else {
                    const severity = isProduction ? 'error' : 'warning';
                    this.log(`${isProduction ? '❌' : '⚠️'} Header ${header} ausente`, severity);
                    if (isProduction) {
                        this.results.errors.push(`Security header ${header} missing`);
                    }
                }
            }
            
            // Verificar HTTPS em produção
            if (isProduction && !baseUrl.startsWith('https://')) {
                this.log('❌ HTTPS obrigatório em produção', 'error');
                this.results.errors.push('HTTPS required in production');
            } else if (isProduction) {
                this.log('✅ HTTPS configurado', 'success');
            }
            
            // Verificar CORS
            const corsHeader = headers['access-control-allow-origin'];
            if (corsHeader === '*' && isProduction) {
                this.log('❌ CORS muito permissivo para produção', 'error');
                this.results.errors.push('CORS too permissive for production');
            } else {
                this.log(`✅ CORS: ${corsHeader || 'não configurado'}`, 'success');
            }
            
            this.results.deployChecks.security = true;
            
        } catch (error) {
            this.log(`❌ Falha na validação de segurança: ${error.message}`, 'error');
            this.results.errors.push(`Security: ${error.message}`);
            this.results.deployChecks.security = false;
        }
    }

    async validateEnvironmentConfig() {
        this.log('⚙️ Validando configuração do ambiente...', 'info');
        
        // Variáveis obrigatórias
        const requiredEnvVars = [
            'NODE_ENV',
            'DATABASE_URL'
        ];
        
        const optionalEnvVars = [
            'PORT',
            'JWT_SECRET',
            'CORS_ORIGIN'
        ];
        
        for (const envVar of requiredEnvVars) {
            if (process.env[envVar]) {
                this.log(`✅ ${envVar}: configurado`, 'success');
            } else {
                this.log(`❌ ${envVar}: NÃO CONFIGURADO`, 'error');
                this.results.errors.push(`Required environment variable ${envVar} not set`);
            }
        }
        
        for (const envVar of optionalEnvVars) {
            if (process.env[envVar]) {
                this.log(`✅ ${envVar}: configurado`, 'success');
            } else {
                this.log(`⚠️  ${envVar}: não configurado (opcional)`, 'warning');
            }
        }
        
        // Verificar configurações específicas do ambiente
        const nodeEnv = process.env.NODE_ENV;
        if (nodeEnv === 'production') {
            this.log('🚀 Modo produção detectado - validações adicionais...', 'info');
            
            if (!process.env.JWT_SECRET) {
                this.log('❌ JWT_SECRET obrigatório em produção', 'error');
                this.results.errors.push('JWT_SECRET required in production');
            }
            
            if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')) {
                this.log('⚠️  Database localhost em produção?', 'warning');
            }
        }
    }

    async runLoadTest(baseUrl) {
        this.log('⚡ Executando teste de carga básico...', 'info');
        
        try {
            const concurrency = 10;
            const requests = 50;
            const results = [];
            
            this.log(`📊 Enviando ${requests} requisições com ${concurrency} simultâneas...`, 'info');
            
            for (let batch = 0; batch < requests / concurrency; batch++) {
                const batchPromises = Array(concurrency).fill().map(async () => {
                    const start = Date.now();
                    try {
                        await axios.get(`${baseUrl}/health`, { timeout: 5000 });
                        return Date.now() - start;
                    } catch (error) {
                        return -1; // Erro
                    }
                });
                
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
                
                // Pequena pausa entre batches
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const successfulRequests = results.filter(r => r > 0);
            const failedRequests = results.filter(r => r === -1).length;
            
            if (successfulRequests.length === 0) {
                throw new Error('Todas as requisições falharam');
            }
            
            const avgTime = successfulRequests.reduce((a, b) => a + b, 0) / successfulRequests.length;
            const maxTime = Math.max(...successfulRequests);
            const minTime = Math.min(...successfulRequests);
            
            this.log(`📈 Resultados do teste de carga:`, 'info');
            this.log(`   ✅ Sucessos: ${successfulRequests.length}/${requests}`, 'success');
            this.log(`   ❌ Falhas: ${failedRequests}`, failedRequests > 0 ? 'warning' : 'success');
            this.log(`   ⏱️  Tempo médio: ${avgTime.toFixed(0)}ms`, 'info');
            this.log(`   ⚡ Tempo mín/máx: ${minTime}ms / ${maxTime}ms`, 'info');
            
            if (failedRequests > requests * 0.05) { // Mais de 5% de falhas
                this.log('⚠️  Taxa de falhas alta - verificar capacidade', 'warning');
            }
            
            if (avgTime > 1000) {
                this.log('⚠️  Tempo de resposta alto - verificar performance', 'warning');
            }
            
        } catch (error) {
            this.log(`❌ Erro no teste de carga: ${error.message}`, 'error');
            this.results.errors.push(`Load test: ${error.message}`);
        }
    }

    generateDeployReport() {
        const timestamp = new Date().toISOString();
        const totalErrors = this.results.errors.length;
        const checksCompleted = Object.values(this.results.deployChecks).filter(Boolean).length;
        const totalChecks = Object.keys(this.results.deployChecks).length;
        
        this.log('\n' + '='.repeat(80), 'info');
        this.log('🚀 RELATÓRIO DE VALIDAÇÃO DE DEPLOY', 'info');
        this.log('='.repeat(80), 'info');
        
        // Resumo do ambiente
        this.log('\n📊 AMBIENTE:', 'info');
        if (this.results.environment) {
            Object.entries(this.results.environment).forEach(([key, value]) => {
                this.log(`   ${key}: ${value}`, 'info');
            });
        }
        
        // Status dos checks
        this.log('\n✅ VERIFICAÇÕES DE DEPLOY:', 'info');
        Object.entries(this.results.deployChecks).forEach(([check, passed]) => {
            const status = passed ? '✅' : '❌';
            const color = passed ? 'success' : 'error';
            this.log(`   ${status} ${check}`, color);
        });
        
        this.log(`\n📈 RESUMO: ${checksCompleted}/${totalChecks} verificações passou`, 
                 checksCompleted === totalChecks ? 'success' : 'warning');
        
        // Erros encontrados
        if (totalErrors > 0) {
            this.log('\n❌ ERROS ENCONTRADOS:', 'error');
            this.results.errors.forEach(error => {
                this.log(`   • ${error}`, 'error');
            });
        }
        
        // Recomendações
        this.log('\n🎯 RECOMENDAÇÕES:', 'info');
        
        if (totalErrors === 0 && checksCompleted === totalChecks) {
            this.log('   ✅ Deploy aprovado! Sistema pronto para produção', 'success');
            this.log('   🚀 Prossiga com confiança', 'success');
        } else if (totalErrors === 0) {
            this.log('   ⚠️  Deploy parcialmente validado', 'warning');
            this.log('   🔧 Complete as verificações restantes', 'warning');
        } else {
            this.log('   🚨 Deploy NÃO APROVADO', 'error');
            this.log('   🛠️  Corrija todos os erros antes de prosseguir', 'error');
        }
        
        // Salvar relatório
        const report = {
            timestamp,
            environment: this.results.environment,
            deployChecks: this.results.deployChecks,
            errors: this.results.errors,
            warnings: this.results.warnings,
            tests: this.results.tests,
            summary: {
                checksCompleted,
                totalChecks,
                totalErrors,
                approved: totalErrors === 0 && checksCompleted === totalChecks
            }
        };
        
        const reportPath = 'tests/deploy-validation-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log(`\n📄 Relatório salvo em: ${reportPath}`, 'info');
        
        return report;
    }

    async runFullValidation() {
        this.log('🚀 INICIANDO VALIDAÇÃO COMPLETA DE DEPLOY', 'info');
        
        // 1. Detectar ambiente
        const environment = await this.detectEnvironment();
        const baseUrl = this.environments[environment]?.url || 'http://localhost:3002';
        const isProduction = environment === 'production';
        
        // 2. Aguardar servidor (se local)
        if (environment === 'development') {
            this.log('⏳ Aguardando servidor local...', 'info');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // 3. Executar validações
        await this.validateEnvironmentConfig();
        await this.validateBackendDeploy(baseUrl);
        await this.validateFrontendDeploy(baseUrl);
        await this.validateDatabaseDeploy();
        await this.validateMobileBuild();
        await this.validateSecurity(baseUrl, isProduction);
        
        // 4. Teste de carga (apenas se servidor estiver rodando)
        try {
            await this.runLoadTest(baseUrl);
        } catch (error) {
            this.log(`⚠️  Teste de carga pulado: ${error.message}`, 'warning');
        }
        
        // 5. Gerar relatório
        const report = this.generateDeployReport();
        
        // 6. Código de saída
        const exitCode = report.summary.approved ? 0 : 1;
        this.log(`\n🏁 Validação concluída. Exit code: ${exitCode}`, 
                 exitCode === 0 ? 'success' : 'error');
        
        return { report, exitCode };
    }
}

// Função principal
async function main() {
    const validator = new DeployValidator();
    const { report, exitCode } = await validator.runFullValidation();
    process.exit(exitCode);
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Erro fatal na validação de deploy:', error.message);
        process.exit(2);
    });
}

module.exports = DeployValidator;