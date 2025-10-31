// 🚀 MediApp - Service Layer Modernizado
// Implementação de melhores práticas para integração Frontend-Backend

/**
 * 📋 API SERVICE LAYER - PADRÃO MODERNO
 * Centraliza todas as chamadas de API com error handling, loading states e cache
 */

class ApiService {
    constructor(baseURL = '/api/v1') {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        this.loadingStates = new Map();
        this.cache = new Map();
        this.requestId = 0;
    }

    /**
     * 🔧 Método base para todas as requisições
     */
    async request(endpoint, options = {}) {
        const requestId = ++this.requestId;
        const url = `${this.baseURL}${endpoint}`;
        
        // Loading state management
        this.setLoading(endpoint, true);
        
        try {
            console.log(`[API-${requestId}] 🚀 Request: ${options.method || 'GET'} ${url}`);
            
            const config = {
                method: 'GET',
                headers: { ...this.defaultHeaders },
                ...options,
                headers: { 
                    ...this.defaultHeaders, 
                    ...options.headers 
                }
            };

            // Add auth token if available
            const token = this.getAuthToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new ApiError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    await this.extractErrorDetails(response)
                );
            }

            const data = await response.json();
            console.log(`[API-${requestId}] ✅ Success: ${JSON.stringify(data).substring(0, 100)}...`);
            
            return data;
            
        } catch (error) {
            console.error(`[API-${requestId}] ❌ Error:`, error);
            this.handleError(error, endpoint);
            throw error;
        } finally {
            this.setLoading(endpoint, false);
        }
    }

    /**
     * 🏪 Cache management
     */
    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            console.log(`[CACHE] 🎯 Hit: ${key}`);
            return cached.data;
        }
        return null;
    }

    setCache(key, data, ttl = 300000) { // 5 minutes default
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
        console.log(`[CACHE] 💾 Set: ${key}`);
    }

    /**
     * 🔄 Loading states
     */
    setLoading(endpoint, isLoading) {
        this.loadingStates.set(endpoint, isLoading);
        this.notifyLoadingChange(endpoint, isLoading);
    }

    isLoading(endpoint) {
        return this.loadingStates.get(endpoint) || false;
    }

    /**
     * 🔑 Authentication
     */
    getAuthToken() {
        return localStorage.getItem('mediapp_token');
    }

    setAuthToken(token) {
        localStorage.setItem('mediapp_token', token);
        console.log('[AUTH] ✅ Token set');
    }

    clearAuthToken() {
        localStorage.removeItem('mediapp_token');
        console.log('[AUTH] 🚪 Token cleared');
    }

    /**
     * ❌ Error handling
     */
    async extractErrorDetails(response) {
        try {
            const errorData = await response.json();
            return errorData.error || errorData.message || 'Unknown error';
        } catch {
            return response.statusText;
        }
    }

    handleError(error, endpoint) {
        // Notify error listeners
        this.notifyError(endpoint, error);
        
        // Log error for monitoring
        if (window.gtag) {
            window.gtag('event', 'api_error', {
                endpoint,
                error_message: error.message,
                error_code: error.code
            });
        }
    }

    /**
     * 📢 Event system for UI updates
     */
    notifyLoadingChange(endpoint, isLoading) {
        window.dispatchEvent(new CustomEvent('api:loading', {
            detail: { endpoint, isLoading }
        }));
    }

    notifyError(endpoint, error) {
        window.dispatchEvent(new CustomEvent('api:error', {
            detail: { endpoint, error }
        }));
    }
}

/**
 * ❌ Custom Error Class
 */
class ApiError extends Error {
    constructor(message, code, details) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.details = details;
    }
}

/**
 * 👨‍⚕️ MEDICO SERVICE - Implementação específica
 */
class MedicoService extends ApiService {
    constructor() {
        super('/api/v1');
    }

    /**
     * 📋 Listar médicos com filtros e paginação
     */
    async getAll(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        const endpoint = `/medicos${queryString ? '?' + queryString : ''}`;
        
        // Check cache first
        const cacheKey = `medicos:${queryString}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const result = await this.request(endpoint);
        
        // Cache successful results
        if (result.success) {
            this.setCache(cacheKey, result);
        }
        
        return result;
    }

    /**
     * 🔍 Buscar médico por ID
     */
    async getById(id) {
        const cacheKey = `medico:${id}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const result = await this.request(`/medicos/${id}`);
        
        if (result.success) {
            this.setCache(cacheKey, result, 600000); // 10 minutes for individual records
        }
        
        return result;
    }

    /**
     * ➕ Criar novo médico
     */
    async create(medicoData) {
        const result = await this.request('/medicos', {
            method: 'POST',
            body: JSON.stringify(medicoData)
        });
        
        // Invalidate list cache
        this.invalidateListCache();
        
        return result;
    }

    /**
     * ✏️ Atualizar médico
     */
    async update(id, medicoData) {
        const result = await this.request(`/medicos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(medicoData)
        });
        
        // Invalidate caches
        this.cache.delete(`medico:${id}`);
        this.invalidateListCache();
        
        return result;
    }

    /**
     * 🗑️ Excluir médico
     */
    async delete(id) {
        const result = await this.request(`/medicos/${id}`, {
            method: 'DELETE'
        });
        
        // Invalidate caches
        this.cache.delete(`medico:${id}`);
        this.invalidateListCache();
        
        return result;
    }

    /**
     * 🧹 Cache invalidation helpers
     */
    invalidateListCache() {
        for (const key of this.cache.keys()) {
            if (key.startsWith('medicos:')) {
                this.cache.delete(key);
            }
        }
    }
}

/**
 * 📊 UI STATE MANAGER - Para gerenciar estados da interface
 */
class UIStateManager {
    constructor() {
        this.states = new Map();
        this.subscribers = new Map();
        this.setupEventListeners();
    }

    /**
     * 🎯 Subscribe to state changes
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
    }

    /**
     * 📢 Notify subscribers
     */
    notify(key, value) {
        const subscribers = this.subscribers.get(key);
        if (subscribers) {
            subscribers.forEach(callback => callback(value));
        }
    }

    /**
     * 🔄 Update state
     */
    setState(key, value) {
        this.states.set(key, value);
        this.notify(key, value);
    }

    /**
     * 📖 Get state
     */
    getState(key) {
        return this.states.get(key);
    }

    /**
     * 🎧 Setup API event listeners
     */
    setupEventListeners() {
        window.addEventListener('api:loading', (event) => {
            const { endpoint, isLoading } = event.detail;
            this.setState(`loading:${endpoint}`, isLoading);
        });

        window.addEventListener('api:error', (event) => {
            const { endpoint, error } = event.detail;
            this.setState(`error:${endpoint}`, error);
            
            // Show user-friendly error message
            this.showErrorMessage(error);
        });
    }

    /**
     * 💬 Show error messages
     */
    showErrorMessage(error) {
        const message = this.getErrorMessage(error);
        
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="error-toast-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    /**
     * 📝 Get user-friendly error messages
     */
    getErrorMessage(error) {
        const errorMap = {
            401: '🔐 Sessão expirada. Faça login novamente.',
            403: '🚫 Você não tem permissão para esta ação.',
            404: '🔍 Recurso não encontrado.',
            422: '📝 Dados inválidos. Verifique as informações.',
            500: '⚙️ Erro interno. Tente novamente em instantes.',
            0: '🌐 Sem conexão com a internet.'
        };

        return errorMap[error.code] || `❌ Erro: ${error.message}`;
    }
}

/**
 * 🎨 UI COMPONENTS - Componentes reutilizáveis
 */
class UIComponents {
    /**
     * 🔄 Loading Spinner
     */
    static createLoadingSpinner(text = 'Carregando...') {
        return `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>${text}</span>
            </div>
        `;
    }

    /**
     * 📊 Data Table with loading and error states
     */
    static createDataTable(data, columns, options = {}) {
        if (options.isLoading) {
            return this.createLoadingSpinner('Carregando dados...');
        }

        if (options.error) {
            return `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar dados</h3>
                    <p>${options.error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                </div>
            `;
        }

        if (!data || data.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>Nenhum registro encontrado</h3>
                    <p>Não há dados para exibir no momento.</p>
                </div>
            `;
        }

        // Generate table HTML
        const headerCells = columns.map(col => `<th>${col.label}</th>`).join('');
        const bodyRows = data.map(row => {
            const cells = columns.map(col => {
                const value = this.getNestedValue(row, col.field);
                const formatted = col.formatter ? col.formatter(value, row) : value;
                return `<td>${formatted}</td>`;
            }).join('');
            return `<tr data-id="${row.id}">${cells}</tr>`;
        }).join('');

        return `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>${headerCells}</tr>
                    </thead>
                    <tbody>
                        ${bodyRows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * 🔍 Get nested object value by path
     */
    static getNestedValue(obj, path) {
        return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
    }
}

/**
 * 🚀 INITIALIZATION - Configuração global
 */

// Global instances
window.medicoService = new MedicoService();
window.uiState = new UIStateManager();

// CSS for components (inject into head)
const componentStyles = `
<style>
.loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    color: #666;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    padding: 1rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.error-state, .empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
}

.error-state i, .empty-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.data-table th,
.data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.data-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #495057;
}

.data-table tr:hover {
    background: #f8f9fa;
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', componentStyles);

console.log('🚀 MediApp Service Layer initialized successfully!');