/**
 * Serviço de Histórico de Alterações
 * Registra e gerencia mudanças nos dados dos médicos
 */

const databaseService = require('./database');

class HistoricoService {

  /**
   * Registrar alteração
   * @param {Object} params - Parâmetros da alteração
   * @param {number} params.medicoId - ID do médico
   * @param {number} params.usuarioId - ID do usuário que fez a alteração
   * @param {string} params.operacao - Tipo de operação (CREATE, UPDATE, DELETE)
   * @param {Object} params.dadosAnteriores - Dados antes da alteração
   * @param {Object} params.dadosNovos - Dados após a alteração
   * @param {string} params.observacoes - Observações sobre a alteração
   */
  async registrarAlteracao({ medicoId, usuarioId, operacao, dadosAnteriores, dadosNovos, observacoes }) {
    try {
      // Identificar campos alterados
      const camposAlterados = this.identificarCamposAlterados(dadosAnteriores, dadosNovos);

      // Criar registro de histórico
      const historico = await databaseService.client.$executeRaw`
        INSERT INTO historico_alteracoes (
          medico_id, usuario_alteracao_id, operacao, dados_anteriores, 
          dados_novos, campos_alterados, observacoes, data_alteracao
        ) VALUES (
          ${medicoId}, ${usuarioId}, ${operacao}, ${JSON.stringify(dadosAnteriores)},
          ${JSON.stringify(dadosNovos)}, ${JSON.stringify(camposAlterados)}, 
          ${observacoes || ''}, NOW()
        )
      `;

      console.log('📝 [HISTORICO] Alteração registrada:', {
        medicoId,
        operacao,
        camposAlterados: camposAlterados.length
      });

      return historico;

    } catch (error) {
      console.error('❌ [HISTORICO] Erro ao registrar alteração:', error.message);
      throw error;
    }
  }

  /**
   * Obter histórico de um médico
   * @param {number} medicoId - ID do médico
   * @param {Object} options - Opções de filtro
   * @returns {Array} - Lista de alterações
   */
  async obterHistoricoMedico(medicoId, options = {}) {
    try {
      const { 
        limite = 50, 
        offset = 0, 
        operacao, 
        dataInicio, 
        dataFim,
        usuarioId 
      } = options;

      // Construir condições WHERE
      let whereConditions = ['medico_id = $1'];
      const queryParams = [medicoId];
      let paramIndex = 2;

      if (operacao) {
        whereConditions.push(`operacao = $${paramIndex}`);
        queryParams.push(operacao);
        paramIndex++;
      }

      if (usuarioId) {
        whereConditions.push(`usuario_alteracao_id = $${paramIndex}`);
        queryParams.push(usuarioId);
        paramIndex++;
      }

      if (dataInicio) {
        whereConditions.push(`data_alteracao >= $${paramIndex}`);
        queryParams.push(dataInicio);
        paramIndex++;
      }

      if (dataFim) {
        whereConditions.push(`data_alteracao <= $${paramIndex}`);
        queryParams.push(dataFim);
        paramIndex++;
      }

      // Query principal
      const query = `
        SELECT 
          h.*,
          u.nome as usuario_nome,
          u.email as usuario_email
        FROM historico_alteracoes h
        LEFT JOIN usuarios u ON h.usuario_alteracao_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY h.data_alteracao DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limite, offset);

      const resultado = await databaseService.client.$queryRawUnsafe(query, ...queryParams);

      // Processar dados
      const historico = resultado.map(item => ({
        id: item.id,
        operacao: item.operacao,
        dataAlteracao: item.data_alteracao,
        usuario: {
          id: item.usuario_alteracao_id,
          nome: item.usuario_nome,
          email: item.usuario_email
        },
        dadosAnteriores: item.dados_anteriores ? JSON.parse(item.dados_anteriores) : null,
        dadosNovos: item.dados_novos ? JSON.parse(item.dados_novos) : null,
        camposAlterados: item.campos_alterados ? JSON.parse(item.campos_alterados) : [],
        observacoes: item.observacoes,
        resumo: this.gerarResumoAlteracao(item)
      }));

      return historico;

    } catch (error) {
      console.error('❌ [HISTORICO] Erro ao obter histórico:', error.message);
      throw error;
    }
  }

  /**
   * Obter estatísticas do histórico
   * @param {number} medicoId - ID do médico
   * @returns {Object} - Estatísticas
   */
  async obterEstatisticasHistorico(medicoId) {
    try {
      const query = `
        SELECT 
          operacao,
          COUNT(*) as quantidade,
          MIN(data_alteracao) as primeira_alteracao,
          MAX(data_alteracao) as ultima_alteracao
        FROM historico_alteracoes 
        WHERE medico_id = $1
        GROUP BY operacao
      `;

      const resultado = await databaseService.client.$queryRawUnsafe(query, medicoId);

      const estatisticas = {
        totalAlteracoes: 0,
        operacoes: {},
        primeiraAlteracao: null,
        ultimaAlteracao: null
      };

      resultado.forEach(item => {
        estatisticas.totalAlteracoes += Number(item.quantidade);
        estatisticas.operacoes[item.operacao] = Number(item.quantidade);
        
        if (!estatisticas.primeiraAlteracao || item.primeira_alteracao < estatisticas.primeiraAlteracao) {
          estatisticas.primeiraAlteracao = item.primeira_alteracao;
        }
        
        if (!estatisticas.ultimaAlteracao || item.ultima_alteracao > estatisticas.ultimaAlteracao) {
          estatisticas.ultimaAlteracao = item.ultima_alteracao;
        }
      });

      return estatisticas;

    } catch (error) {
      console.error('❌ [HISTORICO] Erro ao obter estatísticas:', error.message);
      throw error;
    }
  }

  /**
   * Identificar campos alterados
   * @param {Object} dadosAnteriores - Dados antes da alteração
   * @param {Object} dadosNovos - Dados após a alteração
   * @returns {Array} - Lista de campos alterados
   */
  identificarCamposAlterados(dadosAnteriores, dadosNovos) {
    const camposAlterados = [];

    if (!dadosAnteriores) return [];

    // Comparar todos os campos
    const todosOsCampos = new Set([
      ...Object.keys(dadosAnteriores || {}),
      ...Object.keys(dadosNovos || {})
    ]);

    todosOsCampos.forEach(campo => {
      const valorAnterior = dadosAnteriores[campo];
      const valorNovo = dadosNovos[campo];

      // Comparação profunda para objetos e arrays
      if (!this.valoresIguais(valorAnterior, valorNovo)) {
        camposAlterados.push({
          campo,
          valorAnterior,
          valorNovo,
          tipo: this.determinarTipoAlteracao(valorAnterior, valorNovo)
        });
      }
    });

    return camposAlterados;
  }

  /**
   * Verificar se dois valores são iguais
   * @param {*} valor1 - Primeiro valor
   * @param {*} valor2 - Segundo valor
   * @returns {boolean} - Se são iguais
   */
  valoresIguais(valor1, valor2) {
    // Valores null/undefined
    if (valor1 == null && valor2 == null) return true;
    if (valor1 == null || valor2 == null) return false;

    // Tipos diferentes
    if (typeof valor1 !== typeof valor2) return false;

    // Objetos e arrays
    if (typeof valor1 === 'object') {
      return JSON.stringify(valor1) === JSON.stringify(valor2);
    }

    // Valores primitivos
    return valor1 === valor2;
  }

  /**
   * Determinar tipo de alteração
   * @param {*} valorAnterior - Valor anterior
   * @param {*} valorNovo - Valor novo
   * @returns {string} - Tipo da alteração
   */
  determinarTipoAlteracao(valorAnterior, valorNovo) {
    if (valorAnterior == null && valorNovo != null) return 'ADICAO';
    if (valorAnterior != null && valorNovo == null) return 'REMOCAO';
    return 'MODIFICACAO';
  }

  /**
   * Gerar resumo da alteração
   * @param {Object} item - Item do histórico
   * @returns {string} - Resumo textual
   */
  gerarResumoAlteracao(item) {
    const operacao = item.operacao;
    const camposAlterados = item.campos_alterados ? JSON.parse(item.campos_alterados) : [];

    switch (operacao) {
      case 'CREATE':
        return 'Médico cadastrado no sistema';
      
      case 'DELETE':
        return 'Médico removido do sistema';
      
      case 'UPDATE':
        if (camposAlterados.length === 0) return 'Dados atualizados';
        
        const principais = camposAlterados
          .filter(campo => ['nome', 'email', 'crm', 'especialidade'].includes(campo.campo))
          .map(campo => campo.campo);
        
        if (principais.length > 0) {
          return `Campos alterados: ${principais.join(', ')}`;
        }
        
        return `${camposAlterados.length} campo(s) alterado(s)`;
      
      default:
        return 'Alteração registrada';
    }
  }

  /**
   * Limpar histórico antigo (manutenção)
   * @param {number} diasRetencao - Dias para manter o histórico
   */
  async limparHistoricoAntigo(diasRetencao = 365) {
    try {
      const dataCorte = new Date();
      dataCorte.setDate(dataCorte.getDate() - diasRetencao);

      const resultado = await databaseService.client.$executeRaw`
        DELETE FROM historico_alteracoes 
        WHERE data_alteracao < ${dataCorte}
      `;

      console.log(`🗑️ [HISTORICO] Limpeza concluída: ${resultado} registros removidos`);
      return resultado;

    } catch (error) {
      console.error('❌ [HISTORICO] Erro na limpeza:', error.message);
      throw error;
    }
  }
}

module.exports = new HistoricoService();