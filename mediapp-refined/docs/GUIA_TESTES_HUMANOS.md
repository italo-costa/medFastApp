# 🏥 MediApp - Guia de Testes Humanos

> **Documento para validação manual completa do sistema MediApp**  
> **Ambiente**: Ubuntu/WSL + PostgreSQL + Node.js 18+  
> **Data**: Outubro 2025

## 📋 Checklist de Pré-requisitos

### ✅ Ambiente
- [ ] Ubuntu/WSL configurado e funcionando
- [ ] PostgreSQL 16 instalado e rodando
- [ ] Node.js 18+ instalado
- [ ] Servidor backend rodando na porta 3002
- [ ] Banco de dados com dados de teste

### ✅ URLs de Acesso
- **API Health**: http://localhost:3002/health
- **Dashboard**: http://localhost:3002/app.html
- **Gestão Médicos**: http://localhost:3002/gestao-medicos.html
- **Gestão Pacientes**: http://localhost:3002/gestao-pacientes.html

---

## 🚀 FASE 1: Validação do Backend

### 1.1 Health Check
**Objetivo**: Verificar se o servidor está respondendo corretamente

**Passos**:
1. Abrir navegador em `http://localhost:3002/health`
2. Verificar resposta JSON com status "OK"
3. Confirmar dados do banco (médicos, pacientes, exames)

**Resultado Esperado**:
```json
{
  "success": true,
  "data": {
    "server": "MediApp Unified Server",
    "status": "OK",
    "database": {
      "medicos": 13,
      "pacientes": 5,
      "exames": 3
    }
  }
}
```

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

### 1.2 API Médicos
**Objetivo**: Testar CRUD completo de médicos

**Passos**:
1. GET `http://localhost:3002/api/medicos`
2. Verificar lista de médicos retornada
3. Confirmar campos: nome, CRM, especialidade, telefone, email

**Resultado Esperado**: Lista de médicos com dados válidos

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

### 1.3 API Pacientes
**Objetivo**: Testar API de pacientes

**Passos**:
1. GET `http://localhost:3002/api/patients`
2. Verificar resposta JSON válida
3. Confirmar estrutura dos dados

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

---

## 🌐 FASE 2: Frontend Web

### 2.1 Página de Gestão de Médicos
**URL**: http://localhost:3002/gestao-medicos.html

#### ✅ Carregamento da Página
- [ ] Página carrega sem erros
- [ ] Design responsivo funciona
- [ ] Métricas exibem valores corretos
- [ ] Lista de médicos aparece

#### ✅ Funcionalidades - Visualizar Médico
**Passos**:
1. Clicar no botão "👁️" (Visualizar) de qualquer médico
2. Modal deve abrir com dados do médico
3. Todos os campos devem estar preenchidos
4. Campos devem estar somente leitura
5. Fechar modal

**Resultado Esperado**: Modal abre, dados carregam, campos read-only  
**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

#### ✅ Funcionalidades - Editar Médico
**Passos**:
1. Clicar no botão "✏️" (Editar) de qualquer médico
2. Modal deve abrir com formulário editável
3. Campos devem estar preenchidos com dados atuais
4. Modificar o telefone do médico
5. Clicar em "Atualizar"
6. Verificar se alteração foi salva

**Resultado Esperado**: Modal abre, dados carregam, edição funciona  
**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

#### ✅ Funcionalidades - Novo Médico
**Passos**:
1. Clicar em "Novo Médico"
2. Preencher todos os campos obrigatórios:
   - Nome: "Dr. Teste Humano"
   - CPF: "123.456.789-00"
   - CRM: "TEST123/SP"
   - Especialidade: "Clínica Geral"
   - Telefone: "(11) 99999-9999"
   - Email: "teste.humano@mediapp.com"
3. Buscar CEP: "01310-100"
4. Clicar em "Salvar"

**Resultado Esperado**: Médico criado e aparece na lista  
**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

#### ✅ Funcionalidades - Excluir Médico
**Passos**:
1. Clicar no botão "🗑️" (Excluir) do médico de teste
2. Confirmar exclusão no modal
3. Verificar se médico foi removido da lista

**Resultado Esperado**: Médico excluído com sucesso  
**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

#### ✅ Busca e Filtros
**Passos**:
1. Usar campo de busca para procurar um médico pelo nome
2. Filtrar por especialidade
3. Limpar filtros

**Resultado Esperado**: Busca e filtros funcionam corretamente  
**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

### 2.2 Página de Gestão de Pacientes
**URL**: http://localhost:3002/gestao-pacientes.html

#### ✅ Carregamento da Página
- [ ] Página carrega sem erros
- [ ] Estatísticas aparecem na sidebar
- [ ] Lista de pacientes carrega

#### ✅ Funcionalidades - Novo Paciente
**Passos**:
1. Clicar em "Novo Paciente"
2. Preencher dados básicos:
   - Nome: "João Teste Silva"
   - CPF: "987.654.321-00"
   - Data Nascimento: "01/01/1980"
   - Telefone: "(11) 88888-8888"
   - Email: "joao.teste@email.com"
3. Preencher endereço (testar busca por CEP)
4. Adicionar tipo sanguíneo e alergias
5. Salvar

**Resultado Esperado**: Paciente criado e aparece na lista  
**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

#### ✅ Funcionalidades - Editar Paciente
**Passos**:
1. Clicar no botão "Editar" de um paciente
2. Modal deve abrir com dados preenchidos
3. Modificar telefone
4. Salvar alterações

**Resultado Esperado**: Dados carregam e edição funciona  
**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

#### ✅ Navegação entre Abas
**Passos**:
1. Selecionar um paciente
2. Navegar pelas abas: Histórico, Medicamentos, Alergias
3. Verificar se dados aparecem

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

---

## 📱 FASE 3: Mobile App (React Native)

### 3.1 Estrutura do Projeto
**Localização**: `/mediapp-refined/apps/mobile/`

#### ✅ Verificação de Arquivos
- [ ] `package.json` existe e está válido
- [ ] Dependências do React Native estão instaladas
- [ ] Estrutura de pastas está organizada

#### ✅ Dependências Críticas
Verificar se estão instaladas:
- [ ] `react-native`: 0.72.6
- [ ] `@reduxjs/toolkit`: Para gerenciamento de estado
- [ ] `react-navigation`: Para navegação
- [ ] `react-native-paper`: Para UI components

### 3.2 Instalação e Build (Opcional)
**Nota**: Esta seção é opcional dependendo do ambiente

#### Para Android:
```bash
cd apps/mobile
npm install
npx react-native run-android
```

#### Para iOS:
```bash
cd apps/mobile
npm install
npx react-native run-ios
```

**Status**: [ ] ✅ Passou [ ] ❌ Falhou [ ] ⏭️ Pulado  
**Observações**: ___________________________

---

## 🗄️ FASE 4: Banco de Dados

### 4.1 Verificação de Dados
**Objetivo**: Confirmar integridade dos dados

#### ✅ Contagem de Registros
**Passos**:
1. Acessar `http://localhost:3002/api/statistics/dashboard`
2. Verificar contadores:
   - Médicos: deve ser > 0
   - Pacientes: deve ser > 0
   - Exames: pode ser 0

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

#### ✅ Consistência dos Dados
**Passos**:
1. Comparar dados entre APIs diferentes
2. Verificar se CRUD mantém consistência
3. Testar relacionamentos entre entidades

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

---

## ⚡ FASE 5: Performance

### 5.1 Tempo de Resposta
**Objetivo**: Validar performance aceitável

#### ✅ APIs
- [ ] Health check responde em < 500ms
- [ ] Lista de médicos carrega em < 1s
- [ ] Lista de pacientes carrega em < 1s

#### ✅ Frontend
- [ ] Páginas carregam em < 3s
- [ ] Modais abrem instantaneamente
- [ ] Busca responde em tempo real

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

### 5.2 Múltiplas Operações
**Passos**:
1. Abrir várias abas com diferentes páginas
2. Realizar operações simultâneas
3. Verificar se sistema mantém responsividade

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

---

## 🔒 FASE 6: Segurança Básica

### 6.1 Validação de Dados
**Passos**:
1. Tentar inserir dados inválidos nos formulários
2. Verificar se validações funcionam
3. Confirmar sanitização de dados

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

### 6.2 Headers de Segurança
**Passos**:
1. Abrir Developer Tools (F12)
2. Verificar headers de resposta
3. Confirmar presença de headers de segurança

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

---

## 🔗 FASE 7: Integração Completa

### 7.1 Workflow Completo - Médico
**Cenário**: Cadastro completo de um novo médico

**Passos**:
1. Acessar gestão de médicos
2. Criar novo médico com todos os dados
3. Visualizar médico criado
4. Editar informações
5. Verificar se aparece nas estatísticas
6. (Opcional) Excluir médico

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

### 7.2 Workflow Completo - Paciente
**Cenário**: Cadastro completo de um novo paciente

**Passos**:
1. Acessar gestão de pacientes
2. Criar novo paciente com todos os dados
3. Buscar CEP automaticamente
4. Adicionar foto (se disponível)
5. Configurar plano de saúde
6. Verificar nas estatísticas

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

### 7.3 Integração Frontend-Backend
**Passos**:
1. Realizar operações no frontend
2. Verificar se dados persistem no backend
3. Atualizar página e confirmar dados
4. Testar em diferentes navegadores

**Status**: [ ] ✅ Passou [ ] ❌ Falhou  
**Observações**: ___________________________

---

## 📊 RELATÓRIO FINAL

### ✅ Resumo de Resultados

| Categoria | Total | Passou | Falhou | Taxa Sucesso |
|-----------|-------|--------|--------|--------------|
| Backend | _____ | ______ | ______ | ________% |
| Frontend | _____ | ______ | ______ | ________% |
| Mobile | _____ | ______ | ______ | ________% |
| Database | _____ | ______ | ______ | ________% |
| Performance | _____ | ______ | ______ | ________% |
| Segurança | _____ | ______ | ______ | ________% |
| Integração | _____ | ______ | ______ | ________% |
| **TOTAL** | _____ | ______ | ______ | ________% |

### 🎯 Avaliação Geral

**Sistema está pronto para produção?**
- [ ] ✅ Sim - Todos os testes passaram
- [ ] ⚠️ Parcialmente - Pequenos ajustes necessários
- [ ] ❌ Não - Problemas críticos encontrados

### 📝 Problemas Encontrados

1. ________________________________
2. ________________________________
3. ________________________________

### 🚀 Recomendações

1. ________________________________
2. ________________________________
3. ________________________________

### 👥 Testador

**Nome**: ___________________________  
**Data**: ___________________________  
**Ambiente**: Ubuntu/WSL  
**Navegador**: _____________________  

---

## 🔧 Comandos Úteis

### Iniciar Sistema
```bash
# Backend
cd /mnt/c/workspace/aplicativo/mediapp-refined/apps/backend
node src/app.js

# Verificar logs
tail -f server.log
```

### Comandos de Debug
```bash
# Verificar se servidor está rodando
curl http://localhost:3002/health

# Testar API médicos
curl http://localhost:3002/api/medicos

# Testar API pacientes
curl http://localhost:3002/api/patients
```

### Solução de Problemas
1. **Servidor não inicia**: Verificar PostgreSQL rodando
2. **Dados não carregam**: Verificar conexão com banco
3. **Erro 404**: Verificar se rotas estão configuradas
4. **Performance lenta**: Verificar recursos do sistema

---

**📞 Suporte**: Para problemas técnicos, verificar logs do servidor e console do navegador