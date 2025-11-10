-- MediApp Database Schema Creation
-- PostgreSQL

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

-- Create tables
CREATE TABLE IF NOT EXISTS "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "medicos" (
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
    "atualizado_em" TIMESTAMP(3) NOT NULL,
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

CREATE TABLE IF NOT EXISTS "pacientes" (
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
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- Create simple test data
INSERT INTO "usuarios" ("id", "email", "senha", "nome", "tipo", "atualizado_em") VALUES
('admin-1', 'admin@mediapp.com', '$2b$10$example', 'Administrador', 'ADMIN', CURRENT_TIMESTAMP),
('medico-1', 'medico@mediapp.com', '$2b$10$example', 'Dr. João Silva', 'MEDICO', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "medicos" ("id", "usuario_id", "crm", "crm_uf", "especialidade", "atualizado_em") VALUES
('medico-1', 'medico-1', '12345', 'SP', 'Clínica Geral', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "pacientes" ("id", "nome", "cpf", "data_nascimento", "sexo", "atualizado_em") VALUES
('paciente-1', 'Maria Santos', '123.456.789-00', '1990-01-01', 'FEMININO', CURRENT_TIMESTAMP),
('paciente-2', 'José Silva', '987.654.321-00', '1985-05-15', 'MASCULINO', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "medicos_usuario_id_key" ON "medicos"("usuario_id");
CREATE UNIQUE INDEX IF NOT EXISTS "medicos_crm_key" ON "medicos"("crm");
CREATE UNIQUE INDEX IF NOT EXISTS "pacientes_cpf_key" ON "pacientes"("cpf");

-- Add foreign key constraints
ALTER TABLE "medicos" ADD CONSTRAINT "medicos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;