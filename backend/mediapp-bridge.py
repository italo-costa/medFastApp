#!/usr/bin/env python3
"""
SERVIDOR DEFINITIVO - MediApp para WSL-Windows
Máxima compatibilidade e estabilidade
"""

import http.server
import socketserver
import json
import datetime
import os
import sys
import signal
import threading
import time
from urllib.parse import urlparse, parse_qs

class MediAppHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='/mnt/c/workspace/aplicativo/backend/public', **kwargs)
    
    def end_headers(self):
        # Headers CORS máxima compatibilidade
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Max-Age', '86400')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Keep-Alive', 'timeout=120, max=1000')
        self.send_header('Server', 'MediApp-Python-Bridge/1.0')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        path = urlparse(self.path).path
        
        # Rotas da API médica
        if path == '/health':
            self.send_json({
                'status': 'OK',
                'timestamp': datetime.datetime.now().isoformat(),
                'server': 'MediApp Python Bridge',
                'version': '1.0.0',
                'pid': os.getpid(),
                'uptime': int(time.time() - start_time),
                'environment': 'WSL-Python',
                'client_ip': self.client_address[0]
            })
            
        elif path == '/wsl-bridge-test':
            self.send_json({
                'message': '✅ WSL Bridge funcionando perfeitamente!',
                'timestamp': datetime.datetime.now().isoformat(),
                'client_info': {
                    'ip': self.client_address[0],
                    'port': self.client_address[1],
                    'user_agent': self.headers.get('User-Agent', 'Unknown')
                },
                'server_info': {
                    'pid': os.getpid(),
                    'uptime': int(time.time() - start_time),
                    'platform': sys.platform
                }
            })
            
        elif path == '/api/test':
            self.send_json({
                'message': '🏥 MediApp API funcionando',
                'timestamp': datetime.datetime.now().isoformat(),
                'endpoints': [
                    '/health',
                    '/wsl-bridge-test', 
                    '/api/pacientes',
                    '/api/medicos',
                    '/api/prontuarios'
                ]
            })
            
        elif path == '/api/pacientes':
            self.send_json({
                'message': 'Lista de pacientes',
                'data': [
                    {
                        'id': 1,
                        'nome': 'João Silva',
                        'idade': 45,
                        'telefone': '(11) 98765-4321',
                        'email': 'joao@email.com'
                    },
                    {
                        'id': 2,
                        'nome': 'Maria Santos',
                        'idade': 32,
                        'telefone': '(11) 87654-3210',
                        'email': 'maria@email.com'
                    }
                ],
                'timestamp': datetime.datetime.now().isoformat(),
                'total': 2
            })
            
        elif path == '/api/medicos':
            self.send_json({
                'message': 'Lista de médicos',
                'data': [
                    {
                        'id': 1,
                        'nome': 'Dr. Carlos Oliveira',
                        'crm': '123456-SP',
                        'especialidade': 'Cardiologia',
                        'telefone': '(11) 3333-4444'
                    },
                    {
                        'id': 2,
                        'nome': 'Dra. Ana Costa',
                        'crm': '789012-SP', 
                        'especialidade': 'Pediatria',
                        'telefone': '(11) 5555-6666'
                    }
                ],
                'timestamp': datetime.datetime.now().isoformat(),
                'total': 2
            })
            
        elif path == '/api/prontuarios':
            self.send_json({
                'message': 'Lista de prontuários',
                'data': [
                    {
                        'id': 1,
                        'paciente_id': 1,
                        'medico_id': 1,
                        'data': '2024-01-15',
                        'resumo': 'Consulta cardiológica de rotina'
                    },
                    {
                        'id': 2,
                        'paciente_id': 2,
                        'medico_id': 2,
                        'data': '2024-01-16',
                        'resumo': 'Consulta pediátrica - vacinação'
                    }
                ],
                'timestamp': datetime.datetime.now().isoformat(),
                'total': 2
            })
            
        else:
            # Servir página principal ou arquivos estáticos
            if path == '/' or path == '/index.html':
                self.serve_main_page()
            else:
                try:
                    super().do_GET()
                except:
                    self.send_error(404, "Arquivo não encontrado")
    
    def do_POST(self):
        # Aceitar POSTs básicos
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8')) if post_data else {}
        except:
            data = {}
        
        self.send_json({
            'message': 'POST recebido com sucesso',
            'received_data': data,
            'timestamp': datetime.datetime.now().isoformat()
        })
    
    def send_json(self, data):
        response = json.dumps(data, indent=2, ensure_ascii=False)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))
    
    def serve_main_page(self):
        html = f'''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MediApp - Sistema Médico</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{ 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        .header {{ 
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white; 
            padding: 30px;
            text-align: center;
        }}
        .header h1 {{ font-size: 2.5em; margin-bottom: 10px; }}
        .status {{ 
            background: #d4edda; 
            border: 1px solid #c3e6cb; 
            color: #155724;
            padding: 20px; 
            margin: 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        .main-nav {{ 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
        }}
        .nav-card {{ 
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 10px;
            padding: 25px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }}
        .nav-card:hover {{ 
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-color: #4CAF50;
        }}
        .nav-card h3 {{ color: #333; margin-bottom: 15px; }}
        .nav-card p {{ color: #666; margin-bottom: 20px; }}
        .nav-btn {{ 
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s;
        }}
        .nav-btn:hover {{ background: #45a049; }}
        .test-section {{ 
            background: #f8f9fa;
            padding: 30px;
            border-top: 1px solid #dee2e6;
        }}
        .test-buttons {{ 
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
        }}
        .test-btn {{ 
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        }}
        .test-btn:hover {{ background: #0056b3; }}
        #test-results {{ 
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            min-height: 100px;
            font-family: monospace;
            white-space: pre-wrap;
        }}
        .footer {{
            background: #333;
            color: white;
            text-align: center;
            padding: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 MediApp</h1>
            <p>Sistema de Gestão Médica - WSL Bridge</p>
        </div>
        
        <div class="status">
            <span style="font-size: 1.5em;">✅</span>
            <div>
                <strong>Servidor Online!</strong><br>
                <small>Conectividade WSL-Windows estabelecida • {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</small>
            </div>
        </div>
        
        <div class="main-nav">
            <div class="nav-card">
                <h3>👥 Pacientes</h3>
                <p>Gerenciar cadastro e dados dos pacientes</p>
                <button class="nav-btn" onclick="testEndpoint('/api/pacientes')">Ver Pacientes</button>
            </div>
            
            <div class="nav-card">
                <h3>👨‍⚕️ Médicos</h3>
                <p>Cadastro e dados dos profissionais</p>
                <button class="nav-btn" onclick="testEndpoint('/api/medicos')">Ver Médicos</button>
            </div>
            
            <div class="nav-card">
                <h3>📋 Prontuários</h3>
                <p>Histórico médico e anamnese</p>
                <button class="nav-btn" onclick="testEndpoint('/api/prontuarios')">Ver Prontuários</button>
            </div>
            
            <div class="nav-card">
                <h3>🔧 Sistema</h3>
                <p>Monitoramento e configurações</p>
                <button class="nav-btn" onclick="testEndpoint('/health')">Health Check</button>
            </div>
        </div>
        
        <div class="test-section">
            <h3>🧪 Testes de Conectividade</h3>
            <div class="test-buttons">
                <button class="test-btn" onclick="testEndpoint('/health')">Health</button>
                <button class="test-btn" onclick="testEndpoint('/wsl-bridge-test')">WSL Bridge</button>
                <button class="test-btn" onclick="testEndpoint('/api/test')">API Test</button>
                <button class="test-btn" onclick="clearResults()">Limpar</button>
            </div>
            <div id="test-results">Clique em um botão para testar a conectividade...</div>
        </div>
        
        <div class="footer">
            <p>&copy; 2024 MediApp - Sistema de Gestão Médica</p>
            <p><small>Servidor Python Bridge • PID: {os.getpid()} • Uptime: {int(time.time() - start_time)}s</small></p>
        </div>
    </div>
    
    <script>
        async function testEndpoint(endpoint) {{
            const resultDiv = document.getElementById('test-results');
            resultDiv.textContent = 'Testando ' + endpoint + '...\n';
            
            try {{
                const response = await fetch(endpoint);
                const data = await response.json();
                resultDiv.textContent = 
                    '✅ Sucesso: ' + endpoint + '\n' +
                    'Status: ' + response.status + '\n' +
                    'Resposta:\n' + 
                    JSON.stringify(data, null, 2);
            }} catch (error) {{
                resultDiv.textContent = 
                    '❌ Erro: ' + endpoint + '\n' +
                    'Mensagem: ' + error.message;
            }}
        }}
        
        function clearResults() {{
            document.getElementById('test-results').textContent = 'Resultados limpos.';
        }}
        
        // Auto-test inicial
        setTimeout(() => testEndpoint('/health'), 1000);
    </script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))

# Variável global para uptime
start_time = time.time()

def signal_handler(sig, frame):
    print(f'\n🛑 Sinal {sig} recebido - encerrando servidor...')
    sys.exit(0)

def heartbeat():
    """Thread de heartbeat para mostrar que o servidor está vivo"""
    count = 0
    while True:
        time.sleep(60)  # A cada minuto
        count += 1
        print(f'💓 Heartbeat #{count} - Uptime: {int(time.time() - start_time)}s - {datetime.datetime.now().strftime("%H:%M:%S")}')

if __name__ == '__main__':
    PORT = 3001
    HOST = '0.0.0.0'  # Bind em todas as interfaces
    
    # Configurar sinais
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Iniciar thread de heartbeat
    heartbeat_thread = threading.Thread(target=heartbeat, daemon=True)
    heartbeat_thread.start()
    
    try:
        # Configurar servidor com reutilização de endereço
        class ReusableTCPServer(socketserver.TCPServer):
            allow_reuse_address = True
            timeout = 120
        
        with ReusableTCPServer((HOST, PORT), MediAppHTTPHandler) as httpd:
            print('🚀 ==========================================')
            print(f'🏥 MediApp Python Bridge Server INICIADO')
            print(f'📡 Endereço: {HOST}:{PORT}')
            print(f'🌍 Acesse: http://localhost:{PORT}')
            print(f'🔧 Health: http://localhost:{PORT}/health')
            print(f'🌉 Bridge: http://localhost:{PORT}/wsl-bridge-test')
            print(f'👥 Pacientes: http://localhost:{PORT}/api/pacientes')
            print(f'👨‍⚕️ Médicos: http://localhost:{PORT}/api/medicos')
            print(f'📋 Prontuários: http://localhost:{PORT}/api/prontuarios')
            print(f'📊 PID: {os.getpid()}')
            print('🚀 ==========================================')
            
            print(f'💡 TESTE NO CHROME: http://localhost:{PORT}')
            print('🎯 Servidor pronto para conexões do Windows!')
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print('\n🛑 Servidor interrompido pelo usuário')
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f'❌ Porta {PORT} já está em uso')
            print('💡 Use: sudo netstat -tlnp | grep :3001')
            print('💡 Ou: sudo fuser -k 3001/tcp')
        else:
            print(f'❌ Erro do sistema: {e}')
    except Exception as e:
        print(f'❌ Erro inesperado: {e}')
    finally:
        print('✅ Servidor Python Bridge encerrado')