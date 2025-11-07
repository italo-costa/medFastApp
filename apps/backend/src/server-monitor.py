#!/usr/bin/env python3
"""
MediApp - Monitor e Iniciador de Servidor
Mantém o servidor rodando e monitora status
"""

import subprocess
import time
import sys
import signal
import os
from threading import Thread
import requests

SERVER_PORT = 3002
CHECK_INTERVAL = 10  # segundos

class ServerMonitor:
    def __init__(self):
        self.server_process = None
        self.running = False
        
    def is_server_responsive(self):
        """Verifica se o servidor está respondendo"""
        try:
            response = requests.get(f'http://localhost:{SERVER_PORT}/health', timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def start_server(self):
        """Inicia o servidor"""
        try:
            print(f"🚀 Iniciando servidor na porta {SERVER_PORT}...")
            server_script = os.path.join(os.path.dirname(__file__), 'simple-server.py')
            
            self.server_process = subprocess.Popen(
                [sys.executable, server_script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.path.dirname(__file__)
            )
            
            # Aguardar um pouco para o servidor inicializar
            time.sleep(3)
            
            if self.is_server_responsive():
                print("✅ Servidor iniciado com sucesso!")
                return True
            else:
                print("❌ Servidor não está respondendo")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao iniciar servidor: {e}")
            return False
    
    def stop_server(self):
        """Para o servidor"""
        if self.server_process:
            print("🛑 Parando servidor...")
            try:
                self.server_process.terminate()
                self.server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.server_process.kill()
                self.server_process.wait()
            self.server_process = None
            print("✅ Servidor parado")
    
    def monitor_loop(self):
        """Loop de monitoramento"""
        print("🔍 Iniciando monitoramento...")
        
        while self.running:
            if not self.is_server_responsive():
                print("⚠️ Servidor não está respondendo, reiniciando...")
                self.stop_server()
                if not self.start_server():
                    print("❌ Falha ao reiniciar servidor, tentando novamente em 30s...")
                    time.sleep(30)
                    continue
            else:
                print(f"✅ Servidor OK na porta {SERVER_PORT}")
            
            time.sleep(CHECK_INTERVAL)
    
    def start_monitoring(self):
        """Inicia monitoramento em thread separada"""
        self.running = True
        
        # Iniciar servidor
        if not self.start_server():
            print("❌ Falha ao iniciar servidor inicial")
            return False
        
        # Iniciar monitoramento
        monitor_thread = Thread(target=self.monitor_loop, daemon=True)
        monitor_thread.start()
        
        return True
    
    def stop_monitoring(self):
        """Para o monitoramento"""
        print("🛑 Parando monitoramento...")
        self.running = False
        self.stop_server()

def signal_handler(sig, frame):
    """Handler para sinais do sistema"""
    print("\n🛑 Recebido sinal de parada...")
    monitor.stop_monitoring()
    sys.exit(0)

if __name__ == "__main__":
    # Configurar handlers de sinal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    monitor = ServerMonitor()
    
    print("🏥 ==========================================")
    print("🏥 MediApp Server Monitor v1.0.0")
    print("🏥 ==========================================")
    print(f"🎯 Monitorando porta: {SERVER_PORT}")
    print(f"⏱️ Intervalo de verificação: {CHECK_INTERVAL}s")
    print("🏥 ==========================================")
    
    if monitor.start_monitoring():
        print("✨ Monitor ativo! Pressione Ctrl+C para parar.")
        
        try:
            # Manter o programa rodando
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
    else:
        print("❌ Falha ao iniciar monitor")
        sys.exit(1)