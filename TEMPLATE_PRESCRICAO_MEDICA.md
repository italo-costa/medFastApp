# 📋 Template de Prescrição Médica - Lopes Souza Saúde
## Sistema Completo para Prescrições Médicas Digitais

### 🎯 Visão Geral

Foi desenvolvido um template completo e profissional para prescrições médicas, atendendo todos os requisitos legais e boas práticas médicas. O sistema permite preenchimento digital e impressão em formato padrão para uso clínico.

---

## ✅ Características do Template

### 🏥 **Identidade Visual da Clínica**
- **Logomarca:** "Lopes Souza Saúde" (LSS)
- **Design Profissional:** Gradientes e cores corporativas
- **Informações Completas:** CNPJ, endereço, telefone, email
- **Slogan:** "Excelência em Cuidados Médicos"

### 📋 **Campos Obrigatórios Implementados**

#### 👨‍⚕️ **Dados do Médico**
- ✅ Nome completo do médico
- ✅ Número do CRM com estado
- ⚪ Especialidade médica (opcional)
- ✅ Data da prescrição

#### 👤 **Dados do Paciente**
- ✅ Nome completo
- ✅ Idade
- ⚪ Peso (opcional, mas importante para dosagens)
- ⚪ CPF (opcional)
- ⚪ Telefone (opcional)
- ⚪ Sexo (opcional)

#### 💊 **Prescrições**
- ✅ Nome do medicamento + concentração
- ✅ Quantidade prescrita
- ⚪ Via de administração
- ✅ Posologia detalhada
- ⚪ Instruções especiais

### 🖨️ **Otimização para Impressão**
- **Formato:** A4 padrão
- **Margens:** 15mm em todos os lados
- **Fonte:** Arial (compatível com impressão)
- **Cores:** Otimizadas para impressão P&B e colorida
- **Quebras:** Controle automático de página

---

## 🔧 Funcionalidades Técnicas

### **Arquivo Principal: `prescricao-medica.html`**

#### 🎨 **Design e Layout**
```css
/* Configurações de impressão otimizadas */
@media print {
    @page {
        size: A4;
        margin: 15mm;
    }
    .no-print { display: none !important; }
}
```

#### 📱 **Responsividade**
- Layout adaptativo para diferentes tamanhos de tela
- Grade flexível que se reorganiza em dispositivos móveis
- Otimização para tablets e smartphones

#### ⚡ **Funcionalidades JavaScript**

##### **1. Preenchimento Automático**
```javascript
function fillSampleData() {
    // Preenche exemplo completo para demonstração
    // Dados do médico, paciente e medicamentos
}
```

##### **2. Validação de Campos**
```javascript
window.addEventListener('beforeprint', function() {
    // Valida campos obrigatórios antes da impressão
    // Mostra alerta se campos obrigatórios estão vazios
});
```

##### **3. Formatação Automática**
- **CPF:** 000.000.000-00
- **Telefone:** (85) 9 9999-9999
- **Data:** Formato brasileiro automático

##### **4. Sincronização de Assinaturas**
- Campos de assinatura se atualizam automaticamente
- Dados do médico e paciente são espelhados

---

## 💊 Seções do Template

### **1. Cabeçalho da Clínica**
```html
<div class="clinic-header">
    <div class="clinic-logo">🏥 LSS</div>
    <h1>Lopes Souza Saúde</h1>
    <!-- Informações completas da clínica -->
</div>
```

### **2. Dados do Profissional**
- Nome do médico
- CRM com estado
- Especialidade
- Data da prescrição

### **3. Informações do Paciente**
- Grid organizado com todos os dados
- Campos opcionais claramente identificados
- Validação de CPF e telefone

### **4. Área de Prescrição**
- **3 medicamentos por página** (padrão)
- Campos estruturados:
  - Nome + concentração
  - Quantidade
  - Via de administração (dropdown)
  - Posologia detalhada

### **5. Orientações Gerais**
- Área livre para instruções
- Placeholders com orientações padrão
- Formatação profissional

### **6. Assinaturas**
- **Médico:** Nome, CRM, data, carimbo
- **Paciente:** Nome, CPF, data

---

## 🎛️ Controles Disponíveis

### **Botões de Ação (não imprimem):**
- **📝 Exemplo 1:** Prescrição para quadro infeccioso completo
- **📝 Exemplo 2:** Prescrição cardiológica para hipertensão  
- **🗑️ Limpar:** Reset completo do formulário
- **🖨️ Imprimir:** Impressão com validação completa
- **⚡ Impressão Direta:** Impressão sem validação (emergência)
- **🔧 Teste:** Diagnóstico completo do sistema de impressão

### **Validações Automáticas:**
- Verificação de campos obrigatórios
- Formatação de CPF e telefone
- Data atual automática
- Sincronização de dados nas assinaturas

---

## 📊 Vias de Administração Disponíveis

O template inclui dropdown com as principais vias:
- ✅ Via Oral
- ✅ Sublingual
- ✅ Intramuscular
- ✅ Endovenosa
- ✅ Tópica
- ✅ Inalatória
- ✅ Ocular
- ✅ Nasal
- ✅ Retal
- ✅ Vaginal

---

## 🛡️ Conformidade Legal

### **Requisitos Atendidos:**
- ✅ Identificação completa do médico
- ✅ Identificação do paciente
- ✅ Data da prescrição
- ✅ Descrição detalhada dos medicamentos
- ✅ Posologia clara e específica
- ✅ Assinatura e carimbo do médico
- ✅ Informações da clínica/consultório

### **Texto Legal Incluso:**
```
"Esta prescrição é válida em todo território nacional por 30 dias 
a partir da data de emissão. Medicamentos controlados têm validade 
específica conforme legislação vigente."
```

---

## 🔍 Exemplos de Prescrições Preenchidas

### **📋 Exemplo 1 - Quadro Infeccioso:**
- **Médico:** Dr. Carlos Eduardo Mendonça Filho (CRM/CE 8547)
- **Especialidade:** Medicina Interna e Clínica Médica
- **Paciente:** Ana Beatriz Santos Ferreira, 38 anos, 72.3kg

**Medicamentos Prescritos:**
1. **Amoxicilina + Ácido Clavulânico 875mg + 125mg** - 14 comprimidos
   - Posologia detalhada com horários e orientações específicas
   - Duração: 7 dias com orientações de continuidade

2. **Paracetamol 750mg** - 20 comprimidos  
   - Uso condicionado para dor ou febre
   - Limite máximo diário especificado

3. **Saccharomyces boulardii 200mg** - 10 cápsulas
   - Probiótico para proteção intestinal durante antibioticoterapia
   - Orientações de armazenamento específicas

### **💗 Exemplo 2 - Cardiologia/Hipertensão:**
- **Médica:** Dra. Mariana Rodrigues Cardoso (CRM/CE 12439)
- **Especialidade:** Cardiologia
- **Paciente:** José Roberto Silva Junior, 58 anos, 89.2kg

**Medicamentos Prescritos:**
1. **Losartana Potássica 50mg** - 30 comprimidos
   - Anti-hipertensivo de uso contínuo
   - Horário fixo matinal

2. **Omeprazol 20mg** - 30 cápsulas
   - Protetor gástrico
   - Uso em jejum antes do café

3. **Ácido Acetilsalicílico 100mg** - 30 comprimidos
   - Proteção cardiovascular
   - Uso noturno após refeição

---

## 🌐 Acesso e Integração

### **URLs:**
- **Template:** `http://localhost:3002/prescricao-medica.html`
- **CSS:** `http://localhost:3002/css/prescricao-medica.css`
- **Acesso via Dashboard:** Card "Prescrição Médica" no app.html

### **Integração com MediApp:**
- Card dedicado no dashboard principal
- Ícone: 💊 (prescription-bottle-alt)
- Cor: Vermelho médico (#dc3545)
- Abertura em nova aba para não perder dados do sistema

---

## 📈 Possíveis Melhorias Futuras

### **Fase 1: Funcionalidades Básicas (Atual)** ✅
- Template completo implementado
- Validações básicas
- Impressão otimizada
- Exemplo funcional

### **Fase 2: Integração com Sistema**
- 🔄 Buscar dados de médicos do sistema
- 🔄 Buscar dados de pacientes automaticamente
- 🔄 Salvar prescrições no banco de dados
- 🔄 Histórico de prescrições por paciente

### **Fase 3: Funcionalidades Avançadas**
- 🔄 Assinatura digital certificada
- 🔄 QR Code para validação
- 🔄 Receituário para medicamentos controlados
- 🔄 Modelos de prescrição pré-definidos

### **Fase 4: Automação**
- 🔄 Prescrições baseadas em diagnósticos
- 🔄 Sugestões de medicamentos por CID
- 🔄 Verificação de interações medicamentosas
- 🔄 Alertas de alergias do paciente

---

## 🎨 Customização

### **Alteração da Logomarca:**
Para alterar a identidade visual:
1. Modificar classe `.clinic-logo`
2. Alterar texto em `.clinic-info h1`
3. Atualizar informações de contato
4. Personalizar cores corporativas

### **Adição de Medicamentos:**
O template suporta facilmente mais medicamentos:
```html
<!-- Duplicar estrutura .medication-item -->
<div class="medication-item">
    <span class="medication-number">4</span>
    <!-- Campos do medicamento -->
</div>
```

---

## 📋 Checklist de Uso

### **Antes de Imprimir:**
- [ ] Dados do médico completos
- [ ] Nome do paciente preenchido
- [ ] Idade do paciente informada
- [ ] Data da prescrição atual
- [ ] Pelo menos um medicamento prescrito
- [ ] Posologia detalhada e clara
- [ ] Orientações gerais preenchidas

### **Para Impressão:**
- [ ] Verificar configuração da impressora (A4)
- [ ] Teste de impressão em papel rascunho
- [ ] Papel timbrado ou branco de qualidade
- [ ] Impressão em cores (recomendado)

---

**📅 Data de Criação:** 04/11/2025  
**🚀 Status:** Implementação Completa  
**👨‍💻 Desenvolvido por:** GitHub Copilot para MediApp v3.0.0  
**🏥 Cliente:** Lopes Souza Saúde  
**📄 Tipo:** Template de Prescrição Médica Digital