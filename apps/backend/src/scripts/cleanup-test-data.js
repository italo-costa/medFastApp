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

const { logger } = require('../utils/logger');

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
        await deleteWithLog('SincronizacaoMobile', () => databaseService.client.sincronizacaoMobile.deleteMany());
        await deleteWithLog('LogSistema', () => databaseService.client.logSistema.deleteMany());
        await deleteWithLog('Sessao', () => databaseService.client.sessao.deleteMany());
        await deleteWithLog('Arquivo', () => databaseService.client.arquivo.deleteMany());
        
        // Atendimentos de enfermagem
        await deleteWithLog('Atendimento', () => databaseService.client.atendimento.deleteMany());
        
        // Dados médicos (prontuários e relacionados)
        await deleteWithLog('SinalVital', () => databaseService.client.sinalVital.deleteMany());
        await deleteWithLog('Prescricao', () => databaseService.client.prescricao.deleteMany());
        await deleteWithLog('ExameSolicitado', () => databaseService.client.exameSolicitado.deleteMany());
        await deleteWithLog('Prontuario', () => databaseService.client.prontuario.deleteMany());
        
        // Consultas e agendamentos
        await deleteWithLog('Consulta', () => databaseService.client.consulta.deleteMany());
        await deleteWithLog('Agendamento', () => databaseService.client.agendamento.deleteMany());
        
        // Dados dos pacientes
        await deleteWithLog('Exame', () => databaseService.client.exame.deleteMany());
        await deleteWithLog('DoencaPreexistente', () => databaseService.client.doencaPreexistente.deleteMany());
        await deleteWithLog('MedicamentoUso', () => databaseService.client.medicamentoUso.deleteMany());
        await deleteWithLog('Alergia', () => databaseService.client.alergia.deleteMany());
        await deleteWithLog('Paciente', () => databaseService.client.paciente.deleteMany());
        
        // Médicos e enfermeiros
        await deleteWithLog('Medico', () => databaseService.client.medico.deleteMany());
        await deleteWithLog('Enfermeiro', () => databaseService.client.enfermeiro.deleteMany());
        
        // Usuários (por último)
        await deleteWithLog('Usuario', () => databaseService.client.usuario.deleteMany());

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
        await databaseService.client.$disconnect();
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
        counts.usuarios = await databaseService.client.usuario.count();
        counts.medicos = await databaseService.client.medico.count();
        counts.enfermeiros = await databaseService.client.enfermeiro.count();
        counts.pacientes = await databaseService.client.paciente.count();
        counts.prontuarios = await databaseService.client.prontuario.count();
        counts.consultas = await databaseService.client.consulta.count();
        counts.exames = await databaseService.client.exame.count();
        counts.alergias = await databaseService.client.alergia.count();
        counts.medicamentos = await databaseService.client.medicamentoUso.count();
        counts.doencas = await databaseService.client.doencaPreexistente.count();
        counts.agendamentos = await databaseService.client.agendamento.count();
        counts.prescricoes = await databaseService.client.prescricao.count();
        counts.sinaisVitais = await databaseService.client.sinalVital.count();
        counts.atendimentos = await databaseService.client.atendimento.count();
        counts.arquivos = await databaseService.client.arquivo.count();
        counts.sessoes = await databaseService.client.sessao.count();
        counts.logs = await databaseService.client.logSistema.count();
        counts.sincronizacao = await databaseService.client.sincronizacaoMobile.count();
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
const databaseService = require('../services/database');
        const hashedPassword = await bcrypt.hash('admin123!@#', 12);
        
        const admin = await databaseService.client.usuario.create({
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