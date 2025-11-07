#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MediApp - Servidor Simples em Python
Servidor ultra simples para demonstração em ambiente virtualizado
"""

import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time

PORT = 3002

# Dados mock
mock_data = {
    "medicos": [
        {"id": 1, "nome": "Dr. João Silva", "crm": "CRM123456", "especialidade": "Cardiologia"},
        {"id": 2, "nome": "Dra. Maria Costa", "crm": "CRM789012", "especialidade": "Pediatria"},
        {"id": 3, "nome": "Dr. Carlos Lima", "crm": "CRM345678", "especialidade": "Ortopedia"}
    ],
    "pacientes": [
        {"id": 1, "nome": "Ana Santos", "cpf": "111.222.333-44", "telefone": "(11) 99999-1111"},
        {"id": 2, "nome": "Roberto Oliveira", "cpf": "555.666.777-88", "telefone": "(21) 88888-2222"}
    ],
    "stats": {
        "medicosAtivos": {"value": 25, "trend": "+3 este mês"},
        "pacientesCadastrados": {"value": 147, "trend": "+12 este mês"},
        "consultasHoje": {"value": 8, "trend": "Normal"},
        "prontuariosAtivos": {"value": 1089, "trend": "+156 este mês"}
    }
}

# HTML para página principal
index_html = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MediApp - Sistema Online</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333; min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; color: white; margin-bottom: 40px; }
        .header h1 { font-size: 3rem; margin-bottom: 10px; }
        .status-card {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white; padding: 30px; border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 30px; text-align: center;
        }
        .status-icon { font-size: 4rem; margin-bottom: 20px; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: transform 0.3s ease; }
        .card:hover { transform: translateY(-5px); }
        .card h3 { color: #667eea; margin-bottom: 15px; font-size: 1.1rem; }
        .card-value { font-size: 2.5rem; font-weight: bold; color: #333; margin-bottom: 10px; }
        .card-trend { color: #4CAF50; font-size: 0.9rem; }
        .actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .btn {
            padding: 15px 25px; background: linear-gradient(135deg, #667eea, #764ba2);
            color: white; text-decoration: none; border-radius: 10px;
            text-align: center; font-weight: 600; transition: all 0.3s ease;
            border: none; cursor: pointer;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .endpoint-list { background: white; padding: 20px; border-radius: 15px; margin-top: 20px; }
        .endpoint { padding: 10px; border-bottom: 1px solid #eee; }
        .endpoint:last-child { border-bottom: none; }
        .endpoint code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 MediApp</h1>
            <p>Sistema Online - Servidor Python</p>
        </div>
        
        <div class="status-card">
            <div class="status-icon">✅</div>
            <h2>Sistema Online</h2>
            <p>Servidor Python rodando na porta 3002</p>
            <p>Integração mobile funcionando</p>
        </div>
        
        <div class="dashboard" id="dashboard">
            <div class="card">
                <h3>👨‍⚕️ Médicos Ativos</h3>
                <div class="card-value">25</div>
                <div class="card-trend">+3 este mês</div>
            </div>
            
            <div class="card">
                <h3>👥 Pacientes Cadastrados</h3>
                <div class="card-value">147</div>
                <div class="card-trend">+12 este mês</div>
            </div>
            
            <div class="card">
                <h3>📅 Consultas Hoje</h3>
                <div class="card-value">8</div>
                <div class="card-trend">Normal</div>
            </div>
            
            <div class="card">
                <h3>📋 Prontuários Ativos</h3>
                <div class="card-value">1089</div>
                <div class="card-trend">+156 este mês</div>
            </div>
        </div>
        
        <div class="actions">
            <a href="/api/medicos" class="btn">👨‍⚕️ Ver Médicos</a>
            <a href="/api/pacientes" class="btn">👥 Ver Pacientes</a>
            <a href="/health" class="btn">🔧 Health Check</a>
            <a href="/api/dashboard/stats" class="btn">📊 Estatísticas</a>
        </div>
        
        <div class="endpoint-list">
            <h3>🔗 Endpoints Disponíveis:</h3>
            <div class="endpoint">
                <strong>Health Check:</strong> <code>GET /health</code>
            </div>
            <div class="endpoint">
                <strong>Médicos:</strong> <code>GET /api/medicos</code>
            </div>
            <div class="endpoint">
                <strong>Pacientes:</strong> <code>GET /api/pacientes</code>
            </div>
            <div class="endpoint">
                <strong>Estatísticas:</strong> <code>GET /api/dashboard/stats</code>
            </div>
            <div class="endpoint">
                <strong>Buscar Médicos:</strong> <code>GET /api/medicos/buscar?q=termo</code>
            </div>
            <div class="endpoint">
                <strong>Buscar Pacientes:</strong> <code>GET /api/pacientes/buscar?q=termo</code>
            </div>
        </div>
    </div>
</body>
</html>"""

class MediAppHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def send_json_response(self, data, status=200):
        response = {
            "success": True,
            "data": data,
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S.000Z')
        }
        
        json_data = json.dumps(response, ensure_ascii=False, indent=2)
        
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        self.wfile.write(json_data.encode('utf-8'))

    def send_html_response(self, html):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        params = parse_qs(parsed_url.query)

        print(f"🔗 {self.command} {path}")

        # Página principal
        if path == '/' or path == '/index.html':
            self.send_html_response(index_html)
            return

        # Health check
        if path == '/health':
            uptime = time.time() - start_time
            health_data = {
                "status": "healthy",
                "server": "MediApp Python Server",
                "version": "1.0.0",
                "uptime": int(uptime),
                "port": PORT
            }
            self.send_json_response(health_data)
            return

        # API Médicos
        if path == '/api/medicos':
            self.send_json_response(mock_data["medicos"])
            return

        # API Pacientes
        if path == '/api/pacientes':
            self.send_json_response(mock_data["pacientes"])
            return

        # API Dashboard Stats
        if path == '/api/dashboard/stats':
            self.send_json_response(mock_data["stats"])
            return

        # Buscar médicos
        if path == '/api/medicos/buscar':
            query = params.get('q', [''])[0].lower()
            filtered = [m for m in mock_data["medicos"] 
                       if query in m["nome"].lower() or 
                          query in m["crm"].lower() or 
                          query in m["especialidade"].lower()]
            self.send_json_response(filtered)
            return

        # Buscar pacientes
        if path == '/api/pacientes/buscar':
            query = params.get('q', [''])[0].lower()
            filtered = [p for p in mock_data["pacientes"] 
                       if query in p["nome"].lower() or 
                          query in p["cpf"]]
            self.send_json_response(filtered)
            return

        # 404
        self.send_response(404)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()
        self.wfile.write(f"Página não encontrada: {path}".encode('utf-8'))

def run_server():
    global start_time
    start_time = time.time()
    
    server = HTTPServer(('0.0.0.0', PORT), MediAppHandler)
    
    print("🏥 ==========================================")
    print("🏥 MediApp Python Server v1.0.0")
    print("🏥 ==========================================")
    print(f"✅ Servidor rodando na porta {PORT}")
    print("🌐 URLs disponíveis:")
    print(f"   📊 Dashboard: http://localhost:{PORT}")
    print(f"   🔧 Health: http://localhost:{PORT}/health")
    print(f"   📡 API Base: http://localhost:{PORT}/api")
    print("🏥 ==========================================")
    print("✨ Servidor estável e pronto!")
    print("🏥 ==========================================")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Parando servidor...")
        server.shutdown()
        print("✅ Servidor parado com sucesso")

if __name__ == "__main__":
    run_server()