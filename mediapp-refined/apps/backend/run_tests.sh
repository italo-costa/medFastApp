#!/bin/bash
echo "🧪 Executando testes automáticos da arquitetura..."
echo "⏱️  Aguardando servidor inicializar..."
sleep 3
node ../../tests/architecture-validation.js
