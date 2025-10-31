/**
 * Script para Limpeza de Dados de Teste - MediFast
 * 
 * Este script remove todos os dados de teste do banco de dados,
 * mantendo apenas a estrutura das tabelas para uso em produção.
 * 
 * ATENÇÃO: Execute apenas em ambiente de desenvolvimento!
 * 
 * Uso: node src/scripts/cleanup-test-data.js
 */

const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

async function cleanupTestData() {
    try {
        console.log('🧹 Iniciando limpeza dos dados de teste...\n');

        // 1. Verificar se é ambiente de desenvolvimento
        if (process.env.NODE_ENV === 'production') {
            throw new Error('❌ ERRO: Este script não pode ser executado em produção!');
        }

        // 2. Contar registros antes da limpeza
        const beforeCounts = await getTableCounts();
        console.log('📊 Registros antes da limpeza:');
        printCounts(beforeCounts);

        // 3. Deletar dados em ordem específica (respeitando foreign keys)
        console.log('\n🗑️  Iniciando deleção de dados...\n');

        // Deletar registros dependentes primeiro
        await deleteWithLog('SincronizacaoMobile', () => prisma.sincronizacaoMobile.deleteMany());
        await deleteWithLog('LogSistema', () => prisma.logSistema.deleteMany());
        await deleteWithLog('Sessao', () => prisma.sessao.deleteMany());
        await deleteWithLog('Arquivo', () => prisma.arquivo.deleteMany());
        
        // Atendimentos de enfermagem
        await deleteWithLog('Atendimento', () => prisma.atendimento.deleteMany());
        
        // Dados médicos (prontuários e relacionados)
        await deleteWithLog('SinalVital', () => prisma.sinalVital.deleteMany());
        await deleteWithLog('Prescricao', () => prisma.prescricao.deleteMany());
        await deleteWithLog('ExameSolicitado', () => prisma.exameSolicitado.deleteMany());
        await deleteWithLog('Prontuario', () => prisma.prontuario.deleteMany());
        
        // Consultas e agendamentos
        await deleteWithLog('Consulta', () => prisma.consulta.deleteMany());
        await deleteWithLog('Agendamento', () => prisma.agendamento.deleteMany());
        
        // Dados dos pacientes
        await deleteWithLog('Exame', () => prisma.exame.deleteMany());
        await deleteWithLog('DoencaPreexistente', () => prisma.doencaPreexistente.deleteMany());
        await deleteWithLog('MedicamentoUso', () => prisma.medicamentoUso.deleteMany());
        await deleteWithLog('Alergia', () => prisma.alergia.deleteMany());
        await deleteWithLog('Paciente', () => prisma.paciente.deleteMany());
        
        // Médicos e enfermeiros
        await deleteWithLog('Medico', () => prisma.medico.deleteMany());
        await deleteWithLog('Enfermeiro', () => prisma.enfermeiro.deleteMany());
        
        // Usuários (por último)
        await deleteWithLog('Usuario', () => prisma.usuario.deleteMany());

        // 4. Contar registros após a limpeza
        const afterCounts = await getTableCounts();
        console.log('\n📊 Registros após a limpeza:');
        printCounts(afterCounts);

        // 5. Resetar sequências (se necessário)
        console.log('\n🔄 Resetando sequências...');
        // Note: O Prisma com PostgreSQL usa CUIDs, então não precisamos resetar AUTO_INCREMENT

        console.log('\n✅ Limpeza concluída com sucesso!');
        console.log('📝 Banco de dados pronto para uso em produção.\n');

        // 6. Criar usuário administrador padrão para produção
        await createDefaultAdmin();

    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error.message);
        logger.error('Erro na limpeza de dados de teste:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function deleteWithLog(tableName, deleteFunction) {
    try {
        const result = await deleteFunction();
        const count = result.count || 0;
        console.log(`   ✓ ${tableName}: ${count} registro(s) removido(s)`);
        return count;
    } catch (error) {
        console.error(`   ❌ Erro ao deletar ${tableName}:`, error.message);
        throw error;
    }
}

async function getTableCounts() {
    const counts = {};
    
    try {
        counts.usuarios = await prisma.usuario.count();
        counts.medicos = await prisma.medico.count();
        counts.enfermeiros = await prisma.enfermeiro.count();
        counts.pacientes = await prisma.paciente.count();
        counts.prontuarios = await prisma.prontuario.count();
        counts.consultas = await prisma.consulta.count();
        counts.exames = await prisma.exame.count();
        counts.alergias = await prisma.alergia.count();
        counts.medicamentos = await prisma.medicamentoUso.count();
        counts.doencas = await prisma.doencaPreexistente.count();
        counts.agendamentos = await prisma.agendamento.count();
        counts.prescricoes = await prisma.prescricao.count();
        counts.sinaisVitais = await prisma.sinalVital.count();
        counts.atendimentos = await prisma.atendimento.count();
        counts.arquivos = await prisma.arquivo.count();
        counts.sessoes = await prisma.sessao.count();
        counts.logs = await prisma.logSistema.count();
        counts.sincronizacao = await prisma.sincronizacaoMobile.count();
    } catch (error) {
        console.warn('⚠️ Algumas tabelas podem não existir ainda:', error.message);
    }
    
    return counts;
}

function printCounts(counts) {
    Object.entries(counts).forEach(([table, count]) => {
        console.log(`   ${table}: ${count} registro(s)`);
    });
}

async function createDefaultAdmin() {
    try {
        console.log('👤 Criando usuário administrador padrão...');
        
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123!@#', 12);
        
        const admin = await prisma.usuario.create({
            data: {
                email: 'admin@medifast.com',
                senha: hashedPassword,
                nome: 'Administrador do Sistema',
                tipo: 'ADMIN',
                ativo: true
            }
        });
        
        console.log(`   ✓ Usuário admin criado: ${admin.email}`);
        console.log('   🔐 Senha temporária: admin123!@#');
        console.log('   ⚠️  ALTERE A SENHA NO PRIMEIRO LOGIN!\n');
        
    } catch (error) {
        console.warn('⚠️ Erro ao criar admin (pode já existir):', error.message);
    }
}

// Executar script
if (require.main === module) {
    cleanupTestData()
        .then(() => {
            console.log('🎉 Script de limpeza finalizado!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Erro fatal:', error);
            process.exit(1);
        });
}

module.exports = { cleanupTestData };