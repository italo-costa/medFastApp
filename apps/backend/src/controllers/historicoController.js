/**
 * Controller de Histórico
 * Gerencia consultas ao histórico de alterações dos médicos
 */

const historicoService = require('../services/historicoService');

class HistoricoController {

  /**
   * Obter histórico de um médico
   */
  async obterHistoricoMedico(req, res) {
    try {
      const { id } = req.params;
      const { 
        limite, 
        offset, 
        operacao, 
        dataInicio, 
        dataFim,
        usuarioId 
      } = req.query;

      console.log('📜 [HISTORICO] Obtendo histórico do médico:', { 
        medicoId: id, 
        filtros: { operacao, dataInicio, dataFim } 
      });

      const historico = await historicoService.obterHistoricoMedico(id, {
        limite: limite ? parseInt(limite) : 50,
        offset: offset ? parseInt(offset) : 0,
        operacao,
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
        usuarioId
      });

      res.success(historico, 'Histórico obtido com sucesso');

    } catch (error) {
      console.error('❌ [HISTORICO] Erro ao obter histórico:', error.message);
      res.error('Erro ao obter histórico do médico', 500, error.message);
    }
  }

  /**
   * Obter estatísticas do histórico
   */
  async obterEstatisticasHistorico(req, res) {
    try {
      const { id } = req.params;

      console.log('📊 [HISTORICO] Obtendo estatísticas do médico:', id);

      const estatisticas = await historicoService.obterEstatisticasHistorico(id);

      res.success(estatisticas, 'Estatísticas obtidas com sucesso');

    } catch (error) {
      console.error('❌ [HISTORICO] Erro ao obter estatísticas:', error.message);
      res.error('Erro ao obter estatísticas do histórico', 500, error.message);
    }
  }

  /**
   * Limpeza manual do histórico antigo
   */
  async limparHistoricoAntigo(req, res) {
    try {
      const { diasRetencao = 365 } = req.body;

      console.log('🗑️ [HISTORICO] Iniciando limpeza:', { diasRetencao });

      const registrosRemovidos = await historicoService.limparHistoricoAntigo(diasRetencao);

      res.success(
        { registrosRemovidos },
        `Limpeza concluída: ${registrosRemovidos} registros removidos`
      );

    } catch (error) {
      console.error('❌ [HISTORICO] Erro na limpeza:', error.message);
      res.error('Erro na limpeza do histórico', 500, error.message);
    }
  }
}

module.exports = new HistoricoController();