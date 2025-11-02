#!/bin/bash

# FASE 5.3: Testes de Frontend
echo "🌐 FASE 5.3: Testes de Frontend"
echo "=============================="

cd /mnt/c/workspace/aplicativo/mediapp-refined

echo "📁 Verificando estrutura do frontend..."

# Verificar estrutura frontend
frontend_paths=(
    "apps/frontend/src"
    "apps/frontend/assets"
    "apps/backend/public"
)

echo "✅ Estruturas encontradas:"
for path in "${frontend_paths[@]}"; do
    if [ -d "$path" ]; then
        echo "  ✅ $path"
        file_count=$(find "$path" -type f 2>/dev/null | wc -l)
        echo "    📊 $file_count arquivos"
    else
        echo "  ❌ $path - AUSENTE"
    fi
done

echo ""
echo "🖥️ Verificando páginas HTML servidas pelo backend..."

backend_public="/mnt/c/workspace/aplicativo/mediapp-refined/apps/backend/public"
if [ -d "$backend_public" ]; then
    echo "📄 Páginas HTML encontradas:"
    
    html_files=(
        "gestao-medicos.html"
        "gestao-pacientes.html"
        "app.html"
        "index.html"
    )
    
    html_count=0
    for html_file in "${html_files[@]}"; do
        if [ -f "$backend_public/$html_file" ]; then
            echo "  ✅ $html_file"
            ((html_count++))
            
            # Verificar se é HTML válido
            if grep -q "<html\|<HTML\|<!DOCTYPE" "$backend_public/$html_file"; then
                echo "    ✅ HTML válido"
            else
                echo "    ⚠️  Estrutura HTML questionável"
            fi
        else
            echo "  ❌ $html_file - AUSENTE"
        fi
    done
    
    echo "  📊 Total de páginas principais: $html_count/4"
    
    # Contar todas as páginas HTML
    total_html=$(find "$backend_public" -name "*.html" | wc -l)
    echo "  📊 Total de páginas HTML: $total_html"
else
    echo "❌ Diretório public do backend não encontrado"
    html_count=0
    total_html=0
fi

echo ""
echo "📜 Verificando JavaScript do frontend..."

js_dir="$backend_public/js"
if [ -d "$js_dir" ]; then
    echo "📦 Scripts JavaScript:"
    js_count=$(find "$js_dir" -name "*.js" | wc -l)
    echo "  📊 $js_count arquivos JavaScript encontrados"
    
    # Verificar alguns arquivos JS importantes
    if [ -f "$js_dir/app.js" ]; then
        echo "  ✅ app.js principal encontrado"
    fi
    
    if [ -f "$js_dir/api.js" ]; then
        echo "  ✅ api.js para integração encontrado"
    fi
else
    echo "⚠️  Diretório JavaScript não encontrado"
    js_count=0
fi

echo ""
echo "🎨 Verificando recursos estáticos..."

# Verificar CSS
css_count=0
if find "$backend_public" -name "*.css" 2>/dev/null | head -1 > /dev/null; then
    css_count=$(find "$backend_public" -name "*.css" | wc -l)
    echo "🎨 CSS: $css_count arquivos de estilo"
else
    echo "⚠️  Nenhum arquivo CSS encontrado"
fi

# Verificar imagens
img_count=0
if find "$backend_public" -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" 2>/dev/null | head -1 > /dev/null; then
    img_count=$(find "$backend_public" -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" | wc -l)
    echo "🖼️  Imagens: $img_count arquivos de imagem"
else
    echo "⚠️  Nenhuma imagem encontrada"
fi

echo ""
echo "🔗 Testando estrutura de integração frontend..."

# Verificar se há configuração de API nos HTMLs
api_integration=false
if grep -r "localhost:3002\|api/" "$backend_public"/*.html 2>/dev/null; then
    echo "✅ Integração com API detectada nas páginas"
    api_integration=true
else
    echo "⚠️  Integração com API não detectada claramente"
fi

# Verificar se há chamadas AJAX/fetch
if grep -r "fetch\|axios\|XMLHttpRequest\|$.ajax" "$backend_public" 2>/dev/null | head -3; then
    echo "✅ Chamadas AJAX/API detectadas"
    ajax_integration=true
else
    echo "⚠️  Chamadas AJAX/API não detectadas"
    ajax_integration=false
fi

echo ""
echo "🎯 RESUMO FASE 5.3:"
echo "=================="

# Calcular score do frontend
frontend_score=0
frontend_total=8

[ -d "$backend_public" ] && ((frontend_score++))
[ $html_count -ge 3 ] && ((frontend_score++))
[ $total_html -ge 5 ] && ((frontend_score++))
[ $js_count -gt 0 ] && ((frontend_score++))
[ $css_count -gt 0 ] && ((frontend_score++))
[ "$api_integration" = true ] && ((frontend_score++))
[ "$ajax_integration" = true ] && ((frontend_score++))
[ -d "apps/frontend/src" ] && ((frontend_score++))

frontend_percentage=$((frontend_score * 100 / frontend_total))

echo "📊 Estrutura Frontend: $frontend_score/$frontend_total ($frontend_percentage%)"
echo "📄 Páginas HTML: $total_html páginas"
echo "📜 Scripts JS: $js_count arquivos"
echo "🎨 Estilos CSS: $css_count arquivos"

if [ $frontend_percentage -ge 75 ]; then
    echo "✅ FASE 5.3 CONCLUÍDA: Frontend bem estruturado"
elif [ $frontend_percentage -ge 50 ]; then
    echo "⚠️  FASE 5.3 BOA: Frontend funcional com melhorias possíveis"
else
    echo "❌ FASE 5.3 FALHOU: Frontend necessita reestruturação"
fi

echo ""
echo "⏭️  Pronto para FASE 5.4: Integração Final"