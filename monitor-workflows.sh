#!/bin/bash

# 🎯 Monitor de Workflows GitHub Actions - MediApp
# Script para verificar o status dos workflows executados

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

info() {
    echo -e "${PURPLE}ℹ️ $1${NC}"
}

echo "🎯 Monitor de Workflows GitHub Actions - MediApp"
echo "=============================================="
echo ""

# Verificar se gh CLI está disponível
if command -v gh &> /dev/null; then
    success "GitHub CLI disponível"
    
    # Verificar autenticação
    if gh auth status &>/dev/null; then
        success "Autenticado no GitHub"
        
        log "Verificando workflows recentes..."
        
        # Listar workflows recentes
        echo ""
        info "📋 Workflows Recentes:"
        gh run list --limit 10 --json status,name,createdAt,conclusion
        
        echo ""
        log "Verificando status dos workflows individuais..."
        
        # Verificar workflows específicos
        workflows=(
            "Backend CI/CD Pipeline"
            "Frontend CI/CD Pipeline" 
            "Mobile CI/CD Pipeline"
            "Database CI/CD Pipeline"
            "MediApp CI/CD Pipeline Completa"
        )
        
        for workflow in "${workflows[@]}"; do
            echo ""
            info "🔍 Verificando: $workflow"
            
            # Obter último run do workflow
            latest_run=$(gh run list --workflow="$workflow" --limit 1 --json status,conclusion,createdAt 2>/dev/null || echo "[]")
            
            if [ "$latest_run" != "[]" ] && [ "$latest_run" != "" ]; then
                status=$(echo "$latest_run" | jq -r '.[0].status // "unknown"')
                conclusion=$(echo "$latest_run" | jq -r '.[0].conclusion // "none"')
                
                case "$status" in
                    "completed")
                        if [ "$conclusion" = "success" ]; then
                            success "$workflow: Concluído com sucesso"
                        elif [ "$conclusion" = "failure" ]; then
                            error "$workflow: Falhou"
                        else
                            warning "$workflow: Concluído com status: $conclusion"
                        fi
                        ;;
                    "in_progress")
                        info "$workflow: Em execução..."
                        ;;
                    "queued")
                        info "$workflow: Na fila de execução"
                        ;;
                    *)
                        warning "$workflow: Status desconhecido: $status"
                        ;;
                esac
            else
                warning "$workflow: Nenhuma execução encontrada"
            fi
        done
        
        echo ""
        log "Gerando relatório de status..."
        
        # Criar relatório resumido
        echo ""
        echo "📊 RELATÓRIO DE STATUS DOS WORKFLOWS"
        echo "==================================="
        
        # Contar workflows por status
        total_runs=$(gh run list --limit 20 --json status 2>/dev/null | jq '. | length')
        completed_runs=$(gh run list --limit 20 --json status,conclusion 2>/dev/null | jq '[.[] | select(.status == "completed" and .conclusion == "success")] | length')
        failed_runs=$(gh run list --limit 20 --json status,conclusion 2>/dev/null | jq '[.[] | select(.status == "completed" and .conclusion == "failure")] | length')
        in_progress=$(gh run list --limit 20 --json status 2>/dev/null | jq '[.[] | select(.status == "in_progress")] | length')
        
        echo ""
        success "✅ Workflows bem-sucedidos: $completed_runs"
        if [ "$failed_runs" -gt 0 ]; then
            error "❌ Workflows falhados: $failed_runs"
        fi
        if [ "$in_progress" -gt 0 ]; then
            info "🔄 Workflows em execução: $in_progress"
        fi
        echo "📊 Total de workflows recentes: $total_runs"
        
    else
        warning "Não autenticado no GitHub CLI"
        echo "Para autenticar: gh auth login"
    fi
else
    warning "GitHub CLI não disponível"
    echo "Para instalar: https://cli.github.com/"
fi

echo ""
log "Verificações locais adicionais..."

# Verificar se os workflows estão sintaticamente corretos
echo ""
info "🔧 Verificação de sintaxe dos workflows locais:"

workflows_dir=".github/workflows"
if [ -d "$workflows_dir" ]; then
    for workflow_file in "$workflows_dir"/*.yml; do
        if [ -f "$workflow_file" ]; then
            filename=$(basename "$workflow_file")
            
            # Verificação de sintaxe YAML
            if command -v python3 &> /dev/null; then
                if python3 -c "import yaml; yaml.safe_load(open('$workflow_file'))" 2>/dev/null; then
                    success "Sintaxe YAML válida: $filename"
                else
                    error "Sintaxe YAML inválida: $filename"
                fi
            else
                info "Python não disponível para validação YAML: $filename"
            fi
        fi
    done
else
    error "Diretório .github/workflows não encontrado"
fi

echo ""
log "Verificando gatilhos dos workflows..."

# Analisar gatilhos (triggers) dos workflows
echo ""
info "🎯 Análise de gatilhos dos workflows:"

for workflow_file in "$workflows_dir"/*.yml; do
    if [ -f "$workflow_file" ]; then
        filename=$(basename "$workflow_file")
        
        # Verificar se tem trigger on push
        if grep -q "on:" "$workflow_file" && grep -A 10 "on:" "$workflow_file" | grep -q "push:"; then
            success "$filename: Configurado para push"
        else
            info "$filename: Sem trigger de push"
        fi
        
        # Verificar se tem trigger on pull_request
        if grep -A 10 "on:" "$workflow_file" | grep -q "pull_request:"; then
            info "$filename: Configurado para pull requests"
        fi
        
        # Verificar se tem trigger manual
        if grep -A 10 "on:" "$workflow_file" | grep -q "workflow_dispatch:"; then
            info "$filename: Execução manual habilitada"
        fi
    fi
done

echo ""
echo "🎯 PRÓXIMOS PASSOS RECOMENDADOS"
echo "==============================="
echo ""
echo "1. 📊 Monitorar execução no GitHub Actions:"
echo "   https://github.com/italo-costa/medFastApp/actions"
echo ""
echo "2. 🧪 Executar teste manual dos pipelines:"
echo "   gh workflow run 'Test Individual Pipelines' --field pipeline=all"
echo ""
echo "3. 🔍 Verificar logs em caso de falha:"
echo "   gh run view [RUN_ID] --log"
echo ""
echo "4. 🚀 Após validação, executar pipeline completa:"
echo "   gh workflow run 'MediApp CI/CD Pipeline Completa'"
echo ""

success "Monitor de workflows concluído!"
echo ""