const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');

console.log('[INFO] Starting MediApp Server...');
console.log('[INFO] Public directory: ' + PUBLIC_DIR);

// MIME types with UTF-8 encoding
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

// Mock data - clean and safe
const mockData = {
    medicos: [
        {
            id: 1,
            nome: 'Dr. Carlos Eduardo Oliveira',
            crm: '123456-SP',
            especialidade: 'Cardiologia',
            telefone: '(11) 3456-7890',
            email: 'carlos.oliveira@hospital.com.br',
            celular: '(11) 99876-5432',
            endereco: 'Rua Augusta, 1245 - Consolacao, Sao Paulo - SP',
            formacao: 'USP - Faculdade de Medicina (2005), Residencia em Cardiologia - InCor (2008)',
            experiencia: '17 anos',
            atendimento: 'Segunda a Sexta: 8h as 18h'
        },
        {
            id: 2,
            nome: 'Dra. Ana Beatriz Costa Santos',
            crm: '789012-SP',
            especialidade: 'Pediatria',
            telefone: '(11) 3987-6543',
            email: 'ana.costa@clinica.com.br',
            celular: '(11) 98765-4321',
            endereco: 'Av. Paulista, 1578 - Bela Vista, Sao Paulo - SP',
            formacao: 'UNIFESP - Medicina (2008), Residencia em Pediatria - Hospital Sao Paulo (2011)',
            experiencia: '14 anos',
            atendimento: 'Segunda a Quinta: 7h as 17h, Sexta: 7h as 12h'
        },
        {
            id: 3,
            nome: 'Dr. Roberto Mendes Silva',
            crm: '345678-SP',
            especialidade: 'Ortopedia',
            telefone: '(11) 3321-9876',
            email: 'roberto.mendes@ortoclinica.com.br',
            celular: '(11) 97654-3210',
            endereco: 'Rua Oscar Freire, 987 - Jardins, Sao Paulo - SP',
            formacao: 'PUC-SP - Medicina (2003), Residencia em Ortopedia - HC-FMUSP (2007)',
            experiencia: '20 anos',
            atendimento: 'Terca e Quinta: 14h as 19h, Sabado: 8h as 12h'
        },
        {
            id: 4,
            nome: 'Dra. Fernanda Lima Rodrigues',
            crm: '901234-SP',
            especialidade: 'Ginecologia e Obstetricia',
            telefone: '(11) 3654-7890',
            email: 'fernanda.lima@gineco.com.br',
            celular: '(11) 96543-2109',
            endereco: 'Rua Haddock Lobo, 456 - Cerqueira Cesar, Sao Paulo - SP',
            formacao: 'Santa Casa - Medicina (2006), Residencia em GO - Hospital das Clinicas (2010)',
            experiencia: '15 anos',
            atendimento: 'Segunda, Quarta e Sexta: 9h as 18h'
        },
        {
            id: 5,
            nome: 'Dr. Paulo Cesar Almeida',
            crm: '567890-SP',
            especialidade: 'Neurologia',
            telefone: '(11) 3789-0123',
            email: 'paulo.almeida@neuro.com.br',
            celular: '(11) 95432-1098',
            endereco: 'Av. Brigadeiro Faria Lima, 2034 - Jardim Paulistano, Sao Paulo - SP',
            formacao: 'USP - Medicina (2001), Residencia em Neurologia - HC-FMUSP (2005)',
            experiencia: '22 anos',
            atendimento: 'Segunda a Quarta: 8h as 17h, Quinta: 13h as 19h'
        }
    ],
    pacientes: [
        {
            id: 1,
            nome: 'Joao Silva Santos',
            idade: 45,
            dataNascimento: '1979-03-15',
            cpf: '123.456.789-01',
            rg: '12.345.678-9',
            telefone: '(11) 98765-4321',
            celular: '(11) 97654-3210',
            email: 'joao.silva@email.com',
            endereco: 'Rua das Flores, 123 - Vila Madalena, Sao Paulo - SP, CEP: 05435-020',
            profissao: 'Engenheiro Civil',
            estadoCivil: 'Casado',
            nomeContato: 'Maria Silva Santos (esposa)',
            telefoneContato: '(11) 96543-2109',
            convenio: 'Unimed Premium',
            numeroConvenio: '123456789012',
            alergias: 'Dipirona, Penicilina',
            medicamentosUso: 'Losartana 50mg (1x ao dia), Sinvastatina 20mg (1x ao dia)',
            doencasPreexistentes: 'Hipertensao arterial, Dislipidemia',
            observacoes: 'Paciente colaborativo, historico familiar de problemas cardiacos'
        },
        {
            id: 2,
            nome: 'Maria Santos Costa',
            idade: 32,
            dataNascimento: '1992-07-22',
            cpf: '987.654.321-09',
            rg: '98.765.432-1',
            telefone: '(11) 87654-3210',
            celular: '(11) 86543-2109',
            email: 'maria.costa@email.com',
            endereco: 'Av. Sao Joao, 456 - Centro, Sao Paulo - SP, CEP: 01035-000',
            profissao: 'Professora',
            estadoCivil: 'Solteira',
            nomeContato: 'Jose Santos (pai)',
            telefoneContato: '(11) 85432-1098',
            convenio: 'Bradesco Saude',
            numeroConvenio: '987654321098',
            alergias: 'Nao possui',
            medicamentosUso: 'Anticoncepcional Yasmin (uso continuo)',
            doencasPreexistentes: 'Nao possui',
            observacoes: 'Paciente jovem, busca acompanhamento preventivo'
        },
        {
            id: 3,
            nome: 'Carlos Roberto Mendes',
            idade: 58,
            dataNascimento: '1966-11-08',
            cpf: '456.789.123-45',
            rg: '45.678.912-3',
            telefone: '(11) 76543-2109',
            celular: '(11) 75432-1098',
            email: 'carlos.mendes@empresa.com',
            endereco: 'Rua Consolacao, 789 - Consolacao, Sao Paulo - SP, CEP: 01302-100',
            profissao: 'Contador',
            estadoCivil: 'Divorciado',
            nomeContato: 'Ana Mendes (filha)',
            telefoneContato: '(11) 74321-0987',
            convenio: 'SulAmerica',
            numeroConvenio: '456789123456',
            alergias: 'Acido acetilsalicilico (AAS)',
            medicamentosUso: 'Metformina 850mg (2x ao dia), Atenolol 50mg (1x ao dia)',
            doencasPreexistentes: 'Diabetes tipo 2, Hipertensao arterial',
            observacoes: 'Paciente com boa aderencia ao tratamento, trabalha sentado'
        },
        {
            id: 4,
            nome: 'Ana Paula Rodrigues Lima',
            idade: 28,
            dataNascimento: '1996-04-12',
            cpf: '789.123.456-78',
            rg: '78.912.345-6',
            telefone: '(11) 65432-1098',
            celular: '(11) 64321-0987',
            email: 'anapaula@startup.com',
            endereco: 'Rua Augusta, 2134 - Jardins, Sao Paulo - SP, CEP: 01412-100',
            profissao: 'Designer UX/UI',
            estadoCivil: 'Solteira',
            nomeContato: 'Beatriz Lima (mae)',
            telefoneContato: '(11) 63210-9876',
            convenio: 'Particular',
            numeroConvenio: 'N/A',
            alergias: 'Latex, Frutos do mar',
            medicamentosUso: 'Nao faz uso regular',
            doencasPreexistentes: 'Nao possui',
            observacoes: 'Paciente jovem, trabalha muito tempo no computador'
        },
        {
            id: 5,
            nome: 'Roberto Silva Oliveira',
            idade: 72,
            dataNascimento: '1952-09-30',
            cpf: '321.654.987-32',
            rg: '32.165.498-7',
            telefone: '(11) 54321-0987',
            celular: '(11) 53210-9876',
            email: 'roberto.oliveira@aposentado.com',
            endereco: 'Rua Pamplona, 567 - Jardim Paulista, Sao Paulo - SP, CEP: 01405-001',
            profissao: 'Aposentado (ex-bancario)',
            estadoCivil: 'Viuvo',
            nomeContato: 'Marcos Oliveira (filho)',
            telefoneContato: '(11) 52109-8765',
            convenio: 'Golden Cross',
            numeroConvenio: '321654987321',
            alergias: 'Sulfa, Iodo',
            medicamentosUso: 'Varfarina 5mg (1x ao dia), Digoxina 0,25mg (1x ao dia), Furosemida 40mg (1x ao dia)',
            doencasPreexistentes: 'Fibrilacao atrial, Insuficiencia cardiaca compensada, Artrose',
            observacoes: 'Paciente idoso, necessita acompanhamento cardiologico regular'
        },
        {
            id: 6,
            nome: 'Beatriz Santos Almeida',
            idade: 35,
            dataNascimento: '1989-12-03',
            cpf: '654.321.098-76',
            rg: '65.432.109-8',
            telefone: '(11) 43210-9876',
            celular: '(11) 42109-8765',
            email: 'beatriz.almeida@advocacia.com',
            endereco: 'Av. Faria Lima, 1478 - Itaim Bibi, Sao Paulo - SP, CEP: 04567-890',
            profissao: 'Advogada',
            estadoCivil: 'Casada',
            nomeContato: 'Fernando Almeida (esposo)',
            telefoneContato: '(11) 41098-7654',
            convenio: 'Amil',
            numeroConvenio: '654321098654',
            alergias: 'Nao possui',
            medicamentosUso: 'Acido folico 5mg (gestante)',
            doencasPreexistentes: 'Nao possui',
            observacoes: 'Gestante - 20 semanas, primeira gestacao'
        }
    ],
    prontuarios: [
        {
            id: 1,
            paciente_id: 1,
            medico_id: 1,
            data: '2024-09-20',
            hora: '14:30',
            tipo: 'Consulta de Rotina',
            queixaPrincipal: 'Dor no peito e falta de ar aos esforcos',
            historiaDoencaAtual: 'Paciente relata episodios de dor precordial ha 2 semanas, principalmente aos esforcos fisicos, acompanhada de dispneia. Nega palpitacoes ou sincope.',
            exameClinico: 'PA: 150/95 mmHg, FC: 78 bpm, FR: 16 irpm, Tax: 36.5C. Ausculta cardiaca: B1 e B2 hipofoneticas, sem sopros. Ausculta pulmonar: MV presente bilateralmente.',
            hipoteseDiagnostica: 'Angina pectoris estavel, Hipertensao arterial descompensada',
            conduta: 'Solicitado ECG, Ecocardiograma e Teste ergometrico. Ajustado anti-hipertensivo. Orientacoes sobre estilo de vida.',
            medicamentos: 'Losartana 100mg 1x ao dia, Sinvastatina 40mg 1x ao dia, AAS 100mg 1x ao dia',
            retorno: '2024-10-15',
            observacoes: 'Paciente orientado sobre sinais de alerta. Familiares cientes do quadro.',
            cid: 'I20.9 - Angina pectoris nao especificada',
            medicoNome: 'Dr. Carlos Eduardo Oliveira',
            medicoCrm: '123456-SP'
        },
        {
            id: 2,
            paciente_id: 2,
            medico_id: 2,
            data: '2024-09-19',
            hora: '10:15',
            tipo: 'Consulta Preventiva',
            queixaPrincipal: 'Check-up anual e orientacoes sobre planejamento familiar',
            historiaDoencaAtual: 'Paciente assintomatica, busca consulta para avaliacao preventiva. Ciclos menstruais regulares, sem queixas ginecologicas.',
            exameClinico: 'Bom estado geral, corada, hidratada. PA: 110/70 mmHg, FC: 72 bpm, IMC: 22,3 kg/m2. Exame fisico sem alteracoes.',
            hipoteseDiagnostica: 'Mulher jovem higida para acompanhamento preventivo',
            conduta: 'Solicitado hemograma, glicemia, colesterol, TSH, papanicolau e USG pelvico. Orientacoes sobre anticoncepcao.',
            medicamentos: 'Manter anticoncepcional em uso. Suplementacao com acido folico se planejar gestacao.',
            retorno: '2025-01-19',
            observacoes: 'Paciente interessada em engravidar no proximo ano. Orientada sobre cuidados pre-concepcionais.',
            cid: 'Z00.0 - Exame medico geral',
            medicoNome: 'Dra. Ana Beatriz Costa Santos',
            medicoCrm: '789012-SP'
        },
        {
            id: 3,
            paciente_id: 3,
            medico_id: 1,
            data: '2024-09-18',
            hora: '16:45',
            tipo: 'Retorno - Diabetes',
            queixaPrincipal: 'Acompanhamento do diabetes e hipertensao',
            historiaDoencaAtual: 'Paciente diabetico ha 8 anos, em tratamento regular. Glicemias de jejum entre 120-140 mg/dL. HbA1c ultimo: 7,2%. Nega sintomas de hipo ou hiperglicemia.',
            exameClinico: 'Regular estado geral, PA: 130/85 mmHg, FC: 68 bpm, Peso: 78kg (perdeu 2kg). Exame dos pes: sem lesoes, pulsos presentes.',
            hipoteseDiagnostica: 'Diabetes mellitus tipo 2 com controle adequado, Hipertensao arterial controlada',
            conduta: 'Manter medicacoes atuais. Solicitado HbA1c, microalbuminuria e fundo de olho. Reforcar dieta e exercicios.',
            medicamentos: 'Metformina 850mg 12/12h, Atenolol 50mg 1x ao dia',
            retorno: '2024-12-18',
            observacoes: 'Paciente aderente ao tratamento. Familia colaborativa. Perdeu peso com reeducacao alimentar.',
            cid: 'E11.9 - Diabetes mellitus tipo 2 sem complicacoes',
            medicoNome: 'Dr. Carlos Eduardo Oliveira',
            medicoCrm: '123456-SP'
        },
        {
            id: 4,
            paciente_id: 4,
            medico_id: 3,
            data: '2024-09-17',
            hora: '15:20',
            tipo: 'Consulta Inicial',
            queixaPrincipal: 'Dor na coluna cervical e ombros',
            historiaDoencaAtual: 'Dor em regiao cervical ha 3 meses, irradiando para ombros, relacionada ao trabalho prolongado no computador. Piora no final do dia, melhora com repouso.',
            exameClinico: 'Tensao muscular em trapezio bilateral, amplitude de movimento cervical limitada por dor. Teste de Spurling negativo. Forca muscular preservada em MMSS.',
            hipoteseDiagnostica: 'Cervicalgia tensional, Sindrome do pescoco rigido',
            conduta: 'Prescricao de relaxante muscular e anti-inflamatorio. Orientacoes ergonomicas. Fisioterapia. Raio-X cervical se nao melhorar.',
            medicamentos: 'Ciclobenzaprina 10mg 1x ao dia, Nimesulida 100mg 12/12h por 7 dias',
            retorno: '2024-10-07',
            observacoes: 'Orientada sobre pausas no trabalho e exercicios de alongamento. Avaliar mesa de trabalho.',
            cid: 'M54.2 - Cervicalgia',
            medicoNome: 'Dr. Roberto Mendes Silva',
            medicoCrm: '345678-SP'
        },
        {
            id: 5,
            paciente_id: 6,
            medico_id: 4,
            data: '2024-09-16',
            hora: '09:00',
            tipo: 'Pre-natal - 20 semanas',
            queixaPrincipal: 'Acompanhamento pre-natal de rotina',
            historiaDoencaAtual: 'Gestante de 20 semanas, primeira gestacao. Nega sangramento, dor abdominal ou contracoes. Movimentacao fetal presente.',
            exameClinico: 'Bom estado geral. PA: 110/70 mmHg, Peso: +3kg desde ultima consulta. AU: 18cm. BCF: 144 bpm. Edema discreto em MMII.',
            hipoteseDiagnostica: 'Gestacao unica topica de 20 semanas, sem intercorrencias',
            conduta: 'USG morfologico realizado - normal. Solicitar glicemia e hemograma. Manter suplementacao. Orientacoes sobre movimentacao fetal.',
            medicamentos: 'Acido folico 5mg 1x ao dia, Sulfato ferroso 300mg 1x ao dia',
            retorno: '2024-10-14',
            observacoes: 'Casal ansioso mas bem orientado. USG mostrou sexo feminino. Sem fatores de risco identificados.',
            cid: 'Z34.0 - Supervisao de gravidez normal, primeiro trimestre',
            medicoNome: 'Dra. Fernanda Lima Rodrigues',
            medicoCrm: '901234-SP'
        },
        {
            id: 6,
            paciente_id: 5,
            medico_id: 5,
            data: '2024-09-15',
            hora: '11:30',
            tipo: 'Acompanhamento Neurologico',
            queixaPrincipal: 'Seguimento de quadro demencial',
            historiaDoencaAtual: 'Paciente com diagnostico de demencia mista ha 2 anos. Familia relata piora da memoria recente e desorientacao temporal. Mantem autonomia parcial.',
            exameClinico: 'Orientado auto e alopsiquicamente com dificuldade. MEEM: 18/30. Marcha lenta mas independente. Sem sinais focais neurologicos.',
            hipoteseDiagnostica: 'Demencia mista em progressao',
            conduta: 'Ajuste de medicacao antidemencial. Orientacoes a familia sobre cuidados. Solicitado acompanhamento psicologico.',
            medicamentos: 'Donepezila 10mg 1x ao dia, Memantina 20mg 1x ao dia',
            retorno: '2024-12-15',
            observacoes: 'Filho muito presente nos cuidados. Discussao sobre cuidadores. Familia bem orientada sobre evolucao da doenca.',
            cid: 'F03 - Demencia nao especificada',
            medicoNome: 'Dr. Paulo Cesar Almeida',
            medicoCrm: '567890-SP'
        },
        {
            id: 7,
            paciente_id: 1,
            medico_id: 1,
            data: '2024-08-15',
            hora: '14:00',
            tipo: 'Retorno Cardiologico',
            queixaPrincipal: 'Resultado de exames cardiologicos',
            historiaDoencaAtual: 'Retorno para avaliacao de ECG e ecocardiograma solicitados em consulta anterior. Paciente refere melhora da dor precordial apos inicio da medicacao.',
            exameClinico: 'PA: 135/85 mmHg, FC: 70 bpm. Paciente com melhor aspecto geral. Nega dor precordial em repouso.',
            hipoteseDiagnostica: 'Doenca arterial coronariana estavel, Hipertensao arterial em controle',
            conduta: 'ECG: alteracoes discretas de repolarizacao. Eco: funcao ventricular preservada. Manter medicacoes. Liberado para atividade fisica leve.',
            medicamentos: 'Manter esquema atual: Losartana 100mg, Sinvastatina 40mg, AAS 100mg',
            retorno: '2024-11-15',
            observacoes: 'Paciente apresentou boa resposta ao tratamento inicial. Orientado sobre importancia da aderencia medicamentosa.',
            cid: 'I25.9 - Doenca isquemica cronica do coracao nao especificada',
            medicoNome: 'Dr. Carlos Eduardo Oliveira',
            medicoCrm: '123456-SP'
        }
    ]
};

// Create HTTP server
const server = http.createServer((req, res) => {
    try {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        
        console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + pathname);
        
        // Set CORS headers for all responses
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Health check endpoint
        if (pathname === '/health') {
            const healthData = {
                status: 'OK',
                timestamp: new Date().toISOString(),
                server: 'MediApp HTTP Server',
                frontend: 'Active',
                pid: process.pid,
                uptime: Math.floor(process.uptime())
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(healthData, null, 2));
            return;
        }
        
        // API endpoint for patients
        if (pathname === '/api/pacientes') {
            const responseData = {
                success: true,
                data: mockData.pacientes,
                total: mockData.pacientes.length,
                timestamp: new Date().toISOString()
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(responseData, null, 2));
            return;
        }
        
        // API endpoint for doctors
        if (pathname === '/api/medicos') {
            const responseData = {
                success: true,
                data: mockData.medicos,
                total: mockData.medicos.length,
                timestamp: new Date().toISOString()
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(responseData, null, 2));
            return;
        }
        
        // API endpoint for medical records
        if (pathname === '/api/prontuarios') {
            const responseData = {
                success: true,
                data: mockData.prontuarios,
                total: mockData.prontuarios.length,
                timestamp: new Date().toISOString()
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(responseData, null, 2));
            return;
        }
        
        // API endpoint for patient stats (compatibility route)
        if (pathname === '/api/patients/stats/overview') {
            const responseData = {
                success: true,
                totalPatients: mockData.pacientes.length,
                totalRecords: mockData.prontuarios.length,
                totalDoctors: mockData.medicos.length,
                recentPatients: mockData.pacientes.slice(0, 3),
                stats: {
                    newThisMonth: 2,
                    activeToday: mockData.pacientes.length,
                    avgAge: Math.round(mockData.pacientes.reduce((sum, p) => sum + p.idade, 0) / mockData.pacientes.length)
                },
                timestamp: new Date().toISOString()
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(responseData, null, 2));
            return;
        }
        
        // API endpoint for doctor registration (compatibility route)
        if (pathname === '/api/auth/register-doctor' && req.method === 'POST') {
            const responseData = {
                success: true,
                message: 'Medico cadastrado com sucesso (demo)',
                timestamp: new Date().toISOString()
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(responseData, null, 2));
            return;
        }
        
        // Serve static files
        let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'app.html') : path.join(PUBLIC_DIR, pathname);
        
        // Security check: prevent directory traversal
        if (!filePath.startsWith(PUBLIC_DIR)) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('403 - Forbidden');
            return;
        }
        
        // Read and serve file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // For SPA, serve app.html for non-API routes
                    if (!pathname.startsWith('/api/')) {
                        const appPath = path.join(PUBLIC_DIR, 'app.html');
                        fs.readFile(appPath, (err, data) => {
                            if (err) {
                                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                                res.end('404 - Page not found');
                                return;
                            }
                            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(data);
                        });
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: 'API endpoint not found' }));
                    }
                } else {
                    console.error('[ERROR] File read error:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('500 - Internal Server Error');
                }
                return;
            }
            
            // Determine content type
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'text/plain; charset=utf-8';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
        
    } catch (error) {
        console.error('[ERROR] Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 - Internal Server Error');
    }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log('==========================================');
    console.log('MediApp HTTP Server - Port ' + PORT);
    console.log('Frontend: app.html ready');
    console.log('Static files: ' + PUBLIC_DIR);
    console.log('URL: http://localhost:' + PORT);
    console.log('Health: http://localhost:' + PORT + '/health');
    console.log('==========================================');
    console.log('SERVER STABLE - FRONTEND READY!');
});

// Error handling
server.on('error', (err) => {
    console.error('[ERROR] Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error('[ERROR] Port ' + PORT + ' is already in use');
        process.exit(1);
    }
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    console.log('[INFO] SIGTERM received - Shutting down server...');
    server.close(() => {
        console.log('[INFO] Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('[INFO] SIGINT received - Shutting down server...');
    server.close(() => {
        console.log('[INFO] Server closed');
        process.exit(0);
    });
});

// Process error handling
process.on('uncaughtException', (err) => {
    console.error('[ERROR] Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Optional: Keep alive heartbeat (reduced frequency)
setInterval(() => {
    const uptime = Math.floor(process.uptime());
    console.log('[HEARTBEAT] Server alive - PID: ' + process.pid + ' - Uptime: ' + uptime + 's');
}, 120000); // Every 2 minutes instead of 1