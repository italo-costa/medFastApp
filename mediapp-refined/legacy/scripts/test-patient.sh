#!/bin/bash
# Script para testar cadastro de paciente

curl -v -X POST http://localhost:3001/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCompleto": "João Silva Teste",
    "cpf": "12345678901", 
    "dataNascimento": "1990-01-01",
    "telefone": "11999999999",
    "email": "joao@teste.com"
  }'