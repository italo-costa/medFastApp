const puppeteer = require('puppeteer');
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('🧪 Testes End-to-End - Frontend + Backend', () => {
    let browser;
    let page;
    let server;
    let baseUrl = 'http://localhost:3002';

    beforeAll(async () => {
        // Iniciar o servidor
        const app = require('../../src/server-prisma');
        server = app.listen(3001);
        
        // Aguardar servidor ficar pronto
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Configurar browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        
        // Criar dados de teste realistas
        await setupTestData();
    });

    afterAll(async () => {
        if (browser) await browser.close();
        if (server) server.close();
        await cleanupTestData();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Limpar localStorage e cookies antes de cada teste
        await page.evaluateOnNewDocument(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    async function setupTestData() {
        // Criar médico de teste realista
        const senhaHash = await bcrypt.hash('medico123', 10);
        
        const medicoUsuario = await prisma.usuario.create({
            data: {
                email: 'dr.santos@mediapp.com',
                senha: senhaHash,
                nome: 'Dr. Carlos Santos',
                tipo: 'MEDICO',
                ativo: true
            }
        });

        await prisma.medico.create({
            data: {
                usuario_id: medicoUsuario.id,
                crm: '123456',
                crm_uf: 'SP',
                especialidade: 'Cardiologia',
                telefone: '(11) 3456-7890',
                celular: '(11) 98765-4321',
                endereco: 'Rua das Flores, 123 - São Paulo/SP'
            }
        });

        // Criar pacientes realistas
        const pacientes = [
            {
                nome: 'Maria Silva Santos',
                cpf: '12345678901',
                data_nascimento: new Date('1985-03-15'),
                sexo: 'FEMININO',
                telefone: '(11) 99999-1111',
                email: 'maria.santos@email.com',
                endereco: 'Av. Paulista, 1000 - São Paulo/SP',
                profissao: 'Professora',
                estado_civil: 'CASADA'
            },
            {
                nome: 'João Pedro Oliveira',
                cpf: '98765432109',
                data_nascimento: new Date('1992-08-22'),
                sexo: 'MASCULINO',
                telefone: '(11) 88888-2222',
                email: 'joao.oliveira@email.com',
                endereco: 'Rua Augusta, 500 - São Paulo/SP',
                profissao: 'Engenheiro',
                estado_civil: 'SOLTEIRO'
            }
        ];

        for (const pacienteData of pacientes) {
            await prisma.paciente.create({ data: pacienteData });
        }
    }

    async function cleanupTestData() {
        await prisma.consulta.deleteMany({});
        await prisma.prontuario.deleteMany({});
        await prisma.medico.deleteMany({});
        await prisma.paciente.deleteMany({});
        await prisma.usuario.deleteMany({});
    }

    describe('🔐 Fluxo de Autenticação', () => {
        test('deve carregar página de login e autenticar médico', async () => {
            await page.goto(`${baseUrl}/app.html`);
            
            // Verificar se a página carregou
            await page.waitForSelector('#loginForm');
            
            const title = await page.title();
            expect(title).toContain('MediApp');
            
            // Preencher formulário de login
            await page.type('#email', 'dr.santos@mediapp.com');
            await page.type('#password', 'medico123');
            
            // Submeter formulário
            await page.click('#loginBtn');
            
            // Aguardar resposta da API
            await page.waitForTimeout(2000);
            
            // Verificar se foi redirecionado ou autenticado
            const currentUrl = page.url();
            const isAuthenticated = await page.evaluate(() => {
                return localStorage.getItem('token') !== null;
            });
            
            expect(isAuthenticated).toBe(true);
        });

        test('deve rejeitar credenciais inválidas', async () => {
            await page.goto(`${baseUrl}/app.html`);
            await page.waitForSelector('#loginForm');
            
            await page.type('#email', 'medico.inexistente@email.com');
            await page.type('#password', 'senhaerrada');
            
            await page.click('#loginBtn');
            await page.waitForTimeout(1000);
            
            // Verificar se não foi autenticado
            const isAuthenticated = await page.evaluate(() => {
                return localStorage.getItem('token') !== null;
            });
            
            expect(isAuthenticated).toBe(false);
        });
    });

    describe('👨‍⚕️ Gestão de Médicos', () => {
        beforeEach(async () => {
            // Fazer login antes de cada teste
            await page.goto(`${baseUrl}/app.html`);
            await page.waitForSelector('#loginForm');
            await page.type('#email', 'dr.santos@mediapp.com');
            await page.type('#password', 'medico123');
            await page.click('#loginBtn');
            await page.waitForTimeout(2000);
        });

        test('deve listar médicos cadastrados', async () => {
            await page.goto(`${baseUrl}/lista-medicos.html`);
            await page.waitForSelector('.medicos-container');
            
            // Verificar se a lista de médicos carregou
            const medicosCount = await page.evaluate(() => {
                return document.querySelectorAll('.medico-card').length;
            });
            
            expect(medicosCount).toBeGreaterThan(0);
            
            // Verificar se os dados do médico estão sendo exibidos
            const medicoInfo = await page.evaluate(() => {
                const card = document.querySelector('.medico-card');
                return card ? card.textContent : '';
            });
            
            expect(medicoInfo).toContain('Dr. Carlos Santos');
            expect(medicoInfo).toContain('Cardiologia');
        });

        test('deve cadastrar novo médico', async () => {
            await page.goto(`${baseUrl}/cadastro-medico.html`);
            await page.waitForSelector('#medicoForm');
            
            // Preencher dados do novo médico
            await page.type('#nome', 'Dra. Ana Paula Costa');
            await page.type('#email', 'ana.costa@mediapp.com');
            await page.type('#senha', 'medico456');
            await page.type('#crm', '654321');
            await page.select('#crm_uf', 'RJ');
            await page.type('#especialidade', 'Dermatologia');
            await page.type('#telefone', '(21) 3333-4444');
            await page.type('#celular', '(21) 99999-5555');
            
            // Submeter formulário
            await page.click('#submitBtn');
            await page.waitForTimeout(2000);
            
            // Verificar se foi criado com sucesso
            const response = await request(baseUrl)
                .get('/api/medicos')
                .expect(200);
            
            const novaMedica = response.body.data.find(m => m.crm === '654321');
            expect(novaMedica).toBeDefined();
            expect(novaMedica.especialidade).toBe('Dermatologia');
        });
    });

    describe('👥 Gestão de Pacientes', () => {
        beforeEach(async () => {
            // Fazer login
            await page.goto(`${baseUrl}/app.html`);
            await page.waitForSelector('#loginForm');
            await page.type('#email', 'dr.santos@mediapp.com');
            await page.type('#password', 'medico123');
            await page.click('#loginBtn');
            await page.waitForTimeout(2000);
        });

        test('deve listar pacientes cadastrados', async () => {
            await page.goto(`${baseUrl}/gestao-pacientes.html`);
            await page.waitForSelector('.pacientes-container');
            
            // Aguardar carregamento dos dados
            await page.waitForTimeout(1000);
            
            const pacientesCount = await page.evaluate(() => {
                return document.querySelectorAll('.paciente-card').length;
            });
            
            expect(pacientesCount).toBeGreaterThan(0);
            
            // Verificar dados dos pacientes
            const pacienteInfo = await page.evaluate(() => {
                const cards = document.querySelectorAll('.paciente-card');
                return Array.from(cards).map(card => card.textContent);
            });
            
            expect(pacienteInfo.some(info => info.includes('Maria Silva Santos'))).toBe(true);
            expect(pacienteInfo.some(info => info.includes('João Pedro Oliveira'))).toBe(true);
        });

        test('deve cadastrar novo paciente', async () => {
            await page.goto(`${baseUrl}/gestao-pacientes.html`);
            await page.waitForSelector('#novoPacienteBtn');
            
            // Abrir modal de cadastro
            await page.click('#novoPacienteBtn');
            await page.waitForSelector('#pacienteModal');
            
            // Preencher dados do paciente
            await page.type('#nome', 'Roberto Carlos Mendes');
            await page.type('#cpf', '11122233344');
            await page.type('#email', 'roberto.mendes@email.com');
            await page.type('#telefone', '(11) 77777-8888');
            await page.type('#data_nascimento', '1975-12-10');
            await page.select('#sexo', 'MASCULINO');
            await page.type('#endereco', 'Rua das Palmeiras, 789 - São Paulo/SP');
            await page.type('#profissao', 'Advogado');
            
            // Submeter formulário
            await page.click('#salvarPaciente');
            await page.waitForTimeout(2000);
            
            // Verificar se foi criado
            const response = await request(baseUrl)
                .get('/api/pacientes')
                .expect(200);
            
            const novoPaciente = response.body.data.find(p => p.cpf === '11122233344');
            expect(novoPaciente).toBeDefined();
            expect(novoPaciente.nome).toBe('Roberto Carlos Mendes');
        });

        test('deve buscar paciente por CPF', async () => {
            await page.goto(`${baseUrl}/gestao-pacientes.html`);
            await page.waitForSelector('#buscarCpf');
            
            // Buscar por CPF
            await page.type('#buscarCpf', '12345678901');
            await page.click('#buscarBtn');
            await page.waitForTimeout(1000);
            
            // Verificar resultado da busca
            const resultadoBusca = await page.evaluate(() => {
                const resultado = document.querySelector('.busca-resultado');
                return resultado ? resultado.textContent : '';
            });
            
            expect(resultadoBusca).toContain('Maria Silva Santos');
        });
    });

    describe('📋 Prontuários Médicos', () => {
        beforeEach(async () => {
            // Fazer login
            await page.goto(`${baseUrl}/app.html`);
            await page.waitForSelector('#loginForm');
            await page.type('#email', 'dr.santos@mediapp.com');
            await page.type('#password', 'medico123');
            await page.click('#loginBtn');
            await page.waitForTimeout(2000);
        });

        test('deve acessar página de prontuários', async () => {
            await page.goto(`${baseUrl}/prontuarios.html`);
            await page.waitForSelector('.prontuarios-container');
            
            const title = await page.evaluate(() => {
                return document.querySelector('h1').textContent;
            });
            
            expect(title).toContain('Prontuários');
        });

        test('deve criar nova consulta', async () => {
            await page.goto(`${baseUrl}/prontuarios.html`);
            await page.waitForSelector('#novaConsultaBtn');
            
            // Abrir modal de nova consulta
            await page.click('#novaConsultaBtn');
            await page.waitForSelector('#consultaModal');
            
            // Preencher dados da consulta
            await page.select('#paciente_id', '1'); // Assumindo que existe paciente com ID 1
            await page.type('#motivo_consulta', 'Dor no peito e falta de ar');
            await page.type('#sintomas', 'Paciente relata dor torácica há 2 dias, associada a dispneia aos esforços');
            await page.type('#exame_fisico', 'PA: 140/90 mmHg, FC: 85 bpm, ausculta cardíaca normal');
            await page.type('#diagnostico', 'Hipertensão arterial sistêmica');
            await page.type('#tratamento', 'Losartana 50mg 1x/dia, retorno em 30 dias');
            
            // Salvar consulta
            await page.click('#salvarConsulta');
            await page.waitForTimeout(2000);
            
            // Verificar se foi criada
            const consultas = await page.evaluate(() => {
                return document.querySelectorAll('.consulta-item').length;
            });
            
            expect(consultas).toBeGreaterThan(0);
        });
    });

    describe('📊 Dashboard e Navegação', () => {
        test('deve carregar dashboard principal', async () => {
            await page.goto(`${baseUrl}/index.html`);
            
            const title = await page.title();
            expect(title).toContain('MediApp');
            
            // Verificar elementos principais
            const hasWelcomeMessage = await page.evaluate(() => {
                return document.querySelector('.welcome-message') !== null;
            });
            
            expect(hasWelcomeMessage).toBe(true);
        });

        test('deve navegar entre páginas', async () => {
            await page.goto(`${baseUrl}/index.html`);
            
            // Clicar no link para acessar o sistema
            await page.click('a[href="/app.html"]');
            await page.waitForNavigation();
            
            const currentUrl = page.url();
            expect(currentUrl).toContain('/app.html');
        });
    });

    describe('🔍 Funcionalidades Avançadas', () => {
        beforeEach(async () => {
            // Fazer login
            await page.goto(`${baseUrl}/app.html`);
            await page.waitForSelector('#loginForm');
            await page.type('#email', 'dr.santos@mediapp.com');
            await page.type('#password', 'medico123');
            await page.click('#loginBtn');
            await page.waitForTimeout(2000);
        });

        test('deve realizar busca de pacientes', async () => {
            await page.goto(`${baseUrl}/gestao-pacientes.html`);
            await page.waitForSelector('#buscaGeral');
            
            await page.type('#buscaGeral', 'Maria');
            await page.click('#buscarGeralBtn');
            await page.waitForTimeout(1000);
            
            const resultados = await page.evaluate(() => {
                return document.querySelectorAll('.resultado-busca').length;
            });
            
            expect(resultados).toBeGreaterThan(0);
        });

        test('deve filtrar por especialidade médica', async () => {
            await page.goto(`${baseUrl}/lista-medicos.html`);
            await page.waitForSelector('#filtroEspecialidade');
            
            await page.select('#filtroEspecialidade', 'Cardiologia');
            await page.waitForTimeout(1000);
            
            const medicosVisiveis = await page.evaluate(() => {
                return document.querySelectorAll('.medico-card:not(.hidden)').length;
            });
            
            expect(medicosVisiveis).toBeGreaterThan(0);
        });
    });

    describe('📱 Responsividade e UX', () => {
        test('deve funcionar em dispositivos móveis', async () => {
            await page.setViewport({ width: 375, height: 667 });
            await page.goto(`${baseUrl}/index.html`);
            
            const isMobile = await page.evaluate(() => {
                return window.innerWidth <= 768;
            });
            
            expect(isMobile).toBe(true);
            
            // Verificar se elementos estão responsivos
            const mobileMenu = await page.evaluate(() => {
                return document.querySelector('.mobile-menu') !== null;
            });
            
            // Reset viewport
            await page.setViewport({ width: 1200, height: 800 });
        });

        test('deve carregar em menos de 3 segundos', async () => {
            const startTime = Date.now();
            
            await page.goto(`${baseUrl}/app.html`);
            await page.waitForSelector('body');
            
            const loadTime = Date.now() - startTime;
            expect(loadTime).toBeLessThan(3000);
        });
    });
});