#!/bin/bash
# 💾 MediApp - Script de Backup Automatizado

set -e

# Configurações
BACKUP_DIR="./backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PREFIX="mediapp_backup_$TIMESTAMP"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

log "💾 MediApp - Backup Automatizado"
log "📅 Timestamp: $TIMESTAMP"

# Verificar se containers estão rodando
if ! docker ps | grep -q "mediapp-postgres"; then
    error "Container PostgreSQL não está rodando"
fi

if ! docker ps | grep -q "mediapp-backend"; then
    warn "Container do backend não está rodando"
fi

# 1. Backup do Banco de Dados
log "🗄️ Fazendo backup do banco de dados..."
DB_BACKUP_FILE="$BACKUP_DIR/${BACKUP_PREFIX}_database.sql"

docker exec mediapp-postgres pg_dump -U mediapp -h localhost mediapp_db > "$DB_BACKUP_FILE" || error "Falha no backup do banco"

# Comprimir backup do banco
gzip "$DB_BACKUP_FILE"
DB_BACKUP_FILE="${DB_BACKUP_FILE}.gz"

log "✅ Backup do banco criado: $(basename $DB_BACKUP_FILE)"

# 2. Backup dos Uploads
log "📁 Fazendo backup dos uploads..."
UPLOADS_BACKUP_FILE="$BACKUP_DIR/${BACKUP_PREFIX}_uploads.tar.gz"

if docker exec mediapp-backend test -d /app/uploads; then
    docker exec mediapp-backend tar -czf /tmp/uploads_backup.tar.gz -C /app uploads/ || warn "Falha no backup de uploads"
    docker cp mediapp-backend:/tmp/uploads_backup.tar.gz "$UPLOADS_BACKUP_FILE" || warn "Falha ao copiar backup de uploads"
    docker exec mediapp-backend rm -f /tmp/uploads_backup.tar.gz
    
    if [ -f "$UPLOADS_BACKUP_FILE" ]; then
        log "✅ Backup de uploads criado: $(basename $UPLOADS_BACKUP_FILE)"
    fi
else
    warn "Diretório de uploads não encontrado"
fi

# 3. Backup das Configurações
log "⚙️ Fazendo backup das configurações..."
CONFIG_BACKUP_FILE="$BACKUP_DIR/${BACKUP_PREFIX}_config.tar.gz"

# Criar arquivo temporário com configurações importantes
TEMP_CONFIG_DIR="/tmp/mediapp_config_$$"
mkdir -p "$TEMP_CONFIG_DIR"

# Copiar arquivos de configuração
cp docker-compose.yml "$TEMP_CONFIG_DIR/" 2>/dev/null || warn ".env não copiado"
cp .env "$TEMP_CONFIG_DIR/" 2>/dev/null || warn ".env não encontrado"
cp -r nginx/ "$TEMP_CONFIG_DIR/" 2>/dev/null || warn "Configurações nginx não copiadas"

# Criar tar das configurações
tar -czf "$CONFIG_BACKUP_FILE" -C "$TEMP_CONFIG_DIR" . 2>/dev/null || warn "Erro ao criar backup de configurações"

# Limpar temporários
rm -rf "$TEMP_CONFIG_DIR"

if [ -f "$CONFIG_BACKUP_FILE" ]; then
    log "✅ Backup de configurações criado: $(basename $CONFIG_BACKUP_FILE)"
fi

# 4. Criar manifesto do backup
log "📋 Criando manifesto do backup..."
MANIFEST_FILE="$BACKUP_DIR/${BACKUP_PREFIX}_manifest.txt"

cat > "$MANIFEST_FILE" << EOF
MediApp Backup Manifest
======================
Timestamp: $(date)
Backup ID: $BACKUP_PREFIX

Files included:
- Database: $(basename $DB_BACKUP_FILE) ($(stat -f%z "$DB_BACKUP_FILE" 2>/dev/null || stat -c%s "$DB_BACKUP_FILE") bytes)
$([ -f "$UPLOADS_BACKUP_FILE" ] && echo "- Uploads: $(basename $UPLOADS_BACKUP_FILE) ($(stat -f%z "$UPLOADS_BACKUP_FILE" 2>/dev/null || stat -c%s "$UPLOADS_BACKUP_FILE") bytes)")
$([ -f "$CONFIG_BACKUP_FILE" ] && echo "- Config: $(basename $CONFIG_BACKUP_FILE) ($(stat -f%z "$CONFIG_BACKUP_FILE" 2>/dev/null || stat -c%s "$CONFIG_BACKUP_FILE") bytes)")

Docker containers status at backup time:
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}")

Environment info:
- Host: $(hostname)
- User: $(whoami)
- Docker version: $(docker --version)
- Compose version: $(docker-compose --version)

Restore instructions:
1. Stop current containers: docker-compose down
2. Restore database: gunzip -c $(basename $DB_BACKUP_FILE) | docker exec -i mediapp-postgres psql -U mediapp mediapp_db
$([ -f "$UPLOADS_BACKUP_FILE" ] && echo "3. Restore uploads: docker cp $(basename $UPLOADS_BACKUP_FILE) mediapp-backend:/tmp/ && docker exec mediapp-backend tar -xzf /tmp/$(basename $UPLOADS_BACKUP_FILE) -C /app")
4. Restart containers: docker-compose up -d
EOF

log "✅ Manifesto criado: $(basename $MANIFEST_FILE)"

# 5. Limpeza de backups antigos
log "🧹 Removendo backups antigos (>${RETENTION_DAYS} dias)..."

find "$BACKUP_DIR" -name "mediapp_backup_*" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || warn "Erro na limpeza de backups antigos"

REMOVED_COUNT=$(find "$BACKUP_DIR" -name "mediapp_backup_*" -type f -mtime +$RETENTION_DAYS 2>/dev/null | wc -l || echo 0)
if [ "$REMOVED_COUNT" -gt 0 ]; then
    log "🗑️ $REMOVED_COUNT backups antigos removidos"
fi

# 6. Resumo final
log ""
log "📊 Resumo do Backup:"
log "   • ID do Backup: $BACKUP_PREFIX"
log "   • Localização: $BACKUP_DIR"
log "   • Arquivos criados:"

for file in "$DB_BACKUP_FILE" "$UPLOADS_BACKUP_FILE" "$CONFIG_BACKUP_FILE" "$MANIFEST_FILE"; do
    if [ -f "$file" ]; then
        SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
        SIZE_MB=$(echo "scale=2; $SIZE/1024/1024" | bc 2>/dev/null || echo "N/A")
        log "     - $(basename "$file"): ${SIZE_MB} MB"
    fi
done

# Calcular tamanho total
TOTAL_SIZE=$(find "$BACKUP_DIR" -name "${BACKUP_PREFIX}*" -type f -exec stat -f%z {} + 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo 0)
TOTAL_MB=$(echo "scale=2; $TOTAL_SIZE/1024/1024" | bc 2>/dev/null || echo "N/A")

log "   • Tamanho total: ${TOTAL_MB} MB"
log "   • Backups no diretório: $(ls -1 "$BACKUP_DIR"/mediapp_backup_* 2>/dev/null | wc -l) arquivos"

log ""
log "✅ Backup concluído com sucesso!"
log "🔄 Para restaurar, consulte o arquivo: $(basename $MANIFEST_FILE)"