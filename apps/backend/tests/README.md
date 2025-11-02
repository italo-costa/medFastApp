# Scripts de Teste - MediApp

Este diretório contém os scripts de teste para executar diferentes tipos de testes no projeto MediApp.

## Executar Testes

### Todos os Testes
```bash
npm test
```

### Testes Unitários
```bash
npm run test:unit
```

### Testes de Integração
```bash
npm run test:integration
```

### Testes E2E (End-to-End)
```bash
npm run test:e2e
```

### Cobertura de Código
```bash
npm run test:coverage
```

### Modo Watch (Desenvolvimento)
```bash
npm run test:watch
```

## Estrutura dos Testes

### `tests/unit/`
Testes unitários que testam funções individuais e validações:
- `validation.test.js` - Testes de validação de dados (CPF, CRM, email, etc.)

### `tests/integration/`
Testes de integração que testam as APIs completas:
- `medicos.test.js` - Testes completos da API de médicos

### `tests/e2e/`
Testes end-to-end que simulam fluxos completos do usuário:
- `medicos-workflow.test.js` - Fluxo completo de gestão de médicos

### `tests/utils/`
Utilitários para facilitar os testes:
- `testDatabase.js` - Gerenciamento do banco de dados de teste
- `testHelpers.js` - Funções auxiliares para testes
- `setup.js` - Configuração inicial dos testes
- `globalSetup.js` - Configuração global antes de todos os testes
- `globalTeardown.js` - Limpeza global após todos os testes

### `tests/fixtures/`
Dados de teste padronizados:
- `medicosFixtures.js` - Dados de exemplo para médicos
- `pacientesFixtures.js` - Dados de exemplo para pacientes

## Configuração

Os testes são configurados para:
- **Timeout**: 30 segundos por teste
- **Cobertura mínima**: 70% para statements, branches, functions e lines
- **Ambiente**: Node.js com configuração de banco de dados de teste
- **Reporters**: Text (console) + LCOV + HTML para cobertura

## Banco de Dados de Teste

Os testes usam um banco de dados separado configurado através de variáveis de ambiente:
- `NODE_ENV=test`
- Configuração específica no `prisma/schema.prisma`
- Limpeza automática entre testes

## Boas Práticas

1. **Isolamento**: Cada teste é independente e limpa seus dados
2. **Fixtures**: Use dados padronizados dos arquivos de fixtures
3. **Helpers**: Utilize as funções auxiliares para reduzir duplicação
4. **Performance**: Testes devem executar rapidamente (< 30s cada)
5. **Cobertura**: Mantenha a cobertura acima de 70%

## Debugging

Para debuggar testes específicos:
```bash
# Executar apenas um arquivo de teste
npm test -- tests/unit/validation.test.js

# Executar com verbose
npm test -- --verbose

# Executar testes que contenham uma palavra específica
npm test -- --testNamePattern="CPF"
```

## Relatórios de Cobertura

Após executar `npm run test:coverage`, os relatórios estarão disponíveis em:
- Console: Sumário da cobertura
- `coverage/lcov-report/index.html`: Relatório HTML detalhado
- `coverage/lcov.info`: Dados para integração com ferramentas CI/CD