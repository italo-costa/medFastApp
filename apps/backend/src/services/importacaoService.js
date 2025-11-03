/**
 * Serviço de Importação
 * Importação em lote de médicos via CSV/Excel
 */

const ExcelJS = require('exceljs');
const { validateDoctorData, hashPassword } = require('../utils/validators');
const databaseService = require('./database');

class ImportacaoService {

  /**
   * Importar médicos de arquivo Excel
   * @param {Buffer} buffer - Buffer do arquivo Excel
   * @returns {Object} - Resultado da importação
   */
  async importarMedicosExcel(buffer) {
    const resultado = {
      total: 0,
      sucessos: 0,
      erros: 0,
      detalhes: [],
      medicosImportados: []
    };

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('Planilha não encontrada');
      }

      // Mapear colunas (assumindo primeira linha como cabeçalho)
      const headers = {};
      const firstRow = worksheet.getRow(1);
      firstRow.eachCell((cell, colNumber) => {
        const headerName = cell.value?.toString().toLowerCase().trim();
        headers[colNumber] = this.mapearCabecalho(headerName);
      });

      // Validar cabeçalhos obrigatórios
      const camposObrigatorios = ['nome', 'email', 'crm', 'especialidade', 'telefone'];
      const camposEncontrados = Object.values(headers).filter(Boolean);
      const camposFaltando = camposObrigatorios.filter(campo => !camposEncontrados.includes(campo));

      if (camposFaltando.length > 0) {
        throw new Error(`Campos obrigatórios não encontrados: ${camposFaltando.join(', ')}`);
      }

      // Processar linhas de dados
      const promises = [];
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        
        // Verificar se a linha não está vazia
        if (this.isRowEmpty(row)) continue;

        const dadosMedico = this.extrairDadosLinha(row, headers);
        promises.push(this.processarMedico(dadosMedico, i, resultado));
        resultado.total++;
      }

      // Aguardar processamento de todos os médicos
      await Promise.all(promises);

      return resultado;

    } catch (error) {
      resultado.erros = resultado.total;
      resultado.detalhes.push({
        linha: 'Geral',
        erro: error.message
      });
      return resultado;
    }
  }

  /**
   * Mapear cabeçalho da planilha para campo do sistema
   * @param {string} header - Cabeçalho da planilha
   * @returns {string|null} - Campo mapeado
   */
  mapearCabecalho(header) {
    const mapeamento = {
      'nome': 'nome',
      'nome completo': 'nome',
      'email': 'email',
      'e-mail': 'email',
      'crm': 'crm',
      'especialidade': 'especialidade',
      'telefone': 'telefone',
      'celular': 'celular',
      'cpf': 'cpf',
      'data nascimento': 'data_nascimento',
      'data de nascimento': 'data_nascimento',
      'sexo': 'sexo',
      'cep': 'cep',
      'logradouro': 'logradouro',
      'endereco': 'logradouro',
      'endereço': 'logradouro',
      'numero': 'numero',
      'número': 'numero',
      'complemento': 'complemento',
      'bairro': 'bairro',
      'cidade': 'cidade',
      'estado': 'estado',
      'uf': 'estado',
      'formacao': 'formacao',
      'formação': 'formacao',
      'experiencia': 'experiencia',
      'experiência': 'experiencia',
      'observacoes': 'observacoes',
      'observações': 'observacoes'
    };

    return mapeamento[header] || null;
  }

  /**
   * Verificar se linha está vazia
   * @param {Row} row - Linha da planilha
   * @returns {boolean}
   */
  isRowEmpty(row) {
    return !row.values || row.values.every(cell => !cell || cell.toString().trim() === '');
  }

  /**
   * Extrair dados da linha
   * @param {Row} row - Linha da planilha
   * @param {Object} headers - Mapeamento de cabeçalhos
   * @returns {Object} - Dados do médico
   */
  extrairDadosLinha(row, headers) {
    const dados = {};

    row.eachCell((cell, colNumber) => {
      const campo = headers[colNumber];
      if (campo && cell.value) {
        let valor = cell.value;

        // Tratamento especial para alguns campos
        if (campo === 'data_nascimento' && valor instanceof Date) {
          dados[campo] = valor;
        } else if (campo === 'sexo') {
          const sexoMap = {
            'M': 'MASCULINO',
            'F': 'FEMININO',
            'MASCULINO': 'MASCULINO',
            'FEMININO': 'FEMININO',
            'OUTRO': 'OUTRO'
          };
          dados[campo] = sexoMap[valor.toString().toUpperCase()] || null;
        } else {
          dados[campo] = valor.toString().trim();
        }
      }
    });

    return dados;
  }

  /**
   * Processar um médico da importação
   * @param {Object} dados - Dados do médico
   * @param {number} linha - Número da linha
   * @param {Object} resultado - Objeto de resultado
   */
  async processarMedico(dados, linha, resultado) {
    try {
      // Validar dados
      const validation = validateDoctorData({
        nomeCompleto: dados.nome,
        email: dados.email,
        crm: dados.crm,
        crm_uf: this.extrairUfCrm(dados.crm),
        especialidade: dados.especialidade,
        telefone: dados.telefone,
        celular: dados.celular,
        cpf: dados.cpf,
        data_nascimento: dados.data_nascimento
      });

      if (!validation.isValid) {
        resultado.erros++;
        resultado.detalhes.push({
          linha,
          tipo: 'Validação',
          dados: dados.nome || `Linha ${linha}`,
          erro: validation.errors.join(', ')
        });
        return;
      }

      // Verificar duplicatas
      const duplicatas = await this.verificarDuplicatas(dados);
      if (duplicatas.length > 0) {
        resultado.erros++;
        resultado.detalhes.push({
          linha,
          tipo: 'Duplicata',
          dados: dados.nome,
          erro: `Já existe: ${duplicatas.join(', ')}`
        });
        return;
      }

      // Criar médico
      const medico = await this.criarMedico(dados);
      
      resultado.sucessos++;
      resultado.medicosImportados.push({
        linha,
        nome: dados.nome,
        crm: dados.crm,
        id: medico.id
      });

    } catch (error) {
      resultado.erros++;
      resultado.detalhes.push({
        linha,
        tipo: 'Erro',
        dados: dados.nome || `Linha ${linha}`,
        erro: error.message
      });
    }
  }

  /**
   * Extrair UF do CRM
   * @param {string} crm - CRM completo
   * @returns {string} - UF extraída
   */
  extrairUfCrm(crm) {
    if (!crm) return 'SP';
    const match = crm.match(/[\/-]([A-Z]{2})$/);
    return match ? match[1] : 'SP';
  }

  /**
   * Verificar duplicatas
   * @param {Object} dados - Dados do médico
   * @returns {Array} - Lista de campos duplicados
   */
  async verificarDuplicatas(dados) {
    const duplicatas = [];

    // Verificar CRM
    if (dados.crm) {
      const crmExiste = await databaseService.client.medico.findUnique({
        where: { crm: dados.crm }
      });
      if (crmExiste) duplicatas.push('CRM');
    }

    // Verificar Email
    if (dados.email) {
      const emailExiste = await databaseService.client.usuario.findUnique({
        where: { email: dados.email }
      });
      if (emailExiste) duplicatas.push('Email');
    }

    // Verificar CPF
    if (dados.cpf) {
      const cpfLimpo = dados.cpf.replace(/[^\d]/g, '');
      const cpfExiste = await databaseService.client.medico.findFirst({
        where: { cpf: cpfLimpo }
      });
      if (cpfExiste) duplicatas.push('CPF');
    }

    return duplicatas;
  }

  /**
   * Criar médico no banco
   * @param {Object} dados - Dados do médico
   * @returns {Object} - Médico criado
   */
  async criarMedico(dados) {
    return await databaseService.client.$transaction(async (prisma) => {
      // Criar usuário
      const usuario = await prisma.usuario.create({
        data: {
          nome: dados.nome,
          email: dados.email,
          senha: await hashPassword('temp123'), // Senha temporária
          tipo: 'MEDICO',
          ativo: true
        }
      });

      // Criar médico
      const medico = await prisma.medico.create({
        data: {
          usuario_id: usuario.id,
          crm: dados.crm,
          crm_uf: this.extrairUfCrm(dados.crm),
          especialidade: dados.especialidade,
          telefone: dados.telefone,
          celular: dados.celular,
          cpf: dados.cpf ? dados.cpf.replace(/[^\d]/g, '') : null,
          data_nascimento: dados.data_nascimento ? new Date(dados.data_nascimento) : null,
          sexo: dados.sexo,
          cep: dados.cep ? dados.cep.replace(/[^\d]/g, '') : null,
          logradouro: dados.logradouro,
          numero_endereco: dados.numero,
          complemento_endereco: dados.complemento,
          bairro: dados.bairro,
          cidade: dados.cidade,
          uf: dados.estado,
          formacao: dados.formacao,
          experiencia: dados.experiencia,
          observacoes: dados.observacoes
        }
      });

      return medico;
    });
  }

  /**
   * Gerar template Excel para importação
   * @returns {Buffer} - Buffer do arquivo template
   */
  async gerarTemplateImportacao() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template Importação Médicos');

    // Cabeçalhos
    const headers = [
      'Nome Completo *',
      'Email *',
      'CRM *',
      'Especialidade *',
      'Telefone *',
      'Celular',
      'CPF',
      'Data Nascimento',
      'Sexo',
      'CEP',
      'Logradouro',
      'Numero',
      'Complemento',
      'Bairro',
      'Cidade',
      'Estado',
      'Formação',
      'Experiência',
      'Observações'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };
    });

    // Linha de exemplo
    worksheet.addRow([
      'Dr. João Silva',
      'joao.silva@email.com',
      '12345/SP',
      'Cardiologia',
      '(11) 99999-9999',
      '(11) 88888-8888',
      '123.456.789-00',
      '1980-01-15',
      'MASCULINO',
      '01234-567',
      'Rua das Flores',
      '123',
      'Apto 45',
      'Centro',
      'São Paulo',
      'SP',
      'Medicina - USP',
      '10 anos',
      'Especialista em cardiologia intervencionista'
    ]);

    // Ajustar larguras
    worksheet.columns = headers.map(() => ({ width: 15 }));

    // Instruções
    worksheet.addRow([]);
    worksheet.addRow(['INSTRUÇÕES:']);
    worksheet.addRow(['* Campos obrigatórios']);
    worksheet.addRow(['* CRM deve incluir UF (ex: 12345/SP)']);
    worksheet.addRow(['* Data no formato AAAA-MM-DD']);
    worksheet.addRow(['* Sexo: MASCULINO, FEMININO ou OUTRO']);
    worksheet.addRow(['* CEP apenas números ou com hífen']);

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

module.exports = new ImportacaoService();