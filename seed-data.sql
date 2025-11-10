-- Script para popular o banco com dados de teste
-- MediApp - Dados de exemplo

-- Inserir usuários
INSERT INTO usuarios (id, nome, email, senha, tipo, ativo, created_at, updated_at) VALUES
('usr-001', 'Dr. João Silva', 'joao.silva@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'medico', true, NOW(), NOW()),
('usr-002', 'Dra. Maria Santos', 'maria.santos@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'medico', true, NOW(), NOW()),
('usr-003', 'Dr. Pedro Costa', 'pedro.costa@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'medico', true, NOW(), NOW()),
('usr-004', 'Admin Sistema', 'admin@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'admin', true, NOW(), NOW());

-- Inserir médicos
INSERT INTO medicos (id, nome_completo, crm, crm_uf, especialidade, email, telefone, ativo, usuario_id, created_at, updated_at) VALUES
('med-001', 'Dr. João Silva', '12345', 'SP', 'Cardiologia', 'joao.silva@mediapp.com', '(11) 99999-1111', true, 'usr-001', NOW(), NOW()),
('med-002', 'Dra. Maria Santos', '23456', 'RJ', 'Dermatologia', 'maria.santos@mediapp.com', '(21) 99999-2222', true, 'usr-002', NOW(), NOW()),
('med-003', 'Dr. Pedro Costa', '34567', 'MG', 'Neurologia', 'pedro.costa@mediapp.com', '(31) 99999-3333', true, 'usr-003', NOW(), NOW()),
('med-004', 'Dra. Ana Oliveira', '45678', 'SP', 'Pediatria', 'ana.oliveira@mediapp.com', '(11) 99999-4444', true, NULL, NOW(), NOW()),
('med-005', 'Dr. Carlos Lima', '56789', 'RJ', 'Ortopedia', 'carlos.lima@mediapp.com', '(21) 99999-5555', true, NULL, NOW(), NOW()),
('med-006', 'Dra. Lucia Rocha', '67890', 'SP', 'Ginecologia', 'lucia.rocha@mediapp.com', '(11) 99999-6666', true, NULL, NOW(), NOW()),
('med-007', 'Dr. Roberto Dias', '78901', 'PR', 'Urologia', 'roberto.dias@mediapp.com', '(41) 99999-7777', true, NULL, NOW(), NOW()),
('med-008', 'Dra. Fernanda Cruz', '89012', 'RS', 'Oftalmologia', 'fernanda.cruz@mediapp.com', '(51) 99999-8888', true, NULL, NOW(), NOW());

-- Inserir pacientes
INSERT INTO pacientes (id, nome_completo, cpf, rg, data_nascimento, sexo, email, telefone, endereco, cidade, uf, cep, ativo, created_at, updated_at) VALUES
('pac-001', 'Ana Maria Silva', '12345678901', '123456789', '1985-03-15', 'F', 'ana.maria@email.com', '(11) 88888-1111', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', true, NOW(), NOW()),
('pac-002', 'Carlos Eduardo Santos', '23456789012', '234567890', '1978-07-22', 'M', 'carlos.eduardo@email.com', '(21) 88888-2222', 'Av. Copacabana, 456', 'Rio de Janeiro', 'RJ', '22071-900', true, NOW(), NOW()),
('pac-003', 'Mariana Costa Lima', '34567890123', '345678901', '1992-12-05', 'F', 'mariana.costa@email.com', '(31) 88888-3333', 'Rua Bahia, 789', 'Belo Horizonte', 'MG', '30112-000', true, NOW(), NOW()),
('pac-004', 'José Roberto Oliveira', '45678901234', '456789012', '1965-09-10', 'M', 'jose.roberto@email.com', '(11) 88888-4444', 'Rua Augusta, 321', 'São Paulo', 'SP', '01305-100', true, NOW(), NOW()),
('pac-005', 'Lucia Helena Ferreira', '56789012345', '567890123', '1988-01-30', 'F', 'lucia.helena@email.com', '(21) 88888-5555', 'Rua Ipanema, 654', 'Rio de Janeiro', 'RJ', '22421-030', true, NOW(), NOW()),
('pac-006', 'Ricardo Almeida', '67890123456', '678901234', '1975-11-18', 'M', 'ricardo.almeida@email.com', '(41) 88888-6666', 'Av. Paraná, 987', 'Curitiba', 'PR', '80020-300', true, NOW(), NOW());

-- Inserir consultas
INSERT INTO consultas (id, medico_id, paciente_id, data_consulta, status, observacoes, created_at, updated_at) VALUES
('con-001', 'med-001', 'pac-001', '2024-11-15 10:00:00', 'agendada', 'Consulta cardiológica de rotina', NOW(), NOW()),
('con-002', 'med-002', 'pac-002', '2024-11-16 14:00:00', 'agendada', 'Avaliação dermatológica', NOW(), NOW()),
('con-003', 'med-003', 'pac-003', '2024-11-17 09:00:00', 'agendada', 'Consulta neurológica', NOW(), NOW()),
('con-004', 'med-001', 'pac-004', '2024-11-12 15:30:00', 'realizada', 'Consulta realizada com sucesso', NOW(), NOW()),
('con-005', 'med-004', 'pac-005', '2024-11-18 11:00:00', 'agendada', 'Consulta pediátrica', NOW(), NOW());

-- Inserir exames
INSERT INTO exames (id, paciente_id, medico_id, tipo_exame, data_exame, resultado, observacoes, created_at, updated_at) VALUES
('exa-001', 'pac-001', 'med-001', 'Eletrocardiograma', '2024-11-10', 'Normal', 'ECG sem alterações', NOW(), NOW()),
('exa-002', 'pac-002', 'med-002', 'Biópsia de pele', '2024-11-08', 'Benigno', 'Lesão benigna confirmada', NOW(), NOW()),
('exa-003', 'pac-003', 'med-003', 'Ressonância Magnética', '2024-11-05', 'Aguardando', 'Exame agendado para esta semana', NOW(), NOW()),
('exa-004', 'pac-004', 'med-001', 'Holter 24h', '2024-11-01', 'Normal', 'Ritmo cardíaco normal', NOW(), NOW());