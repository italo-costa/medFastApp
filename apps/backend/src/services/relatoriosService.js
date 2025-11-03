/**
 * Serviço de Relatórios
 * Geração de relatórios em PDF e Excel para médicos
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

class RelatoriosService {
  
  /**
   * Gerar relatório de médicos em Excel
   * @param {Array} medicos - Lista de médicos
   * @param {Object} filtros - Filtros aplicados
   * @returns {Buffer} - Buffer do arquivo Excel
   */
  async gerarExcelMedicos(medicos, filtros = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório de Médicos');

    // Configurar informações do documento
    workbook.creator = 'MediApp';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Título do relatório
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'RELATÓRIO DE MÉDICOS';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    // Informações do relatório
    worksheet.mergeCells('A2:K2');
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `Gerado em: ${new Date().toLocaleString('pt-BR')} | Total: ${medicos.length} médicos`;
    infoCell.font = { size: 10, italic: true };
    infoCell.alignment = { horizontal: 'center' };

    // Filtros aplicados
    if (Object.keys(filtros).length > 0) {
      worksheet.mergeCells('A3:K3');
      const filtrosCell = worksheet.getCell('A3');
      const filtroTexto = Object.entries(filtros)
        .filter(([key, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ');
      filtrosCell.value = `Filtros: ${filtroTexto}`;
      filtrosCell.font = { size: 9, italic: true };
      filtrosCell.alignment = { horizontal: 'center' };
    }

    // Cabeçalhos
    const headers = [
      'Nome Completo',
      'CPF',
      'CRM',
      'Especialidade',
      'Telefone',
      'Email',
      'Cidade',
      'UF',
      'Status',
      'Data Nascimento',
      'Cadastrado em'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Dados dos médicos
    medicos.forEach(medico => {
      const row = worksheet.addRow([
        medico.nomeCompleto || 'N/A',
        medico.cpf || 'N/A',
        medico.crm || 'N/A',
        medico.especialidade || 'N/A',
        medico.telefone || 'N/A',
        medico.email || 'N/A',
        medico.cidade || 'N/A',
        medico.estado || 'N/A',
        medico.status || 'N/A',
        medico.data_nascimento ? new Date(medico.data_nascimento).toLocaleDateString('pt-BR') : 'N/A',
        medico.criado_em ? new Date(medico.criado_em).toLocaleDateString('pt-BR') : 'N/A'
      ]);

      // Formatação das células
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Status com cores
        if (colNumber === 9) { // Coluna Status
          switch (cell.value) {
            case 'ATIVO':
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7E6' } };
              break;
            case 'INATIVO':
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
              break;
            default:
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4E6' } };
          }
        }
      });
    });

    // Ajustar largura das colunas
    worksheet.columns = [
      { width: 25 }, // Nome
      { width: 15 }, // CPF
      { width: 12 }, // CRM
      { width: 20 }, // Especialidade
      { width: 15 }, // Telefone
      { width: 25 }, // Email
      { width: 15 }, // Cidade
      { width: 5 },  // UF
      { width: 10 }, // Status
      { width: 12 }, // Data Nascimento
      { width: 12 }  // Cadastrado em
    ];

    // Estatísticas no final
    const lastRow = worksheet.rowCount + 2;
    worksheet.mergeCells(`A${lastRow}:K${lastRow}`);
    const statsCell = worksheet.getCell(`A${lastRow}`);
    
    const ativos = medicos.filter(m => m.status === 'ATIVO').length;
    const inativos = medicos.filter(m => m.status === 'INATIVO').length;
    const especialidades = [...new Set(medicos.map(m => m.especialidade).filter(Boolean))].length;
    
    statsCell.value = `Estatísticas: ${ativos} ativos | ${inativos} inativos | ${especialidades} especialidades diferentes`;
    statsCell.font = { bold: true };
    statsCell.alignment = { horizontal: 'center' };

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Gerar relatório estatístico de médicos
   * @param {Array} medicos - Lista de médicos
   * @returns {Object} - Estatísticas detalhadas
   */
  gerarEstatisticasMedicos(medicos) {
    const stats = {
      total: medicos.length,
      ativos: medicos.filter(m => m.status === 'ATIVO').length,
      inativos: medicos.filter(m => m.status === 'INATIVO').length,
      
      // Por especialidade
      especialidades: {},
      
      // Por estado
      estados: {},
      
      // Por faixa etária
      faixasEtarias: {
        'Até 30 anos': 0,
        '31-40 anos': 0,
        '41-50 anos': 0,
        '51-60 anos': 0,
        'Acima de 60 anos': 0,
        'Não informado': 0
      },
      
      // Cadastros por mês
      cadastrosPorMes: {},
      
      // Médicos com foto
      comFoto: medicos.filter(m => m.foto_url).length
    };

    medicos.forEach(medico => {
      // Contar especialidades
      if (medico.especialidade) {
        stats.especialidades[medico.especialidade] = 
          (stats.especialidades[medico.especialidade] || 0) + 1;
      }

      // Contar estados
      if (medico.estado) {
        stats.estados[medico.estado] = 
          (stats.estados[medico.estado] || 0) + 1;
      }

      // Calcular faixa etária
      if (medico.data_nascimento) {
        const idade = Math.floor((new Date() - new Date(medico.data_nascimento)) / (365.25 * 24 * 60 * 60 * 1000));
        if (idade <= 30) stats.faixasEtarias['Até 30 anos']++;
        else if (idade <= 40) stats.faixasEtarias['31-40 anos']++;
        else if (idade <= 50) stats.faixasEtarias['41-50 anos']++;
        else if (idade <= 60) stats.faixasEtarias['51-60 anos']++;
        else stats.faixasEtarias['Acima de 60 anos']++;
      } else {
        stats.faixasEtarias['Não informado']++;
      }

      // Cadastros por mês
      if (medico.criado_em) {
        const mes = new Date(medico.criado_em).toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'long' 
        });
        stats.cadastrosPorMes[mes] = (stats.cadastrosPorMes[mes] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Gerar relatório de médicos por especialidade
   * @param {Array} medicos - Lista de médicos
   * @returns {Buffer} - Buffer do arquivo Excel
   */
  async gerarRelatorioEspecialidades(medicos) {
    const workbook = new ExcelJS.Workbook();
    
    // Agrupar por especialidade
    const porEspecialidade = {};
    medicos.forEach(medico => {
      const esp = medico.especialidade || 'Não informado';
      if (!porEspecialidade[esp]) {
        porEspecialidade[esp] = [];
      }
      porEspecialidade[esp].push(medico);
    });

    // Criar uma aba para cada especialidade
    Object.entries(porEspecialidade).forEach(([especialidade, medicosList]) => {
      const worksheet = workbook.addWorksheet(especialidade.substring(0, 30));

      // Título
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `${especialidade.toUpperCase()} (${medicosList.length} médicos)`;
      titleCell.font = { size: 14, bold: true };
      titleCell.alignment = { horizontal: 'center' };

      // Cabeçalhos
      const headers = ['Nome', 'CRM', 'Telefone', 'Email', 'Cidade', 'Status'];
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6F3FF' }
        };
      });

      // Dados
      medicosList.forEach(medico => {
        worksheet.addRow([
          medico.nomeCompleto,
          medico.crm,
          medico.telefone,
          medico.email,
          medico.cidade,
          medico.status
        ]);
      });

      // Ajustar colunas
      worksheet.columns = [
        { width: 25 },
        { width: 12 },
        { width: 15 },
        { width: 25 },
        { width: 15 },
        { width: 10 }
      ];
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

module.exports = new RelatoriosService();