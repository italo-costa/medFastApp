# 📋 Integrações com APIs Externas - MediApp

Este documento descreve as integrações do MediApp com APIs de terceiros e como utilizar os contratos OpenAPI 3.0 para documentação e desenvolvimento.

## 🌐 APIs Integradas

### 1. ViaCEP - Consulta de CEP e Endereços

**Provedor**: ViaCEP (https://viacep.com.br)
**Contrato OpenAPI**: [`/docs/api-contracts/viacep-api.yaml`](./api-contracts/viacep-api.yaml)
**Serviço Interno**: [`/backend/src/services/ViaCepService.js`](../backend/src/services/ViaCepService.js)

#### Funcionalidades
- ✅ Consulta de endereço por CEP
- ✅ Busca reversa (CEP por endereço)
- ✅ Cache local automático (24h)
- ✅ Rate limiting (100ms entre requests)
- ✅ Validação robusta de dados
- ✅ Tratamento de erros

#### Endpoints da API Interna
```
POST /api/cep/consultar
POST /api/cep/buscar-por-endereco
GET  /api/cep/stats
POST /api/cep/clear-cache
```

#### Exemplo de Uso - Consulta por CEP
```javascript
const response = await fetch('/api/cep/consultar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cep: '01001000' })
});

const result = await response.json();
if (result.success) {
    console.log('Endereço:', result.data.localidade, result.data.uf);
}
```

#### Exemplo de Uso - Busca Reversa
```javascript
const response = await fetch('/api/cep/buscar-por-endereco', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        uf: 'SP',
        cidade: 'São Paulo',
        logradouro: 'Praça da Sé'
    })
});

const result = await response.json();
if (result.success) {
    console.log('CEPs encontrados:', result.data.length);
}
```

## 📊 Monitoramento e Estatísticas

### Estatísticas do ViaCEP
```
GET /api/cep/stats
```

Retorna:
```json
{
    "success": true,
    "data": {
        "requestCount": 42,
        "cacheSize": 15,
        "lastRequestTime": 1635724800000,
        "uptime": 3600000
    }
}
```

### Limpeza de Cache
```
POST /api/cep/clear-cache
```

## 🛠️ Desenvolvimento com OpenAPI 3.0

### Ferramentas Recomendadas

1. **Swagger Editor**: https://editor.swagger.io/
   - Cole o conteúdo do arquivo YAML para visualizar
   - Gere código cliente automaticamente

2. **Postman**
   - Importe o arquivo YAML
   - Teste as APIs diretamente

3. **Insomnia**
   - Suporte nativo para OpenAPI 3.0
   - Sincronização automática

### Validação de Contratos

```bash
# Instalar swagger-codegen
npm install -g swagger-codegen-cli

# Validar contrato
swagger-codegen validate -i docs/api-contracts/viacep-api.yaml
```

### Geração de Documentação

```bash
# Gerar documentação HTML
swagger-codegen generate -i docs/api-contracts/viacep-api.yaml -l html2 -o docs/generated/viacep
```

## 🔧 Configuração e Deploy

### Variáveis de Ambiente

```env
# ViaCEP Configuration
VIACEP_CACHE_TIMEOUT=86400000  # 24 hours in ms
VIACEP_RATE_LIMIT=100          # ms between requests
VIACEP_MAX_CACHE_SIZE=1000     # maximum cached items
```

### Health Check

O serviço ViaCEP é monitorado através do endpoint `/health`:

```json
{
    "status": "healthy",
    "services": {
        "viacep": {
            "status": "online",
            "cacheSize": 15,
            "requestCount": 42
        }
    }
}
```

## ⚠️ Considerações de Performance

### Cache Strategy
- **TTL**: 24 horas
- **Tamanho máximo**: 1000 itens
- **Eviction**: FIFO (First In, First Out)

### Rate Limiting
- **Delay mínimo**: 100ms entre requests
- **Prevenção**: Evita bloqueio automático do ViaCEP

### Error Handling
- **Timeout**: 10 segundos por request
- **Retry**: Não implementado (APIs síncronas)
- **Fallback**: Retorna erro estruturado

## 📈 Métricas e Logs

### Logs Estruturados
```
[INFO] 📍 Consultando CEP: 01001000
[INFO] 🔍 Buscando CEP por endereço: SP/São Paulo/Praça da Sé
[INFO] 🧹 Cache do ViaCEP limpo
```

### Métricas Coletadas
- Número total de requests
- Hit rate do cache
- Tempo de resposta médio
- Erros por tipo

## 🔮 Futuras Integrações

### APIs Planejadas

1. **IBGE - Localidades**
   - Contrato: `/docs/api-contracts/ibge-api.yaml` (a criar)
   - Validação de códigos IBGE

2. **Receita Federal - CNPJ**
   - Contrato: `/docs/api-contracts/receita-federal-api.yaml` (a criar)
   - Validação de dados de clínicas

3. **CFM - Validação CRM**
   - Contrato: `/docs/api-contracts/cfm-api.yaml` (a criar)
   - Verificação de registros médicos

## 📝 Padrões de Desenvolvimento

### Estrutura de Arquivos
```
docs/
├── api-contracts/           # Contratos OpenAPI 3.0
│   ├── viacep-api.yaml     # ViaCEP
│   └── future-apis/        # Futuras integrações
backend/src/services/       # Serviços de integração
├── ViaCepService.js        # Serviço ViaCEP
└── BaseApiService.js       # Classe base (a criar)
```

### Padrão de Nomenclatura
- **Contratos**: `{provider}-api.yaml`
- **Serviços**: `{Provider}Service.js`
- **Rotas**: `/api/{provider}/{action}`

### Tratamento de Erros
```javascript
{
    "success": false,
    "error": "Descrição amigável do erro",
    "code": "ERROR_CODE",
    "details": { /* dados técnicos */ }
}
```

---

## 🤝 Contribuição

Para adicionar novas integrações:

1. Crie o contrato OpenAPI 3.0 em `/docs/api-contracts/`
2. Implemente o serviço em `/backend/src/services/`
3. Adicione as rotas em `real-data-server.js`
4. Atualize esta documentação
5. Teste com as ferramentas recomendadas

---

**Versão**: 1.0.0  
**Última atualização**: 27/10/2025  
**Equipe**: MediApp Development Team