/**
 * Main MediApp Application
 * Handles dashboard functionality and navigation
 */

class MediApp extends MediAppCore {
    constructor() {
        super();
        this.lastStatsLoad = null;
        this.statsCache = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log('Initializing MediApp...');
        this.bindEvents();
        this.loadDashboardStats();
        this.loadRecentActivities();
    }

    bindEvents() {
        // Feature card navigation
        document.querySelectorAll('.feature-card[data-navigate]').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(card.dataset.navigate);
            });
        });

        // Button navigation
        document.querySelectorAll('button[data-navigate]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const url = btn.dataset.navigate;
                const action = btn.dataset.action;
                
                if (action === 'new') {
                    // Navigate with new action flag
                    this.navigate(url + '?action=new');
                } else {
                    this.navigate(url);
                }
            });
        });

        // Real-time updates
        this.startRealtimeUpdates();
    }

    navigate(url) {
        window.location.href = url;
    }

    async loadDashboardStats() {
        // Prevent multiple simultaneous calls
        if (this.isLoading) {
            console.log('Stats already loading, skipping...');
            return;
        }

        // Use cache if data is fresh (less than 5 minutes old)
        const now = Date.now();
        if (this.statsCache && this.lastStatsLoad && (now - this.lastStatsLoad < 300000)) {
            console.log('Using cached stats');
            this.updateStatsFromCache();
            return;
        }

        try {
            this.isLoading = true;
            this.showLoading('loadingStats');
            
            console.log('Loading fresh stats from API...');
            const response = await this.request('/statistics/dashboard');
            
            if (response.success && response.data) {
                this.statsCache = response;
                this.lastStatsLoad = now;
                
                const stats = response.data;
                const metadata = response.metadata || {};
                
                // Update main stats cards
                this.updateElement('totalMedicos', stats.medicosAtivos?.value || '0');
                this.updateElement('totalPacientes', stats.pacientesCadastrados?.value || '0');
                this.updateElement('consultasHoje', metadata.consultasHoje || '0');
                this.updateElement('consultasSemana', Math.floor((metadata.consultasHoje || 0) * 7)); // Estimate

                // Update feature cards with same data
                this.updateElement('totalMedicosCard', stats.medicosAtivos?.value || '0');
                this.updateElement('totalPacientesCard', stats.pacientesCadastrados?.value || '0');
                this.updateElement('consultasHojeCard', metadata.consultasHoje || '0');
                this.updateElement('prontuariosCard', stats.prontuariosCriados?.value || '0');
                this.updateElement('prescricoesCard', stats.examesRegistrados?.value || '0');
            }

            this.hideLoading('loadingStats');
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            this.showNotification('Erro ao carregar estatísticas do dashboard', 'error');
            this.hideLoading('loadingStats');
            
            // Fallback values
            this.updateElement('totalMedicos', '5');
            this.updateElement('totalPacientes', '6');
            this.updateElement('consultasHoje', '0');
            this.updateElement('consultasSemana', '0');
            this.updateElement('totalMedicosCard', '5');
            this.updateElement('totalPacientesCard', '6');
            this.updateElement('consultasHojeCard', '0');
            this.updateElement('prontuariosCard', '0');
            this.updateElement('prescricoesCard', '0');
        } finally {
            this.isLoading = false;
        }
    }

    updateStatsFromCache() {
        if (!this.statsCache) return;
        
        const stats = this.statsCache.data;
        const metadata = this.statsCache.metadata || {};
        
        // Update main stats cards
        this.updateElement('totalMedicos', stats.medicosAtivos?.value || '0');
        this.updateElement('totalPacientes', stats.pacientesCadastrados?.value || '0');
        this.updateElement('consultasHoje', metadata.consultasHoje || '0');
        this.updateElement('consultasSemana', Math.floor((metadata.consultasHoje || 0) * 7)); // Estimate

        // Update feature cards with same data
        this.updateElement('totalMedicosCard', stats.medicosAtivos?.value || '0');
        this.updateElement('totalPacientesCard', stats.pacientesCadastrados?.value || '0');
        this.updateElement('consultasHojeCard', metadata.consultasHoje || '0');
        this.updateElement('prontuariosCard', stats.prontuariosCriados?.value || '0');
        this.updateElement('prescricoesCard', stats.examesRegistrados?.value || '0');
    }

    async loadRecentActivities() {
        try {
            this.showLoading('loadingActivities');
            
            const activitiesContainer = document.getElementById('recentActivities');
            
            // For now, show a placeholder since we don't have a real activities endpoint
            if (activitiesContainer) {
                activitiesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-info-circle"></i>
                        <h3>Dashboard em Desenvolvimento</h3>
                        <p>As atividades recentes aparecerão aqui em breve.</p>
                        <small class="text-muted">Funcionalidade em implementação</small>
                    </div>
                `;
            }

            this.hideLoading('loadingActivities');
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
            this.hideLoading('loadingActivities');
        }
    }

    getActivityIcon(type) {
        const icons = {
            'medico': 'fa-user-md',
            'paciente': 'fa-user',
            'consulta': 'fa-calendar',
            'sistema': 'fa-cog'
        };
        return icons[type] || 'fa-info-circle';
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Agora';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
        
        return date.toLocaleDateString('pt-BR');
    }

    startRealtimeUpdates() {
        // Update stats every 30 minutes (reduced frequency)
        setInterval(() => {
            this.loadDashboardStats();
        }, 1800000);

        // Only update activities once on page load (no periodic updates for now)
        // setInterval(() => {
        //     this.loadRecentActivities();
        // }, 300000);
    }

    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
        }
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
        }
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
}

// Initialize app when DOM is loaded (only once)
document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations
    if (window.MediApp) {
        console.warn('MediApp already initialized');
        return;
    }
    
    console.log('Initializing MediApp...');
    window.MediApp = new MediApp();
});