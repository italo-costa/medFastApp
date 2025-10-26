-- Script para atualizar tabela de exames com novos campos
-- Execute este script no PostgreSQL se necessário

ALTER TABLE exames 
ADD COLUMN IF NOT EXISTS nome_arquivo_original VARCHAR(255),
ADD COLUMN IF NOT EXISTS tamanho_arquivo INTEGER,
ADD COLUMN IF NOT EXISTS tipo_arquivo VARCHAR(100);

-- Comentários dos campos
COMMENT ON COLUMN exames.nome_arquivo_original IS 'Nome original do arquivo enviado';
COMMENT ON COLUMN exames.tamanho_arquivo IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN exames.tipo_arquivo IS 'MIME type do arquivo (image/jpeg, application/pdf, etc.)';

-- Inserir alguns dados de exemplo para testes
INSERT INTO exames (
    id, 
    paciente_id, 
    tipo_exame, 
    nome_exame, 
    data_realizacao, 
    laboratorio, 
    medico_solicitante,
    resultado,
    observacoes,
    criado_em,
    atualizado_em
) VALUES 
-- Usar IDs de pacientes existentes - ajuste conforme necessário
(
    gen_random_uuid(),
    (SELECT id FROM pacientes LIMIT 1),
    'Raio-X',
    'Raio-X de Tórax AP e Perfil',
    '2025-10-20',
    'Laboratório São Paulo',
    'Dr. João Silva',
    'Campos pulmonares livres. Coração com área cardíaca normal. Sem alterações ósseas significativas.',
    'Exame realizado em condições técnicas adequadas.',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM pacientes LIMIT 1 OFFSET 1),
    'Exame de Sangue',
    'Hemograma Completo',
    '2025-10-22',
    'Laboratório Central',
    'Dra. Maria Santos',
    'Hemoglobina: 14,2 g/dL, Leucócitos: 7.500/mm³, Plaquetas: 280.000/mm³. Valores dentro da normalidade.',
    'Jejum de 12 horas respeitado.',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM pacientes LIMIT 1 OFFSET 2),
    'Ultrassom',
    'Ultrassom Abdominal Total',
    '2025-10-25',
    'Clínica Imagem e Vida',
    'Dr. Pedro Costa',
    'Fígado com ecotextura normal. Vesícula biliar sem alterações. Demais órgãos sem particularidades.',
    'Exame realizado com preparo adequado.',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;