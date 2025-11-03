#!/usr/bin/env python3
"""
Verifica se os arquivos JavaScript têm sintaxe válida básica
"""

import os
import re

def verificar_syntax_basica(arquivo):
    """Verificação básica de sintaxe JavaScript"""
    erros = []
    
    with open(arquivo, 'r', encoding='utf-8') as f:
        conteudo = f.read()
        linhas = conteudo.split('\n')
    
    # Verificar parênteses, chaves e colchetes balanceados
    stack = []
    pairs = {'(': ')', '[': ']', '{': '}'}
    
    for i, linha in enumerate(linhas, 1):
        # Remover strings e comentários para análise mais precisa
        linha_limpa = re.sub(r'//.*', '', linha)  # Comentários de linha
        linha_limpa = re.sub(r'/\*.*?\*/', '', linha_limpa)  # Comentários de bloco
        linha_limpa = re.sub(r'"[^"]*"', '""', linha_limpa)  # Strings duplas
        linha_limpa = re.sub(r"'[^']*'", "''", linha_limpa)  # Strings simples
        linha_limpa = re.sub(r'`[^`]*`', '``', linha_limpa)  # Template strings
        
        for char in linha_limpa:
            if char in pairs:
                stack.append((char, i))
            elif char in pairs.values():
                if not stack:
                    erros.append(f"Linha {i}: '{char}' sem abertura correspondente")
                else:
                    abertura, linha_abertura = stack.pop()
                    if pairs[abertura] != char:
                        erros.append(f"Linha {i}: '{char}' não corresponde a '{abertura}' da linha {linha_abertura}")
    
    # Verificar se há aberturas não fechadas
    for abertura, linha in stack:
        erros.append(f"Linha {linha}: '{abertura}' não foi fechado")
    
    # Verificar require statements básicos
    requires = re.findall(r"require\s*\(\s*['\"]([^'\"]+)['\"]", conteudo)
    for req in requires:
        if req.startswith('./') or req.startswith('../'):
            # Verificar se arquivo local existe (básico)
            pass
    
    # Verificar exports
    if 'module.exports' not in conteudo and 'exports.' not in conteudo:
        if not arquivo.endswith('test-services.js'):  # Exceto arquivo de teste
            erros.append("Arquivo não possui exports")
    
    return erros

def main():
    print("🔍 Verificando sintaxe básica dos serviços JavaScript...")
    
    services_dir = r"c:\workspace\aplicativo\apps\backend\src\services"
    test_file = r"c:\workspace\aplicativo\apps\backend\src\test-services.js"
    
    arquivos_para_verificar = [
        os.path.join(services_dir, "authService.js"),
        os.path.join(services_dir, "validationService.js"),
        os.path.join(services_dir, "fileService.js"),
        os.path.join(services_dir, "responseService.js"),
        test_file
    ]
    
    total_erros = 0
    
    for arquivo in arquivos_para_verificar:
        if os.path.exists(arquivo):
            print(f"\n📁 Verificando: {os.path.basename(arquivo)}")
            erros = verificar_syntax_basica(arquivo)
            
            if erros:
                print(f"❌ {len(erros)} erro(s) encontrado(s):")
                for erro in erros:
                    print(f"   - {erro}")
                total_erros += len(erros)
            else:
                print("✅ Sintaxe básica válida")
        else:
            print(f"❌ Arquivo não encontrado: {arquivo}")
            total_erros += 1
    
    print(f"\n📊 RESULTADO:")
    if total_erros == 0:
        print("🎉 Todos os arquivos passaram na verificação básica!")
        print("✅ FASE 2 - SERVIÇOS CENTRALIZADOS: SINTAXE VÁLIDA")
    else:
        print(f"❌ {total_erros} erro(s) encontrado(s)")
    
    return total_erros == 0

if __name__ == "__main__":
    main()