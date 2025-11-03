# 📋 Guia de Implementação - Dados Reais de Saúde

## 🎯 Visão Geral

Este guia documenta como utilizar o sistema de integração com **fontes oficiais de dados de saúde do Brasil**, garantindo conformidade com LGPD e Lei de Acesso à Informação.

## 🏛️ Fontes de Dados Oficiais

### **1. DATASUS - Ministério da Saúde**
- **URL**: http://tabnet.datasus.gov.br
- **Dados**: Taxa de ocupação hospitalar, internações, procedimentos
- **Atualização**: Mensal
- **Formato**: TabNet (requer parsing específico)
- **Cache TTL**: 24 horas

### **2. ANS - Agência Nacional de Saúde Suplementar**
- **URL**: https://www.ans.gov.br/anstabnet
- **Dados**: Beneficiários de planos de saúde por município
- **Atualização**: Trimestral
- **Formato**: API REST + TabNet
- **Cache TTL**: 7 dias

### **3. IBGE - Instituto Brasileiro de Geografia e Estatística**
- **URL**: https://servicodados.ibge.gov.br/api
- **Dados**: População, demografia, indicadores sociais
- **Atualização**: Anual/Decenal
- **Formato**: JSON REST API
- **Cache TTL**: 30 dias

### **4. Anatel - Agência Nacional de Telecomunicações**
- **URL**: https://sistemas.anatel.gov.br
- **Dados**: Conectividade, cobertura de rede, velocidade
- **Atualização**: Mensal
- **Formato**: Relatórios estruturados
- **Cache TTL**: 7 dias

### **5. CETIC.br - Centro Regional de Estudos TIC**
- **URL**: https://cetic.br
- **Dados**: Digitalização, uso de tecnologia na saúde
- **Atualização**: Anual
- **Formato**: Relatórios PDF/Excel
- **Cache TTL**: 1 ano

## 🚀 Como Usar

### **Instalação de Dependências**
```bash
# Backend - dependências para APIs
pip install requests pandas numpy pyarrow boto3

# Analytics - bibliotecas de visualização
pip install plotly matplotlib seaborn cartopy geopandas

# Conformidade LGPD
pip install cryptography hashlib
```

### **1. Inicialização Básica**
```python
from real_data_loader import RealHealthDataLoader
from real_data_config import print_validation_report

# Verificar ambiente
print_validation_report()

# Inicializar carregador
loader = RealHealthDataLoader(api_base_url='http://localhost:3001')
```

### **2. Carregar Dados Completos**
```python
# Carrega todos os indicadores de todos os municípios
df_complete = loader.load_real_data()

print(f"Municípios carregados: {len(df_complete)}")
print(f"Indicadores: {list(df_complete.columns)}")
```

### **3. Usar no Jupyter Notebook**
```python
# No notebook indicadores-saude-nordeste.ipynb
health_data = load_health_data_with_real_integration(config)

# Dados estão prontos para visualização
df_municipios = health_data['municipios']
df_timeseries = health_data['timeseries']
df_especialidades = health_data['especialidades']
```

### **4. Integração com Backend**
```javascript
// Solicitar dados via API
const response = await fetch('/api/analytics/indicators?source=completo');
const data = await response.json();

console.log(`Municípios: ${data.metadata.total_municipalities}`);
console.log(`Fontes: ${data.metadata.data_sources.join(', ')}`);
```

## 📊 Estrutura dos Dados

### **DataFrame Principal**
```python
{
    'Município': str,           # Nome do município
    'UF': str,                  # Unidade Federativa
    'Tipo': str,                # 'capital' ou 'interior'
    'Populacao': int,           # População total (IBGE)
    'Taxa_Ocupacao_Hospitalar': float,    # 0-100% (DATASUS)
    'Penetracao_Planos_Saude': float,     # 0-100% (ANS)
    'Conectividade_Digital_Mbps': float,  # Mbps (Anatel)
    'Resolutividade_Local': float,        # 0-100% (calculado)
    'Latitude': float,          # Coordenadas geográficas
    'Longitude': float,         # Coordenadas geográficas
    'Performance_Geral': float  # Índice calculado
}
```

### **Dados de Séries Temporais**
```python
{
    'cidade': str,
    'estado': str,
    'data': datetime,
    'ocupacao_hospitalar': float,
    'consultas_mes': int,
    'referencias_enviadas': int,
    'referencias_recebidas': int
}
```

## 🔧 Configuração Avançada

### **1. Cache Personalizado**
```python
# Configurar cache por fonte
loader = RealHealthDataLoader()
loader.cache_config = {
    'datasus': {'ttl': 12 * 60 * 60 * 1000},  # 12 horas
    'ans': {'ttl': 3 * 24 * 60 * 60 * 1000},  # 3 dias
    'ibge': {'ttl': 15 * 24 * 60 * 60 * 1000} # 15 dias
}
```

### **2. Filtros Personalizados**
```python
# Carregar apenas capitais
municipios_filtrados = [m for m in loader.municipiosNordeste if m['tipo'] == 'capital']
df_capitais = loader.fetchIndicadoresCompletos(municipios_filtrados)

# Carregar apenas um estado
municipios_ce = [m for m in loader.municipiosNordeste if m['uf'] == 'CE']
df_ceara = loader.fetchIndicadoresCompletos(municipios_ce)
```

### **3. Fallback Inteligente**
```python
try:
    # Tentar dados reais
    df = loader.fetchOcupacaoHospitalar()
except Exception as e:
    print(f"API indisponível: {e}")
    # Usar dados simulados realísticos
    df = loader.load_simulated_realistic_data()
```

## 🛡️ Conformidade LGPD

### **Princípios Implementados**

1. **Minimização de Dados**: Apenas dados necessários para analytics
2. **Finalidade Específica**: Uso exclusivo para dashboard de saúde
3. **Transparência**: Logs de auditoria de todos os acessos
4. **Segurança**: Criptografia em trânsito, cache temporário

### **Logs de Auditoria**
```python
# Cada acesso é registrado
audit_log = {
    'timestamp': '2025-10-23T15:30:00Z',
    'user_id': 'system',
    'action': 'DATA_ACCESS',
    'resource': 'health_indicators',
    'purpose': 'ANALYTICAL_DASHBOARD',
    'legal_basis': 'LEGITIMATE_INTEREST',
    'data_sources': ['DATASUS', 'ANS', 'IBGE'],
    'municipalities_count': 18,
    'retention_period': '2_YEARS'
}
```

### **Relatório de Conformidade**
```python
# Gerar relatório LGPD
compliance_report = loader.generateAuditReport()
print(f"Status: {compliance_report['compliance_status']}")
print(f"Acessos: {compliance_report['total_requests']}")
print(f"Retenção: {compliance_report['retention_policy']}")
```

## 📈 Monitoramento e Alertas

### **Status das APIs**
```python
from real_data_config import validate_environment

# Verificar status
status = validate_environment()
print(f"APIs funcionais: {sum(status['api_access'].values())}/{len(status['api_access'])}")

# Alertas automáticos
if not status['internet_connection']:
    print("🚨 ALERTA: Sem conectividade com internet")

if sum(status['api_access'].values()) < 2:
    print("⚠️ ALERTA: Poucas APIs disponíveis")
```

### **Performance e Rate Limiting**
```python
# Rate limiting automático
loader.rateLimiter = {
    'datasus': {'last_request': datetime.now(), 'requests_count': 0},
    'ans': {'last_request': datetime.now(), 'requests_count': 0}
}

# Verificar antes de cada request
if not loader.checkRateLimit('datasus'):
    print("⏸️ Rate limit atingido, aguardando...")
    time.sleep(60)
```

## 🔄 Atualização Automática

### **Script de Atualização**
```python
def update_health_data():
    """
    Script para atualização automática dos dados
    Executar via cron ou task scheduler
    """
    try:
        loader = RealHealthDataLoader()
        
        # Carregar dados atualizados
        df = loader.load_real_data()
        
        # Salvar para cache
        loader.save_data_for_api(df)
        
        # Gerar mapas atualizados
        subprocess.run(['python', 'generate_maps.py'])
        
        print(f"✅ Dados atualizados: {len(df)} municípios")
        
    except Exception as e:
        print(f"❌ Erro na atualização: {e}")
        # Enviar alerta por email/Slack
        send_alert(f"Falha na atualização de dados: {e}")

# Executar diariamente às 06:00
# crontab: 0 6 * * * /usr/bin/python3 /path/to/update_health_data.py
```

### **Webhook para Atualizações**
```javascript
// Endpoint no backend para trigger manual
app.post('/api/analytics/refresh', async (req, res) => {
  try {
    const result = await execSync('python update_health_data.py');
    res.json({ success: true, message: 'Dados atualizados' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## 🧪 Testes e Validação

### **Testes de Integração**
```python
def test_data_integration():
    """Testa integração com todas as fontes"""
    loader = RealHealthDataLoader()
    
    # Testar cada fonte individualmente
    tests = {
        'ocupacao': loader.fetchOcupacaoHospitalar,
        'planos': loader.fetchPenetracaoPlanos,
        'conectividade': loader.fetchConectividadeDigital,
        'completo': loader.fetchIndicadoresCompletos
    }
    
    results = {}
    for test_name, test_func in tests.items():
        try:
            data = test_func()
            results[test_name] = {
                'success': True,
                'records': len(data) if data else 0
            }
        except Exception as e:
            results[test_name] = {
                'success': False,
                'error': str(e)
            }
    
    return results
```

### **Validação de Qualidade**
```python
def validate_data_quality(df):
    """Valida qualidade dos dados carregados"""
    issues = []
    
    # Verificar dados faltantes
    missing_data = df.isnull().sum()
    if missing_data.any():
        issues.append(f"Dados faltantes: {missing_data.to_dict()}")
    
    # Verificar outliers
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        q1, q3 = df[col].quantile([0.25, 0.75])
        iqr = q3 - q1
        outliers = df[(df[col] < q1 - 1.5*iqr) | (df[col] > q3 + 1.5*iqr)]
        if len(outliers) > 0:
            issues.append(f"Outliers em {col}: {len(outliers)} registros")
    
    # Verificar consistência temporal
    if 'data_coleta' in df.columns:
        old_data = df[df['data_coleta'] < datetime.now() - timedelta(days=30)]
        if len(old_data) > 0:
            issues.append(f"Dados antigos (>30 dias): {len(old_data)} registros")
    
    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'quality_score': max(0, 100 - len(issues) * 10)
    }
```

## 📚 Próximos Passos

1. **Expansão Regional**: Adicionar outras regiões do Brasil
2. **APIs Adicionais**: Integrar com mais fontes governamentais
3. **Machine Learning**: Modelos preditivos com dados históricos
4. **Real-time**: Streaming de dados em tempo real
5. **Data Lake**: Integração com soluções de Big Data

## 📞 Suporte

- **Documentação**: `/docs/api-integration.md`
- **Issues**: GitHub Issues para problemas técnicos
- **Conformidade**: `/docs/lgpd-compliance.md`
- **Performance**: `/docs/performance-tuning.md`

---

**✅ Sistema pronto para produção com conformidade total LGPD e LAI**