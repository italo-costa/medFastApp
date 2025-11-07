/**
 * MediApp - Gestão de Médicos
 * JavaScript modularizado e otimizado
 */

class MedicoApp {
    constructor() {
        this.medicosData = [];
        this.medicosFiltered = [];
        this.currentMode = 'create'; // 'create', 'edit', 'view'
        
        this.especialidades = [
            'Cardiologia', 'Dermatologia', 'Endocrinologia', 'Gastroenterologia',
            'Ginecologia', 'Neurologia', 'Oftalmologia', 'Ortopedia',
            'Otorrinolaringologia', 'Pediatria', 'Psiquiatria', 'Urologia', 'Clinica Geral'
        ];
        
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.carregarEspecialidades();
            this.carregarStats();
            this.carregarMedicos();
        });
    }
    
    setupEventListeners() {
        // Botão Novo Médico
        const novoBtn = document.getElementById('novoMedicoBtn');
        if (novoBtn) {
            novoBtn.addEventListener('click', () => this.openModal('create'));
        }
        
        // Busca
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => this.filtrarMedicos(), 300));
        }
        
        // Filtro especialidade
        const filterSelect = document.getElementById('filterEspecialidade');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.filtrarMedicos());
        }
        
        // Fechar modal clicando fora
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
        
        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    carregarEspecialidades() {
        const selects = [
            document.getElementById('filterEspecialidade'),
            document.getElementById('especialidade')
        ];
        
        selects.forEach(select => {
            if (select && select.id === 'especialidade') {
                this.especialidades.forEach(esp => {
                    const option = document.createElement('option');
                    option.value = esp;
                    option.textContent = esp;
                    select.appendChild(option);
                });
            } else if (select && select.id === 'filterEspecialidade') {
                this.especialidades.forEach(esp => {
                    const option = document.createElement('option');
                    option.value = esp;
                    option.textContent = esp;
                    select.appendChild(option);
                });
            }
        });
    }
    
    async carregarStats() {
        try {
            const response = await fetch('/api/statistics/dashboard');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    const stats = result.data;
                    this.updateElement('totalMedicos', stats.totalMedicos || 0);
                    this.updateElement('medicosAtivos', stats.totalMedicos || 0);
                    this.updateElement('especialidades', stats.especialidades || 0);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }
    
    async carregarMedicos() {
        this.showLoading(true);
        
        try {
            const response = await fetch('/api/medicos');
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.medicosData = result.data || [];
                    this.medicosFiltered = [...this.medicosData];
                    this.renderTabela();
                } else {
                    this.showError('Erro ao carregar médicos: ' + result.message);
                }
            } else {
                this.showError('Erro na requisição: ' + response.status);
            }
        } catch (error) {
            this.showError('Erro ao conectar com o servidor: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    renderTabela() {
        const tbody = document.getElementById('medicosTableBody');
        const table = document.getElementById('medicosTable');
        const emptyState = document.getElementById('emptyState');
        
        if (!tbody || !table || !emptyState) return;
        
        tbody.innerHTML = '';
        
        if (this.medicosFiltered.length === 0) {
            this.hideElement(table);
            this.showElement(emptyState);
            return;
        }
        
        this.showElement(table);
        this.hideElement(emptyState);
        
        this.medicosFiltered.forEach(medico => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${medico.nomeCompleto || medico.nome || 'N/A'}</strong></td>
                <td>${medico.crm || 'N/A'} <small style="color: #718096;">${medico.crm_uf || ''}</small></td>
                <td><span class="badge badge-blue">${medico.especialidade || 'N/A'}</span></td>
                <td>${medico.email || 'N/A'}</td>
                <td>${medico.telefone || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="medicoApp.visualizarMedico('${medico.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-warning btn-sm" onclick="medicoApp.editarMedico('${medico.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="medicoApp.confirmarExclusao('${medico.id}', '${this.escapeName(medico.nomeCompleto || medico.nome)}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Adicionar CSS para badge se não existir
        if (!document.querySelector('style[data-badge]')) {
            const style = document.createElement('style');
            style.setAttribute('data-badge', 'true');
            style.textContent = `
                .badge { padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; }
                .badge-blue { background: #ebf8ff; color: #3182ce; }
            `;
            document.head.appendChild(style);
        }
    }
    
    filtrarMedicos() {
        const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const especialidade = document.getElementById('filterEspecialidade')?.value || '';
        
        this.medicosFiltered = this.medicosData.filter(medico => {
            const nome = (medico.nomeCompleto || medico.nome || '').toLowerCase();
            const crm = (medico.crm || '').toLowerCase();
            const esp = (medico.especialidade || '').toLowerCase();
            const email = (medico.email || '').toLowerCase();
            
            const matchSearch = !search || 
                nome.includes(search) ||
                crm.includes(search) ||
                esp.includes(search) ||
                email.includes(search);
            
            const matchEspecialidade = !especialidade || medico.especialidade === especialidade;
            
            return matchSearch && matchEspecialidade;
        });
        
        this.renderTabela();
    }
    
    openModal(mode = 'create', medicoId = null) {
        this.currentMode = mode;
        const modal = document.getElementById('medicoModal');
        const form = document.getElementById('medicoForm');
        const title = document.getElementById('modalTitle');
        
        if (!modal || !form || !title) {
            console.error('Elementos do modal não encontrados');
            return;
        }
        
        // Reset form
        form.reset();
        document.getElementById('medicoId').value = medicoId || '';
        
        // Configure based on mode
        switch (mode) {
            case 'create':
                title.textContent = 'Novo Médico';
                this.setFormEnabled(true);
                break;
            case 'edit':
                title.textContent = 'Editar Médico';
                this.setFormEnabled(true);
                if (medicoId) this.carregarDadosMedico(medicoId);
                break;
            case 'view':
                title.textContent = 'Visualizar Médico';
                this.setFormEnabled(false);
                if (medicoId) this.carregarDadosMedico(medicoId);
                break;
        }
        
        // Show modal
        modal.classList.add('active');
        
        // Focus first input
        setTimeout(() => {
            const firstInput = form.querySelector('input:not([type="hidden"])');
            if (firstInput && mode !== 'view') {
                firstInput.focus();
            }
        }, 100);
    }
    
    closeModal() {
        const modal = document.getElementById('medicoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    setFormEnabled(enabled) {
        const inputs = document.querySelectorAll('#medicoForm input:not([type="hidden"]), #medicoForm select');
        inputs.forEach(input => {
            input.disabled = !enabled;
        });
    }
    
    async carregarDadosMedico(id) {
        try {
            const response = await fetch(`/api/medicos/${id}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    this.preencherFormulario(result.data);
                } else {
                    this.showAlert('Erro ao carregar dados do médico: ' + result.message, 'error');
                }
            } else {
                this.showAlert('Erro na requisição: ' + response.status, 'error');
            }
        } catch (error) {
            this.showAlert('Erro ao conectar com o servidor: ' + error.message, 'error');
        }
    }
    
    preencherFormulario(medico) {
        const fields = {
            'nomeCompleto': medico.nomeCompleto || medico.nome || '',
            'crm': medico.crm || '',
            'crm_uf': medico.crm_uf || '',
            'especialidade': medico.especialidade || '',
            'email': medico.email || '',
            'telefone': medico.telefone || ''
        };
        
        Object.entries(fields).forEach(([field, value]) => {
            const element = document.getElementById(field);
            if (element) {
                element.value = value;
            }
        });
    }
    
    async salvarMedico() {
        const form = document.getElementById('medicoForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const isEdit = this.currentMode === 'edit';
        const id = document.getElementById('medicoId').value;
        
        // Validação básica
        if (!this.validarFormulario(data)) {
            return;
        }
        
        try {
            const url = isEdit && id ? `/api/medicos/${id}` : '/api/medicos';
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.closeModal();
                    this.carregarMedicos();
                    this.carregarStats();
                    this.showAlert(isEdit ? 'Médico atualizado com sucesso!' : 'Médico cadastrado com sucesso!', 'success');
                } else {
                    this.showAlert('Erro ao salvar: ' + result.message, 'error');
                }
            } else {
                this.showAlert('Erro na requisição: ' + response.status, 'error');
            }
        } catch (error) {
            this.showAlert('Erro ao conectar com o servidor: ' + error.message, 'error');
        }
    }
    
    validarFormulario(data) {
        const required = ['nomeCompleto', 'crm', 'crm_uf', 'especialidade', 'email', 'telefone'];
        const missing = required.filter(field => !data[field] || data[field].trim() === '');
        
        if (missing.length > 0) {
            this.showAlert('Preencha todos os campos obrigatórios.', 'error');
            return false;
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showAlert('Por favor, insira um email válido.', 'error');
            return false;
        }
        
        return true;
    }
    
    async visualizarMedico(id) {
        this.openModal('view', id);
    }
    
    async editarMedico(id) {
        this.openModal('edit', id);
    }
    
    confirmarExclusao(id, nome) {
        if (confirm(`Tem certeza que deseja excluir o médico "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
            this.excluirMedico(id);
        }
    }
    
    async excluirMedico(id) {
        try {
            const response = await fetch(`/api/medicos/${id}`, { method: 'DELETE' });
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.carregarMedicos();
                    this.carregarStats();
                    this.showAlert('Médico excluído com sucesso!', 'success');
                } else {
                    this.showAlert('Erro ao excluir: ' + result.message, 'error');
                }
            } else {
                this.showAlert('Erro na requisição: ' + response.status, 'error');
            }
        } catch (error) {
            this.showAlert('Erro ao conectar com o servidor: ' + error.message, 'error');
        }
    }
    
    // Utility Methods
    showLoading(show) {
        const loading = document.getElementById('loadingIndicator');
        const table = document.getElementById('medicosTable');
        const emptyState = document.getElementById('emptyState');
        
        if (loading) loading.classList.toggle('hidden', !show);
        if (show) {
            if (table) table.classList.add('hidden');
            if (emptyState) emptyState.classList.add('hidden');
        }
    }
    
    showError(message) {
        const table = document.getElementById('medicosTable');
        const emptyState = document.getElementById('emptyState');
        
        if (table) table.classList.add('hidden');
        if (emptyState) {
            emptyState.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f56565; margin-bottom: 1rem;"></i>
                <h3 style="color: #4a5568; margin-bottom: 0.5rem;">Erro ao carregar dados</h3>
                <p style="color: #718096;">${message}</p>
                <button class="btn btn-primary" onclick="medicoApp.carregarMedicos()" style="margin-top: 1rem;">
                    <i class="fas fa-sync"></i> Tentar Novamente
                </button>
            `;
            emptyState.classList.remove('hidden');
        }
    }
    
    showAlert(message, type = 'info') {
        // Simple alert for now, could be enhanced with a custom notification system
        alert(message);
    }
    
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    showElement(element) {
        if (element) element.classList.remove('hidden');
    }
    
    hideElement(element) {
        if (element) element.classList.add('hidden');
    }
    
    escapeName(name) {
        return (name || '').replace(/'/g, "\\'");
    }
    
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
}

// Initialize the app
const medicoApp = new MedicoApp();

// Expose methods for onclick handlers
window.MedicoApp = {
    openModal: (mode, id) => medicoApp.openModal(mode, id),
    closeModal: () => medicoApp.closeModal(),
    salvarMedico: () => medicoApp.salvarMedico()
};