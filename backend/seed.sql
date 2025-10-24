-- Script para inserir dados de exemplo no banco MedFast
-- Execute via: psql postgresql://postgres:postgres@localhost:5432/medifast_db -f seed.sql

-- Inserir pacientes de exemplo
INSERT INTO pacientes (
    id, nome, cpf, data_nascimento, sexo, telefone, email, 
    endereco, cep, cidade, uf, convenio, numero_convenio, 
    observacoes, ativo, criado_em, atualizado_em
) VALUES 
(
    'pat_001',
    'João Silva Santos',
    '12345678901',
    '1985-05-15',
    'MASCULINO',
    '11999991234',
    'joao.silva@email.com',
    'Av. Paulista, 1000, Apto 101',
    '01310100',
    'São Paulo',
    'SP',
    'Unimed',
    '123456789',
    'Paciente com histórico de hipertensão',
    true,
    '2024-01-15 10:30:00',
    '2024-01-15 10:30:00'
),
(
    'pat_002', 
    'Maria Fernanda Oliveira',
    '98765432109',
    '1992-08-22',
    'FEMININO',
    '11888885678',
    'maria.oliveira@email.com',
    'Rua das Flores, 250',
    '04567890',
    'São Paulo',
    'SP',
    NULL,
    NULL,
    'Paciente diabética tipo 2',
    true,
    '2024-02-10 09:15:00',
    '2024-02-10 09:15:00'
),
(
    'pat_003',
    'Carlos Eduardo Mendes', 
    '45678912345',
    '1978-12-03',
    'MASCULINO',
    '11777779012',
    'carlos.mendes@email.com',
    'Av. Brigadeiro Faria Lima, 1500, Sala 301',
    '02345678',
    'São Paulo',
    'SP',
    'Bradesco Saúde',
    '987654321',
    'Paciente com histórico de cirurgia cardíaca',
    true,
    '2024-03-05 16:20:00',
    '2024-03-05 16:20:00'
),
(
    'pat_004',
    'Ana Beatriz Costa',
    '11122233344',
    '1990-07-18',
    'FEMININO',
    '11966667777',
    'ana.costa@email.com',
    'Rua Augusta, 500',
    '01310200',
    'São Paulo',
    'SP',
    'SulAmérica',
    '555666777',
    'Paciente gestante - 2º trimestre',
    true,
    '2024-04-12 14:45:00',
    '2024-04-12 14:45:00'
),
(
    'pat_005',
    'Roberto Lima Santos',
    '55566677788',
    '1965-11-25',
    'MASCULINO',
    '11955554444',
    'roberto.lima@email.com',
    'Rua da Consolação, 800',
    '01302000',
    'São Paulo',
    'SP',
    NULL,
    NULL,
    'Paciente idoso com acompanhamento cardiológico',
    true,
    '2024-05-20 11:30:00',
    '2024-05-20 11:30:00'
);

-- Inserir alergias de exemplo
INSERT INTO alergias (
    id, paciente_id, substancia, tipo_reacao, gravidade,
    observacoes, criado_em, atualizado_em
) VALUES
(
    'alg_001', 'pat_002', 'Penicilina', 'Erupção cutânea', 'MODERADA',
    'Reação alérgica descoberta em 2020', NOW(), NOW()
),
(
    'alg_002', 'pat_003', 'Dipirona', 'Choque anafilático', 'GRAVE',
    'Histórico de reação grave - evitar administração', NOW(), NOW()
),
(
    'alg_003', 'pat_004', 'Látex', 'Dermatite de contato', 'LEVE',
    'Descoberto durante consulta pré-natal', NOW(), NOW()
);

-- Inserir consultas de exemplo (precisa de médicos primeiro)
-- Vamos criar um médico de exemplo primeiro
INSERT INTO usuarios (
    id, email, senha, nome, tipo, ativo, criado_em, atualizado_em
) VALUES (
    'usr_001', 
    'dr.silva@medfast.com',
    '$2b$12$LQv3c1yqBwrf3CdkZtgCz.QP6KqC6FKrfkG2VGo8wA1j3h.N0nL3e', -- senha: 123456
    'Dr. João Silva',
    'MEDICO',
    true,
    NOW(),
    NOW()
);

INSERT INTO medicos (
    id, usuario_id, crm, crm_uf, especialidade,
    telefone, formacao, criado_em, atualizado_em
) VALUES (
    'med_001',
    'usr_001',
    '123456',
    'SP',
    'Clínica Médica',
    '11999887766',
    'Faculdade de Medicina USP',
    NOW(),
    NOW()
);

-- Inserir consultas
INSERT INTO consultas (
    id, paciente_id, medico_id, data_hora, tipo, status,
    observacoes, criado_em, atualizado_em
) VALUES
(
    'con_001', 'pat_001', 'med_001', '2024-10-20 14:30:00',
    'CONSULTA_ROTINA', 'CONCLUIDA',
    'Consulta de rotina - pressão controlada', NOW(), NOW()
),
(
    'con_002', 'pat_002', 'med_001', '2024-10-18 11:00:00',
    'CONSULTA_RETORNO', 'CONCLUIDA', 
    'Acompanhamento diabetes - glicemia estável', NOW(), NOW()
),
(
    'con_003', 'pat_004', 'med_001', '2024-10-22 09:15:00',
    'CONSULTA_PREVENTIVA', 'CONCLUIDA',
    'Consulta pré-natal - 20 semanas', NOW(), NOW()
);

-- Inserir arquivos de exemplo (fotos)
INSERT INTO arquivos (
    id, paciente_id, nome_original, nome_arquivo, tipo_arquivo,
    tamanho_bytes, caminho, descricao, criado_em
) VALUES
(
    'arq_001', 'pat_001', 'foto_joao.jpg', 'foto_pat_001_001.jpg',
    'IMAGEM', 15420,
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SlM8L3RleHQ+PC9zdmc+',
    'Foto do paciente João Silva',
    NOW()
),
(
    'arq_002', 'pat_002', 'foto_maria.jpg', 'foto_pat_002_001.jpg',
    'IMAGEM', 18650,
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI2VjNDg5OSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TUY8L3RleHQ+PC9zdmc+',
    'Foto da paciente Maria Fernanda',
    NOW()
);

-- Inserir exames de exemplo
INSERT INTO exames (
    id, paciente_id, tipo_exame, nome_exame, data_realizacao,
    resultado, laboratorio, criado_em, atualizado_em
) VALUES
(
    'ex_001', 'pat_001', 'Laboratório', 'Hemograma Completo',
    '2024-10-15 08:00:00', 'Valores dentro da normalidade',
    'Lab Fleury', NOW(), NOW()
),
(
    'ex_002', 'pat_002', 'Laboratório', 'Glicemia de Jejum',
    '2024-10-10 07:30:00', 'Glicose: 95 mg/dL (Normal)',
    'Lab Delboni', NOW(), NOW()
),
(
    'ex_003', 'pat_004', 'Ultrassom', 'Ultrassom Obstétrico',
    '2024-10-18 15:00:00', 'Feto com desenvolvimento normal',
    'Clínica Santa Helena', NOW(), NOW()
);

COMMIT;