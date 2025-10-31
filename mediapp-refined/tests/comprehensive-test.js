#!/usr/bin/env node

/**
 * 🏥 MEDIAPP - TESTE ABRANGENTE
 * 
 * Este script testa toda a arquitetura do MediApp:
 * - Backend API
 * - Frontend Web
 * - Funcionalidades CRUD
 * - Integração de dados
 * - Performance
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';
const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class MediAppTester {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    log(message, color = 'reset') {
        console.log(`${COLORS[color]}${message}${COLORS.reset}`);
    }

    async test(name, testFn) {
        this.results.total++;
        try {
            await testFn();
            this.results.passed++;
            this.log(`✅ ${name}`, 'green');
        } catch (error) {
            this.results.failed++;
            this.results.errors.push({ name, error: error.message });
            this.log(`❌ ${name}: ${error.message}`, 'red');
        }
    }

    async runTests() {
        this.log('\n🏥 INICIANDO TESTES ABRANGENTES DO MEDIAPP\n', 'cyan');

        // ========================================
        // TESTES DE BACKEND API
        // ========================================
        this.log('📡 TESTANDO BACKEND API', 'blue');
        
        await this.test('Health Check do servidor', async () => {
            const response = await axios.get(`${BASE_URL}/health`);
            if (response.status !== 200) throw new Error(`Status ${response.status}`);
        });

        await this.test('API de estatísticas do dashboard', async () => {
            const response = await axios.get(`${BASE_URL}/api/statistics/dashboard`);
            if (!response.data.success) throw new Error('Resposta sem sucesso');
            if (!response.data.data) throw new Error('Dados não encontrados');
        });

        await this.test('Listagem de médicos', async () => {
            const response = await axios.get(`${BASE_URL}/api/medicos`);
            if (!response.data.success) throw new Error('Falha ao listar médicos');
            if (!Array.isArray(response.data.data)) throw new Error('Dados não são array');
        });

        await this.test('Listagem de pacientes', async () => {
            const response = await axios.get(`${BASE_URL}/api/patients`);
            if (response.status !== 200) throw new Error(`Status ${response.status}`);
        });

        // ========================================
        // TESTES DE FRONTEND WEB
        // ========================================
        this.log('\n🌐 TESTANDO FRONTEND WEB', 'blue');

        await this.test('Página principal (index)', async () => {
            const response = await axios.get(`${BASE_URL}/`);
            if (response.status !== 200) throw new Error(`Status ${response.status}`);
            if (!response.data.includes('MediApp')) throw new Error('Conteúdo inválido');
        });

        await this.test('Página de gestão de médicos', async () => {
            const response = await axios.get(`${BASE_URL}/gestao-medicos.html`);
            if (response.status !== 200) throw new Error(`Status ${response.status}`);
            if (!response.data.includes('Gestão de Médicos')) throw new Error('Conteúdo inválido');
        });

        await this.test('Página de gestão de pacientes', async () => {
            const response = await axios.get(`${BASE_URL}/gestao-pacientes.html`);
            if (response.status !== 200) throw new Error(`Status ${response.status}`);
            if (!response.data.includes('Gestão de Pacientes')) throw new Error('Conteúdo inválido');
        });

        await this.test('Dashboard com estatísticas', async () => {
            const response = await axios.get(`${BASE_URL}/stats-improved.html`);
            if (response.status !== 200) throw new Error(`Status ${response.status}`);
        });

        // ========================================
        // TESTES DE FUNCIONALIDADES CRUD
        // ========================================
        this.log('\n📝 TESTANDO FUNCIONALIDADES CRUD', 'blue');

        let medicoId = null;
        
        // Buscar um médico existente para testar visualização e edição
        await this.test('Buscar médico específico para testes', async () => {
            const response = await axios.get(`${BASE_URL}/api/medicos`);
            if (response.data.success && response.data.data.length > 0) {
                medicoId = response.data.data[0].id;
            } else {
                throw new Error('Nenhum médico encontrado para testes');
            }
        });

        if (medicoId) {
            await this.test('Visualizar médico específico', async () => {
                const response = await axios.get(`${BASE_URL}/api/medicos/${medicoId}`);
                if (!response.data.success) throw new Error('Falha ao buscar médico');
                if (!response.data.data.id) throw new Error('Dados do médico incompletos');
            });
        }

        // ========================================
        // TESTES DE INTEGRAÇÃO
        // ========================================
        this.log('\n🔗 TESTANDO INTEGRAÇÃO', 'blue');

        await this.test('Integração ViaCEP', async () => {
            const response = await axios.get(`${BASE_URL}/api/viacep/01310-100`);
            if (!response.data.success) throw new Error('Falha na integração ViaCEP');
        });

        await this.test('Estatísticas de pacientes', async () => {
            const response = await axios.get(`${BASE_URL}/api/patients/stats/overview`);
            if (response.status !== 200) throw new Error(`Status ${response.status}`);
        });

        // ========================================
        // TESTES DE PERFORMANCE
        // ========================================
        this.log('\n⚡ TESTANDO PERFORMANCE', 'blue');

        await this.test('Tempo de resposta da API (< 500ms)', async () => {
            const start = Date.now();
            await axios.get(`${BASE_URL}/api/statistics/dashboard`);
            const elapsed = Date.now() - start;
            if (elapsed > 500) throw new Error(`Tempo de resposta: ${elapsed}ms`);
        });

        await this.test('Carregamento de assets estáticos', async () => {
            const response = await axios.get(`${BASE_URL}/favicon.ico`);
            if (response.status !== 200) throw new Error(`Status ${response.status}`);
        });

        // ========================================
        // TESTES DE BANCO DE DADOS
        // ========================================
        this.log('\n🗄️ TESTANDO BANCO DE DADOS', 'blue');

        await this.test('Consistência de dados de médicos', async () => {
            const response = await axios.get(`${BASE_URL}/api/medicos`);
            const medicos = response.data.data;
            
            for (const medico of medicos) {
                if (!medico.crm) throw new Error(`Médico ${medico.id} sem CRM`);
                if (!medico.especialidade) throw new Error(`Médico ${medico.id} sem especialidade`);
            }
        });

        // ========================================
        // RELATÓRIO FINAL
        // ========================================
        this.generateReport();
    }

    generateReport() {
        this.log('\n📊 RELATÓRIO FINAL', 'magenta');
        this.log('═'.repeat(50), 'magenta');
        
        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        
        this.log(`Total de testes: ${this.results.total}`, 'cyan');
        this.log(`✅ Aprovados: ${this.results.passed}`, 'green');
        this.log(`❌ Reprovados: ${this.results.failed}`, 'red');
        this.log(`📈 Taxa de sucesso: ${successRate}%`, successRate >= 90 ? 'green' : 'yellow');

        if (this.results.errors.length > 0) {
            this.log('\n🐛 ERROS ENCONTRADOS:', 'red');
            this.results.errors.forEach((error, index) => {
                this.log(`${index + 1}. ${error.name}: ${error.error}`, 'red');
            });
        }

        if (successRate >= 90) {
            this.log('\n🎉 SISTEMA PRONTO PARA TESTES HUMANOS!', 'green');
        } else {
            this.log('\n⚠️ SISTEMA PRECISA DE CORREÇÕES ANTES DOS TESTES', 'yellow');
        }

        // Salvar relatório em arquivo
        const reportPath = path.join(__dirname, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            results: this.results,
            successRate: parseFloat(successRate)
        }, null, 2));

        this.log(`\n📄 Relatório salvo em: ${reportPath}`, 'cyan');
    }
}

// Executar testes
if (require.main === module) {
    const tester = new MediAppTester();
    tester.runTests().catch(error => {
        console.error('Erro fatal nos testes:', error);
        process.exit(1);
    });
}

module.exports = MediAppTester;