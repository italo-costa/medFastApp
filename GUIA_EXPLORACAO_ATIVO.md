# 🏥 **GUIA DE EXPLORAÇÃO - MediApp em Execução**

## 🎯 **SERVIDOR ATIVO E FUNCIONAL**

✅ **Status:** Servidor rodando na porta 3002  
✅ **Ambiente:** Linux virtualizado (WSL)  
✅ **URL Base:** http://localhost:3002  

---

## 🌐 **URLS PARA EXPLORAÇÃO**

### **📊 Dashboard Principal**
**URL:** http://localhost:3002  
**Funcionalidades:**
- Visão geral do sistema
- Estatísticas em tempo real
- Acesso rápido às funcionalidades
- Navegação centralizada

### **🏥 Aplicação Completa**
**URL:** http://localhost:3002/app  
**Funcionalidades:**
- Interface principal do sistema
- Dashboard integrado
- Navegação por abas
- Gerenciamento completo

### **👨‍⚕️ Gestão de Médicos**
**URL:** http://localhost:3002/gestao-medicos.html  
**Funcionalidades para testar:**
- ✅ Cadastrar novo médico
- ✅ Listar médicos existentes
- ✅ Buscar por nome/CRM/especialidade
- ✅ Editar informações
- ✅ Excluir médicos
- ✅ Exportar dados
- ✅ Busca de CEP automática
- ✅ Validação de formulários

### **👥 Gestão de Pacientes**
**URL:** http://localhost:3002/gestao-pacientes.html  
**Funcionalidades para testar:**
- ✅ Cadastrar novo paciente
- ✅ Buscar pacientes
- ✅ Histórico médico
- ✅ Medicamentos
- ✅ Alergias e contraindicações
- ✅ Exportar relatórios
- ✅ Backup de dados

### **🗺️ Analytics Geoespaciais**
**URL:** http://localhost:3002/analytics-mapas.html  
**Funcionalidades:**
- Mapas interativos
- Análise geográfica
- Visualizações avançadas

---

## 🔧 **ENDPOINTS DA API FUNCIONAIS**

### **Médicos**
- `GET /api/medicos` - Listar médicos
- `GET /api/medicos/:id` - Buscar médico por ID
- `POST /api/medicos` - Cadastrar médico
- `GET /api/medicos/buscar?q=termo` - Buscar médicos
- `GET /api/medicos/especialidades` - Listar especialidades

### **Pacientes**
- `GET /api/pacientes` - Listar pacientes
- `GET /api/pacientes/:id` - Buscar paciente por ID
- `POST /api/pacientes` - Cadastrar paciente
- `GET /api/pacientes/buscar?q=termo` - Buscar pacientes

### **Dashboard**
- `GET /api/dashboard/stats` - Estatísticas do sistema
- `GET /health` - Status do servidor

### **Autenticação**
- `POST /api/auth/login` - Login no sistema

---

## 🧪 **DADOS DE DEMONSTRAÇÃO DISPONÍVEIS**

### **👨‍⚕️ Médicos Mock (3 registros):**
1. **Dr. João Silva Santos**
   - CRM: CRM123456-SP
   - Especialidade: Cardiologia
   - Email: joao.silva@mediapp.com

2. **Dra. Maria Oliveira Costa**
   - CRM: CRM987654-RJ
   - Especialidade: Pediatria
   - Email: maria.costa@mediapp.com

3. **Dr. Carlos Eduardo Lima**
   - CRM: CRM555666-MG
   - Especialidade: Ortopedia
   - Email: carlos.lima@mediapp.com

### **👥 Pacientes Mock (2 registros):**
1. **Ana Paula Santos Silva**
   - CPF: 111.222.333-44
   - Convênio: Unimed
   - Cidade: São Paulo, SP

2. **Roberto Carlos Oliveira**
   - CPF: 999.888.777-66
   - Convênio: Bradesco Saúde
   - Cidade: Rio de Janeiro, RJ

### **📊 Estatísticas Mock:**
- **Médicos:** 25 total (23 ativos)
- **Pacientes:** 147 total (145 ativos)
- **Consultas:** 8 hoje, 45 esta semana
- **Prontuários:** 1.089 total

---

## 🎮 **ROTEIRO DE TESTES SUGERIDO**

### **1. Dashboard Principal (5 min)**
1. Acesse: http://localhost:3002
2. Explore os cards de estatísticas
3. Teste os links de navegação
4. Verifique o layout responsivo

### **2. Gestão de Médicos (10 min)**
1. Acesse: http://localhost:3002/gestao-medicos.html
2. **Teste Listagem:**
   - Visualize os médicos existentes
   - Use os filtros de busca
   - Teste paginação
3. **Teste Cadastro:**
   - Clique em "Cadastrar Novo Médico"
   - Preencha o formulário
   - Teste busca de CEP
   - Salve e verifique se aparece na lista
4. **Teste Edição:**
   - Clique no botão "Editar" de um médico
   - Modifique informações
   - Salve as alterações
5. **Teste Exclusão:**
   - Clique no botão "Excluir"
   - Confirme a exclusão
6. **Teste Exportação:**
   - Clique em "Exportar Dados"
   - Verifique download

### **3. Gestão de Pacientes (10 min)**
1. Acesse: http://localhost:3002/gestao-pacientes.html
2. **Teste Navegação por Abas:**
   - Lista de pacientes
   - Histórico médico
   - Medicamentos
   - Alergias
3. **Teste Busca:**
   - Use o campo de busca
   - Teste diferentes critérios
4. **Teste Cadastro:**
   - Clique em "Novo Paciente"
   - Preencha formulário completo
   - Teste máscaras (CPF, telefone)
   - Salve e verifique
5. **Teste Funcionalidades Extras:**
   - Exportar relatório
   - Backup de dados
   - Configurações

### **4. Aplicação Integrada (10 min)**
1. Acesse: http://localhost:3002/app
2. **Teste Dashboard:**
   - Visualize estatísticas
   - Teste atualização automática
3. **Teste Navegação:**
   - Use menu lateral
   - Alterne entre seções
   - Teste abas de prontuários
4. **Teste Funcionalidades:**
   - Gestão de pacientes integrada
   - Prontuários médicos
   - Exames e alergias

### **5. API Testing (5 min)**
1. Abra console do navegador (F12)
2. Teste chamadas diretas:
```javascript
// Listar médicos
fetch('/api/medicos').then(r=>r.json()).then(console.log)

// Buscar médicos
fetch('/api/medicos/buscar?q=João').then(r=>r.json()).then(console.log)

// Estatísticas
fetch('/api/dashboard/stats').then(r=>r.json()).then(console.log)

// Health check
fetch('/health').then(r=>r.json()).then(console.log)
```

---

## 📱 **TESTE DE CONECTIVIDADE MOBILE**

### **Para Android Emulator:**
- URL: http://10.0.2.2:3002/api
- Teste no emulador Android

### **Para iOS Simulator:**
- URL: http://localhost:3002/api
- Teste no simulador iOS

### **Para Dispositivos Físicos:**
- Identifique IP da máquina: `ipconfig`
- Use: http://[SEU_IP]:3002/api

---

## 🎯 **PONTOS DE ATENÇÃO PARA TESTES**

### **✅ Funcionalidades Implementadas:**
- CRUD completo de médicos
- CRUD completo de pacientes
- Sistema de busca avançada
- Validações de formulário
- Máscaras de input
- Exportação de dados
- Dashboard com estatísticas
- API RESTful completa
- Interface responsiva
- Navegação intuitiva

### **🔍 Itens para Validar:**
- Velocidade de resposta
- Usabilidade da interface
- Funcionamento em diferentes browsers
- Responsividade mobile
- Validação de dados
- Tratamento de erros
- Navegação fluida
- Integração entre telas

### **📝 Feedback Esperado:**
- Performance geral
- Facilidade de uso
- Problemas encontrados
- Sugestões de melhorias
- Compatibilidade
- Design e UX

---

## 🏥 **SERVIDOR MANTIDO ATIVO**

✅ **Status:** Rodando continuamente  
✅ **Logs:** Visíveis no terminal WSL  
✅ **Hot Reload:** Automático para mudanças  
✅ **API:** Totalmente funcional  
✅ **Frontend:** Todas as telas operacionais  

---

**🎉 SISTEMA PRONTO PARA EXPLORAÇÃO COMPLETA!**

**Explore todas as funcionalidades, teste diferentes cenários e valide a experiência completa do usuário no MediApp!**