# 🚀 MediApp - Deploy para GitHub

Esta pasta contém os arquivos organizados e otimizados para commit no repositório GitHub do MediApp.

## 📁 Estrutura do Projeto

```
github-deploy/
├── mediapp-frontend/     # Frontend React/Web
├── mediapp-backend/      # Backend Node.js/Express
├── .github/              # GitHub Actions & Workflows
├── docs/                 # Documentação do projeto
└── scripts/              # Scripts de automação
```

## 🎯 Processo de Deploy

1. **Preparação dos Arquivos**
   - Copiar arquivos limpos do desenvolvimento
   - Remover arquivos desnecessários (.log, .tmp, etc.)
   - Otimizar código para produção

2. **Commit Estruturado**
   - Usar Conventional Commits
   - Versionamento semântico
   - Tags de release organizadas

3. **CI/CD Automático**
   - Build automático via GitHub Actions
   - Testes automatizados
   - Deploy para staging/produção

## 📋 Checklist de Deploy

- [ ] ✅ Código testado e funcionando
- [ ] 🧹 Arquivos limpos e organizados  
- [ ] 📝 Documentação atualizada
- [ ] 🏷️ Versionamento correto
- [ ] 🔒 Secrets configurados
- [ ] 🚀 Pipeline CI/CD funcionando

## 🔧 Comandos Úteis

```bash
# Preparar para commit
./scripts/prepare-commit.sh

# Fazer deploy
git add .
git commit -m "feat: nova funcionalidade X"
git push origin main

# Criar release
git tag -a v3.0.0 -m "Release v3.0.0"
git push origin v3.0.0
```

---
**MediApp v3.0.0** | Sistema Médico Completo  
🏥 Desenvolvido com ❤️ para profissionais de saúde