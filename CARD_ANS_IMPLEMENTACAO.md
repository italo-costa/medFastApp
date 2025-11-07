# 🏥 INTEGRAÇÃO ANS NO MEDIAPP
**Central de Informações da Agência Nacional de Saúde Suplementar**  
**Data:** 4 de novembro de 2025  

---

## 📋 NOVO CARD IMPLEMENTADO

✅ **Card "Central ANS" adicionado ao painel principal**
- **Localização:** Tela principal (app.html) na seção de quick-actions
- **Ícone:** 🛡️ (fas fa-shield-alt) em azul (#2b6cb0)
- **Função:** `showANSInfo()` - abre modal informativo completo

---

## 🔍 INFORMAÇÕES ÚTEIS PARA CONSULTÓRIOS

### **1. Validação de Operadoras**
```javascript
// Possível implementação futura
async function validarOperadora(registroANS) {
    // Verificar se o registro ANS é válido
    // Consultar situação da operadora
    // Verificar modalidade (médico-hospitalar, odontológico, etc.)
    return {
        valido: true,
        situacao: "ATIVA",
        modalidade: "MÉDICO-HOSPITALAR"
    };
}
```

### **2. Consulta de Cobertura**
```javascript
// ROL de procedimentos obrigatórios
const procedimentosObrigatorios = [
    "Consulta médica em consultório",
    "Consulta/atendimento domiciliar",
    "Consulta em pronto-socorro",
    "Exames complementares diagnósticos",
    "Terapias especializadas",
    "Cirurgias ambulatoriais e hospitalares"
];
```

### **3. Prazos Regulamentados**
```javascript
const prazosANS = {
    consulta_basica: "7 dias",
    consulta_especializada: "14 dias", 
    cirurgia_eletiva: "21 dias",
    exames_simples: "3 dias",
    exames_complexos: "10 dias",
    urgencia_emergencia: "imediato"
};
```

---

## 🏥 INFORMAÇÕES PARA MÉDICOS

### **1. Padrão TISS (Troca de Informação de Saúde Suplementar)**
- **Componentes:** XML/EDI para comunicação com operadoras
- **Uso:** Autorização de procedimentos, faturamento
- **Integração:** Possível implementar validador TISS no MediApp

### **2. Tabela TUSS (Terminologia Unificada da Saúde Suplementar)**
```javascript
// Exemplo de códigos TUSS
const codigosTUSS = {
    "10101012": "Consulta médica - consulta inicial",
    "10101020": "Consulta médica - consulta de retorno",
    "40801021": "Eletrocardiograma",
    "40301010": "Hemograma completo"
};
```

### **3. Indicadores de Glosa**
- **Função:** Monitorar negativas por operadora
- **Dados:** Taxa de glosa, motivos mais frequentes
- **Aplicação:** Dashboard de análise por convênio

---

## 📊 DADOS DISPONÍVEIS PARA PESQUISA

### **1. Operadoras de Planos**
```json
{
    "registro_ans": "123456",
    "razao_social": "Operadora XYZ Ltda",
    "nome_fantasia": "Plano Saúde XYZ",
    "modalidade": "MÉDICO-HOSPITALAR",
    "situacao": "ATIVA",
    "porte": "GRANDE",
    "classificacao_prudencial": "RISCO_BAIXO",
    "data_registro": "2010-05-15"
}
```

### **2. Beneficiários por Operadora**
```json
{
    "operadora": "123456",
    "total_beneficiarios": 150000,
    "distribuicao_idade": {
        "0-18": 25000,
        "19-39": 45000,
        "40-59": 50000,
        "60+": 30000
    },
    "modalidade_contratacao": {
        "individual": 30000,
        "coletivo_empresarial": 100000,
        "coletivo_adesao": 20000
    }
}
```

### **3. Índices de Reclamação**
```json
{
    "operadora": "123456",
    "trimestre": "2025-Q3",
    "indice_reclamacao": 0.85,
    "tipos_reclamacao": {
        "cobertura_assistencial": 45,
        "reembolso": 25,
        "cancelamento_unilateral": 15,
        "outros": 15
    }
}
```

---

## 🗺️ MAPAS E ANÁLISES GEOESPACIAIS

### **1. Distribuição Regional de Operadoras**
```javascript
// Dados para visualização no mapa
const operadorasPorRegiao = {
    "nordeste": {
        "total_operadoras": 125,
        "beneficiarios": 2800000,
        "concentracao": "Salvador, Recife, Fortaleza"
    },
    "sudeste": {
        "total_operadoras": 450,
        "beneficiarios": 12500000,
        "concentracao": "São Paulo, Rio de Janeiro, BH"
    }
};
```

### **2. Indicadores de Qualidade por Estado**
```javascript
const qualidadePorEstado = {
    "BA": {
        "tempo_medio_autorizacao": "2.5 dias",
        "taxa_glosa": "12%",
        "satisfacao_beneficiario": "7.2/10"
    },
    "PE": {
        "tempo_medio_autorizacao": "2.1 dias", 
        "taxa_glosa": "10%",
        "satisfacao_beneficiario": "7.5/10"
    }
};
```

---

## 🔄 INTEGRAÇÕES POSSÍVEIS NO MEDIAPP

### **1. Módulo de Validação de Convênios**
```javascript
class ANSValidator {
    async validateInsurance(registroANS, cpfPaciente) {
        // Validar operadora ativa
        // Verificar cobertura do paciente
        // Consultar carências
        return {
            valid: true,
            coverage: ["consultas", "exames", "cirurgias"],
            restrictions: []
        };
    }
}
```

### **2. Dashboard de Análise de Convênios**
```javascript
class ConvenioAnalytics {
    async getOperadoraStats(registroANS) {
        return {
            indice_reclamacao: 0.85,
            tempo_medio_aprovacao: "2.3 dias",
            taxa_glosa: "8.5%",
            ranking_qualidade: "B+"
        };
    }
}
```

### **3. Alertas Regulatórios**
```javascript
class RegulatoryAlerts {
    async checkUpdates() {
        return [
            {
                tipo: "ROL_ATUALIZADO",
                data: "2025-01-01",
                descricao: "Novos procedimentos incluídos no ROL"
            },
            {
                tipo: "REAJUSTE_AUTORIZADO", 
                data: "2025-05-01",
                descricao: "Reajuste de 9.63% para planos individuais"
            }
        ];
    }
}
```

---

## 📈 FUNCIONALIDADES IMPLEMENTÁVEIS

### **Nível 1 - Básico (Imediato)**
- ✅ **Modal informativo** (já implementado)
- 🔄 **Links para recursos ANS**
- 🔄 **Glossário de termos regulatórios**

### **Nível 2 - Intermediário (Curto prazo)**
- 🔄 **Validador de registro ANS**
- 🔄 **Consulta de operadoras ativas**
- 🔄 **Base local de dados ANS**

### **Nível 3 - Avançado (Médio prazo)**
- 🔄 **Dashboard de análise de convênios**
- 🔄 **Indicadores de qualidade por operadora**
- 🔄 **Alertas de mudanças regulatórias**

### **Nível 4 - Completo (Longo prazo)**
- 🔄 **Integração TISS completa**
- 🔄 **Sistema de glosas automatizado**
- 🔄 **Relatórios de compliance ANS**

---

## 🛠️ IMPLEMENTAÇÃO TÉCNICA

### **1. Estrutura de Dados**
```sql
-- Tabela de operadoras
CREATE TABLE ans_operadoras (
    registro_ans VARCHAR(10) PRIMARY KEY,
    razao_social VARCHAR(255),
    nome_fantasia VARCHAR(255),
    modalidade VARCHAR(50),
    situacao VARCHAR(20),
    porte VARCHAR(20),
    data_registro DATE,
    updated_at TIMESTAMP
);

-- Tabela de indicadores
CREATE TABLE ans_indicadores (
    id SERIAL PRIMARY KEY,
    registro_ans VARCHAR(10),
    periodo VARCHAR(10),
    indice_reclamacao DECIMAL(4,2),
    tempo_aprovacao DECIMAL(3,1),
    taxa_glosa DECIMAL(4,2),
    FOREIGN KEY (registro_ans) REFERENCES ans_operadoras(registro_ans)
);
```

### **2. API Endpoints**
```javascript
// Novos endpoints para o backend
app.get('/api/ans/operadoras', async (req, res) => {
    // Retornar lista de operadoras ativas
});

app.get('/api/ans/validate/:registro', async (req, res) => {
    // Validar registro ANS
});

app.get('/api/ans/coverage/:registro/:procedimento', async (req, res) => {
    // Verificar cobertura de procedimento
});
```

### **3. Sincronização de Dados**
```javascript
// Job para atualizar dados ANS periodicamente
class ANSDataSync {
    async syncOperadoras() {
        // Download dados do portal ANS
        // Processar CSV/JSON
        // Atualizar base local
    }
    
    async syncIndicadores() {
        // Sincronizar indicadores de qualidade
        // Atualizar métricas mensais
    }
}
```

---

## 🎯 VALOR AGREGADO PARA O MEDIAPP

### **Para Médicos:**
1. **Validação instantânea** de planos de saúde
2. **Consulta de cobertura** antes de solicitar procedimentos
3. **Histórico de glosas** por operadora
4. **Alertas regulatórios** automáticos

### **Para Consultórios:**
1. **Dashboard de convênios** com indicadores de qualidade
2. **Análise de rentabilidade** por operadora
3. **Relatórios de compliance** ANS
4. **Otimização de processos** administrativos

### **Para Pacientes:**
1. **Transparência** sobre direitos e coberturas
2. **Informações** sobre qualidade das operadoras
3. **Orientações** sobre prazos e procedimentos
4. **Canais** para reclamações

---

## 📱 PRÓXIMOS PASSOS

### **Implementação Imediata:**
1. ✅ Modal informativo da ANS (concluído)
2. 🔄 Links diretos para recursos ANS
3. 🔄 Documentação de integração

### **Desenvolvimento Futuro:**
1. 🔄 Middleware de dados ANS
2. 🔄 API interna para validações
3. 🔄 Dashboard de análise de convênios
4. 🔄 Sistema de alertas regulatórios

---

**💡 O card da ANS no MediApp representa o primeiro passo para uma integração completa com dados regulatórios, oferecendo aos usuários acesso centralizado às informações essenciais da Agência Nacional de Saúde Suplementar.**