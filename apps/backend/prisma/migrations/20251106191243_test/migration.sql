-- CreateTable
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

-- CreateIndex
CREATE INDEX "historico_alteracoes_medico_id_idx" ON "historico_alteracoes"("medico_id");

-- CreateIndex
CREATE INDEX "historico_alteracoes_data_alteracao_idx" ON "historico_alteracoes"("data_alteracao");

-- CreateIndex
CREATE INDEX "historico_alteracoes_operacao_idx" ON "historico_alteracoes"("operacao");

-- AddForeignKey
ALTER TABLE "historico_alteracoes" ADD CONSTRAINT "historico_alteracoes_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_alteracoes" ADD CONSTRAINT "historico_alteracoes_usuario_alteracao_id_fkey" FOREIGN KEY ("usuario_alteracao_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
