# Análise do Contexto de Saúde Brasileiro para Gestão de Pacientes

## 📋 Objetivo
Mapear os diferentes modelos de gestão de pacientes e médicos no Brasil para informar a arquitetura do sistema MedFast, considerando SUS municipal, hospitais particulares, planos de saúde e requisitos de segurança/autorização.

---

## 🏥 1. SISTEMA ÚNICO DE SAÚDE (SUS) - MUNICÍPIOS

### Estrutura Hierárquica
- **Atenção Primária (APS)**: Porta de entrada principal, filtro organizador
- **Atenção Secundária**: Especialidades e procedimentos de média complexidade  
- **Atenção Terciária**: Alta complexidade hospitalar

### Modelo de Associação Paciente-Médico
```
Paciente → UBS/ESF → Especialista (referência) → Hospital (contrarreferência)
```

### Características Chave:
- **Universalidade**: Acesso garantido a todos os cidadãos
- **Integralidade**: Cuidado completo do indivíduo
- **Hierarquização**: Sistema de referência e contrarreferência
- **Territorialização**: Pacientes vinculados a áreas geográficas específicas
- **Equipe multidisciplinar**: Médico, enfermeiro, agente comunitário

### Sistemas de Informação:
- **e-SUS APS**: Prontuário eletrônico da atenção primária
- **SISREG**: Sistema de regulação de consultas e exames
- **CNES**: Cadastro Nacional de Estabelecimentos de Saúde

### Implicações para o Sistema:
✅ **Implementar**: Referência/contrarreferência, territorial, multiprofissional
✅ **Considerar**: Paciente pode ter múltiplos médicos em níveis diferentes
✅ **Integração**: APIs com sistemas municipais (SISREG, e-SUS)

---

## 🏨 2. HOSPITAIS PARTICULARES

### Estrutura Organizacional
- **Corpo Clínico Aberto**: Médicos externos com privilégios hospitalares
- **Corpo Clínico Fechado**: Médicos contratados exclusivos
- **Modelo Misto**: Combinação dos anteriores

### Modelo de Associação Paciente-Médico
```
Paciente → Médico Assistente → Equipe Hospitalar → Especialistas Consultores
```

### Características Chave:
- **Médico Assistente**: Responsável principal pelo caso
- **Interconsultas**: Outros especialistas podem ser chamados
- **Privilégios Hospitalares**: Médicos credenciados para atuar no hospital
- **Protocolos Internos**: Padronização de condutas e processos

### Aspectos Regulatórios:
- **Acreditação**: Certificação de qualidade (JCI, ONA, NIAHO)
- **Corpo Clínico**: Comissões de credenciamento e ética
- **Protocolos**: Medicina baseada em evidências

### Implicações para o Sistema:
✅ **Implementar**: Hierarquia médica, credenciamento, protocolos
✅ **Considerar**: Médico principal + consultores, privilégios por especialidade
✅ **Compliance**: Rastreabilidade de decisões, auditoria interna

---

## 💳 3. PLANOS DE SAÚDE E OPERADORAS

### Estrutura da Rede Credenciada
- **Rede Própria**: Médicos e hospitais da operadora
- **Rede Credenciada**: Prestadores terceirizados contratados
- **Rede Referenciada**: Parcerias específicas por região/especialidade

### Modelo de Autorização
```
Paciente → Médico Solicitante → Auditoria Médica → Autorização → Prestador
```

### Características Chave:
- **Guias**: SADT, SP/SADT, Internação, Consulta
- **Autorização Prévia**: Procedimentos de alto custo
- **Auditoria Médica**: Validação técnica e financeira
- **Glosas**: Negativas e reduções de pagamento

### Regulamentação ANS:
- **Rol de Procedimentos**: Cobertura obrigatória
- **Prazos Máximos**: Consultas, exames, cirurgias
- **TISS**: Padrão de intercâmbio de informações

### Implicações para o Sistema:
✅ **Implementar**: Sistema de guias, autorização, auditoria
✅ **Considerar**: Múltiplos planos por paciente, rede credenciada
✅ **Integração**: Padrão TISS, APIs com operadoras

---

## 🔐 4. SEGURANÇA E PROTEÇÃO DE DADOS

### LGPD (Lei Geral de Proteção de Dados)
- **Dados Sensíveis**: Informações de saúde requerem consentimento explícito
- **Minimização**: Coletar apenas dados necessários
- **Finalidade**: Uso específico e transparente dos dados
- **Portabilidade**: Direito do titular aos seus dados

### Sigilo Médico (Código de Ética Médica)
- **Confidencialidade**: Informações protegidas por sigilo profissional
- **Quebra de Sigilo**: Apenas em situações legalmente previstas
- **Prontuário**: Propriedade do paciente, guarda do médico/instituição

### Níveis de Acesso Sugeridos:
```
NIVEL 1: Dados básicos (recepção, agendamento)
NIVEL 2: Dados clínicos básicos (enfermagem, técnicos)  
NIVEL 3: Dados clínicos completos (médicos assistentes)
NIVEL 4: Dados administrativos (gestão, auditoria)
NIVEL 5: Dados completos + logs (administradores sistema)
```

### Implicações para o Sistema:
✅ **Implementar**: Controle de acesso por perfil, auditoria, criptografia
✅ **Considerar**: Consentimento granular, anonimização, logs detalhados
✅ **Compliance**: Certificação ISO 27001, relatórios LGPD

---

## 🔄 5. PADRÕES DE INTEROPERABILIDADE

### HL7 FHIR (Fast Healthcare Interoperability Resources)
- **Padrão Internacional**: Troca de informações entre sistemas de saúde
- **RESTful APIs**: Arquitetura moderna e flexível
- **Recursos**: Paciente, Médico, Consulta, Exame, Medicamento

### TISS (Troca de Informações na Saúde Suplementar)
- **Padrão Nacional**: Operadoras e prestadores
- **Guias Eletrônicas**: Padronização de solicitações
- **Demonstrativo de Retorno**: Feedback sobre pagamentos

### e-SUS/RNDS (Rede Nacional de Dados em Saúde)
- **Integração SUS**: Compartilhamento entre sistemas públicos
- **Certificação ICP-Brasil**: Assinatura digital obrigatória
- **Prontuário Nacional**: Dados unificados do paciente

### Implicações para o Sistema:
✅ **Implementar**: APIs FHIR, padrão TISS, certificado digital
✅ **Considerar**: Mapeamento de terminologias (CID-10, TUSS, CBHPM)
✅ **Futuro**: Integração com RNDS quando disponível

---

## 🏗️ 6. MODELAGEM DE DADOS ADAPTATIVA

### Schema Flexível Proposto:
```sql
-- Contexto organizacional
CREATE TABLE organizacoes (
  id UUID PRIMARY KEY,
  nome VARCHAR(255),
  tipo ENUM('sus_municipal', 'hospital_privado', 'operadora', 'clinica'),
  cnpj VARCHAR(14),
  configuracoes JSONB -- Configurações específicas do tipo
);

-- Pacientes com contextos múltiplos  
CREATE TABLE pacientes (
  id UUID PRIMARY KEY,
  nome VARCHAR(255),
  cpf VARCHAR(11),
  dados_basicos JSONB,
  consentimentos JSONB -- LGPD granular
);

-- Médicos com múltiplas vinculações
CREATE TABLE medicos (
  id UUID PRIMARY KEY,
  nome VARCHAR(255),
  crm VARCHAR(20),
  especialidades JSONB,
  certificacoes JSONB
);

-- Vínculos contextualizados
CREATE TABLE vinculos_paciente_medico (
  id UUID PRIMARY KEY,
  paciente_id UUID REFERENCES pacientes(id),
  medico_id UUID REFERENCES medicos(id),
  organizacao_id UUID REFERENCES organizacoes(id),
  tipo_vinculo ENUM('assistente', 'consultor', 'referencia', 'contrarreferencia'),
  ativo BOOLEAN DEFAULT true,
  metadados JSONB -- Dados específicos do contexto
);

-- Autorizações e permissões
CREATE TABLE autorizacoes (
  id UUID PRIMARY KEY,
  paciente_id UUID REFERENCES pacientes(id),
  medico_id UUID REFERENCES medicos(id),
  organizacao_id UUID REFERENCES organizacoes(id),
  tipo_autorizacao VARCHAR(100),
  status ENUM('pendente', 'autorizada', 'negada', 'expirada'),
  validade TIMESTAMP,
  detalhes JSONB
);
```

### Vantagens da Modelagem:
✅ **Flexibilidade**: Suporta diferentes contextos organizacionais
✅ **Escalabilidade**: Crescimento sem reestruturação
✅ **Compliance**: Auditoria e controle granular
✅ **Integração**: Preparado para APIs externas

---

## 🎯 7. RECOMENDAÇÕES DE IMPLEMENTAÇÃO

### Fase 1: Básico Funcional (Atual)
- ✅ CRUD de pacientes e médicos
- ✅ Associações básicas 1:N
- ✅ Interface responsiva

### Fase 2: Contextos Organizacionais
- 📋 Implementar tabela organizacoes
- 📋 Vínculos contextualizados
- 📋 Perfis de acesso básicos

### Fase 3: Autorizações e Compliance
- 📋 Sistema de autorizações
- 📋 Logs de auditoria
- 📋 Consentimentos LGPD

### Fase 4: Interoperabilidade
- 📋 APIs FHIR básicas
- 📋 Integração TISS (se aplicável)
- 📋 Certificação digital

### Considerações Técnicas:
- **Banco**: PostgreSQL com suporte JSONB para flexibilidade
- **APIs**: RESTful com documentação OpenAPI/Swagger
- **Segurança**: JWT + OAuth2, criptografia AES-256
- **Auditoria**: Log estruturado com identificação de usuário
- **Backup**: Estratégia 3-2-1 com criptografia

---

## 📚 Referências Consultadas
- Portal do Ministério da Saúde (gov.br/saude)
- Agência Nacional de Saúde Suplementar (ANS)
- Conselho Federal de Medicina (CFM)  
- Associação Nacional de Hospitais Privados (ANAHP)
- Biblioteca Virtual em Saúde do Ministério da Saúde

---

*Documento elaborado em: outubro/2025*  
*Versão: 1.0*  
*Próxima revisão: Após implementação das fases 1-2*