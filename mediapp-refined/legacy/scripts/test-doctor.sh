#!/bin/bash
# Script para testar cadastro de médico

curl -v -X POST http://localhost:3001/api/auth/register-doctor \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCompleto": "Dr. Maria Santos",
    "cpf": "98765432109",
    "crm": "12345-SP", 
    "especialidade": "Cardiologia",
    "telefone": "11988776655",
    "email": "dra.maria@mediapp.com",
    "dataNascimento": "1985-05-15",
    "usuario": "drmaria",
    "senha": "senha123456"
  }'