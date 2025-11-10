-- Script para popular o banco com dados de teste - CORRIGIDO
-- MediApp - Dados de exemplo com estrutura correta

-- Inserir usuários
INSERT INTO usuarios (id, nome, email, senha, tipo, ativo, criado_em, atualizado_em) VALUES
('usr-001', 'Dr. João Silva', 'joao.silva@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'MEDICO', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-002', 'Dra. Maria Santos', 'maria.santos@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'MEDICO', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-003', 'Dr. Pedro Costa', 'pedro.costa@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'MEDICO', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-004', 'Admin Sistema', 'admin@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-005', 'Dra. Ana Oliveira', 'ana.oliveira@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'MEDICO', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-006', 'Dr. Carlos Lima', 'carlos.lima@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'MEDICO', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-007', 'Dra. Lucia Rocha', 'lucia.rocha@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'MEDICO', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-008', 'Dr. Roberto Dias', 'roberto.dias@mediapp.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'MEDICO', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Inserir médicos
INSERT INTO medicos (id, usuario_id, crm, crm_uf, especialidade, telefone, celular, criado_em, atualizado_em) VALUES
('med-001', 'usr-001', '12345', 'SP', 'Cardiologia', '(11) 3333-1111', '(11) 99999-1111', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('med-002', 'usr-002', '23456', 'RJ', 'Dermatologia', '(21) 3333-2222', '(21) 99999-2222', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('med-003', 'usr-003', '34567', 'MG', 'Neurologia', '(31) 3333-3333', '(31) 99999-3333', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('med-004', 'usr-005', '45678', 'SP', 'Pediatria', '(11) 3333-4444', '(11) 99999-4444', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('med-005', 'usr-006', '56789', 'RJ', 'Ortopedia', '(21) 3333-5555', '(21) 99999-5555', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('med-006', 'usr-007', '67890', 'SP', 'Ginecologia', '(11) 3333-6666', '(11) 99999-6666', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('med-007', 'usr-008', '78901', 'PR', 'Urologia', '(41) 3333-7777', '(41) 99999-7777', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);