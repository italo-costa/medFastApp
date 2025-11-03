-- CreateEnum
CREATE TYPE "TipoEstatistica" AS ENUM ('PACIENTES_CADASTRADOS', 'PRONTUARIOS_CRIADOS', 'EXAMES_REGISTRADOS', 'MEDICOS_ATIVOS', 'CONSULTAS_HOJE', 'AGENDAMENTOS_PENDENTES', 'ALERGIAS_REGISTRADAS', 'MEDICAMENTOS_PRESCRITOS');

-- AlterTable
ALTER TABLE "exames" ADD COLUMN     "nome_arquivo_original" TEXT,
ADD COLUMN     "tamanho_arquivo" INTEGER,
ADD COLUMN     "tipo_arquivo" TEXT;

-- AlterTable
ALTER TABLE "medicos" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "complemento_endereco" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "data_nascimento" TIMESTAMP(3),
ADD COLUMN     "logradouro" TEXT,
ADD COLUMN     "numero_endereco" TEXT,
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "outras_especialidades" TEXT,
ADD COLUMN     "sexo" "Sexo",
ADD COLUMN     "uf" TEXT;

-- CreateTable
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
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estatisticas_dashboard_pkey" PRIMARY KEY ("id")
);
