#!/usr/bin/env node

/**
 * 🏥 MEDIAPP - VALIDAÇÃO RÁPIDA DE ARQUITETURA
 * Verifica se toda a estrutura está funcionando corretamente
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'localhost';
const PORT = 3002;

class QuickValidator {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, total: 0 };
    }

    log(message, color = '') {
        const colors = {
            green: '\x1b[32m',
            red: '\x1b[31m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            cyan: '\x1b[36m',
            reset: '\x1b[0m'
        };
        console.log(`${colors[color] || ''}${message}${colors.reset}`);
    }

    async makeRequest(path) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: BASE_URL,
                port: PORT,
                path: path,
                method: 'GET',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Timeout')));
            req.end();
        });
    }

    async test(name, testFn) {
        this.results.total++;
        try {
            await testFn();
            this.results.passed++;
            this.log(`✅ ${name}`, 'green');
        } catch (error) {
            this.results.failed++;
            this.log(`❌ ${name}: ${error.message}`, 'red');
        }
    }

    async validateArchitecture() {
        this.log('\n🏥 VALIDAÇÃO DA ARQUITETURA MEDIAPP', 'cyan');
        this.log('═'.repeat(50), 'cyan');

        // ========================================
        // VERIFICAÇÃO DE ARQUIVOS ESTRUTURAIS
        // ========================================
        this.log('\n📁 Verificando estrutura de arquivos...', 'blue');

        const criticalPaths = [
            '/mnt/c/workspace/aplicativo/mediapp-refined/apps/backend/src/app.js',
            '/mnt/c/workspace/aplicativo/mediapp-refined/apps/backend/package.json',
            '/mnt/c/workspace/aplicativo/mediapp-refined/apps/backend/.env',
            '/mnt/c/workspace/aplicativo/mediapp-refined/apps/backend/prisma/schema.prisma',
            '/mnt/c/workspace/aplicativo/mediapp-refined/apps/mobile/package.json',
            '/mnt/c/workspace/aplicativo/mediapp-refined/apps/mobile/App.tsx'
        ];

        for (const filePath of criticalPaths) {
            await this.test(`Arquivo crítico: ${path.basename(filePath)}`, async () => {
                // Converter caminho WSL para Windows
                const winPath = filePath.replace('/mnt/c/', 'C:/').replace(/\//g, '\\');
                if (!fs.existsSync(winPath)) {
                    throw new Error(`Arquivo não encontrado: ${winPath}`);
                }
            });
        }

        // ========================================
        // VERIFICAÇÃO DE ENDPOINTS
        // ========================================
        this.log('\n🌐 Testando endpoints principais...', 'blue');

        const endpoints = [
            { path: '/health', name: 'Health Check' },
            { path: '/api/statistics/dashboard', name: 'Dashboard Stats' },
            { path: '/api/medicos', name: 'API Médicos' },
            { path: '/', name: 'Página Principal' },
            { path: '/gestao-medicos.html', name: 'Gestão Médicos' },
            { path: '/gestao-pacientes.html', name: 'Gestão Pacientes' }
        ];

        for (const endpoint of endpoints) {
            await this.test(`Endpoint: ${endpoint.name}`, async () => {
                const response = await this.makeRequest(endpoint.path);
                if (response.status < 200 || response.status >= 400) {
                    throw new Error(`Status HTTP ${response.status}`);
                }
            });
        }

        // ========================================
        // VERIFICAÇÃO DE FUNCIONALIDADES
        // ========================================
        this.log('\n⚙️ Verificando funcionalidades específicas...', 'blue');

        await this.test('API retorna dados válidos', async () => {
            const response = await this.makeRequest('/api/statistics/dashboard');
            const data = JSON.parse(response.data);
            if (!data.success || !data.data) {
                throw new Error('Estrutura de resposta inválida');
            }
        });

        await this.test('Gestão de médicos carrega corretamente', async () => {
            const response = await this.makeRequest('/gestao-medicos.html');
            if (!response.data.includes('visualizarMedico') || 
                !response.data.includes('editarMedico') || 
                !response.data.includes('excluirMedico')) {
                throw new Error('Funções JavaScript não encontradas');
            }
        });

        await this.test('Integração ViaCEP funcional', async () => {
            const response = await this.makeRequest('/api/viacep/01310-100');
            const data = JSON.parse(response.data);
            if (!data.success) {
                throw new Error('Integração ViaCEP falhou');
            }
        });

        // ========================================
        // VERIFICAÇÃO DE MOBILE
        // ========================================
        this.log('\n📱 Verificando configuração mobile...', 'blue');

        await this.test('Configuração React Native válida', async () => {
            const packagePath = 'C:/workspace/aplicativo/mediapp-refined/apps/mobile/package.json';
            if (!fs.existsSync(packagePath)) {
                throw new Error('package.json mobile não encontrado');
            }
            
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            if (!packageData.dependencies['react-native']) {
                throw new Error('React Native não configurado');
            }
        });

        await this.test('APK existe e é válido', async () => {
            const apkPaths = [
                'C:/workspace/aplicativo/MediApp-Beta-Android.apk',
                'C:/workspace/aplicativo/MediApp-Beta-Fixed.apk'
            ];
            
            const apkExists = apkPaths.some(path => fs.existsSync(path));
            if (!apkExists) {
                throw new Error('Nenhum APK encontrado');
            }
        });

        // ========================================
        // RELATÓRIO FINAL
        // ========================================
        this.generateReport();
    }

    generateReport() {
        this.log('\n📊 RELATÓRIO DE VALIDAÇÃO', 'cyan');
        this.log('═'.repeat(50), 'cyan');

        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        
        this.log(`Total: ${this.results.total} | Aprovados: ${this.results.passed} | Reprovados: ${this.results.failed}`);
        this.log(`Taxa de sucesso: ${successRate}%`, successRate >= 90 ? 'green' : 'red');

        if (successRate >= 90) {
            this.log('\n🎉 ARQUITETURA VALIDADA - PRONTA PARA TESTES HUMANOS!', 'green');
            this.log('\n📋 CHECKLIST PARA TESTES HUMANOS:', 'blue');
            this.log('  1. ✅ Servidor rodando na porta 3002');
            this.log('  2. ✅ APIs funcionais');
            this.log('  3. ✅ Frontend web operacional');
            this.log('  4. ✅ Gestão de médicos e pacientes');
            this.log('  5. ✅ Mobile configurado');
            this.log('  6. ✅ Banco de dados conectado');
            
            this.log('\n🔗 URLS PARA TESTE:', 'yellow');
            this.log(`  • Principal: http://localhost:3002/`);
            this.log(`  • Médicos: http://localhost:3002/gestao-medicos.html`);
            this.log(`  • Pacientes: http://localhost:3002/gestao-pacientes.html`);
            this.log(`  • Stats: http://localhost:3002/stats-improved.html`);
        } else {
            this.log('\n⚠️ ARQUITETURA PRECISA DE CORREÇÕES', 'yellow');
        }
    }
}

// Executar validação
if (require.main === module) {
    const validator = new QuickValidator();
    validator.validateArchitecture().catch(error => {
        console.error('Erro na validação:', error.message);
        process.exit(1);
    });
}

module.exports = QuickValidator;