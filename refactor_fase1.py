#!/usr/bin/env python3
"""
Script para refatoração automática - Fase 1
Substitui instâncias do Prisma pelo databaseService
"""

import os
import re
import glob

# Diretório base
BASE_DIR = r"c:\workspace\aplicativo\apps\backend\src"

def refactor_file(file_path):
    """Refatora um arquivo substituindo prisma por databaseService"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. Remover import do PrismaClient se existir
        content = re.sub(
            r'const { PrismaClient } = require\([\'"]@prisma/client[\'"]\);\s*\n',
            '',
            content
        )
        
        # 2. Remover declaração da instância do Prisma
        content = re.sub(
            r'const prisma = new PrismaClient\(\);\s*\n',
            '',
            content
        )
        
        # 3. Adicionar import do databaseService se não existir
        if 'databaseService' not in content and 'prisma.' in content:
            # Encontrar o último import
            import_lines = []
            lines = content.split('\n')
            
            for i, line in enumerate(lines):
                if line.strip().startswith('const ') and 'require(' in line:
                    import_lines.append(i)
            
            if import_lines:
                last_import_idx = max(import_lines)
                lines.insert(last_import_idx + 1, "const databaseService = require('../services/database');")
                content = '\n'.join(lines)
        
        # 4. Substituir todas as ocorrências de prisma. por databaseService.client.
        content = re.sub(r'\bprisma\.', 'databaseService.client.', content)
        
        # 5. Corrigir transações - prisma.$transaction vira databaseService.client.$transaction
        content = re.sub(
            r'databaseService\.client\.\$transaction\(async \(prismaTransaction\)',
            'databaseService.client.$transaction(async (transaction)',
            content
        )
        
        # 6. Substituir prismaTransaction por transaction nas transações
        content = re.sub(r'\bprismaTransaction\.', 'transaction.', content)
        
        # Se houve mudanças, salvar o arquivo
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Refatorado: {file_path}")
            return True
        else:
            print(f"⚪ Inalterado: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao processar {file_path}: {e}")
        return False

def main():
    """Executa a refatoração em todos os arquivos relevantes"""
    
    # Arquivos a serem processados
    patterns = [
        os.path.join(BASE_DIR, "routes", "*.js"),
        os.path.join(BASE_DIR, "scripts", "*.js"),
        os.path.join(BASE_DIR, "database", "*.js")
    ]
    
    files_processed = 0
    files_changed = 0
    
    print("🔄 Iniciando refatoração da Fase 1 - Consolidação Database")
    print("=" * 60)
    
    for pattern in patterns:
        for file_path in glob.glob(pattern):
            files_processed += 1
            if refactor_file(file_path):
                files_changed += 1
    
    print("=" * 60)
    print(f"📊 Resumo da refatoração:")
    print(f"   • Arquivos processados: {files_processed}")
    print(f"   • Arquivos alterados: {files_changed}")
    print(f"   • Taxa de refatoração: {(files_changed/files_processed*100):.1f}%")
    
    print("\n🎯 Próximos passos:")
    print("   1. Testar os endpoints refatorados")
    print("   2. Verificar se o servidor inicia sem erros")
    print("   3. Prosseguir para Fase 2 (Services)")

if __name__ == "__main__":
    main()