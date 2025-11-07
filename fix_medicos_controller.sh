#!/bin/bash

# Script para corrigir res.success/res.error/res.notFound no medicosController.js

FILE="c:/workspace/aplicativo/apps/backend/src/controllers/medicosController.js"

echo "Corrigindo métodos de resposta no medicosController.js..."

# Fazer backup
cp "$FILE" "$FILE.backup"

# Corrigir res.success(data, message) para res.status(200).json({success: true, data, message})
sed -i 's/res\.success(\([^,]*\), \([^)]*\))/res.status(200).json({success: true, data: \1, message: \2})/g' "$FILE"

# Corrigir res.error(message, code, error) para res.status(code).json({success: false, message, error})
sed -i 's/res\.error(\([^,]*\), \([^,]*\), \([^)]*\))/res.status(\2).json({success: false, message: \1, error: \3})/g' "$FILE"

# Corrigir res.error(message, code) para res.status(code).json({success: false, message})
sed -i 's/res\.error(\([^,]*\), \([^)]*\))/res.status(\2).json({success: false, message: \1})/g' "$FILE"

# Corrigir res.notFound(message) para res.status(404).json({success: false, message})
sed -i 's/res\.notFound(\([^)]*\))/res.status(404).json({success: false, message: \1})/g' "$FILE"

echo "Correções aplicadas com sucesso!"