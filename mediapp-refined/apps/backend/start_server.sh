#!/bin/bash
echo "🚀 Iniciando servidor MediApp..."
echo "📊 Backend: http://localhost:3002"
echo "🏥 Gestão Médicos: http://localhost:3002/gestao-medicos.html"
echo "👥 Gestão Pacientes: http://localhost:3002/gestao-pacientes.html"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo ""
node src/app.js
