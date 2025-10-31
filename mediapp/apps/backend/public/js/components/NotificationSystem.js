/**
 * Sistema de Notificações - MediApp
 * Gerencia toast notifications e feedbacks visuais
 */

class NotificationSystem {
  constructor() {
    this.container = null;
    this.init();
  }

  /**
   * Inicializar o sistema de notificações
   */
  init() {
    // Criar container se não existir
    if (!document.getElementById('notification-container')) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'notification-container';
      this.container.innerHTML = `
        <style>
          .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
          }
          
          .notification {
            background: white;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border-left: 4px solid #ccc;
            display: flex;
            align-items: center;
            animation: slideInRight 0.3s ease-out;
            max-width: 100%;
            word-wrap: break-word;
          }
          
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
          
          .notification.success { border-left-color: #10b981; }
          .notification.error { border-left-color: #ef4444; }
          .notification.warning { border-left-color: #f59e0b; }
          .notification.info { border-left-color: #3b82f6; }
          
          .notification-icon {
            font-size: 18px;
            margin-right: 12px;
            flex-shrink: 0;
          }
          
          .notification.success .notification-icon { color: #10b981; }
          .notification.error .notification-icon { color: #ef4444; }
          .notification.warning .notification-icon { color: #f59e0b; }
          .notification.info .notification-icon { color: #3b82f6; }
          
          .notification-content {
            flex: 1;
          }
          
          .notification-title {
            font-weight: 600;
            margin-bottom: 4px;
            font-size: 14px;
          }
          
          .notification-message {
            font-size: 13px;
            color: #6b7280;
            line-height: 1.4;
          }
          
          .notification-close {
            background: none;
            border: none;
            font-size: 18px;
            color: #9ca3af;
            cursor: pointer;
            padding: 0;
            margin-left: 12px;
            flex-shrink: 0;
          }
          
          .notification-close:hover {
            color: #6b7280;
          }
        </style>
      `;
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('notification-container');
    }
  }

  /**
   * Mostrar notificação
   */
  show(message, type = 'info', title = null, duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const titles = {
      success: title || 'Sucesso',
      error: title || 'Erro',
      warning: title || 'Atenção',
      info: title || 'Informação'
    };

    notification.innerHTML = `
      <div class="notification-icon">${icons[type]}</div>
      <div class="notification-content">
        <div class="notification-title">${titles[type]}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">&times;</button>
    `;

    // Adicionar ao container
    this.container.appendChild(notification);

    // Evento de fechar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.remove(notification);
    });

    // Auto-remover após duração especificada
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, duration);
    }

    return notification;
  }

  /**
   * Remover notificação
   */
  remove(notification) {
    if (notification && notification.parentNode) {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }

  /**
   * Limpar todas as notificações
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  // Métodos de conveniência
  success(message, title = null, duration = 5000) {
    return this.show(message, 'success', title, duration);
  }

  error(message, title = null, duration = 8000) {
    return this.show(message, 'error', title, duration);
  }

  warning(message, title = null, duration = 6000) {
    return this.show(message, 'warning', title, duration);
  }

  info(message, title = null, duration = 5000) {
    return this.show(message, 'info', title, duration);
  }
}

// Loading overlay
class LoadingManager {
  constructor() {
    this.overlay = null;
    this.activeLoaders = 0;
  }

  show(message = 'Carregando...') {
    this.activeLoaders++;
    
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.id = 'loading-overlay';
      this.overlay.innerHTML = `
        <style>
          #loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
          }
          
          .loading-content {
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .loading-message {
            color: #374151;
            font-size: 16px;
            font-weight: 500;
          }
        </style>
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-message">${message}</div>
        </div>
      `;
      document.body.appendChild(this.overlay);
    } else {
      // Atualizar mensagem se já estiver visível
      const messageElement = this.overlay.querySelector('.loading-message');
      if (messageElement) {
        messageElement.textContent = message;
      }
    }
  }

  hide() {
    this.activeLoaders = Math.max(0, this.activeLoaders - 1);
    
    if (this.activeLoaders === 0 && this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
  }

  forceHide() {
    this.activeLoaders = 0;
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
  }
}

// Instâncias globais
const notifications = new NotificationSystem();
const loading = new LoadingManager();

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.notifications = notifications;
  window.loading = loading;
  window.NotificationSystem = NotificationSystem;
  window.LoadingManager = LoadingManager;
}

// Exportar para Node.js se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationSystem, LoadingManager, notifications, loading };
}