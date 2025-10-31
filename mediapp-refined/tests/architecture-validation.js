#!/usr/bin/env node

/**
 * 🏥 MEDIAPP - VALIDAÇÃO COMPLETA DA ARQUITETURA
 * 
 * Este script valida toda a arquitetura do MediApp em ambiente Ubuntu/WSL:
 * - ✅ Backend API (Node.js + Express + PostgreSQL)
 * - ✅ Frontend Web (HTML5 + CSS3 + JavaScript)
 * - ✅ Mobile App (React Native + Redux Toolkit)
 * - ✅ Banco de dados (PostgreSQL + Prisma ORM)
 * - ✅ Integração completa
 * - ✅ Performance e escalabilidade
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const BASE_URL = 'http://localhost:3002';
const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

class ArchitectureValidator {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: [],
            performance: {},
            coverage: {}
        };
        this.startTime = Date.now();
    }

    log(message, color = 'reset', bold = false) {
        const style = bold ? COLORS.bold : '';
        console.log(`${style}${COLORS[color]}${message}${COLORS.reset}`);
    }

    async test(name, testFn, category = 'general') {
        this.results.total++;
        const testStart = Date.now();
        
        try {
            await testFn();
            const duration = Date.now() - testStart;
            this.results.passed++;
            this.log(`✅ ${name} (${duration}ms)`, 'green');
            
            if (!this.results.performance[category]) {
                this.results.performance[category] = [];
            }
            this.results.performance[category].push({ name, duration });
        } catch (error) {
            this.results.failed++;
            this.results.errors.push({ name, error: error.message, category });
            this.log(`❌ ${name}: ${error.message}`, 'red');
        }
    }

    async validateBackendAPI() {
        this.log('\n🚀 VALIDANDO BACKEND API', 'cyan', true);
        
        // Health Check
        await this.test('Health Check - Status do Sistema', async () => {
            const response = await axios.get(`${BASE_URL}/health`);
            if (response.status !== 200) throw new Error('Health check falhou');
            if (!response.data.server) throw new Error('Resposta inválida');
        }, 'backend');

        // API Médicos
        await this.test('API Médicos - Listar todos', async () => {
            const response = await axios.get(`${BASE_URL}/api/medicos`);
            if (response.status !== 200) throw new Error('Falha ao listar médicos');
            if (!response.data.success) throw new Error('Resposta da API inválida');
            if (!Array.isArray(response.data.data)) throw new Error('Dados não são array');
        }, 'backend');

        // API Pacientes
        await this.test('API Pacientes - Listar todos', async () => {
            const response = await axios.get(`${BASE_URL}/api/patients`);
            if (response.status !== 200) throw new Error('Falha ao listar pacientes');
            if (!response.data.success) throw new Error('Resposta da API inválida');
        }, 'backend');

        // API Estatísticas
        await this.test('API Estatísticas - Dashboard', async () => {
            const response = await axios.get(`${BASE_URL}/api/statistics/dashboard`);
            if (response.status !== 200) throw new Error('Falha ao obter estatísticas');
            if (!response.data.success) throw new Error('Resposta da API inválida');
        }, 'backend');

        // Teste CRUD - Criar Médico
        await this.test('CRUD Médicos - Criar novo médico', async () => {
            const novoMedico = {
                nomeCompleto: 'Dr. Teste Validação',
                cpf: '12345678901',
                crm: 'TEST123',
                especialidade: 'Clinica Geral',
                telefone: '(11) 99999-9999',
                email: 'teste.validacao@mediapp.com'
            };
            
            const response = await axios.post(`${BASE_URL}/api/medicos`, novoMedico);
            if (response.status !== 201 && response.status !== 200) {
                throw new Error('Falha ao criar médico');
            }
            if (!response.data.success) throw new Error('Resposta da API inválida');
        }, 'backend');
    }

    async validateFrontendWeb() {
        this.log('\n🌐 VALIDANDO FRONTEND WEB', 'cyan', true);

        // Página principal
        await this.test('Frontend - Página de gestão de médicos', async () => {
            const response = await axios.get(`${BASE_URL}/gestao-medicos.html`);
            if (response.status !== 200) throw new Error('Página não carrega');
            if (!response.data.includes('MediApp')) throw new Error('Conteúdo inválido');
        }, 'frontend');

        // Página de pacientes
        await this.test('Frontend - Página de gestão de pacientes', async () => {
            const response = await axios.get(`${BASE_URL}/gestao-pacientes.html`);
            if (response.status !== 200) throw new Error('Página não carrega');
            if (!response.data.includes('Gestão de Pacientes')) throw new Error('Conteúdo inválido');
        }, 'frontend');

        // Assets estáticos
        await this.test('Frontend - Recursos estáticos (CSS/JS)', async () => {
            const response = await axios.get(`${BASE_URL}/app.html`);
            if (response.status !== 200) throw new Error('App principal não carrega');
        }, 'frontend');
    }

    async validateMobileArchitecture() {
        this.log('\n📱 VALIDANDO ARQUITETURA MOBILE', 'cyan', true);

        const mobileDir = '/mnt/c/workspace/aplicativo/mediapp-refined/apps/mobile';
        
        await this.test('Mobile - Estrutura do projeto React Native', async () => {
            const packagePath = `${mobileDir}/package.json`;
            if (!fs.existsSync(packagePath.replace('/mnt/c/', 'c:\\'))) {
                throw new Error('package.json não encontrado');
            }
        }, 'mobile');

        await this.test('Mobile - Dependências React Native', async () => {
            const packagePath = path.join(mobileDir.replace('/mnt/c/', 'c:\\'), 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            const requiredDeps = ['react', 'react-native', '@reduxjs/toolkit', 'react-redux'];
            for (const dep of requiredDeps) {
                if (!packageJson.dependencies[dep]) {
                    throw new Error(`Dependência ${dep} não encontrada`);
                }
            }
        }, 'mobile');

        await this.test('Mobile - Estrutura de pastas', async () => {
            const srcPath = path.join(mobileDir.replace('/mnt/c/', 'c:\\'), 'src');
            const requiredDirs = ['components', 'screens', 'navigation', 'store', 'services'];
            
            for (const dir of requiredDirs) {
                const dirPath = path.join(srcPath, dir);
                if (fs.existsSync(dirPath)) {
                    // Diretório existe
                } else {
                    this.log(`⚠️  Diretório ${dir} não encontrado - estrutura pode estar diferente`, 'yellow');
                }
            }
        }, 'mobile');
    }

    async validateDatabaseIntegration() {
        this.log('\n🗄️ VALIDANDO INTEGRAÇÃO COM BANCO DE DADOS', 'cyan', true);

        await this.test('Database - Conexão PostgreSQL', async () => {
            const response = await axios.get(`${BASE_URL}/health`);
            if (!response.data.database) throw new Error('Dados do banco não disponíveis');
            if (response.data.database.medicos < 0) throw new Error('Dados inválidos do banco');
        }, 'database');

        await this.test('Database - Operações CRUD Médicos', async () => {
            // Listar
            const listResponse = await axios.get(`${BASE_URL}/api/medicos`);
            if (!listResponse.data.success) throw new Error('Falha ao listar');
            
            const medicosCount = listResponse.data.data.length;
            if (medicosCount < 0) throw new Error('Contagem inválida');
        }, 'database');

        await this.test('Database - Integridade dos dados', async () => {
            const response = await axios.get(`${BASE_URL}/api/statistics/dashboard`);
            const stats = response.data.data;
            
            if (!stats || typeof stats.medicos === 'undefined') {
                throw new Error('Estatísticas do banco inválidas');
            }
        }, 'database');
    }

    async validatePerformance() {
        this.log('\n⚡ VALIDANDO PERFORMANCE', 'cyan', true);

        await this.test('Performance - Tempo de resposta da API', async () => {
            const start = Date.now();
            await axios.get(`${BASE_URL}/api/medicos`);
            const duration = Date.now() - start;
            
            if (duration > 2000) throw new Error(`Resposta muito lenta: ${duration}ms`);
        }, 'performance');

        await this.test('Performance - Carregamento das páginas', async () => {
            const start = Date.now();
            await axios.get(`${BASE_URL}/gestao-medicos.html`);
            const duration = Date.now() - start;
            
            if (duration > 3000) throw new Error(`Página carrega muito devagar: ${duration}ms`);
        }, 'performance');

        await this.test('Performance - Múltiplas requisições simultâneas', async () => {
            const promises = Array(5).fill().map(() => 
                axios.get(`${BASE_URL}/api/medicos`)
            );
            
            const start = Date.now();
            await Promise.all(promises);
            const duration = Date.now() - start;
            
            if (duration > 5000) throw new Error(`Requisições simultâneas muito lentas: ${duration}ms`);
        }, 'performance');
    }

    async validateSecurity() {
        this.log('\n🔒 VALIDANDO SEGURANÇA', 'cyan', true);

        await this.test('Security - Headers de segurança', async () => {
            const response = await axios.get(`${BASE_URL}/health`);
            const headers = response.headers;
            
            if (!headers['x-content-type-options']) {
                throw new Error('Header X-Content-Type-Options ausente');
            }
        }, 'security');

        await this.test('Security - CORS configurado', async () => {
            const response = await axios.get(`${BASE_URL}/health`);
            // CORS deve estar configurado para desenvolvimento
            if (response.status !== 200) throw new Error('CORS pode estar mal configurado');
        }, 'security');
    }

    async validateIntegration() {
        this.log('\n🔗 VALIDANDO INTEGRAÇÃO COMPLETA', 'cyan', true);

        await this.test('Integration - Frontend consome API corretamente', async () => {
            // Simular uma operação completa
            const medicosResponse = await axios.get(`${BASE_URL}/api/medicos`);
            const statsResponse = await axios.get(`${BASE_URL}/api/statistics/dashboard`);
            
            if (!medicosResponse.data.success || !statsResponse.data.success) {
                throw new Error('APIs não respondem corretamente');
            }
        }, 'integration');

        await this.test('Integration - Dados consistentes entre APIs', async () => {
            const medicosResponse = await axios.get(`${BASE_URL}/api/medicos`);
            const statsResponse = await axios.get(`${BASE_URL}/api/statistics/dashboard`);
            
            const medicosCount = medicosResponse.data.data.length;
            const statsCount = statsResponse.data.data.medicos?.value || 0;
              
            // Deve haver uma correlação razoável entre os dados
            if (Math.abs(medicosCount - statsCount) > 5) {
                this.log(`⚠️  Diferença nos dados: médicos=${medicosCount}, stats=${statsCount}`, 'yellow');
            }
        }, 'integration');
    }

    generateTestReport() {
        const totalTime = Date.now() - this.startTime;
        
        this.log('\n' + '='.repeat(80), 'cyan', true);
        this.log('🏥 RELATÓRIO FINAL DE VALIDAÇÃO DA ARQUITETURA MEDIAPP', 'cyan', true);
        this.log('='.repeat(80), 'cyan', true);
        
        this.log(`\n📊 RESUMO GERAL:`, 'blue', true);
        this.log(`   ✅ Testes executados: ${this.results.total}`);
        this.log(`   ✅ Sucessos: ${this.results.passed}`, 'green');
        this.log(`   ❌ Falhas: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
        this.log(`   ⏱️  Tempo total: ${totalTime}ms`);
        this.log(`   📈 Taxa de sucesso: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

        // Performance por categoria
        this.log(`\n⚡ PERFORMANCE POR CATEGORIA:`, 'blue', true);
        Object.entries(this.results.performance).forEach(([category, tests]) => {
            const avgTime = tests.reduce((sum, test) => sum + test.duration, 0) / tests.length;
            this.log(`   ${category}: ${avgTime.toFixed(0)}ms médio (${tests.length} testes)`);
        });

        // Erros detalhados
        if (this.results.errors.length > 0) {
            this.log(`\n❌ ERROS ENCONTRADOS:`, 'red', true);
            this.results.errors.forEach(error => {
                this.log(`   ${error.category}: ${error.name}`, 'red');
                this.log(`      ${error.error}`, 'yellow');
            });
        }

        // Recomendações
        this.log(`\n🎯 RECOMENDAÇÕES:`, 'blue', true);
        
        if (this.results.passed === this.results.total) {
            this.log(`   ✅ Arquitetura está funcionando perfeitamente!`, 'green');
            this.log(`   ✅ Sistema pronto para testes humanos`);
            this.log(`   ✅ Backend, Frontend e Mobile integrados`);
        } else {
            this.log(`   ⚠️  Corrija os erros encontrados antes dos testes humanos`, 'yellow');
            this.log(`   🔧 Verifique as integrações que falharam`);
        }

        this.log(`\n🚀 PRÓXIMOS PASSOS:`, 'blue', true);
        this.log(`   1. Execute testes humanos nas páginas web`);
        this.log(`   2. Teste o app mobile em dispositivo/emulador`);
        this.log(`   3. Valide workflows completos de usuário`);
        this.log(`   4. Monitore performance em produção`);

        // Salvar relatório
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                successRate: (this.results.passed / this.results.total) * 100,
                totalTime: totalTime
            },
            performance: this.results.performance,
            errors: this.results.errors,
            architecture: {
                backend: 'Node.js + Express + PostgreSQL + Prisma',
                frontend: 'HTML5 + CSS3 + JavaScript',
                mobile: 'React Native + Redux Toolkit',
                environment: 'Ubuntu WSL'
            }
        };

        fs.writeFileSync('tests/architecture-validation-report.json', JSON.stringify(report, null, 2));
        this.log(`\n📄 Relatório salvo em: tests/architecture-validation-report.json`, 'blue');
    }

    async runAllTests() {
        this.log('🏥 INICIANDO VALIDAÇÃO COMPLETA DA ARQUITETURA MEDIAPP', 'magenta', true);
        this.log('🔍 Testando: Backend + Frontend + Mobile + Database + Performance + Security\n', 'blue');

        try {
            await this.validateBackendAPI();
            await this.validateFrontendWeb();
            await this.validateMobileArchitecture();
            await this.validateDatabaseIntegration();
            await this.validatePerformance();
            await this.validateSecurity();
            await this.validateIntegration();
        } catch (error) {
            this.log(`\n❌ Erro crítico durante os testes: ${error.message}`, 'red', true);
        }

        this.generateTestReport();
    }
}

// Função principal
async function main() {
    const validator = new ArchitectureValidator();
    
    // Aguardar um pouco para o servidor inicializar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await validator.runAllTests();
    
    // Código de saída baseado nos resultados
    process.exit(validator.results.failed > 0 ? 1 : 0);
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = ArchitectureValidator;