/**
 * Controller de Dashboard
 * Gerencia dados consolidados e estatísticas para o dashboard
 */

const dashboardService = require('../services/dashboardService');

class DashboardController {

  /**
   * Obter dados completos do dashboard
   */
  async obterDashboard(req, res) {
    try {
      console.log('📊 [DASHBOARD] Obtendo dados do dashboard');

      const dados = await dashboardService.obterDadosDashboard();

      console.log('✅ [DASHBOARD] Dados obtidos com sucesso:', {
        totalMedicos: dados.metricas.totalMedicos,
        graficos: Object.keys(dados.graficos).length,
        atividades: dados.atividadesRecentes.length
      });

      return res.status(200).json({
        success: true,
        data: dados,
        message: 'Dados do dashboard obtidos com sucesso'
      });

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter dados:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter dados do dashboard',
        error: error.message
      });
    }
  }

  /**
   * Obter apenas métricas principais
   */
  async obterMetricas(req, res) {
    try {
      console.log('📈 [DASHBOARD] Obtendo métricas principais');

      const dados = await dashboardService.obterDadosDashboard();

      res.status(200).json({
        success: true,
        data: dados.metricas,
        message: 'Métricas obtidas com sucesso'
      });

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter métricas:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter métricas',
        error: error.message
      });
    }
  }

  /**
   * Obter dados para gráficos específicos
   */
  async obterGraficos(req, res) {
    try {
      const { tipo } = req.query;

      console.log('📊 [DASHBOARD] Obtendo dados de gráficos:', { tipo });

      const dados = await dashboardService.obterDadosDashboard();

      let resultado = dados.graficos;

      // Filtrar por tipo específico se solicitado
      if (tipo && dados.graficos[tipo]) {
        resultado = { [tipo]: dados.graficos[tipo] };
      }

      res.status(200).json({
        success: true,
        data: resultado,
        message: 'Dados de gráficos obtidos com sucesso'
      });

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter gráficos:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter dados de gráficos',
        error: error.message
      });
    }
  }

  /**
   * Obter atividades recentes
   */
  async obterAtividades(req, res) {
    try {
      const { limite = 10 } = req.query;

      console.log('📋 [DASHBOARD] Obtendo atividades recentes:', { limite });

      const dados = await dashboardService.obterDadosDashboard();
      const atividades = dados.atividadesRecentes.slice(0, parseInt(limite));

      res.status(200).json({
        success: true,
        data: atividades,
        message: 'Atividades recentes obtidas com sucesso'
      });

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter atividades:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter atividades recentes',
        error: error.message
      });
    }
  }

  /**
   * Obter estatísticas detalhadas
   */
  async obterEstatisticasDetalhadas(req, res) {
    try {
      console.log('📊 [DASHBOARD] Obtendo estatísticas detalhadas');

      const dados = await dashboardService.obterDadosDashboard();

      res.status(200).json({
        success: true,
        data: dados.estatisticas,
        message: 'Estatísticas detalhadas obtidas com sucesso'
      });

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter estatísticas detalhadas:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas detalhadas',
        error: error.message
      });
    }
  }
}

module.exports = new DashboardController();