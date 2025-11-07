/**
 * MediApp Core JavaScript Framework
 * Base classes e utilities para toda a aplicação
 */

class MediAppCore {
  constructor() {
    this.apiBaseUrl = '/api';
    this.components = new Map();
    this.eventBus = new EventTarget();
    this.init();
  }
  
  init() {
    this.setupGlobalEventListeners();
    this.initializeServiceWorker();
  }
  
  // ========================
  // EVENT MANAGEMENT
  // ========================
  
  setupGlobalEventListeners() {
    // ESC key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.emit('escape-pressed', e);
      }
    });
    
    // Click outside handler
    document.addEventListener('click', (e) => {
      this.emit('click-outside', e);
    });
    
    // Form validation
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.classList.contains('validate')) {
        if (!this.validateForm(form)) {
          e.preventDefault();
        }
      }
    });
  }
  
  on(event, callback) {
    this.eventBus.addEventListener(event, callback);
  }
  
  off(event, callback) {
    this.eventBus.removeEventListener(event, callback);
  }
  
  emit(event, data = null) {
    this.eventBus.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
  
  // ========================
  // HTTP CLIENT
  // ========================
  
  async request(endpoint, options = {}) {
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('Request failed:', error);
      this.showNotification('Erro de conexão com o servidor', 'error');
      throw error;
    }
  }
  
  async get(endpoint) {
    return this.request(endpoint);
  }
  
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
  
  // ========================
  // DOM UTILITIES
  // ========================
  
  $(selector, context = document) {
    const element = context.querySelector(selector);
    if (!element) {
      console.warn(`Element not found: ${selector}`);
    }
    return element;
  }
  
  $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  }
  
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key.startsWith('on')) {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    
    return element;
  }
  
  show(element) {
    if (element) {
      element.classList.remove('hidden');
      element.style.display = '';
    }
  }
  
  hide(element) {
    if (element) {
      element.classList.add('hidden');
    }
  }
  
  toggle(element) {
    if (element) {
      element.classList.toggle('hidden');
    }
  }
  
  // ========================
  // MODAL MANAGEMENT
  // ========================
  
  openModal(modalId, config = {}) {
    const modal = this.$(modalId.startsWith('#') ? modalId : `#${modalId}`);
    if (!modal) return false;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus management
    const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea, button');
    if (firstInput && !config.noAutoFocus) {
      setTimeout(() => firstInput.focus(), 100);
    }
    
    // Setup close handlers
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.closeModal(modalId);
      }
    };
    
    const handleClickOutside = (e) => {
      if (e.target === modal) {
        this.closeModal(modalId);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    modal.addEventListener('click', handleClickOutside);
    
    // Store cleanup functions
    modal._cleanup = () => {
      document.removeEventListener('keydown', handleEscape);
      modal.removeEventListener('click', handleClickOutside);
    };
    
    this.emit('modal-opened', { modalId, modal });
    return true;
  }
  
  closeModal(modalId) {
    const modal = this.$(modalId.startsWith('#') ? modalId : `#${modalId}`);
    if (!modal) return false;
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Cleanup event listeners
    if (modal._cleanup) {
      modal._cleanup();
      delete modal._cleanup;
    }
    
    this.emit('modal-closed', { modalId, modal });
    return true;
  }
  
  // ========================
  // FORM UTILITIES
  // ========================
  
  getFormData(form) {
    const formData = new FormData(form);
    return Object.fromEntries(formData);
  }
  
  setFormData(form, data) {
    Object.entries(data).forEach(([key, value]) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (field) {
        field.value = value || '';
      }
    });
  }
  
  resetForm(form) {
    if (form) {
      form.reset();
      // Clear validation states
      this.$$('.form-control', form).forEach(field => {
        field.classList.remove('invalid', 'valid');
      });
    }
  }
  
  validateForm(form) {
    let isValid = true;
    const fields = this.$$('.form-control[required]', form);
    
    fields.forEach(field => {
      const value = field.value.trim();
      const isFieldValid = this.validateField(field, value);
      
      if (!isFieldValid) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  validateField(field, value) {
    let isValid = true;
    
    // Required validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
      }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
      }
    }
    
    // Update field appearance
    field.classList.toggle('invalid', !isValid);
    field.classList.toggle('valid', isValid && !!value);
    
    return isValid;
  }
  
  // ========================
  // NOTIFICATION SYSTEM
  // ========================
  
  showNotification(message, type = 'info', duration = 5000) {
    const notification = this.createElement('div', {
      className: `notification notification-${type}`,
      innerHTML: `
        <div class="notification-content">
          <span class="notification-message">${message}</span>
          <button class="notification-close">&times;</button>
        </div>
      `
    });
    
    // Add to DOM
    let container = this.$('#notification-container');
    if (!container) {
      container = this.createElement('div', {
        id: 'notification-container',
        className: 'notification-container'
      });
      document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Auto remove
    const remove = () => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    };
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', remove);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(remove, duration);
    }
    
    // Animate in
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease';
    }, 10);
  }
  
  // ========================
  // LOADING STATES
  // ========================
  
  showLoading(element, message = 'Carregando...') {
    if (!element) return;
    
    const loader = this.createElement('div', {
      className: 'loading-overlay',
      innerHTML: `
        <div class="loading-content">
          <i class="fas fa-spinner animate-spin"></i>
          <span>${message}</span>
        </div>
      `
    });
    
    element.style.position = 'relative';
    element.appendChild(loader);
  }
  
  hideLoading(element) {
    if (!element) return;
    
    const loader = element.querySelector('.loading-overlay');
    if (loader) {
      loader.remove();
    }
  }
  
  // ========================
  // UTILITIES
  // ========================
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
  
  formatDate(date, options = {}) {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...options
    }).format(new Date(date));
  }
  
  formatPhone(value) {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return value;
  }
  
  formatCEP(value) {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }
  
  formatCPF(value) {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  
  // ========================
  // SERVICE WORKER
  // ========================
  
  async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registered:', registration);
      } catch (error) {
        console.log('ServiceWorker registration failed:', error);
      }
    }
  }
  
  // ========================
  // COMPONENT SYSTEM
  // ========================
  
  registerComponent(name, component) {
    this.components.set(name, component);
  }
  
  getComponent(name) {
    return this.components.get(name);
  }
  
  initializeComponents() {
    // Auto-initialize components with data-component attribute
    this.$$('[data-component]').forEach(element => {
      const componentName = element.dataset.component;
      const ComponentClass = this.getComponent(componentName);
      
      if (ComponentClass) {
        new ComponentClass(element);
      }
    });
  }
}

// ========================
// BASE COMPONENT CLASS
// ========================

class MediAppComponent {
  constructor(element, options = {}) {
    this.element = element;
    this.options = { ...this.defaultOptions, ...options };
    this.app = window.mediApp;
    this.init();
  }
  
  get defaultOptions() {
    return {};
  }
  
  init() {
    this.setupEventListeners();
    this.render();
  }
  
  setupEventListeners() {
    // Override in subclasses
  }
  
  render() {
    // Override in subclasses
  }
  
  destroy() {
    // Cleanup event listeners
    // Override in subclasses
  }
  
  $(selector) {
    return this.element.querySelector(selector);
  }
  
  $$(selector) {
    return Array.from(this.element.querySelectorAll(selector));
  }
  
  emit(event, data = null) {
    this.element.dispatchEvent(new CustomEvent(event, { detail: data, bubbles: true }));
  }
  
  on(event, callback) {
    this.element.addEventListener(event, callback);
  }
}

// ========================
// GLOBAL STYLES FOR NOTIFICATIONS
// ========================

const notificationStyles = `
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  max-width: 400px;
}

.notification {
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--space-3);
  overflow: hidden;
  border-left: 4px solid var(--primary-500);
}

.notification-info { border-left-color: var(--info); }
.notification-success { border-left-color: var(--success); }
.notification-warning { border-left-color: var(--warning); }
.notification-error { border-left-color: var(--error); }

.notification-content {
  padding: var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-message {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--gray-700);
}

.notification-close {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  cursor: pointer;
  color: var(--gray-400);
  padding: var(--space-1);
  margin-left: var(--space-3);
}

.notification-close:hover {
  color: var(--gray-600);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  color: var(--gray-600);
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

.form-control.invalid {
  border-color: var(--error);
  box-shadow: 0 0 0 3px var(--error-light);
}

.form-control.valid {
  border-color: var(--success);
  box-shadow: 0 0 0 3px var(--success-light);
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Initialize global app instance
window.mediApp = new MediAppCore();

// Auto-initialize components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.mediApp.initializeComponents();
});

// Export for modules
window.MediAppCore = MediAppCore;
window.MediAppComponent = MediAppComponent;