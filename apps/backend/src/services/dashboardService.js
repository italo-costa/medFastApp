/**
 * Serviço de Dashboard
 * Gera dados consolidados para dashboard com estatísticas e métricas
 */

const databaseService = require('./database');

class DashboardService {

  /**
   * Obter dados completos do dashboard
   * @returns {Object} - Dados consolidados do dashboard
   */
  async obterDadosDashboard() {
    try {
      // Buscar todos os médicos com relacionamentos
      const medicos = await databaseService.client.medico.findMany({
        include: {
          usuario: {
            select: {
              nome: true,
              email: true,
              ativo: true,
              criado_em: true
            }
          }
        }
      });

      // Gerar métricas principais
      const metricas = this.calcularMetricasPrincipais(medicos);

      // Gerar dados para gráficos
      const graficos = this.gerarDadosGraficos(medicos);

      // Gerar estatísticas detalhadas
      const estatisticas = this.gerarEstatisticasDetalhadas(medicos);

      // Gerar atividades recentes
      const atividadesRecentes = this.gerarAtividadesRecentes(medicos);

      return {
        metricas,
        graficos,
        estatisticas,
        atividadesRecentes,
        ultimaAtualizacao: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter dados:', error.message);
      throw error;
    }
  }

  /**
   * Calcular métricas principais
   * @param {Array} medicos - Lista de médicos
   * @returns {Object} - Métricas principais
   */
  calcularMetricasPrincipais(medicos) {
    const total = medicos.length;
    const ativos = medicos.filter(m => m.usuario?.ativo).length;
    const inativos = total - ativos;

    // Calcular médicos cadastrados nos últimos 30 dias
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
    
    const novosUltimos30Dias = medicos.filter(m => 
      m.usuario?.criado_em && new Date(m.usuario.criado_em) >= treintaDiasAtras
    ).length;

    // Calcular taxa de crescimento (comparando com 30 dias anteriores)
    const sessentaDiasAtras = new Date();
    sessentaDiasAtras.setDate(sessentaDiasAtras.getDate() - 60);
    
    const novos30a60Dias = medicos.filter(m => 
      m.usuario?.criado_em && 
      new Date(m.usuario.criado_em) >= sessentaDiasAtras &&
      new Date(m.usuario.criado_em) < treintaDiasAtras
    ).length;

    const taxaCrescimento = novos30a60Dias > 0 
      ? ((novosUltimos30Dias - novos30a60Dias) / novos30a60Dias * 100).toFixed(1)
      : novosUltimos30Dias > 0 ? 100 : 0;

    return {
      totalMedicos: total,
      medicosAtivos: ativos,
      medicosInativos: inativos,
      percentualAtivos: total > 0 ? ((ativos / total) * 100).toFixed(1) : 0,
      novosUltimos30Dias,
      taxaCrescimento: parseFloat(taxaCrescimento)
    };
  }

  /**
   * Gerar dados para gráficos
   * @param {Array} medicos - Lista de médicos
   * @returns {Object} - Dados para gráficos
   */
  gerarDadosGraficos(medicos) {
    return {
      especialidades: this.graficoPorEspecialidade(medicos),
      estados: this.graficoPorEstado(medicos),
      cadastrosMensais: this.graficoCadastrosMensais(medicos),
      idadeDistribuicao: this.graficoDistribuicaoIdade(medicos),
      statusDistribuicao: this.graficoDistribuicaoStatus(medicos)
    };
  }

  /**
   * Gráfico por especialidade
   * @param {Array} medicos - Lista de médicos
   * @returns {Object} - Dados do gráfico
   */
  graficoPorEspecialidade(medicos) {
    const especialidades = {};
    
    medicos.forEach(medico => {
      const esp = medico.especialidade || 'Não informado';
      especialidades[esp] = (especialidades[esp] || 0) + 1;
    });

    const dados = Object.entries(especialidades)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10

    return {
      titulo: 'Médicos por Especialidade',
      tipo: 'doughnut',
      labels: dados.map(([nome]) => nome),
      dados: dados.map(([,quantidade]) => quantidade),
      cores: this.gerarCoresPadrao(dados.length)
    };
  }

  /**
   * Gráfico por estado
   * @param {Array} medicos - Lista de médicos
   * @returns {Object} - Dados do gráfico
   */
  graficoPorEstado(medicos) {
    const estados = {};
    
    medicos.forEach(medico => {
      const uf = medico.uf || 'Não informado';
      estados[uf] = (estados[uf] || 0) + 1;
    });

    const dados = Object.entries(estados)
      .sort(([,a], [,b]) => b - a);

    return {
      titulo: 'Médicos por Estado',
      tipo: 'bar',
      labels: dados.map(([uf]) => uf),
      dados: dados.map(([,quantidade]) => quantidade),
      cores: ['#3B82F6'] // Azul único para barras
    };
  }

  /**
   * Gráfico de cadastros mensais
   * @param {Array} medicos - Lista de médicos
   * @returns {Object} - Dados do gráfico
   */
  graficoCadastrosMensais(medicos) {
    const meses = {};
    const hoje = new Date();
    
    // Inicializar últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      meses[chave] = 0;
    }

    // Contar cadastros por mês
    medicos.forEach(medico => {
      if (medico.usuario?.criado_em) {
        const data = new Date(medico.usuario.criado_em);
        const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        if (meses.hasOwnProperty(chave)) {
          meses[chave]++;
        }
      }
    });

    const dados = Object.entries(meses);

    return {
      titulo: 'Cadastros por Mês',
      tipo: 'line',
      labels: dados.map(([mes]) => {
        const [ano, m] = mes.split('-');
        const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                           'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${nomesMeses[parseInt(m) - 1]}/${ano.slice(2)}`;
      }),
      dados: dados.map(([,quantidade]) => quantidade),
      cores: ['#10B981'] // Verde para linha
    };
  }

  /**
   * Gráfico de distribuição de idade
   * @param {Array} medicos - Lista de médicos
   * @returns {Object} - Dados do gráfico
   */
  graficoDistribuicaoIdade(medicos) {
    const faixas = {
      '20-30': 0,
      '31-40': 0,
      '41-50': 0,
      '51-60': 0,
      '60+': 0,
      'Não informado': 0
    };

    medicos.forEach(medico => {
      if (medico.data_nascimento) {
        const idade = this.calcularIdade(medico.data_nascimento);
        if (idade <= 30) faixas['20-30']++;
        else if (idade <= 40) faixas['31-40']++;
        else if (idade <= 50) faixas['41-50']++;
        else if (idade <= 60) faixas['51-60']++;
        else faixas['60+']++;
      } else {
        faixas['Não informado']++;
      }
    });

    return {
      titulo: 'Distribuição por Idade',
      tipo: 'bar',
      labels: Object.keys(faixas),
      dados: Object.values(faixas),
      cores: ['#F59E0B'] // Amarelo para barras
    };
  }

  /**
   * Gráfico de distribuição de status
   * @param {Array} medicos - Lista de médicos
   * @returns {Object} - Dados do gráfico
   */
  graficoDistribuicaoStatus(medicos) {
    const ativos = medicos.filter(m => m.usuario?.ativo).length;
    const inativos = medicos.length - ativos;

    return {
      titulo: 'Status dos Médicos',
      tipo: 'pie',
      labels: ['Ativos', 'Inativos'],
      dados: [ativos, inativos],
      cores: ['#10B981', '#EF4444'] // Verde e vermelho
    };
  }

  /**
   * Gerar estatísticas detalhadas
   * @param {Array} medicos - Lista de médicos
   * @returns {Object} - Estatísticas detalhadas
   */
  gerarEstatisticasDetalhadas(medicos) {
    const especialidadesMaisComuns = this.obterEspecialidadesMaisComuns(medicos, 5);
    const estadosComMaisMedicos = this.obterEstadosComMaisMedicos(medicos, 5);
    const mediaIdade = this.calcularMediaIdade(medicos);

    return {
      especialidadesMaisComuns,
      estadosComMaisMedicos,
      mediaIdade: mediaIdade ? mediaIdade.toFixed(1) : null,
      totalComFoto: medicos.filter(m => m.foto_url).length,
      totalComCelular: medicos.filter(m => m.celular).length,
      totalComCPF: medicos.filter(m => m.cpf).length
    };
  }

  /**
   * Gerar atividades recentes
   * @param {Array} medicos - Lista de médicos
   * @returns {Array} - Lista de atividades recentes
   */
  gerarAtividadesRecentes(medicos) {
    return medicos
      .filter(m => m.usuario?.criado_em)
      .sort((a, b) => new Date(b.usuario.criado_em) - new Date(a.usuario.criado_em))
      .slice(0, 10)
      .map(medico => ({
        tipo: 'cadastro',
        titulo: 'Novo médico cadastrado',
        descricao: `${medico.usuario.nome} - ${medico.especialidade}`,
        data: medico.usuario.criado_em,
        icon: 'user-plus'
      }));
  }

  /**
   * Métodos auxiliares
   */

  calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  }

  calcularMediaIdade(medicos) {
    const medicosComIdade = medicos.filter(m => m.data_nascimento);
    if (medicosComIdade.length === 0) return null;

    const somaIdades = medicosComIdade.reduce((soma, medico) => {
      return soma + this.calcularIdade(medico.data_nascimento);
    }, 0);

    return somaIdades / medicosComIdade.length;
  }

  obterEspecialidadesMaisComuns(medicos, limite = 5) {
    const especialidades = {};
    
    medicos.forEach(medico => {
      const esp = medico.especialidade || 'Não informado';
      especialidades[esp] = (especialidades[esp] || 0) + 1;
    });

    return Object.entries(especialidades)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limite)
      .map(([nome, quantidade]) => ({ nome, quantidade }));
  }

  obterEstadosComMaisMedicos(medicos, limite = 5) {
    const estados = {};
    
    medicos.forEach(medico => {
      const uf = medico.uf || 'Não informado';
      estados[uf] = (estados[uf] || 0) + 1;
    });

    return Object.entries(estados)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limite)
      .map(([nome, quantidade]) => ({ nome, quantidade }));
  }

  gerarCoresPadrao(quantidade) {
    const cores = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
    ];
    
    const resultado = [];
    for (let i = 0; i < quantidade; i++) {
      resultado.push(cores[i % cores.length]);
    }
    
    return resultado;
  }
}

module.exports = new DashboardService();