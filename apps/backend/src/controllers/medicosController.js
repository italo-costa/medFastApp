/**
 * Controller de Médicos
 * Gerencia todas as operações relacionadas aos médicos
 */

const databaseService = require('../services/database');
const ResponseService = require('../services/responseService');
const { validateDoctorData, hashPassword, formatCPF, formatPhone, formatCEP } = require('../utils/validators');
const { processarFotoMedico, removerFotoAnterior } = require('../middleware/uploadMiddleware');
const relatoriosService = require('../services/relatoriosService');
const importacaoService = require('../services/importacaoService');
const historicoService = require('../services/historicoService');

class MedicosController {
  /**
   * Listar médicos com filtros e paginação
   */
  async listar(req, res) {
    const { search, especialidade, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Construir filtros
    let where = {
      usuario: {
        ativo: true
      }
    };

    if (search) {
      where.OR = [
        {
          usuario: {
            nome: { contains: search, mode: 'insensitive' }
          }
        },
        { crm: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (especialidade) {
      where.especialidade = especialidade;
    }

    try {
      const [medicos, total] = await Promise.all([
        databaseService.client.medico.findMany({
          where,
          include: {
            usuario: {
              select: {
                nome: true,
                email: true,
                ativo: true
              }
            },
            _count: {
              select: { consultas: true }
            }
          },
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { crm: 'asc' }
        }),
        databaseService.client.medico.count({ where })
      ]);

      // Formatar dados para o frontend
      const medicosFormatados = medicos.map(medico => ({
        id: medico.id,
        nomeCompleto: medico.usuario?.nome || 'Nome não disponível',
        crm: medico.crm,
        crm_uf: medico.crm_uf,
        especialidade: medico.especialidade,
        outras_especialidades: medico.outras_especialidades,
        telefone: medico.telefone,
        celular: medico.celular,
        cpf: medico.cpf ? formatCPF(medico.cpf) : null,
        data_nascimento: medico.data_nascimento,
        sexo: medico.sexo,
        email: medico.usuario?.email || 'Email não disponível',
        status: medico.usuario?.ativo ? 'ATIVO' : 'INATIVO',
        totalConsultas: medico._count?.consultas || 0,
        // Endereço estruturado
        endereco: medico.endereco, // Compatibilidade
        cep: medico.cep ? formatCEP(medico.cep) : null,
        logradouro: medico.logradouro,
        numero: medico.numero_endereco,
        complemento: medico.complemento_endereco,
        bairro: medico.bairro,
        cidade: medico.cidade,
        estado: medico.uf
      }));

      return ResponseService.paginated(res,
        medicosFormatados,
        { page, limit, total },
        `${medicosFormatados.length} médicos encontrados`
      );

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao listar:', error.message);
      return ResponseService.error(res, 'Erro ao buscar médicos', 500, error.message);
    }
  }

  /**
   * Buscar médico por ID
   */
  async buscarPorId(req, res) {
    const { id } = req.params;

    try {
      const medico = await databaseService.client.medico.findUnique({
        where: { id },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              ativo: true
            }
          },
          _count: {
            select: {
              consultas: true,
              prontuarios: true
            }
          }
        }
      });

      if (!medico) {
        return res.notFound('Médico não encontrado');
      }

      const medicoFormatado = {
        id: medico.id,
        nomeCompleto: medico.usuario?.nome || 'Nome não disponível',
        crm: medico.crm,
        crm_uf: medico.crm_uf,
        especialidade: medico.especialidade,
        outras_especialidades: medico.outras_especialidades,
        telefone: medico.telefone,
        celular: medico.celular,
        cpf: medico.cpf ? formatCPF(medico.cpf) : null,
        data_nascimento: medico.data_nascimento,
        sexo: medico.sexo,
        email: medico.usuario?.email || 'Email não disponível',
        status: medico.usuario?.ativo ? 'ATIVO' : 'INATIVO',
        // Endereço estruturado
        endereco: medico.endereco, // Compatibilidade
        cep: medico.cep ? formatCEP(medico.cep) : null,
        logradouro: medico.logradouro,
        numero: medico.numero_endereco,
        complemento: medico.complemento_endereco,
        bairro: medico.bairro,
        cidade: medico.cidade,
        estado: medico.uf,
        // Campos profissionais
        formacao: medico.formacao,
        experiencia: medico.experiencia,
        horario_atendimento: medico.horario_atendimento,
        observacoes: medico.observacoes,
        estatisticas: {
          totalConsultas: medico._count?.consultas || 0,
          totalProntuarios: medico._count?.prontuarios || 0
        }
      };

      res.success(medicoFormatado, 'Médico encontrado com sucesso');

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao buscar por ID:', error.message);
      res.error('Erro ao buscar médico', 500, error.message);
    }
  }

  /**
   * Criar novo médico
   */
  async criar(req, res) {
    const dadosMedico = req.body;

    // Validar dados de entrada
    const validation = validateDoctorData(dadosMedico);
    if (!validation.isValid) {
      return res.error('Dados inválidos', 400, validation.errors);
    }

    try {
      // Verificar se CRM já existe
      const crmExistente = await databaseService.client.medico.findUnique({
        where: { crm: dadosMedico.crm }
      });

      if (crmExistente) {
        return res.error('CRM já cadastrado no sistema', 409);
      }

      // Verificar se email já existe
      const emailExistente = await databaseService.client.usuario.findUnique({
        where: { email: dadosMedico.email }
      });

      if (emailExistente) {
        return res.error('Email já cadastrado no sistema', 409);
      }

      // Verificar se CPF já existe (se fornecido)
      if (dadosMedico.cpf) {
        const cpfLimpo = dadosMedico.cpf.replace(/[^\d]/g, '');
        const cpfExistente = await databaseService.client.medico.findFirst({
          where: { cpf: cpfLimpo }
        });

        if (cpfExistente) {
          return res.error('CPF já cadastrado no sistema', 409);
        }
      }

      // Extrair dados separados
      const {
        nomeCompleto,
        email,
        senha = 'temp123', // Senha temporária
        crm,
        crm_uf,
        especialidade,
        outras_especialidades,
        telefone,
        celular,
        cpf,
        data_nascimento,
        sexo,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        formacao,
        experiencia,
        horario_atendimento,
        observacoes,
        status = 'ATIVO'
      } = dadosMedico;

      // Hash da senha
      const senhaHash = await hashPassword(senha);

      // Montar endereço completo para compatibilidade
      const enderecoCompleto = [logradouro, numero, complemento, bairro, cidade, estado]
        .filter(Boolean).join(', ');

      // Criar médico com usuário em transação
      const novoMedico = await databaseService.client.$transaction(async (prisma) => {
        // Criar usuário
        const usuario = await prisma.usuario.create({
          data: {
            nome: nomeCompleto,
            email,
            senha: senhaHash,
            tipo: 'MEDICO',
            ativo: status === 'ATIVO'
          }
        });

        // Criar médico
        const medico = await prisma.medico.create({
          data: {
            usuario_id: usuario.id,
            crm,
            crm_uf,
            especialidade,
            outras_especialidades,
            telefone,
            celular,
            cpf: cpf ? cpf.replace(/[^\d]/g, '') : null,
            data_nascimento: data_nascimento ? new Date(data_nascimento) : null,
            sexo,
            endereco: enderecoCompleto || null,
            cep: cep ? cep.replace(/[^\d]/g, '') : null,
            logradouro,
            numero_endereco: numero,
            complemento_endereco: complemento,
            bairro,
            cidade,
            uf: estado,
            formacao,
            experiencia,
            horario_atendimento,
            observacoes
          },
          include: {
            usuario: {
              select: {
                nome: true,
                email: true,
                ativo: true
              }
            }
          }
        });

        return medico;
      });

      res.success(
        {
          id: novoMedico.id,
          nome: novoMedico.usuario.nome,
          crm: novoMedico.crm,
          especialidade: novoMedico.especialidade
        },
        'Médico cadastrado com sucesso',
        201
      );

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao criar:', error.message);
      
      if (error.code === 'P2002') {
        return res.error('Dados já cadastrados (CRM, Email ou CPF)', 409);
      }
      
      res.error('Erro ao cadastrar médico', 500, error.message);
    }
  }

  /**
   * Atualizar médico
   */
  async atualizar(req, res) {
    const { id } = req.params;
    const dadosAtualizacao = req.body;

    // Validar dados de entrada (sem obrigatoriedade para atualização)
    const validation = validateDoctorData(dadosAtualizacao);
    if (!validation.isValid) {
      return res.error('Dados inválidos', 400, validation.errors);
    }

    try {
      // Verificar se médico existe
      const medicoExistente = await databaseService.client.medico.findUnique({
        where: { id },
        include: { usuario: true }
      });

      if (!medicoExistente) {
        return res.notFound('Médico não encontrado');
      }

      // Verificar conflitos apenas se os dados mudaram
      if (dadosAtualizacao.crm && dadosAtualizacao.crm !== medicoExistente.crm) {
        const crmConflito = await databaseService.client.medico.findUnique({
          where: { crm: dadosAtualizacao.crm }
        });
        if (crmConflito) {
          return res.error('CRM já cadastrado para outro médico', 409);
        }
      }

      if (dadosAtualizacao.email && dadosAtualizacao.email !== medicoExistente.usuario.email) {
        const emailConflito = await databaseService.client.usuario.findUnique({
          where: { email: dadosAtualizacao.email }
        });
        if (emailConflito) {
          return res.error('Email já cadastrado para outro usuário', 409);
        }
      }

      if (dadosAtualizacao.cpf) {
        const cpfLimpo = dadosAtualizacao.cpf.replace(/[^\d]/g, '');
        if (cpfLimpo !== medicoExistente.cpf) {
          const cpfConflito = await databaseService.client.medico.findFirst({
            where: { 
              cpf: cpfLimpo,
              id: { not: id }
            }
          });
          if (cpfConflito) {
            return res.error('CPF já cadastrado para outro médico', 409);
          }
        }
      }

      // Extrair dados
      const {
        nomeCompleto,
        email,
        crm,
        crm_uf,
        especialidade,
        outras_especialidades,
        telefone,
        celular,
        cpf,
        data_nascimento,
        sexo,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        formacao,
        experiencia,
        horario_atendimento,
        observacoes,
        status
      } = dadosAtualizacao;

      // Montar endereço completo para compatibilidade
      const enderecoCompleto = [logradouro, numero, complemento, bairro, cidade, estado]
        .filter(Boolean).join(', ');

      // Atualizar em transação
      const medicoAtualizado = await databaseService.client.$transaction(async (prisma) => {
        // Atualizar dados do usuário
        if (nomeCompleto || email || status !== undefined) {
          await prisma.usuario.update({
            where: { id: medicoExistente.usuario_id },
            data: {
              ...(nomeCompleto && { nome: nomeCompleto }),
              ...(email && { email }),
              ...(status !== undefined && { ativo: status === 'ATIVO' })
            }
          });
        }

        // Atualizar dados do médico
        const medico = await prisma.medico.update({
          where: { id },
          data: {
            ...(crm && { crm }),
            ...(crm_uf && { crm_uf }),
            ...(especialidade && { especialidade }),
            ...(outras_especialidades !== undefined && { outras_especialidades }),
            ...(telefone && { telefone }),
            ...(celular !== undefined && { celular }),
            ...(cpf !== undefined && { cpf: cpf ? cpf.replace(/[^\d]/g, '') : null }),
            ...(data_nascimento !== undefined && { 
              data_nascimento: data_nascimento ? new Date(data_nascimento) : null 
            }),
            ...(sexo !== undefined && { sexo }),
            ...(enderecoCompleto && { endereco: enderecoCompleto }),
            ...(cep !== undefined && { cep: cep ? cep.replace(/[^\d]/g, '') : null }),
            ...(logradouro !== undefined && { logradouro }),
            ...(numero !== undefined && { numero_endereco: numero }),
            ...(complemento !== undefined && { complemento_endereco: complemento }),
            ...(bairro !== undefined && { bairro }),
            ...(cidade !== undefined && { cidade }),
            ...(estado !== undefined && { uf: estado }),
            ...(formacao !== undefined && { formacao }),
            ...(experiencia !== undefined && { experiencia }),
            ...(horario_atendimento !== undefined && { horario_atendimento }),
            ...(observacoes !== undefined && { observacoes })
          },
          include: {
            usuario: {
              select: {
                nome: true,
                email: true,
                ativo: true
              }
            }
          }
        });

        return medico;
      });

      res.success(
        {
          id: medicoAtualizado.id,
          nome: medicoAtualizado.usuario.nome,
          crm: medicoAtualizado.crm,
          especialidade: medicoAtualizado.especialidade
        },
        'Médico atualizado com sucesso'
      );

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao atualizar:', error.message);
      res.error('Erro ao atualizar médico', 500, error.message);
    }
  }

  /**
   * Remover médico (soft delete)
   */
  async remover(req, res) {
    const { id } = req.params;

    try {
      const medico = await databaseService.client.medico.findUnique({
        where: { id },
        include: { usuario: true }
      });

      if (!medico) {
        return res.notFound('Médico não encontrado');
      }

      // Desativar usuário (soft delete)
      await databaseService.client.usuario.update({
        where: { id: medico.usuario_id },
        data: { ativo: false }
      });

      res.success(null, 'Médico removido com sucesso');

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao remover:', error.message);
      res.error('Erro ao remover médico', 500, error.message);
    }
  }

  /**
   * Upload de foto do médico
   */
  async uploadFoto(req, res) {
    const { id } = req.params;

    try {
      // Verificar se médico existe
      const medico = await databaseService.client.medico.findUnique({
        where: { id },
        select: { id: true, foto_url: true }
      });

      if (!medico) {
        return res.notFound('Médico não encontrado');
      }

      // Verificar se há arquivo no request
      if (!req.validatedFile) {
        return res.error('Nenhuma foto fornecida', 400);
      }

      // Processar a nova foto
      const fotoInfo = await processarFotoMedico(
        req.validatedFile.buffer,
        req.validatedFile.originalname,
        id
      );

      // Remover foto anterior se existir
      if (medico.foto_url) {
        await removerFotoAnterior(medico.foto_url);
      }

      // Atualizar médico no banco
      await databaseService.client.medico.update({
        where: { id },
        data: {
          foto_url: fotoInfo.url,
          foto_nome_original: fotoInfo.originalName
        }
      });

      res.success({
        foto_url: fotoInfo.url,
        nome_original: fotoInfo.originalName,
        tamanho: fotoInfo.size
      }, 'Foto atualizada com sucesso');

    } catch (error) {
      console.error('❌ [MEDICOS] Erro no upload da foto:', error.message);
      res.error('Erro ao fazer upload da foto', 500, error.message);
    }
  }

  /**
   * Remover foto do médico
   */
  async removerFoto(req, res) {
    const { id } = req.params;

    try {
      // Buscar médico
      const medico = await databaseService.client.medico.findUnique({
        where: { id },
        select: { id: true, foto_url: true }
      });

      if (!medico) {
        return res.notFound('Médico não encontrado');
      }

      if (!medico.foto_url) {
        return res.error('Médico não possui foto', 400);
      }

      // Remover arquivo físico
      await removerFotoAnterior(medico.foto_url);

      // Atualizar banco
      await databaseService.client.medico.update({
        where: { id },
        data: {
          foto_url: null,
          foto_nome_original: null
        }
      });

      res.success(null, 'Foto removida com sucesso');

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao remover foto:', error.message);
      res.error('Erro ao remover foto', 500, error.message);
    }
  }

  /**
   * Gerar relatório Excel de médicos
   */
  async gerarRelatorioExcel(req, res) {
    try {
      const { search, especialidade, status, cidade, estado } = req.query;
      
      // Construir filtros para busca
      let where = {
        usuario: {
          ativo: status === 'INATIVO' ? false : status === 'ATIVO' ? true : undefined
        }
      };

      if (search) {
        where.OR = [
          {
            usuario: {
              nome: { contains: search, mode: 'insensitive' }
            }
          },
          { crm: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (especialidade) {
        where.especialidade = especialidade;
      }

      if (cidade) {
        where.cidade = { contains: cidade, mode: 'insensitive' };
      }

      if (estado) {
        where.uf = estado;
      }

      // Buscar médicos
      const medicos = await databaseService.client.medico.findMany({
        where,
        include: {
          usuario: {
            select: {
              nome: true,
              email: true,
              ativo: true
            }
          }
        },
        orderBy: { usuario: { nome: 'asc' } }
      });

      // Formatar dados
      const medicosFormatados = medicos.map(medico => ({
        nomeCompleto: medico.usuario?.nome,
        cpf: medico.cpf ? formatCPF(medico.cpf) : null,
        crm: medico.crm,
        especialidade: medico.especialidade,
        telefone: medico.telefone ? formatPhone(medico.telefone) : null,
        email: medico.usuario?.email,
        cidade: medico.cidade,
        estado: medico.uf,
        status: medico.usuario?.ativo ? 'ATIVO' : 'INATIVO',
        data_nascimento: medico.data_nascimento,
        criado_em: medico.criado_em,
        foto_url: medico.foto_url
      }));

      // Gerar relatório
      const buffer = await relatoriosService.gerarExcelMedicos(medicosFormatados, {
        search,
        especialidade,
        status,
        cidade,
        estado
      });

      // Definir nome do arquivo
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `relatorio_medicos_${timestamp}.xlsx`;

      // Configurar response
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao gerar relatório:', error.message);
      res.error('Erro ao gerar relatório', 500, error.message);
    }
  }

  /**
   * Gerar relatório por especialidades
   */
  async gerarRelatorioEspecialidades(req, res) {
    try {
      // Buscar todos os médicos ativos
      const medicos = await databaseService.client.medico.findMany({
        where: {
          usuario: { ativo: true }
        },
        include: {
          usuario: {
            select: {
              nome: true,
              email: true
            }
          }
        },
        orderBy: [
          { especialidade: 'asc' },
          { usuario: { nome: 'asc' } }
        ]
      });

      // Formatar dados
      const medicosFormatados = medicos.map(medico => ({
        nomeCompleto: medico.usuario?.nome,
        crm: medico.crm,
        especialidade: medico.especialidade,
        telefone: medico.telefone ? formatPhone(medico.telefone) : null,
        email: medico.usuario?.email,
        cidade: medico.cidade,
        status: 'ATIVO'
      }));

      // Gerar relatório
      const buffer = await relatoriosService.gerarRelatorioEspecialidades(medicosFormatados);

      // Definir nome do arquivo
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `relatorio_especialidades_${timestamp}.xlsx`;

      // Configurar response
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao gerar relatório de especialidades:', error.message);
      res.error('Erro ao gerar relatório de especialidades', 500, error.message);
    }
  }

  /**
   * Obter estatísticas detalhadas
   */
  async obterEstatisticas(req, res) {
    try {
      // Buscar todos os médicos
      const medicos = await databaseService.client.medico.findMany({
        include: {
          usuario: {
            select: {
              nome: true,
              email: true,
              ativo: true
            }
          }
        }
      });

      // Formatar dados
      const medicosFormatados = medicos.map(medico => ({
        nomeCompleto: medico.usuario?.nome,
        especialidade: medico.especialidade,
        estado: medico.uf,
        status: medico.usuario?.ativo ? 'ATIVO' : 'INATIVO',
        data_nascimento: medico.data_nascimento,
        criado_em: medico.criado_em,
        foto_url: medico.foto_url
      }));

      // Gerar estatísticas
      const estatisticas = relatoriosService.gerarEstatisticasMedicos(medicosFormatados);

      res.success(estatisticas, 'Estatísticas obtidas com sucesso');

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao obter estatísticas:', error.message);
      res.error('Erro ao obter estatísticas', 500, error.message);
    }
  }

  /**
   * Importar médicos em lote
   */
  async importarMedicos(req, res) {
    try {
      if (!req.file) {
        return res.error('Arquivo não foi enviado', 400);
      }

      console.log('📁 [MEDICOS] Iniciando importação em lote:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Importar médicos
      const resultado = await importacaoService.importarMedicosExcel(req.file.buffer);

      // Log do resultado
      console.log('✅ [MEDICOS] Importação concluída:', {
        total: resultado.total,
        sucessos: resultado.sucessos,
        erros: resultado.erros
      });

      res.success(resultado, 'Importação processada com sucesso');

    } catch (error) {
      console.error('❌ [MEDICOS] Erro na importação:', error.message);
      res.error('Erro na importação de médicos', 500, error.message);
    }
  }

  /**
   * Baixar template de importação
   */
  async baixarTemplateImportacao(req, res) {
    try {
      console.log('📄 [MEDICOS] Gerando template de importação');

      const buffer = await importacaoService.gerarTemplateImportacao();
      const filename = `template_importacao_medicos_${Date.now()}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);

    } catch (error) {
      console.error('❌ [MEDICOS] Erro ao gerar template:', error.message);
      res.error('Erro ao gerar template de importação', 500, error.message);
    }
  }
}

module.exports = new MedicosController();