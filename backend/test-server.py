#!/usr/bin/env python3
"""
Servidor de teste super simples para verificar conectividade WSL-Windows
"""

import http.server
import socketserver
import json
import datetime
import os
import signal
import sys
from urllib.parse import urlparse, parse_qs

class MediAppHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        
        if path == '/health':
            self.send_json_response({
                'status': 'OK',
                'timestamp': datetime.datetime.now().isoformat(),
                'server': 'Python Simple Server',
                'pid': os.getpid()
            })
        elif path == '/wsl-test':
            self.send_json_response({
                'message': 'WSL Connection OK via Python',
                'timestamp': datetime.datetime.now().isoformat(),
                'client_ip': self.client_address[0]
            })
        elif path == '/api/test':
            self.send_json_response({
                'message': 'API funcionando via Python',
                'timestamp': datetime.datetime.now().isoformat()
            })
        else:
            # Servir arquivos estáticos ou resposta padrão
            self.send_json_response({
                'message': 'MediApp Python Test Server',
                'endpoints': ['/health', '/wsl-test', '/api/test'],
                'timestamp': datetime.datetime.now().isoformat()
            })
    
    def do_POST(self):
        # Aceitar qualquer POST com resposta OK
        self.send_json_response({
            'message': 'POST recebido',
            'timestamp': datetime.datetime.now().isoformat()
        })
    
    def send_json_response(self, data):
        response = json.dumps(data, indent=2)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Connection', 'keep-alive')
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

def signal_handler(sig, frame):
    print('\n🛑 Encerrando servidor Python...')
    sys.exit(0)

if __name__ == '__main__':
    PORT = 3002
    HOST = '0.0.0.0'
    
    # Configurar tratamento de sinais
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Mudar para diretório public se existir
    public_dir = '/mnt/c/workspace/aplicativo/backend/public'
    if os.path.exists(public_dir):
        os.chdir(public_dir)
        print(f"📁 Servindo arquivos de: {public_dir}")
    
    try:
        with socketserver.TCPServer((HOST, PORT), MediAppHandler) as httpd:
            httpd.allow_reuse_address = True
            print('🚀 ===================================')
            print(f'🐍 MediApp Python Server - Porta {PORT}')
            print(f'🔗 Health: http://localhost:{PORT}/health')
            print(f'🌐 Test: http://localhost:{PORT}')
            print(f'🔧 WSL Test: http://localhost:{PORT}/wsl-test')
            print('🚀 ===================================')
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print('\n🛑 Servidor interrompido pelo usuário')
    except Exception as e:
        print(f'❌ Erro no servidor: {e}')
    finally:
        print('✅ Servidor Python encerrado')