const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');

console.log(`[${new Date().toISOString()}] 🚀 Iniciando MediApp Server...`);
console.log(`[${new Date().toISOString()}] 📁 Public dir: ${PUBLIC_DIR}`);

// MIME types
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

// Mock data
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
            endereco: 'Rua Augusta, 1245 - Consolação, São Paulo - SP',
            formacao: 'USP - Faculdade de Medicina (2005), Residência em Cardiologia - InCor (2008)',
            experiencia: '17 anos',
            atendimento: 'Segunda a Sexta: 8h às 18h'
        },
        {
            id: 2,
            nome: 'Dra. Ana Beatriz Costa Santos',
            crm: '789012-SP',
            especialidade: 'Pediatria',
            telefone: '(11) 3987-6543',
            email: 'ana.costa@clinica.com.br',
            celular: '(11) 98765-4321',
            endereco: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
            formacao: 'UNIFESP - Medicina (2008), Residência em Pediatria - Hospital São Paulo (2011)',
            experiencia: '14 anos',
            atendimento: 'Segunda a Quinta: 7h às 17h, Sexta: 7h às 12h'
        },
        {
            id: 3,
            nome: 'Dr. Roberto Mendes Silva',
            crm: '345678-SP',
            especialidade: 'Ortopedia',
            telefone: '(11) 3321-9876',
            email: 'roberto.mendes@ortoclinica.com.br',
            celular: '(11) 97654-3210',
            endereco: 'Rua Oscar Freire, 987 - Jardins, São Paulo - SP',
            formacao: 'PUC-SP - Medicina (2003), Residência em Ortopedia - HC-FMUSP (2007)',
            experiencia: '20 anos',
            atendimento: 'Terça e Quinta: 14h às 19h, Sábado: 8h às 12h'
        },
        {
            id: 4,
            nome: 'Dra. Fernanda Lima Rodrigues',
            crm: '901234-SP',
            especialidade: 'Ginecologia e Obstetrícia',
            telefone: '(11) 3654-7890',
            email: 'fernanda.lima@gineco.com.br',
            celular: '(11) 96543-2109',
            endereco: 'Rua Haddock Lobo, 456 - Cerqueira César, São Paulo - SP',
            formacao: 'Santa Casa - Medicina (2006), Residência em GO - Hospital das Clínicas (2010)',
            experiencia: '15 anos',
            atendimento: 'Segunda, Quarta e Sexta: 9h às 18h'
        },
        {
            id: 5,
            nome: 'Dr. Paulo César Almeida',
            crm: '567890-SP',
            especialidade: 'Neurologia',
            telefone: '(11) 3789-0123',
            email: 'paulo.almeida@neuro.com.br',
            celular: '(11) 95432-1098',
            endereco: 'Av. Brigadeiro Faria Lima, 2034 - Jardim Paulistano, São Paulo - SP',
            formacao: 'USP - Medicina (2001), Residência em Neurologia - HC-FMUSP (2005)',
            experiencia: '22 anos',
            atendimento: 'Segunda a Quarta: 8h às 17h, Quinta: 13h às 19h'
        }
    ],
    pacientes: [
        {
            id: 1,
            nome: 'João Silva Santos',
            idade: 45,
            dataNascimento: '1979-03-15',
            cpf: '123.456.789-01',
            rg: '12.345.678-9',
            telefone: '(11) 98765-4321',
            celular: '(11) 97654-3210',
            email: 'joao.silva@email.com',
            endereco: 'Rua das Flores, 123 - Vila Madalena, São Paulo - SP, CEP: 05435-020',
            profissao: 'Engenheiro Civil',
            estadoCivil: 'Casado',
            nomeContato: 'Maria Silva Santos (esposa)',
            telefoneContato: '(11) 96543-2109',
            convenio: 'Unimed Premium',
            numeroConvenio: '123456789012',
            alergias: 'Dipirona, Penicilina',
            medicamentosUso: 'Losartana 50mg (1x ao dia), Sinvastatina 20mg (1x ao dia)',
            doencasPreexistentes: 'Hipertensão arterial, Dislipidemia',
            observacoes: 'Paciente colaborativo, histórico familiar de problemas cardíacos'
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
            endereco: 'Av. São João, 456 - Centro, São Paulo - SP, CEP: 01035-000',
            profissao: 'Professora',
            estadoCivil: 'Solteira',
            nomeContato: 'José Santos (pai)',
            telefoneContato: '(11) 85432-1098',
            convenio: 'Bradesco Saúde',
            numeroConvenio: '987654321098',
            alergias: 'Não possui',
            medicamentosUso: 'Anticoncepcional Yasmin (uso contínuo)',
            doencasPreexistentes: 'Não possui',
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
            endereco: 'Rua Consolação, 789 - Consolação, São Paulo - SP, CEP: 01302-100',
            profissao: 'Contador',
            estadoCivil: 'Divorciado',
            nomeContato: 'Ana Mendes (filha)',
            telefoneContato: '(11) 74321-0987',
            convenio: 'SulAmérica',
            numeroConvenio: '456789123456',
            alergias: 'Ácido acetilsalicílico (AAS)',
            medicamentosUso: 'Metformina 850mg (2x ao dia), Atenolol 50mg (1x ao dia)',
            doencasPreexistentes: 'Diabetes tipo 2, Hipertensão arterial',
            observacoes: 'Paciente com boa aderência ao tratamento, trabalha sentado'
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
            endereco: 'Rua Augusta, 2134 - Jardins, São Paulo - SP, CEP: 01412-100',
            profissao: 'Designer UX/UI',
            estadoCivil: 'Solteira',
            nomeContato: 'Beatriz Lima (mãe)',
            telefoneContato: '(11) 63210-9876',
            convenio: 'Particular',
            numeroConvenio: 'N/A',
            alergias: 'Látex, Frutos do mar',
            medicamentosUso: 'Não faz uso regular',
            doencasPreexistentes: 'Não possui',
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
            endereco: 'Rua Pamplona, 567 - Jardim Paulista, São Paulo - SP, CEP: 01405-001',
            profissao: 'Aposentado (ex-bancário)',
            estadoCivil: 'Viúvo',
            nomeContato: 'Marcos Oliveira (filho)',
            telefoneContato: '(11) 52109-8765',
            convenio: 'Golden Cross',
            numeroConvenio: '321654987321',
            alergias: 'Sulfa, Iodo',
            medicamentosUso: 'Varfarina 5mg (1x ao dia), Digoxina 0,25mg (1x ao dia), Furosemida 40mg (1x ao dia)',
            doencasPreexistentes: 'Fibrilação atrial, Insuficiência cardíaca compensada, Artrose',
            observacoes: 'Paciente idoso, necessita acompanhamento cardiológico regular'
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
            endereco: 'Av. Faria Lima, 1478 - Itaim Bibi, São Paulo - SP, CEP: 04567-890',
            profissao: 'Advogada',
            estadoCivil: 'Casada',
            nomeContato: 'Fernando Almeida (esposo)',
            telefoneContato: '(11) 41098-7654',
            convenio: 'Amil',
            numeroConvenio: '654321098654',
            alergias: 'Não possui',
            medicamentosUso: 'Ácido fólico 5mg (gestante)',
            doencasPreexistentes: 'Não possui',
            observacoes: 'Gestante - 20 semanas, primeira gestação'
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
            queixaPrincipal: 'Dor no peito e falta de ar aos esforços',
            historiaDoencaAtual: 'Paciente relata episódios de dor precordial há 2 semanas, principalmente aos esforços físicos, acompanhada de dispneia. Nega palpitações ou síncope.',
            exameClinico: 'PA: 150/95 mmHg, FC: 78 bpm, FR: 16 irpm, Tax: 36.5°C. Ausculta cardíaca: B1 e B2 hipofonéticas, sem sopros. Ausculta pulmonar: MV presente bilateralmente.',
            hipoteseDiagnostica: 'Angina pectoris estável, Hipertensão arterial descompensada',
            conduta: 'Solicitado ECG, Ecocardiograma e Teste ergométrico. Ajustado anti-hipertensivo. Orientações sobre estilo de vida.',
            medicamentos: 'Losartana 100mg 1x ao dia, Sinvastatina 40mg 1x ao dia, AAS 100mg 1x ao dia',
            retorno: '2024-10-15',
            observacoes: 'Paciente orientado sobre sinais de alerta. Familiares cientes do quadro.',
            cid: 'I20.9 - Angina pectoris não especificada',
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
            queixaPrincipal: 'Check-up anual e orientações sobre planejamento familiar',
            historiaDoencaAtual: 'Paciente assintomática, busca consulta para avaliação preventiva. Ciclos menstruais regulares, sem queixas ginecológicas.',
            exameClinico: 'Bom estado geral, corada, hidratada. PA: 110/70 mmHg, FC: 72 bpm, IMC: 22,3 kg/m². Exame físico sem alterações.',
            hipoteseDiagnostica: 'Mulher jovem hígida para acompanhamento preventivo',
            conduta: 'Solicitado hemograma, glicemia, colesterol, TSH, papanicolau e USG pélvico. Orientações sobre anticoncepção.',
            medicamentos: 'Manter anticoncepcional em uso. Suplementação com ácido fólico se planejar gestação.',
            retorno: '2025-01-19',
            observacoes: 'Paciente interessada em engravidar no próximo ano. Orientada sobre cuidados pré-concepcionais.',
            cid: 'Z00.0 - Exame médico geral',
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
            queixaPrincipal: 'Acompanhamento do diabetes e hipertensão',
            historiaDoencaAtual: 'Paciente diabético há 8 anos, em tratamento regular. Glicemias de jejum entre 120-140 mg/dL. HbA1c último: 7,2%. Nega sintomas de hipo ou hiperglicemia.',
            exameClinico: 'Regular estado geral, PA: 130/85 mmHg, FC: 68 bpm, Peso: 78kg (perdeu 2kg). Exame dos pés: sem lesões, pulsos presentes.',
            hipoteseDiagnostica: 'Diabetes mellitus tipo 2 com controle adequado, Hipertensão arterial controlada',
            conduta: 'Manter medicações atuais. Solicitado HbA1c, microalbuminúria e fundo de olho. Reforçar dieta e exercícios.',
            medicamentos: 'Metformina 850mg 12/12h, Atenolol 50mg 1x ao dia',
            retorno: '2024-12-18',
            observacoes: 'Paciente aderente ao tratamento. Família colaborativa. Perdeu peso com reeducação alimentar.',
            cid: 'E11.9 - Diabetes mellitus tipo 2 sem complicações',
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
            historiaDoencaAtual: 'Dor em região cervical há 3 meses, irradiando para ombros, relacionada ao trabalho prolongado no computador. Piora no final do dia, melhora com repouso.',
            exameClinico: 'Tensão muscular em trapézio bilateral, amplitude de movimento cervical limitada por dor. Teste de Spurling negativo. Força muscular preservada em MMSS.',
            hipoteseDiagnostica: 'Cervicalgia tensional, Síndrome do pescoço rígido',
            conduta: 'Prescrição de relaxante muscular e anti-inflamatório. Orientações ergonômicas. Fisioterapia. Raio-X cervical se não melhorar.',
            medicamentos: 'Ciclobenzaprina 10mg 1x ao dia, Nimesulida 100mg 12/12h por 7 dias',
            retorno: '2024-10-07',
            observacoes: 'Orientada sobre pausas no trabalho e exercícios de alongamento. Avaliar mesa de trabalho.',
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
            tipo: 'Pré-natal - 20 semanas',
            queixaPrincipal: 'Acompanhamento pré-natal de rotina',
            historiaDoencaAtual: 'Gestante de 20 semanas, primeira gestação. Nega sangramento, dor abdominal ou contrações. Movimentação fetal presente.',
            exameClinico: 'Bom estado geral. PA: 110/70 mmHg, Peso: +3kg desde última consulta. AU: 18cm. BCF: 144 bpm. Edema discreto em MMII.',
            hipoteseDiagnostica: 'Gestação única tópica de 20 semanas, sem intercorrências',
            conduta: 'USG morfológico realizado - normal. Solicitar glicemia e hemograma. Manter suplementação. Orientações sobre movimentação fetal.',
            medicamentos: 'Ácido fólico 5mg 1x ao dia, Sulfato ferroso 300mg 1x ao dia',
            retorno: '2024-10-14',
            observacoes: 'Casal ansioso mas bem orientado. USG mostrou sexo feminino. Sem fatores de risco identificados.',
            cid: 'Z34.0 - Supervisão de gravidez normal, primeiro trimestre',
            medicoNome: 'Dra. Fernanda Lima Rodrigues',
            medicoCrm: '901234-SP'
        },
        {
            id: 6,
            paciente_id: 5,
            medico_id: 5,
            data: '2024-09-15',
            hora: '11:30',
            tipo: 'Acompanhamento Neurológico',
            queixaPrincipal: 'Seguimento de quadro demencial',
            historiaDoencaAtual: 'Paciente com diagnóstico de demência mista há 2 anos. Família relata piora da memória recente e desorientação temporal. Mantém autonomia parcial.',
            exameClinico: 'Orientado auto e alopsiquicamente com dificuldade. MEEM: 18/30. Marcha lenta mas independente. Sem sinais focais neurológicos.',
            hipoteseDiagnostica: 'Demência mista em progressão',
            conduta: 'Ajuste de medicação antidemencial. Orientações à família sobre cuidados. Solicitado acompanhamento psicológico.',
            medicamentos: 'Donepezila 10mg 1x ao dia, Memantina 20mg 1x ao dia',
            retorno: '2024-12-15',
            observacoes: 'Filho muito presente nos cuidados. Discussão sobre cuidadores. Família bem orientada sobre evolução da doença.',
            cid: 'F03 - Demência não especificada',
            medicoNome: 'Dr. Paulo César Almeida',
            medicoCrm: '567890-SP'
        },
        {
            id: 7,
            paciente_id: 1,
            medico_id: 1,
            data: '2024-08-15',
            hora: '14:00',
            tipo: 'Retorno Cardiológico',
            queixaPrincipal: 'Resultado de exames cardiológicos',
            historiaDoencaAtual: 'Retorno para avaliação de ECG e ecocardiograma solicitados em consulta anterior. Paciente refere melhora da dor precordial após início da medicação.',
            exameClinico: 'PA: 135/85 mmHg, FC: 70 bpm. Paciente com melhor aspecto geral. Nega dor precordial em repouso.',
            hipoteseDiagnostica: 'Doença arterial coronariana estável, Hipertensão arterial em controle',
            conduta: 'ECG: alterações discretas de repolarização. Eco: função ventricular preservada. Manter medicações. Liberado para atividade física leve.',
            medicamentos: 'Manter esquema atual: Losartana 100mg, Sinvastatina 40mg, AAS 100mg',
            retorno: '2024-11-15',
            observacoes: 'Paciente apresentou boa resposta ao tratamento inicial. Orientado sobre importância da aderência medicamentosa.',
            cid: 'I25.9 - Doença isquêmica crônica do coração não especificada',
            medicoNome: 'Dr. Carlos Eduardo Oliveira',
            medicoCrm: '123456-SP'
        }
    ]
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API routes
    if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            status: 'OK',
            timestamp: new Date().toISOString(),
            server: 'MediApp HTTP Server',
            frontend: 'Completo',
            pid: process.pid
        }, null, 2));
        return;
    }
    
    if (pathname === '/api/pacientes') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            success: true,
            data: mockData.pacientes,
            timestamp: new Date().toISOString()
        }, null, 2));
        return;
    }
    
    if (pathname === '/api/medicos') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            success: true,
            data: mockData.medicos,
            timestamp: new Date().toISOString()
        }, null, 2));
        return;
    }
    
    if (pathname === '/api/prontuarios') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            success: true,
            data: mockData.prontuarios,
            timestamp: new Date().toISOString()
        }, null, 2));
        return;
    }
    
    // Static files
    let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'app.html') : path.join(PUBLIC_DIR, pathname);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // For SPA, serve app.html for non-API routes
                if (!pathname.startsWith('/api/')) {
                    const appPath = path.join(PUBLIC_DIR, 'app.html');
                    fs.readFile(appPath, (err, data) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            res.end('404 - Page not found');
                            return;
                        }
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(data);
                    });
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'API endpoint not found' }));
                }
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 - Internal Server Error');
            }
            return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] 🚀 =========================================`);
    console.log(`[${new Date().toISOString()}] 🏥 MediApp HTTP Server - Porta ${PORT}`);
    console.log(`[${new Date().toISOString()}] 🎨 Frontend: app.html completo`);
    console.log(`[${new Date().toISOString()}] 📁 Static: ${PUBLIC_DIR}`);
    console.log(`[${new Date().toISOString()}] 🌐 URL: http://localhost:${PORT}`);
    console.log(`[${new Date().toISOString()}] 🔧 Health: http://localhost:${PORT}/health`);
    console.log(`[${new Date().toISOString()}] 🚀 =========================================`);
    console.log(`[${new Date().toISOString()}] ✅ SERVIDOR ESTÁVEL - FRONTEND RESTAURADO!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log(`[${new Date().toISOString()}] 🛑 SIGTERM - Encerrando servidor...`);
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    console.log(`[${new Date().toISOString()}] 🛑 SIGINT - Encerrando servidor...`);
    server.close(() => process.exit(0));
});

// Keep alive
setInterval(() => {
    console.log(`[${new Date().toISOString()}] 💓 Server alive - PID: ${process.pid} - Uptime: ${Math.floor(process.uptime())}s`);
}, 60000);