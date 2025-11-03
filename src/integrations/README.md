# 🔗 SISTEMA DE INTEGRAÇÃO EXTERNA

Este módulo implementa um sistema robusto e escalável para integração com órgãos e sistemas externos, seguindo o padrão estabelecido pelo ViaCEP.

## 📋 Visão Geral

O sistema fornece uma interface unificada para integração com:
- **ViaCEP**: Consulta de CEPs e endereços
- **DATASUS**: Sistema Único de Saúde - estabelecimentos e indicadores
- **ANS**: Agência Nacional de Saúde Suplementar - operadoras e TISS
- **ICP-Brasil**: Certificação digital e assinatura eletrônica

## 🏗️ Arquitetura

```
src/integrations/
├── index.js                    # Interface principal e ponto de entrada
├── contracts/                  # Contratos e interfaces
│   └── ExternalServiceContracts.js
├── services/                   # Implementações dos serviços
│   ├── ViaCepService.js       # ViaCEP v2.0 (refatorado)
│   ├── DataSUSService.js      # DATASUS/SUS
│   ├── ANSService.js          # ANS/TISS
│   └── ICPBrasilService.js    # ICP-Brasil
└── adapters/                  # Camada de abstração
    └── ExternalIntegrationAdapter.js
```

## 🚀 Uso Básico

### Inicialização

```javascript
const { ExternalIntegration } = require('./src/integrations');

// Inicialização com configurações padrão
ExternalIntegration.init();

// Ou com configurações customizadas
ExternalIntegration.init({
    viacep: {
        baseUrl: 'https://viacep.com.br/ws',
        timeout: 10000
    }
});
```

### Consulta de CEP

```javascript
// Consultar CEP específico
const endereco = await ExternalIntegration.consultarCep('01310-100');

// Buscar CEPs por endereço
const ceps = await ExternalIntegration.buscarCepPorEndereco(
    'SP', 'São Paulo', 'Avenida Paulista'
);
```

### Integração SUS/DATASUS

```javascript
// Buscar estabelecimentos de saúde
const estabelecimentos = await ExternalIntegration.buscarEstabelecimentosSaude('355030');

// Consultar indicadores de saúde
const indicadores = await ExternalIntegration.consultarIndicadoresSaude(
    'mortalidade_infantil',
    { uf: 'SP', ano: 2023 }
);

// Integrar com RNDS (Rede Nacional de Dados em Saúde)
const resultado = await ExternalIntegration.integrarRNDS({
    paciente: { cpf: '123.456.789-00' },
    procedimento: 'consulta_medica'
});
```

### Integração ANS

```javascript
// Consultar operadoras de saúde
const operadoras = await ExternalIntegration.consultarOperadoras('SP');

// Validar beneficiário
const beneficiario = await ExternalIntegration.validarBeneficiario(
    '12345678901234567890',
    '123.456.789-00'
);

// Enviar dados TISS
const tiss = await ExternalIntegration.enviarTISS({
    operadora: '12345',
    prestador: '67890',
    procedimentos: [...]
});
```

### Certificação Digital (ICP-Brasil)

```javascript
// Validar certificado digital
const validacao = await ExternalIntegration.validarCertificadoDigital(certificadoPEM);

// Assinar documento
const documentoAssinado = await ExternalIntegration.assinarDocumento(
    documento,
    certificado
);

// Verificar assinatura
const verificacao = await ExternalIntegration.verificarAssinatura(documentoAssinado);
```

## 🔍 Monitoramento e Diagnóstico

### Health Check

```javascript
// Verificar saúde de todos os serviços
const health = await ExternalIntegration.healthCheck();
console.log(health);
// {
//   viacep: { status: 'healthy', responseTime: 150 },
//   datasus: { status: 'healthy', responseTime: 300 },
//   ans: { status: 'degraded', responseTime: 2000 },
//   icpbrasil: { status: 'healthy', responseTime: 500 }
// }
```

### Diagnósticos Detalhados

```javascript
// Obter diagnósticos completos
const diagnostics = await ExternalIntegration.diagnostics();
console.log(diagnostics);
// {
//   viacep: {
//     status: 'healthy',
//     uptime: 3600000,
//     cache: { size: 150, hitRate: 0.85 },
//     requests: { total: 1000, success: 950, errors: 50 }
//   },
//   ...
// }
```

### Estatísticas de Uso

```javascript
// Obter estatísticas de uso
const stats = ExternalIntegration.getStats();
console.log(stats);
// {
//   totalRequests: 5000,
//   successRate: 0.94,
//   averageResponseTime: 450,
//   cacheHitRate: 0.78,
//   serviceUsage: {
//     viacep: 2000,
//     datasus: 1500,
//     ans: 1000,
//     icpbrasil: 500
//   }
// }
```

## ⚙️ Configuração Avançada

### Configurações por Serviço

```javascript
const config = {
    viacep: {
        baseUrl: 'https://viacep.com.br/ws',
        cacheTimeout: 24 * 60 * 60 * 1000, // 24 horas
        rateLimitDelay: 100,
        timeout: 10000,
        maxCacheSize: 1000
    },
    datasus: {
        baseUrl: 'http://tabnet.datasus.gov.br',
        cnesUrl: 'http://cnes2.datasus.gov.br',
        cacheTimeout: 6 * 60 * 60 * 1000, // 6 horas
        rateLimitDelay: 500,
        timeout: 30000,
        maxCacheSize: 500
    },
    ans: {
        baseUrl: 'https://www.ans.gov.br/anstabnet',
        apiUrl: 'https://www.ans.gov.br/aans/api',
        cacheTimeout: 12 * 60 * 60 * 1000, // 12 horas
        rateLimitDelay: 1000,
        timeout: 20000,
        maxCacheSize: 200
    },
    icpbrasil: {
        validatorUrl: 'https://acraiz.icpbrasil.gov.br',
        timestampUrl: 'http://timestamp.iti.gov.br',
        cacheTimeout: 1 * 60 * 60 * 1000, // 1 hora
        rateLimitDelay: 2000,
        timeout: 15000,
        maxCacheSize: 100
    }
};

ExternalIntegration.init(config);
```

### Uso Avançado com Adapter

```javascript
const { ExternalIntegrationAdapter } = require('./src/integrations');

const adapter = new ExternalIntegrationAdapter(config);

// Acesso direto aos serviços
const viaCepService = adapter.getService('viacep');
const resultado = await viaCepService.consultarCep('01310-100');

// Executar múltiplas operações
const resultados = await Promise.all([
    adapter.consultarCep('01310-100'),
    adapter.buscarEstabelecimentosSaude('355030'),
    adapter.consultarOperadoras('SP')
]);
```

## 🛡️ Tratamento de Erros

Todos os serviços implementam tratamento robusto de erros:

```javascript
try {
    const endereco = await ExternalIntegration.consultarCep('01310-100');
} catch (error) {
    console.error('Erro na consulta:', error.message);
    // Possíveis tipos de erro:
    // - NETWORK_ERROR: Problema de rede
    // - SERVICE_UNAVAILABLE: Serviço indisponível
    // - INVALID_PARAMETER: Parâmetro inválido
    // - RATE_LIMIT_EXCEEDED: Limite de taxa excedido
    // - TIMEOUT: Timeout na requisição
}
```

## 📊 Cache e Performance

- **Cache Inteligente**: Cache automático com TTL configurável por serviço
- **Rate Limiting**: Controle de taxa de requisições
- **Timeout Configurável**: Timeouts específicos por serviço
- **Retry Automático**: Tentativas automáticas em caso de falha temporária

### Gerenciamento de Cache

```javascript
// Limpar cache de todos os serviços
ExternalIntegration.clearCache();

// Obter estatísticas de cache
const stats = ExternalIntegration.getStats();
console.log('Taxa de acerto do cache:', stats.cacheHitRate);
```

## 🔌 Integração com Express.js

### Middleware de Integração

```javascript
const express = require('express');
const { ExternalIntegration } = require('./src/integrations');

const app = express();

// Inicializar integrações na inicialização do servidor
ExternalIntegration.init();

// Middleware para health check
app.get('/health/external', async (req, res) => {
    try {
        const health = await ExternalIntegration.healthCheck();
        res.json({ status: 'ok', services: health });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Rotas de CEP
app.get('/api/cep/:cep', async (req, res) => {
    try {
        const endereco = await ExternalIntegration.consultarCep(req.params.cep);
        res.json(endereco);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Rotas SUS
app.get('/api/sus/estabelecimentos/:municipio', async (req, res) => {
    try {
        const estabelecimentos = await ExternalIntegration.buscarEstabelecimentosSaude(
            req.params.municipio
        );
        res.json(estabelecimentos);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

## 🧪 Testes

### Testes Unitários

```javascript
const { ExternalIntegration } = require('./src/integrations');

describe('External Integration', () => {
    beforeAll(() => {
        ExternalIntegration.init();
    });

    test('should consult CEP', async () => {
        const resultado = await ExternalIntegration.consultarCep('01310-100');
        expect(resultado.cep).toBe('01310-100');
        expect(resultado.logradouro).toBeTruthy();
    });

    test('should handle invalid CEP', async () => {
        await expect(
            ExternalIntegration.consultarCep('00000-000')
        ).rejects.toThrow('CEP não encontrado');
    });
});
```

## 📝 Logs e Auditoria

O sistema gera logs detalhados para auditoria:

```javascript
// Exemplo de log
{
    timestamp: '2024-01-15T10:30:00.000Z',
    service: 'viacep',
    method: 'consultarCep',
    parameters: { cep: '01310-100' },
    responseTime: 150,
    status: 'success',
    cacheHit: true
}
```

## 🔄 Migração do ViaCEP Existente

Para migrar código existente que usa o ViaCEP:

### Antes (AddressManager)
```javascript
const addressManager = new AddressManager();
const endereco = await addressManager.getAddressByCep('01310-100');
```

### Depois (Nova Integração)
```javascript
const { ExternalIntegration } = require('./src/integrations');
ExternalIntegration.init();
const endereco = await ExternalIntegration.consultarCep('01310-100');
```

## 🚀 Próximos Passos

1. **Implementar APIs Reais**: Substituir dados simulados por integrações reais
2. **Testes de Integração**: Criar testes completos com APIs reais
3. **Documentação de API**: Documentar todos os endpoints
4. **Monitoramento**: Implementar alertas e métricas
5. **HL7 FHIR**: Adicionar suporte completo ao padrão FHIR

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte os logs de diagnóstico
- Execute health check para verificar status dos serviços
- Verifique as configurações de rede e timeout