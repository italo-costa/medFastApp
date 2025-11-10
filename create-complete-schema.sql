-- MediApp Database Schema Completo

-- Limpar schema existente se necessário
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Create enums
CREATE TYPE "TipoUsuario" AS ENUM ('ADMIN', 'MEDICO', 'ENFERMEIRO');
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');
CREATE TYPE "EstadoCivil" AS ENUM ('SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'UNIAO_ESTAVEL');
CREATE TYPE "TipoConsulta" AS ENUM ('CONSULTA_ROTINA', 'CONSULTA_RETORNO', 'CONSULTA_URGENCIA', 'EXAME_PERIODICO', 'CONSULTA_PREVENTIVA', 'TELECONSULTA');
CREATE TYPE "StatusConsulta" AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'NAO_COMPARECEU');
CREATE TYPE "StatusAgendamento" AS ENUM ('AGENDADO', 'CONFIRMADO', 'REAGENDADO', 'CANCELADO', 'CONCLUIDO');
CREATE TYPE "GravidadeAlergia" AS ENUM ('LEVE', 'MODERADA', 'GRAVE', 'MUITO_GRAVE');
CREATE TYPE "StatusDoenca" AS ENUM ('ATIVA', 'CONTROLADA', 'CURADA', 'EM_TRATAMENTO');
CREATE TYPE "TipoArquivo" AS ENUM ('IMAGEM', 'PDF', 'AUDIO', 'VIDEO', 'DOCUMENTO');
CREATE TYPE "AcaoSync" AS ENUM ('CREATE', 'UPDATE', 'DELETE');
CREATE TYPE "TipoEstatistica" AS ENUM ('PACIENTES_CADASTRADOS', 'PRONTUARIOS_CRIADOS', 'EXAMES_REGISTRADOS', 'MEDICOS_ATIVOS', 'CONSULTAS_HOJE', 'AGENDAMENTOS_PENDENTES', 'ALERGIAS_REGISTRADAS', 'MEDICAMENTOS_PRESCRITOS');

-- Table: usuarios
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- Table: medicos
CREATE TABLE "medicos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "crm" TEXT NOT NULL,
    "crm_uf" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "telefone" TEXT,
    "celular" TEXT,
    "endereco" TEXT,
    "formacao" TEXT,
    "experiencia" TEXT,
    "horario_atendimento" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bairro" TEXT,
    "cep" TEXT,
    "cidade" TEXT,
    "complemento_endereco" TEXT,
    "cpf" TEXT,
    "data_nascimento" TIMESTAMP(3),
    "logradouro" TEXT,
    "numero_endereco" TEXT,
    "observacoes" TEXT,
    "outras_especialidades" TEXT,
    "sexo" "Sexo",
    "uf" TEXT,
    "foto_nome_original" TEXT,
    "foto_url" TEXT,
    CONSTRAINT "medicos_pkey" PRIMARY KEY ("id")
);

-- Table: enfermeiros
CREATE TABLE "enfermeiros" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "coren" TEXT NOT NULL,
    "coren_uf" TEXT NOT NULL,
    "telefone" TEXT,
    "celular" TEXT,
    "endereco" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "enfermeiros_pkey" PRIMARY KEY ("id")
);

-- Table: pacientes
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "data_nascimento" TIMESTAMP(3) NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "telefone" TEXT,
    "celular" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cep" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "profissao" TEXT,
    "estado_civil" "EstadoCivil",
    "nome_contato" TEXT,
    "telefone_contato" TEXT,
    "convenio" TEXT,
    "numero_convenio" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- Table: prontuarios
CREATE TABLE "prontuarios" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "medico_id" TEXT NOT NULL,
    "data_consulta" TIMESTAMP(3) NOT NULL,
    "tipo_consulta" "TipoConsulta" NOT NULL,
    "queixa_principal" TEXT,
    "historia_doenca_atual" TEXT,
    "exame_clinico" TEXT,
    "hipotese_diagnostica" TEXT,
    "conduta" TEXT,
    "cid" TEXT,
    "data_retorno" TIMESTAMP(3),
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prontuarios_pkey" PRIMARY KEY ("id")
);

-- Table: consultas
CREATE TABLE "consultas" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "medico_id" TEXT NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoConsulta" NOT NULL,
    "status" "StatusConsulta" NOT NULL,
    "observacoes" TEXT,
    "valor" DECIMAL(10,2),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- Table: exames
CREATE TABLE "exames" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "tipo_exame" TEXT NOT NULL,
    "nome_exame" TEXT NOT NULL,
    "data_realizacao" TIMESTAMP(3) NOT NULL,
    "resultado" TEXT,
    "observacoes" TEXT,
    "laboratorio" TEXT,
    "medico_solicitante" TEXT,
    "arquivo_url" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nome_arquivo_original" TEXT,
    "tamanho_arquivo" INTEGER,
    "tipo_arquivo" TEXT,
    CONSTRAINT "exames_pkey" PRIMARY KEY ("id")
);

-- Table: exames_solicitados
CREATE TABLE "exames_solicitados" (
    "id" TEXT NOT NULL,
    "prontuario_id" TEXT NOT NULL,
    "tipo_exame" TEXT NOT NULL,
    "nome_exame" TEXT NOT NULL,
    "observacoes" TEXT,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exames_solicitados_pkey" PRIMARY KEY ("id")
);

-- Table: alergias
CREATE TABLE "alergias" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "substancia" TEXT NOT NULL,
    "tipo_reacao" TEXT,
    "gravidade" "GravidadeAlergia" NOT NULL,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alergias_pkey" PRIMARY KEY ("id")
);

-- Table: medicamentos_uso
CREATE TABLE "medicamentos_uso" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "nome_medicamento" TEXT NOT NULL,
    "dosagem" TEXT NOT NULL,
    "frequencia" TEXT NOT NULL,
    "via_administracao" TEXT,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "medicamentos_uso_pkey" PRIMARY KEY ("id")
);

-- Table: doencas_preexistentes
CREATE TABLE "doencas_preexistentes" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "nome_doenca" TEXT NOT NULL,
    "cid" TEXT,
    "data_diagnostico" TIMESTAMP(3),
    "status" "StatusDoenca" NOT NULL,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doencas_preexistentes_pkey" PRIMARY KEY ("id")
);

-- Table: prescricoes
CREATE TABLE "prescricoes" (
    "id" TEXT NOT NULL,
    "prontuario_id" TEXT NOT NULL,
    "medico_id" TEXT NOT NULL,
    "medicamentos" JSONB NOT NULL,
    "observacoes" TEXT,
    "data_validade" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prescricoes_pkey" PRIMARY KEY ("id")
);

-- Table: sinais_vitais
CREATE TABLE "sinais_vitais" (
    "id" TEXT NOT NULL,
    "prontuario_id" TEXT NOT NULL,
    "pressao_arterial" TEXT,
    "frequencia_cardiaca" INTEGER,
    "temperatura" DECIMAL(4,1),
    "peso" DECIMAL(5,2),
    "altura" DECIMAL(3,2),
    "imc" DECIMAL(4,2),
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sinais_vitais_pkey" PRIMARY KEY ("id")
);

-- Table: agendamentos
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "medico_id" TEXT NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "duracao_minutos" INTEGER NOT NULL DEFAULT 30,
    "tipo_consulta" "TipoConsulta" NOT NULL,
    "status" "StatusAgendamento" NOT NULL,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- Table: atendimentos
CREATE TABLE "atendimentos" (
    "id" TEXT NOT NULL,
    "enfermeiro_id" TEXT NOT NULL,
    "paciente_nome" TEXT NOT NULL,
    "tipo_atendimento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "atendimentos_pkey" PRIMARY KEY ("id")
);

-- Table: arquivos
CREATE TABLE "arquivos" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "tipo_arquivo" "TipoArquivo" NOT NULL,
    "tamanho_bytes" INTEGER NOT NULL,
    "caminho" TEXT NOT NULL,
    "descricao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "arquivos_pkey" PRIMARY KEY ("id")
);

-- Table: sessoes
CREATE TABLE "sessoes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "data_expiracao" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "dispositivo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessoes_pkey" PRIMARY KEY ("id")
);

-- Table: logs_sistema
CREATE TABLE "logs_sistema" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "dispositivo" TEXT,
    "dados_extras" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "logs_sistema_pkey" PRIMARY KEY ("id")
);

-- Table: configuracoes
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- Table: sincronizacao_mobile
CREATE TABLE "sincronizacao_mobile" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tabela" TEXT NOT NULL,
    "registro_id" TEXT NOT NULL,
    "acao" "AcaoSync" NOT NULL,
    "dados" JSONB NOT NULL,
    "sincronizado" BOOLEAN NOT NULL DEFAULT false,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sincronizado_em" TIMESTAMP(3),
    CONSTRAINT "sincronizacao_mobile_pkey" PRIMARY KEY ("id")
);

-- Table: estatisticas_dashboard
CREATE TABLE "estatisticas_dashboard" (
    "id" TEXT NOT NULL,
    "tipo_estatistica" "TipoEstatistica" NOT NULL,
    "valor" TEXT NOT NULL,
    "valor_numerico" INTEGER,
    "label" TEXT NOT NULL,
    "trend" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "dados_reais" BOOLEAN NOT NULL DEFAULT false,
    "metadados" JSONB,
    "data_calculo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "estatisticas_dashboard_pkey" PRIMARY KEY ("id")
);

-- Table: historico_alteracoes
CREATE TABLE "historico_alteracoes" (
    "id" TEXT NOT NULL,
    "medico_id" TEXT NOT NULL,
    "usuario_alteracao_id" TEXT NOT NULL,
    "operacao" TEXT NOT NULL,
    "dados_anteriores" JSONB,
    "dados_novos" JSONB,
    "campos_alterados" JSONB,
    "observacoes" TEXT,
    "data_alteracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historico_alteracoes_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX "medicos_usuario_id_key" ON "medicos"("usuario_id");
CREATE UNIQUE INDEX "medicos_crm_key" ON "medicos"("crm");
CREATE UNIQUE INDEX "enfermeiros_usuario_id_key" ON "enfermeiros"("usuario_id");
CREATE UNIQUE INDEX "enfermeiros_coren_key" ON "enfermeiros"("coren");
CREATE UNIQUE INDEX "pacientes_cpf_key" ON "pacientes"("cpf");
CREATE UNIQUE INDEX "sessoes_token_key" ON "sessoes"("token");
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");

-- Create other indexes
CREATE INDEX "historico_alteracoes_medico_id_idx" ON "historico_alteracoes"("medico_id");
CREATE INDEX "historico_alteracoes_data_alteracao_idx" ON "historico_alteracoes"("data_alteracao");
CREATE INDEX "historico_alteracoes_operacao_idx" ON "historico_alteracoes"("operacao");

-- Add foreign key constraints
ALTER TABLE "medicos" ADD CONSTRAINT "medicos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enfermeiros" ADD CONSTRAINT "enfermeiros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prontuarios" ADD CONSTRAINT "prontuarios_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prontuarios" ADD CONSTRAINT "prontuarios_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exames" ADD CONSTRAINT "exames_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exames_solicitados" ADD CONSTRAINT "exames_solicitados_prontuario_id_fkey" FOREIGN KEY ("prontuario_id") REFERENCES "prontuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "alergias" ADD CONSTRAINT "alergias_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "medicamentos_uso" ADD CONSTRAINT "medicamentos_uso_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "doencas_preexistentes" ADD CONSTRAINT "doencas_preexistentes_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescricoes" ADD CONSTRAINT "prescricoes_prontuario_id_fkey" FOREIGN KEY ("prontuario_id") REFERENCES "prontuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescricoes" ADD CONSTRAINT "prescricoes_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sinais_vitais" ADD CONSTRAINT "sinais_vitais_prontuario_id_fkey" FOREIGN KEY ("prontuario_id") REFERENCES "prontuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_enfermeiro_id_fkey" FOREIGN KEY ("enfermeiro_id") REFERENCES "enfermeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "arquivos" ADD CONSTRAINT "arquivos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logs_sistema" ADD CONSTRAINT "logs_sistema_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "historico_alteracoes" ADD CONSTRAINT "historico_alteracoes_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "historico_alteracoes" ADD CONSTRAINT "historico_alteracoes_usuario_alteracao_id_fkey" FOREIGN KEY ("usuario_alteracao_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert test data
INSERT INTO "usuarios" ("id", "email", "senha", "nome", "tipo", "atualizado_em") VALUES
('admin-1', 'admin@mediapp.com', '$2b$10$wvvQ.ZJqV1uGlAIOjM3fAOgRw2ll0pQrYNcqYjWjZzKf/Qx7.1QQu', 'Administrador MediApp', 'ADMIN', CURRENT_TIMESTAMP),
('medico-1', 'medico@mediapp.com', '$2b$10$wvvQ.ZJqV1uGlAIOjM3fAOgRw2ll0pQrYNcqYjWjZzKf/Qx7.1QQu', 'Dr. João Silva', 'MEDICO', CURRENT_TIMESTAMP),
('medico-2', 'ana.costa@mediapp.com', '$2b$10$wvvQ.ZJqV1uGlAIOjM3fAOgRw2ll0pQrYNcqYjWjZzKf/Qx7.1QQu', 'Dra. Ana Costa', 'MEDICO', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "medicos" ("id", "usuario_id", "crm", "crm_uf", "especialidade", "atualizado_em", "telefone", "celular", "formacao", "experiencia") VALUES
('medico-1', 'medico-1', '12345', 'SP', 'Clínica Geral', CURRENT_TIMESTAMP, '(11) 3333-4444', '(11) 99999-8888', 'Universidade de São Paulo', '10 anos de experiência'),
('medico-2', 'medico-2', '67890', 'RJ', 'Cardiologia', CURRENT_TIMESTAMP, '(21) 2222-3333', '(21) 88888-7777', 'Universidade Federal do Rio de Janeiro', '15 anos de experiência')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "pacientes" ("id", "nome", "cpf", "data_nascimento", "sexo", "atualizado_em", "telefone", "email", "endereco", "cidade", "uf") VALUES
('paciente-1', 'Maria Santos Silva', '123.456.789-00', '1990-01-15', 'FEMININO', CURRENT_TIMESTAMP, '(11) 1111-2222', 'maria.santos@email.com', 'Rua das Flores, 123', 'São Paulo', 'SP'),
('paciente-2', 'José Carlos Oliveira', '987.654.321-00', '1985-05-20', 'MASCULINO', CURRENT_TIMESTAMP, '(11) 3333-4444', 'jose.carlos@email.com', 'Av. Paulista, 456', 'São Paulo', 'SP'),
('paciente-3', 'Ana Paula Costa', '456.789.123-00', '1992-08-10', 'FEMININO', CURRENT_TIMESTAMP, '(21) 5555-6666', 'ana.paula@email.com', 'Rua Copacabana, 789', 'Rio de Janeiro', 'RJ')
ON CONFLICT ("id") DO NOTHING;

-- Insert some statistics for dashboard
INSERT INTO "estatisticas_dashboard" ("id", "tipo_estatistica", "valor", "valor_numerico", "label", "trend", "icon", "color", "dados_reais") VALUES
('stat-1', 'PACIENTES_CADASTRADOS', '3', 3, 'Pacientes Cadastrados', '+12%', 'users', '#10B981', true),
('stat-2', 'MEDICOS_ATIVOS', '2', 2, 'Médicos Ativos', '+5%', 'user-md', '#3B82F6', true),
('stat-3', 'CONSULTAS_HOJE', '0', 0, 'Consultas Hoje', '0%', 'calendar', '#F59E0B', true),
('stat-4', 'AGENDAMENTOS_PENDENTES', '0', 0, 'Agendamentos Pendentes', '0%', 'clock', '#EF4444', true)
ON CONFLICT ("id") DO NOTHING;

GRANT USAGE ON SCHEMA public TO mediapp;
GRANT ALL ON ALL TABLES IN SCHEMA public TO mediapp;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO mediapp;