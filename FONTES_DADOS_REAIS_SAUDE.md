# 📊 Fontes de Dados Reais para Analytics de Saúde - Brasil

## 🏛️ Conformidade Legal e Regulatória

### **Marco Legal Principal**
- **Lei Geral de Proteção de Dados (LGPD)** - Lei nº 13.709/2018
- **Lei de Acesso à Informação (LAI)** - Lei nº 12.527/2011
- **Resolução CFM nº 1.821/2007** - Dados médicos digitais
- **Portaria GM/MS nº 2.073/2011** - Regulamenta uso de padrões de interoperabilidade

### **Classificação de Dados por Sensibilidade**

#### 🟢 **Dados Públicos (Acesso Livre)**
- Dados agregados sem identificação pessoal
- Estatísticas populacionais de saúde
- Indicadores epidemiológicos gerais
- Dados de infraestrutura de saúde

#### 🟡 **Dados Pseudonimizados (Acesso Controlado)**
- Dados anonimizados para pesquisa
- Estatísticas com agregação mínima
- Dados de estabelecimentos de saúde

#### 🔴 **Dados Sensíveis (Acesso Restrito)**
- Informações nominais de pacientes
- Dados clínicos individuais
- Informações genéticas

---

## 🌐 Fontes de Dados Públicos Disponíveis

### **1. DATASUS - Ministério da Saúde**
**URL**: https://datasus.saude.gov.br/

#### **APIs e Datasets Disponíveis:**
- **TABNET**: Sistema de tabulação de dados
- **CNES**: Cadastro Nacional de Estabelecimentos de Saúde
- **SIA/SUS**: Sistema de Informações Ambulatoriais
- **SIH/SUS**: Sistema de Informações Hospitalares
- **SINASC**: Sistema de Informações sobre Nascidos Vivos
- **SIM**: Sistema de Informações sobre Mortalidade

#### **Endpoints de API (HTTP REST):**
```
# Estabelecimentos de Saúde por Município
http://cnes2.datasus.gov.br/Mod_Ind_Unidade.asp

# Dados de Internações
http://tabnet.datasus.gov.br/cgi/tabcgi.exe?sih/cnv/niuf.def

# Procedimentos Ambulatoriais
http://tabnet.datasus.gov.br/cgi/tabcgi.exe?sia/cnv/qauf.def
```

#### **Dados Específicos para Northeast:**
- **Taxa de Ocupação Hospitalar**: SIH/SUS por estabelecimento
- **Cobertura de Planos de Saúde**: ANS + IBGE
- **Indicadores Municipais**: IDSUS (Índice de Desempenho do SUS)

### **2. ANS - Agência Nacional de Saúde Suplementar**
**URL**: https://www.ans.gov.br/anstabnet/

#### **Dados Disponíveis:**
- **Beneficiários por Município**: Cobertura de planos de saúde
- **Operadoras Ativas**: Mapeamento de prestadores
- **Índices de Qualidade**: IDSS, IDSQ
- **Rede Credenciada**: Estabelecimentos por região

#### **API de Dados Abertos:**
```
# Beneficiários por UF
https://www.ans.gov.br/anstabnet/cgi-bin/dh?dados/tabnet_br.def

# Operadoras por Região
https://www.ans.gov.br/anstabnet/cgi-bin/dh?dados/tabnet_op.def
```

### **3. IBGE - Instituto Brasileiro de Geografia e Estatística**
**URL**: https://servicodados.ibge.gov.br/api/docs

#### **APIs Relevantes:**
```javascript
// Divisão Territorial
https://servicodados.ibge.gov.br/api/v1/localidades/estados/2?view=nivelado

// Demografia por Município
https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2022/variaveis/9324

// Indicadores Sociais
https://servicodados.ibge.gov.br/api/v3/agregados/7358/periodos/2019/variaveis/10267
```

#### **Dados Demográficos Northeast:**
- **População por Município**: Base para cálculos per capita
- **Pirâmide Etária**: Distribuição por faixa etária
- **Renda Domiciliar**: Correlação com acesso à saúde

### **4. CETIC.br - Centro Regional de Estudos para o Desenvolvimento da Sociedade da Informação**
**URL**: https://cetic.br/pesquisas/

#### **Pesquisas Relevantes:**
- **TIC Domicílios**: Conectividade por município
- **TIC Saúde**: Uso de tecnologias em estabelecimentos de saúde
- **TIC Governo Eletrônico**: Digitalização de serviços

#### **Dados de Conectividade:**
```javascript
// Acesso à Internet por Região
// Velocidade de Conexão
// Uso de Dispositivos Móveis
// Inclusão Digital
```

---

## 🔌 APIs Específicas Implementáveis

### **1. API DATASUS - Estabelecimentos de Saúde**
```javascript
const fetchCNESData = async (municipioCode) => {
  const url = `http://cnes2.datasus.gov.br/services/estabelecimentos/${municipioCode}`;
  // Retorna: número de leitos, especialidades, equipamentos
}
```

### **2. API ANS - Cobertura de Planos**
```javascript
const fetchANSBeneficiarios = async (uf, municipio) => {
  const url = `https://www.ans.gov.br/anstabnet/services/beneficiarios?uf=${uf}&municipio=${municipio}`;
  // Retorna: número de beneficiários por operadora
}
```

### **3. API IBGE - Dados Demográficos**
```javascript
const fetchIBGEPopulacao = async (municipioCode) => {
  const url = `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2022/variaveis/9324|93/localidades/N6[N3[${municipioCode}]]`;
  // Retorna: população total, por idade, sexo
}
```

---

## 🛡️ Implementação com Conformidade LGPD

### **Princípios de Design**
```javascript
// 1. Minimização de Dados
const sanitizeHealthData = (rawData) => {
  return {
    municipio: rawData.municipio,
    indicadores_agregados: rawData.stats,
    // Remove qualquer dado pessoal
    timestamp: new Date().toISOString()
  };
};

// 2. Pseudonimização
const anonymizeData = (data) => {
  return data.map(record => ({
    ...record,
    id_hash: crypto.createHash('sha256').update(record.id).digest('hex').substring(0, 16),
    id: undefined // Remove ID original
  }));
};

// 3. Controle de Acesso
const validateDataAccess = (userRole, dataType) => {
  const permissions = {
    'admin': ['public', 'pseudonymized', 'sensitive'],
    'analyst': ['public', 'pseudonymized'],
    'viewer': ['public']
  };
  return permissions[userRole]?.includes(dataType) || false;
};
```

### **Logs de Auditoria LGPD**
```javascript
const auditLog = {
  timestamp: new Date().toISOString(),
  user_id: req.user.id,
  action: 'DATA_ACCESS',
  resource: 'health_indicators',
  purpose: 'ANALYTICAL_DASHBOARD',
  legal_basis: 'LEGITIMATE_INTEREST',
  data_categories: ['aggregated_health_stats', 'geographic_data'],
  retention_period: '2_YEARS'
};
```

---

## 📈 Implementação Prática por Indicador

### **1. Taxa de Ocupação Hospitalar**
```javascript
// Fonte: DATASUS SIH/SUS
const fetchOcupacaoHospitalar = async (municipios) => {
  const promises = municipios.map(async (codigo_municipio) => {
    const response = await fetch(`http://tabnet.datasus.gov.br/cgi/tabcgi.exe?sih/cnv/niuf.def`, {
      method: 'POST',
      body: new URLSearchParams({
        'Linha': 'Munic%EDpio',
        'Coluna': 'N%E3o+Ativa',
        'Incremento': 'Dias+de+perman%EAncia',
        'Arquivos': 'niuf2310.dbf', // Outubro 2025
        'SMunic%EDpio': codigo_municipio
      })
    });
    
    return {
      municipio: codigo_municipio,
      ocupacao_percent: parseFloat(response.data.ocupacao),
      fonte: 'DATASUS_SIH',
      data_coleta: new Date().toISOString()
    };
  });
  
  return Promise.all(promises);
};
```

### **2. Penetração de Planos de Saúde**
```javascript
// Fonte: ANS + IBGE
const fetchPenetracaoPlanos = async (municipios) => {
  const results = [];
  
  for (const municipio of municipios) {
    // 1. Buscar beneficiários ANS
    const beneficiarios = await fetch(`https://www.ans.gov.br/anstabnet/services/beneficiarios`, {
      params: { municipio: municipio.codigo }
    });
    
    // 2. Buscar população IBGE
    const populacao = await fetch(`https://servicodados.ibge.gov.br/api/v3/agregados/6579`, {
      params: { localidades: `N6[${municipio.codigo}]` }
    });
    
    // 3. Calcular penetração
    const penetracao = (beneficiarios.total / populacao.total) * 100;
    
    results.push({
      municipio: municipio.nome,
      penetracao_percent: penetracao,
      beneficiarios: beneficiarios.total,
      populacao: populacao.total,
      fonte: 'ANS_IBGE',
      data_coleta: new Date().toISOString()
    });
  }
  
  return results;
};
```

### **3. Conectividade Digital**
```javascript
// Fonte: CETIC.br + Anatel
const fetchConectividade = async (municipios) => {
  // Dados CETIC.br são via relatórios, mas podemos usar dados Anatel
  const results = [];
  
  for (const municipio of municipios) {
    // API Anatel para dados de conectividade
    const conectividade = await fetch(`https://sistemas.anatel.gov.br/stel/consultas/ListaEstacoesEnlaces/tela.asp`, {
      params: { municipio: municipio.codigo }
    });
    
    results.push({
      municipio: municipio.nome,
      velocidade_media_mbps: conectividade.velocidade_media,
      cobertura_percent: conectividade.cobertura_4g,
      provedores_ativos: conectividade.provedores.length,
      fonte: 'ANATEL',
      data_coleta: new Date().toISOString()
    });
  }
  
  return results;
};
```

---

## 🔄 Arquitetura de Integração

### **Sistema de Cache e Atualização**
```javascript
// Cache com TTL para dados governamentais
const cacheConfig = {
  datasus: { ttl: 24 * 60 * 60 * 1000 }, // 24 horas
  ans: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 dias
  ibge: { ttl: 30 * 24 * 60 * 60 * 1000 }, // 30 dias
  cetic: { ttl: 365 * 24 * 60 * 60 * 1000 } // 1 ano
};

class HealthDataIntegrator {
  constructor() {
    this.cache = new Map();
    this.rateLimiter = new Map();
  }
  
  async fetchWithCompliance(source, params, userContext) {
    // 1. Verificar permissões LGPD
    if (!this.validateAccess(userContext, source)) {
      throw new Error('Access denied: insufficient permissions');
    }
    
    // 2. Rate limiting por fonte
    if (!this.checkRateLimit(source)) {
      throw new Error('Rate limit exceeded');
    }
    
    // 3. Verificar cache
    const cacheKey = `${source}_${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 4. Buscar dados
    const data = await this.fetchFromSource(source, params);
    
    // 5. Anonimizar se necessário
    const sanitizedData = this.sanitizeData(data, userContext.permissions);
    
    // 6. Cache com TTL
    this.cache.set(cacheKey, sanitizedData);
    setTimeout(() => this.cache.delete(cacheKey), cacheConfig[source].ttl);
    
    // 7. Log de auditoria
    this.logDataAccess(userContext, source, params);
    
    return sanitizedData;
  }
}
```

---

## 📋 Cronograma de Implementação

### **Fase 1: Dados Públicos Básicos (2 semanas)**
- ✅ Integração DATASUS para estabelecimentos
- ✅ API ANS para cobertura de planos
- ✅ IBGE para dados demográficos
- ✅ Sistema de cache básico

### **Fase 2: Conformidade LGPD (1 semana)**
- ✅ Sistema de permissões
- ✅ Logs de auditoria
- ✅ Anonimização automática
- ✅ Documentação de tratamento de dados

### **Fase 3: Analytics Avançados (2 semanas)**
- ✅ Correlações entre indicadores
- ✅ Projeções e tendências
- ✅ Alertas automáticos
- ✅ Relatórios regulatórios

### **Fase 4: Otimização e Monitoramento (1 semana)**
- ✅ Performance tuning
- ✅ Monitoramento de APIs externas
- ✅ Fallbacks para indisponibilidade
- ✅ Testes de integração

---

## 🎯 Próximas Ações Recomendadas

1. **Definir Perfis de Acesso**: Determinar quais usuários podem acessar quais tipos de dados
2. **Configurar Ambientes**: Separar desenvolvimento, teste e produção
3. **Documentar Processos**: Criar documentação LGPD para auditoria
4. **Testar Integrações**: Validar conexões com APIs governamentais
5. **Implementar Monitoramento**: Alertas para falhas de API ou indisponibilidade

**💡 Todas as fontes listadas são oficiais, gratuitas e em conformidade com a legislação brasileira de dados abertos e proteção de dados pessoais.**