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

      res.success(dados, 'Dados do dashboard obtidos com sucesso');

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter dados:', error.message);
      res.error('Erro ao obter dados do dashboard', 500, error.message);
    }
  }

  /**
   * Obter apenas métricas principais
   */
  async obterMetricas(req, res) {
    try {
      console.log('📈 [DASHBOARD] Obtendo métricas principais');

      const dados = await dashboardService.obterDadosDashboard();

      res.success(dados.metricas, 'Métricas obtidas com sucesso');

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter métricas:', error.message);
      res.error('Erro ao obter métricas', 500, error.message);
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

      res.success(resultado, 'Dados de gráficos obtidos com sucesso');

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter gráficos:', error.message);
      res.error('Erro ao obter dados de gráficos', 500, error.message);
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

      res.success(atividades, 'Atividades recentes obtidas com sucesso');

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter atividades:', error.message);
      res.error('Erro ao obter atividades recentes', 500, error.message);
    }
  }

  /**
   * Obter estatísticas detalhadas
   */
  async obterEstatisticasDetalhadas(req, res) {
    try {
      console.log('📊 [DASHBOARD] Obtendo estatísticas detalhadas');

      const dados = await dashboardService.obterDadosDashboard();

      res.success(dados.estatisticas, 'Estatísticas detalhadas obtidas com sucesso');

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter estatísticas detalhadas:', error.message);
      res.error('Erro ao obter estatísticas detalhadas', 500, error.message);
    }
  }
}

module.exports = new DashboardController();