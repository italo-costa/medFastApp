# 🔧 Guia de Configuração do Ambiente de Teste - MediApp

## 📋 Pré-requisitos

### 1. Instalação do Node.js

#### Windows
1. **Baixar Node.js**: https://nodejs.org/
   - Escolha a versão LTS (Long Term Support)
   - Versão mínima: 18.0.0

2. **Executar o instalador**
   - ✅ Marcar "Add to PATH" durante a instalação
   - ✅ Instalar ferramentas de build nativas

3. **Verificar instalação**
   ```cmd
   node --version
   npm --version
   ```

#### Alternativa: Usando Chocolatey
```powershell
# Instalar Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Node.js
choco install nodejs
```

### 2. Configuração do Banco de Dados de Teste

#### PostgreSQL Local
```sql
-- Criar banco de teste
CREATE DATABASE mediapp_test;

-- Criar usuário de teste (opcional)
CREATE USER mediapp_test_user WITH PASSWORD 'test_password';
GRANT ALL PRIVILEGES ON DATABASE mediapp_test TO mediapp_test_user;
```

### 3. Variáveis de Ambiente

Criar arquivo `.env.test` no diretório backend:
```env
NODE_ENV=test
DATABASE_URL="postgresql://username:password@localhost:5432/mediapp_test"
TEST_TIMEOUT=30000
TEST_COVERAGE_THRESHOLD=70
```

## 🚀 Instalação e Configuração

### Passo 1: Navegar para o projeto
```cmd
cd C:\workspace\aplicativo\backend
```

### Passo 2: Instalar dependências
```cmd
npm install
```

### Passo 3: Configurar banco de dados
```cmd
# Gerar cliente Prisma
npm run db:generate

# Executar migrações para teste
npm run db:migrate:test
```

### Passo 4: Verificar instalação
```cmd
# Verificar se Jest foi instalado
npx jest --version

# Verificar estrutura de testes
npm run test:unit --dry-run
```

## 🧪 Executando os Testes

### Comandos Básicos
```cmd
# Todos os testes
npm test

# Por categoria
npm run test:unit
npm run test:integration  
npm run test:e2e

# Com cobertura
npm run test:coverage

# Modo watch (desenvolvimento)
npm run test:watch
```

### Comandos Avançados
```cmd
# Teste específico
npm test -- tests/unit/validation.test.js

# Testes que contenham palavra específica
npm test -- --testNamePattern="CPF"

# Executar com verbose
npm test -- --verbose

# Executar apenas testes que falharam
npm test -- --onlyFailures
```

## 🔍 Solucionando Problemas Comuns

### Problema: "npm não é reconhecido"
**Solução:**
1. Verificar se Node.js foi instalado corretamente
2. Reiniciar terminal/PowerShell
3. Verificar PATH do sistema:
   ```powershell
   $env:PATH -split ';' | Where-Object { $_ -like "*node*" }
   ```

### Problema: "Cannot connect to database"
**Solução:**
1. Verificar se PostgreSQL está rodando
2. Confirmar configurações no `.env.test`
3. Testar conexão manual:
   ```cmd
   psql -h localhost -U username -d mediapp_test
   ```

### Problema: "Jest not found"
**Solução:**
1. Reinstalar dependências:
   ```cmd
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Usar npx:
   ```cmd
   npx jest --version
   ```

### Problema: "Port already in use"
**Solução:**
1. Mudar porta no arquivo de teste
2. Ou finalizar processo:
   ```cmd
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

## 📊 Interpretando Resultados

### Saída Típica de Teste
```
PASS tests/unit/validation.test.js
PASS tests/integration/medicos.test.js  
PASS tests/e2e/medicos-workflow.test.js

Test Suites: 3 passed, 3 total
Tests:       34 passed, 34 total
Snapshots:   0 total
Time:        15.234 s
```

### Relatório de Cobertura
```
File           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line
---------------|---------|----------|---------|---------|----------------
real-data-server.js | 85.5   | 78.2     | 90.1    | 85.5    | 245,267,289
validation.js  | 95.2    | 88.9     | 100     | 95.2    | 12,45
```

## 🎯 Boas Práticas

### 1. Organização dos Testes
- **Unitários**: Testam funções isoladas
- **Integração**: Testam APIs completas  
- **E2E**: Testam fluxos de usuário

### 2. Nomenclatura
```javascript
describe('Funcionalidade Principal', () => {
  describe('Cenário Específico', () => {
    test('deve fazer algo específico quando condição X', () => {
      // teste
    });
  });
});
```

### 3. Setup e Cleanup
```javascript
beforeAll(async () => {
  // Setup uma vez antes de todos os testes
});

beforeEach(async () => {
  // Setup antes de cada teste
  await testDb.cleanDatabase();
});

afterEach(async () => {
  // Cleanup após cada teste
});

afterAll(async () => {
  // Cleanup final
  await testDb.disconnect();
});
```

### 4. Assertions Efetivas
```javascript
// ✅ Específico e claro
expect(response.status).toBe(201);
expect(response.body.data.nomeCompleto).toBe('Dr. João Silva');

// ❌ Genérico demais
expect(response).toBeTruthy();
```

## 🔄 Workflow de Desenvolvimento com TDD

### 1. Red (Vermelho)
```javascript
test('deve validar CPF corretamente', () => {
  expect(validateCPF('123.456.789-00')).toBe(true);
  // Este teste vai FALHAR inicialmente
});
```

### 2. Green (Verde)
```javascript
function validateCPF(cpf) {
  // Implementação mínima para o teste passar
  return true; // Simplificado
}
```

### 3. Refactor (Refatorar)
```javascript
function validateCPF(cpf) {
  // Implementação robusta e limpa
  if (!cpf) return false;
  const cpfClean = cpf.replace(/\D/g, '');
  if (cpfClean.length !== 11) return false;
  // ... validação completa
  return isValid;
}
```

## 📚 Recursos Adicionais

### Documentação
- [Jest Official Docs](https://jestjs.io/docs/getting-started)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing/)

### Ferramentas Úteis
- **VS Code Extensions**:
  - Jest Runner
  - Test Explorer UI
  - Coverage Gutters

### Scripts Personalizados
```json
{
  "scripts": {
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:changed": "jest --changedSince=main",
    "test:update": "jest --updateSnapshot"
  }
}
```

## ✅ Checklist de Verificação

- [ ] Node.js 18+ instalado
- [ ] npm/npx funcionando
- [ ] PostgreSQL rodando
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências instaladas (`npm install`)
- [ ] Banco de teste criado
- [ ] Migrações executadas
- [ ] Primeiro teste executado com sucesso

## 🆘 Suporte

Se encontrar problemas:

1. **Verificar logs detalhados**: `npm test -- --verbose`
2. **Limpar cache**: `npm test -- --clearCache`
3. **Reinstalar**: `rm -rf node_modules && npm install`
4. **Verificar versões**: `node --version && npm --version`

---

📧 **Contato**: Para dúvidas específicas sobre a implementação TDD do MediApp, consulte a documentação do projeto ou abra uma issue no repositório.