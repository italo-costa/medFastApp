# 🔬 GUIA DE TESTE - Sistema de Exames no Ubuntu

## 🎯 **SISTEMA IMPLEMENTADO**
✅ **Upload/Download completo** de exames médicos  
✅ **Suporte total**: PDF, imagens, vídeos  
✅ **Vinculação ao paciente** obrigatória  
✅ **Metadados completos**: data, empresa, médico solicitante  

---

## 🖥️ **COMANDOS PARA UBUNTU SERVER**

### **1. Preparar Ambiente**
```bash
# Navegar para o projeto
cd /mnt/c/workspace/aplicativo

# Verificar se dependências estão atualizadas
cd backend
npm install

# Verificar se multer está instalado
npm list multer
# Deve mostrar: multer@1.4.5-lts.1

# Criar diretório de uploads se não existir
mkdir -p uploads/exams
chmod 755 uploads/exams
```

### **2. Atualizar Banco de Dados**
```bash
# Aplicar migração (se tiver Prisma CLI)
npx prisma migrate dev --name "add_exam_file_fields"

# OU executar SQL manualmente no PostgreSQL:
psql -U mediapp -d mediapp -f database/update_exams_table.sql

# Verificar se campos foram adicionados
psql -U mediapp -d mediapp -c "\d exames"
```

### **3. Iniciar Servidor**
```bash
# Método 1: Usar script estável
node server-stable.js

# Método 2: Usar script principal  
node src/server.js

# Método 3: Modo desenvolvimento
npm run dev

# Verificar se servidor iniciou
curl http://localhost:3001/health
```

### **4. Testar APIs**
```bash
# Testar rota de exames
curl http://localhost:3001/api/exams

# Testar tipos de exames
curl http://localhost:3001/api/exams/types/common

# Verificar estrutura de pacientes
curl http://localhost:3001/api/patients-db
```

---

## 🧪 **TESTES FUNCIONAIS**

### **Teste 1: Upload de Imagem**
```bash
# Criar arquivo de teste
echo "fake image content" > /tmp/test-exam.jpg

# Upload via curl (substitua PACIENTE_ID por ID real)
curl -X POST \
  -F "paciente_id=PACIENTE_ID" \
  -F "tipo_exame=Raio-X" \
  -F "nome_exame=Teste de Upload" \
  -F "data_realizacao=2025-10-26" \
  -F "laboratorio=Lab Teste" \
  -F "arquivo=@/tmp/test-exam.jpg" \
  http://localhost:3001/api/exams/upload
```

### **Teste 2: Listar Exames**
```bash
# Listar todos os exames
curl http://localhost:3001/api/exams

# Filtrar por paciente
curl "http://localhost:3001/api/exams?paciente_id=PACIENTE_ID"

# Filtrar por tipo
curl "http://localhost:3001/api/exams?tipo_exame=Raio-X"
```

### **Teste 3: Download de Arquivo**
```bash
# Baixar arquivo (substitua EXAM_ID)
curl -O http://localhost:3001/api/exams/download/EXAM_ID

# Visualizar inline
curl http://localhost:3001/api/exams/view/EXAM_ID
```

---

## 🌐 **TESTE VIA NAVEGADOR**

### **1. Acessar Dashboard**
```
URL: http://localhost:3001
```

### **2. Ir para Módulo Exames**
- Clicar na aba "Exames" no menu lateral
- Verificar se interface carregou corretamente
- Testar botão "Novo Exame"

### **3. Testar Upload**
1. **Selecionar paciente** - dropdown deve carregar pacientes
2. **Escolher tipo** - 20 tipos disponíveis  
3. **Data de realização** - date picker
4. **Arrastar arquivo** - área drag & drop
5. **Preencher dados** - laboratório, médico, resultado
6. **Salvar** - deve fazer upload e listar

### **4. Testar Visualização**
- **Lista de exames** - deve mostrar cards com dados
- **Botão "Visualizar"** - abre arquivo em nova aba
- **Botão "Download"** - baixa com nome organizado
- **Filtros** - por paciente, tipo, período

---

## 🔧 **TROUBLESHOOTING**

### **Erro: Multer não encontrado**
```bash
cd backend
npm install multer@1.4.5-lts.1
```

### **Erro: Diretório uploads não existe**
```bash
mkdir -p backend/uploads/exams
chmod 755 backend/uploads/exams
```

### **Erro: Campos não existem no banco**
```sql
-- Conectar ao PostgreSQL
psql -U mediapp -d mediapp

-- Adicionar campos manualmente
ALTER TABLE exames 
ADD COLUMN IF NOT EXISTS nome_arquivo_original VARCHAR(255),
ADD COLUMN IF NOT EXISTS tamanho_arquivo INTEGER,
ADD COLUMN IF NOT EXISTS tipo_arquivo VARCHAR(100);
```

### **Erro: Pacientes não carregam**
```bash
# Verificar se existe pacientes
curl http://localhost:3001/api/patients-db

# Se vazio, usar script de dados de exemplo
node src/database/seed.js
```

### **Erro: Upload falha**
```bash
# Verificar permissões
ls -la backend/uploads/
chmod 755 backend/uploads/exams/

# Verificar logs do servidor
tail -f logs/app.log

# Testar upload simples
curl -X POST -F "test=@/tmp/small-file.txt" http://localhost:3001/api/exams/upload
```

---

## 📊 **VALIDAÇÃO COMPLETA**

### **Checklist de Funcionalidades**
- [ ] ✅ **API /api/exams** responde
- [ ] ✅ **Upload funciona** com validação
- [ ] ✅ **Download/view** funciona  
- [ ] ✅ **Frontend carrega** lista de exames
- [ ] ✅ **Modal abre** com formulário completo
- [ ] ✅ **Drag & drop** aceita arquivos
- [ ] ✅ **Filtros funcionam** (paciente, tipo, data)
- [ ] ✅ **Paginação** funciona
- [ ] ✅ **Edição** funciona
- [ ] ✅ **Exclusão** remove arquivo

### **Tipos de Arquivo para Testar**
```bash
# Imagens
curl -F "arquivo=@test.jpg" ...
curl -F "arquivo=@test.png" ...

# PDFs  
curl -F "arquivo=@laudo.pdf" ...

# Vídeos
curl -F "arquivo=@exame.mp4" ...

# Documentos
curl -F "arquivo=@resultado.doc" ...
```

### **Cenários de Validação**
- [ ] **Arquivo muito grande** (>100MB) - deve rejeitar
- [ ] **Tipo não permitido** (.exe, .bat) - deve rejeitar  
- [ ] **Paciente inexistente** - deve dar erro
- [ ] **Campos obrigatórios vazios** - deve validar
- [ ] **Upload sem arquivo** - deve aceitar (só dados)

---

## 🚀 **COMANDOS RÁPIDOS UBUNTU**

### **Inicialização Completa**
```bash
#!/bin/bash
cd /mnt/c/workspace/aplicativo/backend
mkdir -p uploads/exams
chmod 755 uploads/exams
npm install
node server-stable.js &
echo "Servidor rodando em http://localhost:3001"
echo "Teste exames: http://localhost:3001 -> aba Exames"
```

### **Monitoramento**
```bash
# Logs do servidor
tail -f logs/app.log

# Arquivos de upload
ls -la uploads/exams/

# Status do banco
psql -U mediapp -d mediapp -c "SELECT COUNT(*) FROM exames;"

# Requisições HTTP
curl -s http://localhost:3001/api/exams | jq '.'
```

---

## 🎯 **RESULTADO ESPERADO**

Após seguir este guia, você deve ter:

✅ **Sistema de exames 100% funcional**  
✅ **Upload de arquivos médicos operacional**  
✅ **Interface web completamente integrada**  
✅ **Download e visualização funcionando**  
✅ **Validações e segurança ativas**  

**🚀 Pronto para testar no Ubuntu! Execute os comandos acima e o sistema estará funcionando.**