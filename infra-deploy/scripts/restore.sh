#!/bin/bash
# 🔄 MediApp - Script de Restore Automatizado

set -e

# Configurações
BACKUP_DIR="./backups"
RESTORE_LOG="./restore_$(date +%Y%m%d_%H%M%S).log"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    local msg="[$(date +'%H:%M:%S')] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$RESTORE_LOG"
}

warn() {
    local msg="[$(date +'%H:%M:%S')] WARNING: $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "$msg" >> "$RESTORE_LOG"
}

error() {
    local msg="[$(date +'%H:%M:%S')] ERROR: $1"
    echo -e "${RED}${msg}${NC}"
    echo "$msg" >> "$RESTORE_LOG"
    exit 1
}

info() {
    local msg="[$(date +'%H:%M:%S')] INFO: $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "$msg" >> "$RESTORE_LOG"
}

show_help() {
    echo "🔄 MediApp - Script de Restore"
    echo ""
    echo "Uso:"
    echo "  $0 [BACKUP_ID]          Restaurar backup específico"
    echo "  $0 --list              Listar backups disponíveis"
    echo "  $0 --latest            Restaurar backup mais recente"
    echo "  $0 --help              Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 mediapp_backup_20240101_120000"
    echo "  $0 --latest"
    echo ""
}

list_backups() {
    echo "📋 Backups disponíveis:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ]; then
        warn "Diretório de backup não encontrado: $BACKUP_DIR"
        return 1
    fi
    
    # Listar manifestos para identificar backups completos
    local manifests=()
    while IFS= read -r -d '' file; do
        manifests+=("$file")
    done < <(find "$BACKUP_DIR" -name "*_manifest.txt" -print0 2>/dev/null | sort -z)
    
    if [ ${#manifests[@]} -eq 0 ]; then
        warn "Nenhum backup encontrado em $BACKUP_DIR"
        return 1
    fi
    
    printf "%-25s %-20s %-15s %-10s\n" "BACKUP ID" "DATA/HORA" "TAMANHO" "STATUS"
    printf "%-25s %-20s %-15s %-10s\n" "----------" "----------" "-------" "------"
    
    for manifest in "${manifests[@]}"; do
        local backup_id=$(basename "$manifest" _manifest.txt)
        local date_str=$(echo "$backup_id" | sed 's/mediapp_backup_//' | sed 's/_/ /')
        local formatted_date=$(date -d "${date_str:0:8} ${date_str:9:2}:${date_str:11:2}:${date_str:13:2}" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "$date_str")
        
        # Verificar arquivos do backup
        local db_file="$BACKUP_DIR/${backup_id}_database.sql.gz"
        local uploads_file="$BACKUP_DIR/${backup_id}_uploads.tar.gz"
        local config_file="$BACKUP_DIR/${backup_id}_config.tar.gz"
        
        local status="INCOMPLETO"
        local total_size=0
        
        if [ -f "$db_file" ]; then
            status="COMPLETO"
            total_size=$(find "$BACKUP_DIR" -name "${backup_id}*" -type f -exec stat -f%z {} + 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo 0)
        fi
        
        local size_mb=$(echo "scale=1; $total_size/1024/1024" | bc 2>/dev/null || echo "N/A")
        
        printf "%-25s %-20s %-15s %-10s\n" "$backup_id" "$formatted_date" "${size_mb}MB" "$status"
    done
    
    echo ""
    echo "Total de backups: ${#manifests[@]}"
}

get_latest_backup() {
    local latest_manifest=$(find "$BACKUP_DIR" -name "*_manifest.txt" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -z "$latest_manifest" ]; then
        return 1
    fi
    
    basename "$latest_manifest" _manifest.txt
}

confirm_restore() {
    local backup_id="$1"
    
    echo ""
    echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá substituir os dados atuais!${NC}"
    echo ""
    echo "Backup a ser restaurado: $backup_id"
    echo ""
    echo "Arquivos que serão restaurados:"
    
    local db_file="$BACKUP_DIR/${backup_id}_database.sql.gz"
    local uploads_file="$BACKUP_DIR/${backup_id}_uploads.tar.gz"
    local config_file="$BACKUP_DIR/${backup_id}_config.tar.gz"
    local manifest_file="$BACKUP_DIR/${backup_id}_manifest.txt"
    
    [ -f "$db_file" ] && echo "  ✓ Banco de dados: $(basename "$db_file")"
    [ -f "$uploads_file" ] && echo "  ✓ Uploads: $(basename "$uploads_file")"
    [ -f "$config_file" ] && echo "  ✓ Configurações: $(basename "$config_file")"
    
    echo ""
    read -p "Deseja continuar? (digite 'RESTORE' para confirmar): " confirmation
    
    if [ "$confirmation" != "RESTORE" ]; then
        echo "Operação cancelada pelo usuário."
        exit 0
    fi
}

restore_database() {
    local backup_id="$1"
    local db_file="$BACKUP_DIR/${backup_id}_database.sql.gz"
    
    if [ ! -f "$db_file" ]; then
        error "Arquivo de backup do banco não encontrado: $db_file"
    fi
    
    log "🗄️ Restaurando banco de dados..."
    
    # Verificar se container postgres está rodando
    if ! docker ps | grep -q "mediapp-postgres"; then
        info "Iniciando container PostgreSQL..."
        docker-compose up -d postgres
        sleep 10
    fi
    
    # Fazer backup do banco atual (precaução)
    local current_backup="/tmp/mediapp_current_$(date +%Y%m%d_%H%M%S).sql"
    log "📦 Fazendo backup de segurança do banco atual..."
    docker exec mediapp-postgres pg_dump -U mediapp -h localhost mediapp_db > "$current_backup" 2>/dev/null || warn "Não foi possível fazer backup do banco atual"
    
    # Restaurar banco
    log "🔄 Restaurando dados do backup..."
    
    # Dropar conexões ativas
    docker exec mediapp-postgres psql -U mediapp -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'mediapp_db' AND pid <> pg_backend_pid();" >/dev/null 2>&1 || warn "Erro ao fechar conexões do banco"
    
    # Dropar e recriar banco
    docker exec mediapp-postgres psql -U mediapp -d postgres -c "DROP DATABASE IF EXISTS mediapp_db;" || error "Erro ao dropar banco"
    docker exec mediapp-postgres psql -U mediapp -d postgres -c "CREATE DATABASE mediapp_db;" || error "Erro ao criar banco"
    
    # Restaurar dados
    gunzip -c "$db_file" | docker exec -i mediapp-postgres psql -U mediapp -d mediapp_db >/dev/null || error "Erro ao restaurar dados do banco"
    
    log "✅ Banco de dados restaurado com sucesso"
    log "🔒 Backup atual salvo em: $current_backup"
}

restore_uploads() {
    local backup_id="$1"
    local uploads_file="$BACKUP_DIR/${backup_id}_uploads.tar.gz"
    
    if [ ! -f "$uploads_file" ]; then
        warn "Arquivo de backup de uploads não encontrado: $uploads_file"
        return 0
    fi
    
    log "📁 Restaurando uploads..."
    
    # Verificar se container backend está rodando
    if ! docker ps | grep -q "mediapp-backend"; then
        info "Iniciando container do backend..."
        docker-compose up -d backend
        sleep 5
    fi
    
    # Fazer backup dos uploads atuais
    log "📦 Fazendo backup dos uploads atuais..."
    docker exec mediapp-backend tar -czf /tmp/current_uploads_$(date +%Y%m%d_%H%M%S).tar.gz -C /app uploads/ 2>/dev/null || warn "Não foi possível fazer backup dos uploads atuais"
    
    # Restaurar uploads
    docker cp "$uploads_file" mediapp-backend:/tmp/restore_uploads.tar.gz || error "Erro ao copiar arquivo de uploads"
    docker exec mediapp-backend rm -rf /app/uploads/ || warn "Erro ao remover uploads atuais"
    docker exec mediapp-backend tar -xzf /tmp/restore_uploads.tar.gz -C /app || error "Erro ao extrair uploads"
    docker exec mediapp-backend rm -f /tmp/restore_uploads.tar.gz
    
    log "✅ Uploads restaurados com sucesso"
}

restore_config() {
    local backup_id="$1"
    local config_file="$BACKUP_DIR/${backup_id}_config.tar.gz"
    
    if [ ! -f "$config_file" ]; then
        warn "Arquivo de backup de configurações não encontrado: $config_file"
        return 0
    fi
    
    log "⚙️ Restaurando configurações..."
    
    # Criar backup das configurações atuais
    local current_config_backup="./config_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$current_config_backup" docker-compose.yml .env nginx/ 2>/dev/null || warn "Erro ao fazer backup das configurações atuais"
    
    # Extrair configurações
    tar -xzf "$config_file" -C . || error "Erro ao extrair configurações"
    
    log "✅ Configurações restauradas com sucesso"
    log "🔒 Configurações atuais salvas em: $current_config_backup"
}

restart_services() {
    log "🔄 Reiniciando serviços..."
    
    docker-compose down || warn "Erro ao parar serviços"
    sleep 5
    docker-compose up -d || error "Erro ao iniciar serviços"
    
    # Aguardar serviços ficarem prontos
    log "⏳ Aguardando serviços ficarem prontos..."
    sleep 30
    
    # Verificar status
    if docker ps | grep -q "mediapp-backend" && docker ps | grep -q "mediapp-postgres"; then
        log "✅ Serviços reiniciados com sucesso"
        
        # Teste de conectividade
        log "🔍 Testando conectividade..."
        if curl -s http://localhost:3002/health >/dev/null; then
            log "✅ Aplicação respondendo corretamente"
        else
            warn "Aplicação não está respondendo na porta 3002"
        fi
    else
        error "Erro ao reiniciar serviços"
    fi
}

# Função principal
main() {
    case "${1:-}" in
        "--help"|"-h")
            show_help
            exit 0
            ;;
        "--list"|"-l")
            list_backups
            exit 0
            ;;
        "--latest")
            BACKUP_ID=$(get_latest_backup)
            if [ -z "$BACKUP_ID" ]; then
                error "Nenhum backup encontrado"
            fi
            log "📦 Backup mais recente encontrado: $BACKUP_ID"
            ;;
        "")
            echo "❌ Backup ID não especificado"
            echo ""
            show_help
            exit 1
            ;;
        *)
            BACKUP_ID="$1"
            ;;
    esac
    
    # Verificar se backup existe
    local manifest_file="$BACKUP_DIR/${BACKUP_ID}_manifest.txt"
    if [ ! -f "$manifest_file" ]; then
        error "Backup não encontrado: $BACKUP_ID"
    fi
    
    log "🔄 MediApp - Restore do Backup: $BACKUP_ID"
    log "📅 Iniciado em: $(date)"
    log "📝 Log detalhado: $RESTORE_LOG"
    
    # Mostrar informações do backup
    echo ""
    echo "📋 Informações do Backup:"
    echo "-------------------------"
    head -20 "$manifest_file" | grep -E "(Timestamp|Backup ID|Files included)" -A 10
    
    confirm_restore "$BACKUP_ID"
    
    log ""
    log "🚀 Iniciando processo de restore..."
    
    # Executar restore
    restore_database "$BACKUP_ID"
    restore_uploads "$BACKUP_ID"
    restore_config "$BACKUP_ID"
    restart_services
    
    log ""
    log "📊 Resumo do Restore:"
    log "   • Backup ID: $BACKUP_ID"
    log "   • Data/Hora: $(date)"
    log "   • Log detalhado: $RESTORE_LOG"
    log "   • Status: CONCLUÍDO"
    
    log ""
    log "✅ Restore concluído com sucesso!"
    log "🌐 Acesse a aplicação em: http://localhost:3002"
}

# Executar função principal
main "$@"