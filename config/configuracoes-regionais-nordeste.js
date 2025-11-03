// Configurações Regionais do Nordeste para MedFast
// 40% Capitais + 60% Interior (Raio 100km)

const CONFIGURACOES_REGIONAIS_NORDESTE = {
  
  // ===== CAPITAIS NORDESTINAS (40% do foco) =====
  capitais: {
    salvador_ba: {
      populacao: 2900000,
      regiao_metro: 4000000,
      
      configuracao: {
        tipo_contexto: "capital_referencia_regional",
        conectividade: "alta", // 100Mbps+ fibra
        especialidades: "completo_espectro",
        planos_saude: 0.35, // 35% penetração
        digitalizacao: 0.80,
        
        funcionalidades_habilitadas: [
          "telemedicina_avancada",
          "referencias_estaduais", 
          "auditoria_complexa",
          "multiplos_convenios",
          "pesquisa_clinica",
          "ensino_medico"
        ],
        
        integracao_sistemas: [
          "sus_estadual",
          "hapvida_regional", 
          "unimed_bahia",
          "hospitais_universitarios"
        ],
        
        fluxos_referencia: {
          recebe_de: ["interior_bahia", "sergipe", "alagoas"],
          envia_para: ["sao_paulo", "rio_janeiro", "brasilia"],
          telemedicina_para: "interior_100km_radius"
        }
      },
      
      hospitais_principais: [
        { nome: "Hospital das Clínicas UFBA", tipo: "universitario", leitos: 500 },
        { nome: "Hospital Português", tipo: "privado", leitos: 300 },
        { nome: "Hospital da Bahia", tipo: "privado", leitos: 200 }
      ]
    },

    fortaleza_ce: {
      populacao: 2700000,
      regiao_metro: 4100000,
      
      configuracao: {
        tipo_contexto: "capital_hub_tecnologico", 
        conectividade: "muito_alta", // 5G + fibra
        especialidades: "completo_com_inovacao",
        planos_saude: 0.32,
        digitalizacao: 0.85,
        
        funcionalidades_habilitadas: [
          "telemedicina_ia",
          "iot_medico",
          "blockchain_prontuarios",
          "referencias_nacionais",
          "startups_saude"
        ],
        
        especializacoes: [
          "telemedicina_rural",
          "cardiologia_digital", 
          "dermatologia_ia",
          "radiologia_remota"
        ]
      }
    },

    recife_pe: {
      populacao: 1700000,
      regiao_metro: 4000000,
      
      configuracao: {
        tipo_contexto: "capital_polo_medico",
        conectividade: "alta",
        especialidades: "tradicional_completo", 
        planos_saude: 0.38,
        digitalizacao: 0.75,
        
        cluster_medico: {
          integra_com: ["joao_pessoa", "maceio", "caruaru"],
          especializacao: "medicina_tropical",
          pesquisa_forte: true
        }
      }
    }
  },

  // ===== INTERIOR NORDESTE (60% do foco) =====
  interior: {
    
    // Cidades Grande Porte (100K+ hab)
    grande_porte: {
      feira_santana_ba: {
        populacao: 619609,
        distancia_capital: 108, // km de Salvador
        
        configuracao: {
          tipo_contexto: "interior_polo_regional",
          conectividade: "media_alta", // 50Mbps fibra 
          especialidades: "basico_ampliado",
          planos_saude: 0.18,
          digitalizacao: 0.60,
          
          papel_regional: "hub_distribuicao",
          atende_municipios: 25,
          populacao_referencia: 800000,
          
          funcionalidades_habilitadas: [
            "telemedicina_consultoria",
            "referencia_automatica",
            "regulacao_regional",
            "emergencia_complexa"
          ],
          
          especialidades_locais: [
            "cardiologia_basica",
            "ortopedia_geral", 
            "ginecologia_obstetricia",
            "pediatria_complexa",
            "cirurgia_geral"
          ],
          
          fluxo_referencia: {
            recebe_de: ["santo_antonio_jesus", "cruz_das_almas", "amargosa"],
            envia_para: "salvador",
            resolve_local: 0.75 // 75% resolutividade
          }
        }
      },

      petrolina_pe: {
        populacao: 354317,
        distancia_capital: 720, // km de Recife (caso especial)
        
        configuracao: {
          tipo_contexto: "interior_polo_microrregional",
          conectividade: "media",
          especializacao: "agronegocio_saude",
          
          // Polo bi-estadual PE-BA
          atende_estados: ["pernambuco", "bahia"],
          integracao_especial: "juazeiro_ba",
          
          telemedicina_forte: {
            conecta_com: "recife",
            especialidades_remotas: ["neurologia", "cardiologia_intervencionista"],
            horarios_estendidos: true
          }
        }
      },

      caruaru_pe: {
        populacao: 361118,
        distancia_capital: 134, // km de Recife
        
        configuracao: {
          tipo_contexto: "interior_tradicional_forte",
          conectividade: "media",
          tradicao_medica: true, // Referência histórica regional
          
          especializacoes: [
            "cardiologia_referencia", // Hospital do Coração
            "maternidade_alto_risco",
            "trauma_ortopedia"
          ],
          
          fluxo_regional: {
            atende_agreste: ["garanhuns", "arcoverde", "pesqueira"],
            resolve_local: 0.70,
            envia_complexo: "recife"
          }
        }
      }
    },

    // Cidades Médio Porte (50-100K hab) 
    medio_porte: {
      alagoinhas_ba: {
        populacao: 155904,
        distancia_capital: 124, // km de Salvador
        
        configuracao: {
          tipo_contexto: "interior_intermediario",
          conectividade: "media_baixa", // 20Mbps variável
          especialidades: "basico_essencial",
          planos_saude: 0.12,
          digitalizacao: 0.45,
          
          desafios: [
            "conectividade_instavel",
            "rotatividade_medicos", 
            "equipamentos_limitados"
          ],
          
          solucoes_adaptativas: [
            "modo_offline_robusto",
            "sync_batch_inteligente",
            "interface_simplificada",
            "suporte_whatsapp"
          ],
          
          fluxo_simples: {
            "esf_local": "hospital_municipal",
            "media_complexidade": "feira_santana", 
            "alta_complexidade": "salvador"
          }
        }
      },

      garanhuns_pe: {
        populacao: 140577,
        distancia_capital: 230, // km de Recife
        
        configuracao: {
          tipo_contexto: "interior_clima_serra",
          especializacao: "saude_idoso", // Cidade dos aposentados
          
          perfil_demografico: {
            idosos_percentual: 0.18, // 18% 60+ anos
            doencas_cronicas_alta: true,
            turismo_saude: true
          },
          
          adaptacoes_sistema: [
            "prontuario_geriatrico_ampliado",
            "controle_medicamentos_cronicos", 
            "telemedicina_domiciliar",
            "interface_acessibilidade"
          ]
        }
      }
    },

    // Cidades Pequeno Porte (15-50K hab)
    pequeno_porte: {
      cruz_das_almas_ba: {
        populacao: 58997,
        distancia_capital: 146, // km de Salvador
        
        configuracao: {
          tipo_contexto: "interior_basico_rural", 
          conectividade: "baixa_instavel", // 5-15Mbps
          especialidades: "atencao_primaria_ampliada",
          planos_saude: 0.08,
          digitalizacao: 0.30,
          
          realidade_local: {
            economia: "agricultura_fumo",
            renda_media: "baixa",
            escolaridade_digital: "limitada",
            cultura_papel: "forte"
          },
          
          modo_operacao: "hibrido_papel_digital",
          
          funcionalidades_essenciais: [
            "cadastro_paciente_simplificado",
            "agendamento_basico", 
            "prontuario_digital_opcional",
            "impressao_automatica",
            "backup_local_diario"
          ],
          
          suporte_especial: [
            "treinamento_presencial",
            "suporte_telefonico_regional",
            "manual_impresso",
            "videos_tutoriais_offline"
          ],
          
          integracao_regional: {
            "referencia_prima": "feira_santana",
            "emergencia": "santo_antonio_jesus", 
            "especialista": "telemedicina_salvador",
            "samu": "central_regional_feira"
          }
        }
      },

      sao_bento_do_una_pe: {
        populacao: 56432,
        distancia_capital: 180, // km de Recife
        
        configuracao: {
          tipo_contexto: "interior_basico_sertao",
          conectividade: "muito_baixa", // 2-8Mbps
          
          desafios_especificos: [
            "seca_periodica",
            "migracao_sazonal",
            "energia_eletrica_instavel", 
            "internet_satelite_apenas"
          ],
          
          adaptacoes_extremas: [
            "modo_offline_completo",
            "backup_energia_solar",
            "sincronizacao_via_smartphone_4g",
            "dados_compactados_extremo"
          ],
          
          modelo_assistencial: {
            "esf_itinerante": true,
            "medico_familia_rotativo": "semanal",
            "especialista": "mensal_itinerante",
            "emergencia": "stabilizar_transferir"
          }
        }
      }
    }
  },

  // ===== CONFIGURAÇÕES TÉCNICAS POR CONTEXTO =====
  configs_tecnicas: {
    
    capital_referencia: {
      performance: {
        max_usuarios_simultaneos: 500,
        tempo_resposta_target: "< 1s",
        uptime_requirement: "99.9%",
        backup_frequency: "tempo_real"
      },
      
      recursos: {
        storage_local: "1TB SSD",
        ram_minima: "16GB", 
        processamento: "multi_core",
        conectividade_backup: "4G_dedicado"
      }
    },

    interior_polo: {
      performance: {
        max_usuarios_simultaneos: 100,
        tempo_resposta_target: "< 3s", 
        uptime_requirement: "99.5%",
        backup_frequency: "cada_4h"
      },
      
      recursos: {
        storage_local: "500GB SSD",
        ram_minima: "8GB",
        processamento: "dual_core", 
        conectividade_backup: "4G_compartilhado"
      }
    },

    interior_basico: {
      performance: {
        max_usuarios_simultaneos: 20,
        tempo_resposta_target: "< 5s",
        uptime_requirement: "99.0%", 
        backup_frequency: "diario_noturno"
      },
      
      recursos: {
        storage_local: "250GB SSD",
        ram_minima: "4GB",
        processamento: "single_core",
        conectividade_backup: "smartphone_hotspot"
      },
      
      modo_degradado: {
        funciona_offline: "sim_completo",
        sync_quando_conecta: "automatico",
        compressao_dados: "maxima", 
        interface: "ultra_simplificada"
      }
    }
  },

  // ===== INTEGRAÇÕES REGIONAIS =====
  integracoes_nordeste: {
    
    planos_saude: {
      hapvida: {
        market_share: 0.60, // 60% do mercado regional
        integracao: "api_completa",
        guias_eletronicas: true,
        auditoria_tempo_real: true
      },
      
      unimed_regional: {
        market_share: 0.25,
        especificidades: "cooperativa_local",
        variacao_por_estado: true
      }
    },

    sus_regional: {
      sisreg_estadual: {
        integracao_obrigatoria: true,
        padrao: "web_service_soap",
        frequencia_sync: "tempo_real"
      },
      
      esus_aps: {
        utilizacao: 0.60, // 60% dos municipios
        versao_predominante: "5.2",
        sync_necessaria: "CDS_individual"
      }
    },

    sistemas_emergencia: {
      samu_192: {
        integracao_desejada: true,
        padroes: "hl7_fhir_basic",
        tempo_resposta: "< 30s"
      }
    }
  },

  // ===== ROADMAP IMPLANTAÇÃO NORDESTE =====
  roadmap_implementacao: {
    
    fase_1_piloto: {
      duracao: "3_meses",
      locais: [
        {
          tipo: "capital",
          cidade: "salvador_ba", 
          unidades: ["hospital_portugues", "clinica_referencia"]
        },
        {
          tipo: "interior_polo", 
          cidade: "feira_santana_ba",
          unidades: ["hospital_regional"]
        },
        {
          tipo: "interior_basico",
          cidade: "cruz_das_almas_ba", 
          unidades: ["esf_centro", "hospital_municipal"]
        }
      ],
      
      objetivos: [
        "validar_conectividade_variavel",
        "testar_modo_offline", 
        "medir_adocao_por_contexto",
        "identificar_adaptacoes_necessarias"
      ]
    },

    fase_2_expansao: {
      duracao: "6_meses",
      cobertura: {
        capitais: ["fortaleza_ce", "recife_pe", "salvador_ba"],
        polos: ["caruaru_pe", "petrolina_pe", "sobral_ce"],
        basicos: 12 // municipios selecionados
      }
    },

    fase_3_integracao: {
      duracao: "12_meses", 
      foco: [
        "telemedicina_capital_interior",
        "referencias_automatizadas",
        "analytics_regionais",
        "compliance_ans_completo"
      ]
    }
  },

  // ===== MÉTRICAS DE SUCESSO REGIONAIS =====
  metricas_sucesso: {
    
    por_contexto: {
      capital: {
        adocao_target: 0.80, // 80% profissionais
        performance_target: "< 1s",
        satisfacao_target: 4.7, // /5
        integracao_sistemas: 0.90 // 90% integrado
      },
      
      interior_polo: {
        adocao_target: 0.70,
        performance_target: "< 3s", 
        satisfacao_target: 4.5,
        modo_offline_uso: 0.30 // 30% do tempo
      },
      
      interior_basico: {
        adocao_target: 0.60,
        performance_target: "< 5s",
        satisfacao_target: 4.2, 
        modo_offline_uso: 0.50 // 50% do tempo
      }
    },

    regionais: {
      referencias_digitais: 0.75, // 75% referencias pelo sistema
      telemedicina_adocao: 0.40, // 40% consultas remotas
      reducao_custos_admin: 0.25, // 25% redução custos
      tempo_referencia: "50%_reducao" // 50% menos tempo
    }
  }
};

// Função para obter configuração por localização
function getConfiguracaoRegional(latitude, longitude, populacao, distanciaCapital) {
  
  // Lógica de classificação automática
  if (populacao > 1000000) {
    return CONFIGURACOES_REGIONAIS_NORDESTE.capitais;
  }
  
  if (populacao > 100000 || distanciaCapital < 50) {
    return CONFIGURACOES_REGIONAIS_NORDESTE.interior.grande_porte;
  }
  
  if (populacao > 50000 || distanciaCapital < 100) {
    return CONFIGURACOES_REGIONAIS_NORDESTE.interior.medio_porte;
  }
  
  return CONFIGURACOES_REGIONAIS_NORDESTE.interior.pequeno_porte;
}

// Exportar configurações
export default CONFIGURACOES_REGIONAIS_NORDESTE;