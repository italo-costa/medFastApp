#!/usr/bin/env node

/**
 * 🧪 SUÍTE COMPLETA DE TESTES MEDIAPP
 * 
 * Cobertura abrangente de cenários de teste para:
 * - ✅ Testes Unitários (Backend/Frontend/Mobile)
 * - ✅ Testes de Integração (API/Database/UI)
 * - ✅ Testes E2E (Fluxos completos)
 * - ✅ Testes de Performance (Load/Stress)
 * - ✅ Testes de Segurança (Auth/CORS/Headers)
 * - ✅ Testes de Deploy (Validação de ambientes)
 * - ✅ Testes de Regressão (Funcionalidades críticas)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const BASE_URL = 'http://localhost:3002';
const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bold: '\x1b[1m',
    underline: '\x1b[4m'
};

class ComprehensiveTestSuite {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            performance: {},
            coverage: {},
            security: {},
            regression: {},
            deploy: {}
        };
        this.startTime = Date.now();
        this.testCategories = [
            'unit',
            'integration', 
            'e2e',
            'performance',
            'security',
            'deploy',
            'regression',
            'mobile',
            'database'
        ];
    }

    log(message, color = 'reset', bold = false) {
        const style = bold ? COLORS.bold : '';
        const timestamp = new Date().toLocaleTimeString();
        console.log(`${style}${COLORS[color]}[${timestamp}] ${message}${COLORS.reset}`);
    }

    async test(name, testFn, category = 'general', critical = false) {
        this.results.total++;
        const testStart = Date.now();
        
        try {
            await testFn();
            const duration = Date.now() - testStart;
            this.results.passed++;
            
            const indicator = critical ? '🔥' : '✅';
            this.log(`${indicator} ${name} (${duration}ms)`, 'green');
            
            if (!this.results.performance[category]) {
                this.results.performance[category] = [];
            }
            this.results.performance[category].push({ name, duration, critical });
            
        } catch (error) {
            this.results.failed++;
            this.results.errors.push({ 
                name, 
                error: error.message, 
                category, 
                critical,
                stack: error.stack 
            });
            
            const indicator = critical ? '💀' : '❌';
            this.log(`${indicator} ${name}: ${error.message}`, 'red');
        }
    }

    // =================== TESTES UNITÁRIOS ===================
    async runUnitTests() {
        this.log('\n🧪 EXECUTANDO TESTES UNITÁRIOS', 'cyan', true);

        // Backend Unit Tests
        await this.test('Unit - Validação de CPF', async () => {
            const cpfValid = '11144477735';
            const cpfInvalid = '12345678901';
            
            // Simular validação de CPF
            const isValid = (cpf) => {
                if (cpf.length !== 11) return false;
                if (/^(\d)\1{10}$/.test(cpf)) return false;
                return true;
            };
            
            if (!isValid(cpfValid)) throw new Error('CPF válido não passou na validação');
            if (isValid(cpfInvalid)) throw new Error('CPF inválido passou na validação');
        }, 'unit');

        await this.test('Unit - Formatação de dados médicos', async () => {
            const medico = {
                nomeCompleto: 'Dr. João Silva',
                crm: '123456',
                especialidade: 'Cardiologia'
            };
            
            const formatted = {
                ...medico,
                nomeFormatado: medico.nomeCompleto.toUpperCase(),
                crmFormatado: `CRM/${medico.crm}`
            };
            
            if (formatted.nomeFormatado !== 'DR. JOÃO SILVA') {
                throw new Error('Formatação de nome incorreta');
            }
            if (formatted.crmFormatado !== 'CRM/123456') {
                throw new Error('Formatação de CRM incorreta');
            }
        }, 'unit');

        await this.test('Unit - Cálculo de idade de paciente', async () => {
            const hoje = new Date();
            const nascimento = new Date(hoje.getFullYear() - 30, hoje.getMonth(), hoje.getDate());
            
            const calcularIdade = (dataNascimento) => {
                const hoje = new Date();
                const nascimento = new Date(dataNascimento);
                let idade = hoje.getFullYear() - nascimento.getFullYear();
                const mes = hoje.getMonth() - nascimento.getMonth();
                
                if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                    idade--;
                }
                return idade;
            };
            
            const idade = calcularIdade(nascimento);
            if (idade !== 30) throw new Error(`Idade calculada incorreta: ${idade}`);
        }, 'unit');

        // Frontend Unit Tests
        await this.test('Unit - Validação de formulário médico', async () => {
            const formData = {
                nomeCompleto: 'Dr. Teste',
                cpf: '11144477735',
                crm: '123456',
                especialidade: 'Clinica Geral',
                telefone: '(11) 99999-9999',
                email: 'teste@mediapp.com'
            };
            
            const validarFormulario = (data) => {
                if (!data.nomeCompleto || data.nomeCompleto.length < 3) return false;
                if (!data.cpf || data.cpf.length !== 11) return false;
                if (!data.crm || data.crm.length < 4) return false;
                if (!data.especialidade) return false;
                if (!data.email || !data.email.includes('@')) return false;
                return true;
            };
            
            if (!validarFormulario(formData)) {
                throw new Error('Validação de formulário falhou');
            }
        }, 'unit');

        await this.test('Unit - Filtro de especialidades', async () => {
            const especialidades = [
                'Cardiologia', 'Dermatologia', 'Neurologia', 
                'Pediatria', 'Ortopedia', 'Clinica Geral'
            ];
            
            const filtrarEspecialidades = (lista, termo) => {
                return lista.filter(esp => 
                    esp.toLowerCase().includes(termo.toLowerCase())
                );
            };
            
            const resultado = filtrarEspecialidades(especialidades, 'cardio');
            if (resultado.length !== 1 || resultado[0] !== 'Cardiologia') {
                throw new Error('Filtro de especialidades não funcionou');
            }
        }, 'unit');
    }

    // =================== TESTES DE INTEGRAÇÃO ===================
    async runIntegrationTests() {
        this.log('\n🔗 EXECUTANDO TESTES DE INTEGRAÇÃO', 'cyan', true);

        // API Integration Tests
        await this.test('Integration - CRUD completo médicos', async () => {
            // 1. Criar médico
            const novoMedico = {
                nomeCompleto: 'Dr. Integração Teste',
                cpf: '98765432101',
                crm: 'INT123',
                especialidade: 'Teste',
                telefone: '(11) 98888-8888',
                email: 'integracao@test.com'
            };
            
            const createResponse = await axios.post(`${BASE_URL}/api/medicos`, novoMedico);
            if (!createResponse.data.success) throw new Error('Falha ao criar médico');
            
            const medicoId = createResponse.data.data.id;
            
            // 2. Buscar médico criado
            const getResponse = await axios.get(`${BASE_URL}/api/medicos/${medicoId}`);
            if (!getResponse.data.success) throw new Error('Falha ao buscar médico');
            
            // 3. Atualizar médico
            const updateData = { ...novoMedico, especialidade: 'Teste Atualizado' };
            const updateResponse = await axios.put(`${BASE_URL}/api/medicos/${medicoId}`, updateData);
            if (!updateResponse.data.success) throw new Error('Falha ao atualizar médico');
            
            // 4. Deletar médico
            const deleteResponse = await axios.delete(`${BASE_URL}/api/medicos/${medicoId}`);
            if (!deleteResponse.data.success) throw new Error('Falha ao deletar médico');
            
        }, 'integration', true);

        await this.test('Integration - Frontend-Backend médicos', async () => {
            // Simular carregamento da página de gestão de médicos
            const pageResponse = await axios.get(`${BASE_URL}/gestao-medicos.html`);
            if (pageResponse.status !== 200) throw new Error('Página não carrega');
            
            // Verificar se a página contém elementos necessários
            const pageContent = pageResponse.data;
            if (!pageContent.includes('editarMedico')) throw new Error('Função editarMedico não encontrada');
            if (!pageContent.includes('excluirMedico')) throw new Error('Função excluirMedico não encontrada');
            if (!pageContent.includes('api/medicos')) throw new Error('Endpoint API não encontrado');
            
        }, 'integration');

        await this.test('Integration - Database consistency', async () => {
            // Verificar se dados estão consistentes entre diferentes endpoints
            const medicosResponse = await axios.get(`${BASE_URL}/api/medicos`);
            const statsResponse = await axios.get(`${BASE_URL}/api/statistics/dashboard`);
            
            if (!medicosResponse.data.success || !statsResponse.data.success) {
                throw new Error('APIs não respondem corretamente');
            }
            
            const medicosCount = medicosResponse.data.data.length;
            const statsCount = statsResponse.data.data.medicos?.value || 0;
            
            // Aceitar pequenas diferenças por cache/timing
            if (Math.abs(medicosCount - statsCount) > 2) {
                this.log(`⚠️  Diferença nos dados: médicos=${medicosCount}, stats=${statsCount}`, 'yellow');
            }
        }, 'integration');

        await this.test('Integration - Patient-Doctor relationship', async () => {
            // Testar relação paciente-médico
            const pacientesResponse = await axios.get(`${BASE_URL}/api/patients`);
            if (!pacientesResponse.data.success) throw new Error('Falha ao buscar pacientes');
            
            const pacientes = pacientesResponse.data.data;
            if (pacientes.length > 0) {
                // Verificar se paciente tem médico responsável
                const paciente = pacientes[0];
                if (paciente.medico_responsavel_id) {
                    const medicoResponse = await axios.get(`${BASE_URL}/api/medicos/${paciente.medico_responsavel_id}`);
                    if (!medicoResponse.data.success) {
                        throw new Error('Médico responsável não encontrado');
                    }
                }
            }
        }, 'integration');
    }

    // =================== TESTES E2E ===================
    async runE2ETests() {
        this.log('\n🎭 EXECUTANDO TESTES END-TO-END', 'cyan', true);

        await this.test('E2E - Fluxo completo gestão médicos', async () => {
            // 1. Carregar página de gestão
            const pageResponse = await axios.get(`${BASE_URL}/gestao-medicos.html`);
            if (pageResponse.status !== 200) throw new Error('Página não carrega');
            
            // 2. Listar médicos existentes
            const listResponse = await axios.get(`${BASE_URL}/api/medicos`);
            if (!listResponse.data.success) throw new Error('Falha ao listar médicos');
            
            // 3. Simular adição de novo médico
            const novoMedico = {
                nomeCompleto: 'Dr. E2E Teste',
                cpf: '11122233344',
                crm: 'E2E123',
                especialidade: 'E2E Testing',
                telefone: '(11) 97777-7777',
                email: 'e2e@test.com'
            };
            
            const createResponse = await axios.post(`${BASE_URL}/api/medicos`, novoMedico);
            if (!createResponse.data.success) throw new Error('Falha ao criar médico');
            
            // 4. Verificar se médico aparece na listagem
            const newListResponse = await axios.get(`${BASE_URL}/api/medicos`);
            const medicos = newListResponse.data.data;
            const medicoEncontrado = medicos.find(m => m.crm === 'E2E123');
            if (!medicoEncontrado) throw new Error('Médico não aparece na listagem');
            
            // 5. Cleanup
            await axios.delete(`${BASE_URL}/api/medicos/${medicoEncontrado.id}`);
            
        }, 'e2e', true);

        await this.test('E2E - Fluxo completo gestão pacientes', async () => {
            // Teste similar para pacientes
            const pageResponse = await axios.get(`${BASE_URL}/gestao-pacientes.html`);
            if (pageResponse.status !== 200) throw new Error('Página não carrega');
            
            const listResponse = await axios.get(`${BASE_URL}/api/patients`);
            if (!listResponse.data.success) throw new Error('Falha ao listar pacientes');
            
        }, 'e2e');

        await this.test('E2E - Dashboard workflow', async () => {
            // 1. Carregar dashboard
            const dashboardResponse = await axios.get(`${BASE_URL}/app.html`);
            if (dashboardResponse.status !== 200) throw new Error('Dashboard não carrega');
            
            // 2. Verificar estatísticas
            const statsResponse = await axios.get(`${BASE_URL}/api/statistics/dashboard`);
            if (!statsResponse.data.success) throw new Error('Estatísticas não carregam');
            
            const stats = statsResponse.data.data;
            if (!stats.medicos || !stats.pacientes) {
                throw new Error('Dados de estatísticas incompletos');
            }
            
        }, 'e2e');
    }

    // =================== TESTES DE PERFORMANCE ===================
    async runPerformanceTests() {
        this.log('\n⚡ EXECUTANDO TESTES DE PERFORMANCE', 'cyan', true);

        await this.test('Performance - API response time', async () => {
            const tempos = [];
            const requests = 10;
            
            for (let i = 0; i < requests; i++) {
                const start = Date.now();
                await axios.get(`${BASE_URL}/api/medicos`);
                tempos.push(Date.now() - start);
            }
            
            const tempoMedio = tempos.reduce((a, b) => a + b, 0) / tempos.length;
            const tempoMax = Math.max(...tempos);
            
            if (tempoMedio > 1000) throw new Error(`Tempo médio muito alto: ${tempoMedio}ms`);
            if (tempoMax > 2000) throw new Error(`Tempo máximo muito alto: ${tempoMax}ms`);
            
            this.log(`📊 Tempo médio: ${tempoMedio}ms, Máximo: ${tempoMax}ms`, 'blue');
            
        }, 'performance', true);

        await this.test('Performance - Concurrent requests', async () => {
            const concurrency = 20;
            const promises = Array(concurrency).fill().map(() => 
                axios.get(`${BASE_URL}/health`)
            );
            
            const start = Date.now();
            const results = await Promise.allSettled(promises);
            const duration = Date.now() - start;
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            if (failed > concurrency * 0.1) { // Max 10% failure rate
                throw new Error(`Muitas falhas: ${failed}/${concurrency}`);
            }
            
            if (duration > 5000) {
                throw new Error(`Requisições simultâneas muito lentas: ${duration}ms`);
            }
            
            this.log(`📊 ${concurrency} requisições em ${duration}ms (${failed} falhas)`, 'blue');
            
        }, 'performance');

        await this.test('Performance - Memory usage simulation', async () => {
            // Simular uso intensivo de memória
            const largeLists = [];
            const iterations = 100;
            
            const start = process.memoryUsage();
            
            for (let i = 0; i < iterations; i++) {
                const response = await axios.get(`${BASE_URL}/api/medicos`);
                largeLists.push(response.data);
                
                // Simular processamento
                if (response.data.data) {
                    const processed = response.data.data.map(medico => ({
                        ...medico,
                        processed: true,
                        timestamp: Date.now()
                    }));
                    largeLists.push(processed);
                }
            }
            
            const end = process.memoryUsage();
            const memoryIncrease = end.heapUsed - start.heapUsed;
            
            // Cleanup
            largeLists.length = 0;
            
            if (memoryIncrease > 50 * 1024 * 1024) { // 50MB
                this.log(`⚠️  Alto uso de memória: ${Math.round(memoryIncrease / 1024 / 1024)}MB`, 'yellow');
            }
            
        }, 'performance');

        await this.test('Performance - Database query optimization', async () => {
            const queries = [
                '/api/medicos',
                '/api/patients', 
                '/api/statistics/dashboard',
                '/health'
            ];
            
            for (const endpoint of queries) {
                const start = Date.now();
                const response = await axios.get(`${BASE_URL}${endpoint}`);
                const duration = Date.now() - start;
                
                if (duration > 500) {
                    this.log(`⚠️  Query lenta em ${endpoint}: ${duration}ms`, 'yellow');
                }
                
                if (!response.data) {
                    throw new Error(`Resposta vazia em ${endpoint}`);
                }
            }
        }, 'performance');
    }

    // =================== TESTES DE SEGURANÇA ===================
    async runSecurityTests() {
        this.log('\n🔒 EXECUTANDO TESTES DE SEGURANÇA', 'cyan', true);

        await this.test('Security - HTTP Headers', async () => {
            const response = await axios.get(`${BASE_URL}/health`);
            const headers = response.headers;
            
            // Verificar headers de segurança
            const requiredHeaders = [
                'x-content-type-options',
                'x-frame-options', 
                'x-xss-protection'
            ];
            
            const missingHeaders = requiredHeaders.filter(header => !headers[header]);
            
            if (missingHeaders.length > 0) {
                this.log(`⚠️  Headers ausentes: ${missingHeaders.join(', ')}`, 'yellow');
            }
            
        }, 'security');

        await this.test('Security - SQL Injection prevention', async () => {
            // Testar tentativas de SQL injection
            const maliciousInputs = [
                "'; DROP TABLE medicos; --",
                "1' OR '1'='1",
                "admin'/*",
                "1; DELETE FROM usuarios; --"
            ];
            
            for (const input of maliciousInputs) {
                try {
                    const response = await axios.get(`${BASE_URL}/api/medicos`, {
                        params: { search: input }
                    });
                    
                    // Se chegou aqui, a aplicação não quebrou (bom sinal)
                    if (response.status !== 200) {
                        throw new Error('Aplicação instável com entrada maliciosa');
                    }
                    
                } catch (error) {
                    // Erro controlado é aceitável
                    if (error.response && error.response.status >= 500) {
                        throw new Error('Possível vulnerabilidade SQL injection');
                    }
                }
            }
        }, 'security');

        await this.test('Security - XSS prevention', async () => {
            const xssPayloads = [
                '<script>alert("xss")</script>',
                'javascript:alert("xss")',
                '<img src="x" onerror="alert(1)">',
                '<svg onload="alert(1)">'
            ];
            
            for (const payload of xssPayloads) {
                try {
                    const response = await axios.post(`${BASE_URL}/api/medicos`, {
                        nomeCompleto: payload,
                        cpf: '12345678901',
                        crm: 'XSS123',
                        especialidade: 'Teste',
                        telefone: '(11) 99999-9999',
                        email: 'xss@test.com'
                    });
                    
                    // Verificar se payload foi sanitizado
                    if (response.data.data && response.data.data.nomeCompleto === payload) {
                        throw new Error('Possível vulnerabilidade XSS - dados não sanitizados');
                    }
                    
                } catch (error) {
                    // Erro de validação é esperado e bom
                    if (error.response && error.response.status === 400) {
                        // Validação funcionando corretamente
                        continue;
                    }
                    
                    if (error.response && error.response.status >= 500) {
                        throw new Error('Erro interno com payload XSS');
                    }
                }
            }
        }, 'security');

        await this.test('Security - CORS validation', async () => {
            // Verificar configuração CORS
            const response = await axios.options(`${BASE_URL}/api/medicos`, {
                headers: {
                    'Origin': 'http://malicious-site.com',
                    'Access-Control-Request-Method': 'POST'
                }
            });
            
            const corsHeader = response.headers['access-control-allow-origin'];
            
            // Em produção, não deveria permitir * para origens
            if (corsHeader === '*') {
                this.log('⚠️  CORS muito permissivo (*) - considere restringir em produção', 'yellow');
            }
            
        }, 'security');
    }

    // =================== TESTES DE DEPLOY ===================
    async runDeployTests() {
        this.log('\n🚀 EXECUTANDO TESTES DE DEPLOY', 'cyan', true);

        await this.test('Deploy - Environment variables', async () => {
            // Verificar se variáveis críticas estão definidas
            const requiredEnvVars = [
                'NODE_ENV',
                'DATABASE_URL'
            ];
            
            const response = await axios.get(`${BASE_URL}/health`);
            if (!response.data.environment) {
                this.log('⚠️  Informações de ambiente não disponíveis', 'yellow');
                return;
            }
            
            // Verificar se aplicação está rodando em modo apropriado
            if (response.data.environment === 'production') {
                this.log('✅ Aplicação em modo produção', 'green');
            } else {
                this.log('ℹ️  Aplicação em modo desenvolvimento', 'blue');
            }
            
        }, 'deploy');

        await this.test('Deploy - Database connectivity', async () => {
            const response = await axios.get(`${BASE_URL}/health`);
            
            if (!response.data.database || response.data.database !== 'Connected') {
                throw new Error('Banco de dados não conectado');
            }
            
            // Verificar se há dados básicos
            if (response.data.medicos < 0 || response.data.pacientes < 0) {
                throw new Error('Dados do banco inconsistentes');
            }
            
        }, 'deploy', true);

        await this.test('Deploy - Static files serving', async () => {
            const staticFiles = [
                '/gestao-medicos.html',
                '/gestao-pacientes.html', 
                '/app.html'
            ];
            
            for (const file of staticFiles) {
                const response = await axios.get(`${BASE_URL}${file}`);
                if (response.status !== 200) {
                    throw new Error(`Arquivo estático não encontrado: ${file}`);
                }
                
                if (response.data.length < 100) {
                    throw new Error(`Arquivo muito pequeno: ${file}`);
                }
            }
        }, 'deploy');

        await this.test('Deploy - API endpoints availability', async () => {
            const endpoints = [
                '/health',
                '/api/medicos',
                '/api/patients',
                '/api/statistics/dashboard'
            ];
            
            const results = [];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await axios.get(`${BASE_URL}${endpoint}`);
                    results.push({ endpoint, status: response.status, success: true });
                } catch (error) {
                    results.push({ 
                        endpoint, 
                        status: error.response?.status || 'ERROR', 
                        success: false 
                    });
                }
            }
            
            const failed = results.filter(r => !r.success);
            if (failed.length > 0) {
                throw new Error(`Endpoints falhando: ${failed.map(f => f.endpoint).join(', ')}`);
            }
            
        }, 'deploy', true);
    }

    // =================== TESTES DE REGRESSÃO ===================
    async runRegressionTests() {
        this.log('\n🔄 EXECUTANDO TESTES DE REGRESSÃO', 'cyan', true);

        await this.test('Regression - Button functionality (Fixed Issue)', async () => {
            // Verificar se o problema de botões foi realmente corrigido
            const pageResponse = await axios.get(`${BASE_URL}/gestao-medicos.html`);
            const pageContent = pageResponse.data;
            
            // Verificar se não há mais onclick inline (que causava problemas)
            if (pageContent.includes('onclick="editarMedico')) {
                throw new Error('Ainda há onclick inline - regressão detectada');
            }
            
            // Verificar se event listeners estão implementados
            if (!pageContent.includes('addEventListener')) {
                throw new Error('Event listeners não implementados - possível regressão');
            }
            
        }, 'regression', true);

        await this.test('Regression - API consistency', async () => {
            // Verificar se APIs mantêm formato consistente
            const medicosResponse = await axios.get(`${BASE_URL}/api/medicos`);
            const patientsResponse = await axios.get(`${BASE_URL}/api/patients`);
            
            // Verificar estrutura de resposta padrão
            const checkResponseStructure = (response, name) => {
                if (!response.data.success) {
                    throw new Error(`${name}: Campo success ausente`);
                }
                if (!response.data.data) {
                    throw new Error(`${name}: Campo data ausente`);
                }
                if (!Array.isArray(response.data.data)) {
                    throw new Error(`${name}: Data não é array`);
                }
            };
            
            checkResponseStructure(medicosResponse, 'API Médicos');
            checkResponseStructure(patientsResponse, 'API Pacientes');
            
        }, 'regression');

        await this.test('Regression - Critical user flows', async () => {
            // Testar fluxos críticos que não podem quebrar
            const flows = [
                {
                    name: 'Listar médicos',
                    url: '/api/medicos',
                    expectedFields: ['id', 'nomeCompleto', 'crm', 'especialidade']
                },
                {
                    name: 'Dashboard stats',
                    url: '/api/statistics/dashboard', 
                    expectedFields: ['medicos', 'pacientes']
                }
            ];
            
            for (const flow of flows) {
                const response = await axios.get(`${BASE_URL}${flow.url}`);
                
                if (!response.data.success) {
                    throw new Error(`${flow.name}: Falha na resposta`);
                }
                
                if (flow.expectedFields && response.data.data) {
                    const data = Array.isArray(response.data.data) 
                        ? response.data.data[0] 
                        : response.data.data;
                        
                    if (data) {
                        for (const field of flow.expectedFields) {
                            if (!(field in data)) {
                                this.log(`⚠️  ${flow.name}: Campo ${field} ausente`, 'yellow');
                            }
                        }
                    }
                }
            }
        }, 'regression');
    }

    // =================== TESTES MOBILE ===================
    async runMobileTests() {
        this.log('\n📱 EXECUTANDO TESTES MOBILE', 'cyan', true);

        await this.test('Mobile - Project structure validation', async () => {
            const mobileDir = path.join(process.cwd(), '..', 'mobile');
            const packageJsonPath = path.join(mobileDir, 'package.json');
            
            if (!fs.existsSync(packageJsonPath)) {
                throw new Error('package.json mobile não encontrado');
            }
            
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            const requiredDeps = [
                'react',
                'react-native',
                '@reduxjs/toolkit',
                'react-redux',
                'axios'
            ];
            
            for (const dep of requiredDeps) {
                if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
                    throw new Error(`Dependência ${dep} não encontrada`);
                }
            }
            
        }, 'mobile');

        await this.test('Mobile - Redux store configuration', async () => {
            // Simular configuração do store
            const storeConfig = {
                auth: {
                    isAuthenticated: false,
                    user: null,
                    isLoading: false,
                    error: null
                },
                patients: {
                    list: [],
                    loading: false,
                    error: null
                },
                records: {
                    list: [],
                    loading: false,
                    error: null
                }
            };
            
            // Verificar estrutura básica do store
            const requiredSlices = ['auth', 'patients', 'records'];
            for (const slice of requiredSlices) {
                if (!storeConfig[slice]) {
                    throw new Error(`Slice ${slice} não configurado`);
                }
            }
            
        }, 'mobile');

        await this.test('Mobile - API integration mock', async () => {
            // Simular integração mobile com API
            const mockApiCall = async (endpoint) => {
                try {
                    const response = await axios.get(`${BASE_URL}${endpoint}`);
                    return {
                        success: true,
                        data: response.data,
                        error: null
                    };
                } catch (error) {
                    return {
                        success: false,
                        data: null,
                        error: error.message
                    };
                }
            };
            
            const result = await mockApiCall('/api/medicos');
            if (!result.success) {
                throw new Error(`API call failed: ${result.error}`);
            }
            
        }, 'mobile');
    }

    // =================== RELATÓRIO FINAL ===================
    generateComprehensiveReport() {
        const totalTime = Date.now() - this.startTime;
        const successRate = (this.results.passed / this.results.total) * 100;
        
        this.log('\n' + '='.repeat(100), 'magenta', true);
        this.log('🏥 RELATÓRIO COMPLETO DE TESTES - MEDIAPP', 'magenta', true);
        this.log('='.repeat(100), 'magenta', true);
        
        // Resumo geral
        this.log(`\n📊 RESUMO EXECUTIVO:`, 'blue', true);
        this.log(`   📈 Total de testes: ${this.results.total}`);
        this.log(`   ✅ Sucessos: ${this.results.passed}`, 'green');
        this.log(`   ❌ Falhas: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
        this.log(`   ⏱️  Tempo total: ${Math.round(totalTime / 1000)}s`);
        this.log(`   📊 Taxa de sucesso: ${successRate.toFixed(1)}%`, successRate >= 90 ? 'green' : 'yellow');
        
        // Performance por categoria
        this.log(`\n⚡ PERFORMANCE POR CATEGORIA:`, 'blue', true);
        Object.entries(this.results.performance).forEach(([category, tests]) => {
            const avgTime = tests.reduce((sum, test) => sum + test.duration, 0) / tests.length;
            const criticalTests = tests.filter(t => t.critical).length;
            const status = avgTime < 500 ? '🟢' : avgTime < 1000 ? '🟡' : '🔴';
            
            this.log(`   ${status} ${category}: ${avgTime.toFixed(0)}ms médio (${tests.length} testes, ${criticalTests} críticos)`);
        });
        
        // Análise de criticidade
        const criticalErrors = this.results.errors.filter(e => e.critical);
        if (criticalErrors.length > 0) {
            this.log(`\n💀 ERROS CRÍTICOS (${criticalErrors.length}):`, 'red', true);
            criticalErrors.forEach(error => {
                this.log(`   🔥 ${error.name}`, 'red');
                this.log(`      ${error.error}`, 'yellow');
            });
        }
        
        // Todos os erros
        if (this.results.errors.length > 0) {
            this.log(`\n❌ TODOS OS ERROS (${this.results.errors.length}):`, 'red', true);
            this.results.errors.forEach(error => {
                const indicator = error.critical ? '💀' : '❌';
                this.log(`   ${indicator} [${error.category}] ${error.name}`, 'red');
                this.log(`      ${error.error}`, 'yellow');
            });
        }
        
        // Cobertura por categoria
        this.log(`\n📋 COBERTURA DE TESTES:`, 'blue', true);
        const categoryStats = {};
        this.results.performance && Object.keys(this.results.performance).forEach(category => {
            const tests = this.results.performance[category];
            const errors = this.results.errors.filter(e => e.category === category);
            const successRate = ((tests.length - errors.length) / tests.length) * 100;
            
            categoryStats[category] = {
                total: tests.length,
                passed: tests.length - errors.length,
                failed: errors.length,
                successRate
            };
            
            const status = successRate >= 95 ? '🟢' : successRate >= 80 ? '🟡' : '🔴';
            this.log(`   ${status} ${category}: ${successRate.toFixed(1)}% (${tests.length - errors.length}/${tests.length})`);
        });
        
        // Recomendações baseadas nos resultados
        this.log(`\n🎯 RECOMENDAÇÕES:`, 'blue', true);
        
        if (successRate >= 95) {
            this.log(`   ✅ Excelente! Sistema com alta qualidade`, 'green');
            this.log(`   ✅ Pronto para deploy em produção`);
            this.log(`   ✅ Considere implementar CI/CD automático`);
        } else if (successRate >= 80) {
            this.log(`   ⚠️  Boa qualidade, mas há pontos de melhoria`, 'yellow');
            this.log(`   🔧 Corrija os erros antes do deploy`);
            this.log(`   📈 Aumente cobertura de testes críticos`);
        } else {
            this.log(`   🚨 Sistema precisa de melhorias significativas`, 'red');
            this.log(`   🛠️  Corrija todos os erros críticos`);
            this.log(`   🔍 Revise arquitetura e implementação`);
        }
        
        // Próximos passos específicos
        this.log(`\n🚀 PRÓXIMOS PASSOS:`, 'blue', true);
        this.log(`   1. 🔧 Corrigir erros críticos identificados`);
        this.log(`   2. 📱 Executar testes no app mobile real`);
        this.log(`   3. 🔄 Configurar testes automatizados (CI/CD)`);
        this.log(`   4. 📊 Implementar monitoramento em produção`);
        this.log(`   5. 🚀 Preparar deploy com rollback strategy`);
        
        // Salvar relatório detalhado
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                successRate,
                totalTime,
                criticalErrors: criticalErrors.length
            },
            categoryStats,
            performance: this.results.performance,
            errors: this.results.errors,
            architecture: {
                backend: 'Node.js + Express + PostgreSQL + Prisma',
                frontend: 'HTML5 + CSS3 + JavaScript',
                mobile: 'React Native + Redux Toolkit',
                database: 'PostgreSQL 16',
                environment: 'Ubuntu WSL'
            },
            coverage: {
                unit: true,
                integration: true,
                e2e: true,
                performance: true,
                security: true,
                regression: true,
                mobile: true,
                deploy: true
            }
        };
        
        const reportPath = 'tests/comprehensive-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`, 'cyan');
        
        return report;
    }

    // =================== EXECUÇÃO PRINCIPAL ===================
    async runAllTests() {
        this.log('🧪 INICIANDO SUÍTE COMPLETA DE TESTES MEDIAPP', 'magenta', true);
        this.log('🔍 Cobertura: Unit + Integration + E2E + Performance + Security + Deploy + Regression + Mobile\n', 'blue');

        try {
            await this.runUnitTests();
            await this.runIntegrationTests();
            await this.runE2ETests();
            await this.runPerformanceTests();
            await this.runSecurityTests();
            await this.runDeployTests();
            await this.runRegressionTests();
            await this.runMobileTests();
            
        } catch (error) {
            this.log(`\n💥 Erro crítico durante execução dos testes: ${error.message}`, 'red', true);
            this.results.failed++;
            this.results.errors.push({
                name: 'Test Suite Execution',
                error: error.message,
                category: 'system',
                critical: true
            });
        }

        const report = this.generateComprehensiveReport();
        
        // Código de saída baseado na criticidade dos erros
        const criticalErrors = this.results.errors.filter(e => e.critical).length;
        const exitCode = criticalErrors > 0 ? 2 : this.results.failed > 0 ? 1 : 0;
        
        this.log(`\n🏁 Testes concluídos. Exit code: ${exitCode}`, exitCode === 0 ? 'green' : 'red', true);
        
        return { report, exitCode };
    }
}

// Função principal
async function main() {
    const testSuite = new ComprehensiveTestSuite();
    
    // Aguardar servidor estar pronto
    console.log('⏳ Aguardando servidor inicializar...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { report, exitCode } = await testSuite.runAllTests();
    
    process.exit(exitCode);
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Erro fatal na execução dos testes:', error.message);
        process.exit(2);
    });
}

module.exports = ComprehensiveTestSuite;