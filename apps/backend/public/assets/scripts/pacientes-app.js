/**
 * Patient Management Application
 * Handles patient CRUD operations and UI interactions
 */

class PacientesApp extends MediAppCore {
    constructor() {
        super();
        this.pacientes = [];
        this.filteredPacientes = [];
        this.currentPaciente = null;
        this.init();
    }

    init() {
        console.log('Initializing PacientesApp...');
        this.bindEvents();
        this.loadPacientes();
        this.loadStatsData();
    }

    bindEvents() {
        // New patient button
        const novoPacienteBtn = document.getElementById('novoPacienteBtn');
        if (novoPacienteBtn) {
            novoPacienteBtn.addEventListener('click', () => this.showPacienteModal());
        }

        // Search and filters
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterPacientes(e.target.value));
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.filterByStatus(e.target.value));
        }

        // Form submission
        const pacienteForm = document.getElementById('pacienteForm');
        if (pacienteForm) {
            pacienteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarPaciente();
            });
        }

        // CEP lookup
        const cepInput = document.getElementById('cep');
        if (cepInput) {
            cepInput.addEventListener('blur', () => this.buscarCep());
        }

        // Event delegation for action buttons
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const pacienteId = actionBtn.dataset.pacienteId;

            switch (action) {
                case 'editar':
                    this.editarPaciente(pacienteId);
                    break;
                case 'visualizar':
                    this.verPaciente(pacienteId);
                    break;
                case 'excluir':
                    this.excluirPaciente(pacienteId);
                    break;
                case 'fechar-modal':
                    this.closeModal();
                    break;
                case 'salvar-paciente':
                    this.salvarPaciente();
                    break;
            }
        });
    }

    async loadPacientes() {
        try {
            this.showTableLoading();
            const response = await this.request('/api/pacientes');
            this.pacientes = response.pacientes || [];
            this.filteredPacientes = [...this.pacientes];
            this.renderPacientesTable();
            this.hideTableLoading();
        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
            this.showNotification('Erro ao carregar pacientes', 'error');
            this.hideTableLoading();
        }
    }

    async loadStatsData() {
        try {
            const response = await this.request('/api/pacientes/stats');
            
            document.getElementById('totalPacientes').textContent = response.total || 0;
            document.getElementById('pacientesAtivos').textContent = response.ativos || 0;
            document.getElementById('pacientesInativos').textContent = response.inativos || 0;
            document.getElementById('consultasHoje').textContent = response.consultasHoje || 0;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    filterPacientes(searchTerm) {
        const filtered = this.pacientes.filter(paciente => {
            const searchLower = searchTerm.toLowerCase();
            return paciente.nomeCompleto.toLowerCase().includes(searchLower) ||
                   paciente.cpf.includes(searchTerm) ||
                   paciente.email.toLowerCase().includes(searchLower);
        });
        
        this.filteredPacientes = filtered;
        this.renderPacientesTable();
    }

    filterByStatus(status) {
        if (!status) {
            this.filteredPacientes = [...this.pacientes];
        } else {
            this.filteredPacientes = this.pacientes.filter(p => p.status === status);
        }
        this.renderPacientesTable();
    }

    renderPacientesTable() {
        const tbody = document.getElementById('pacientesTableBody');
        const table = document.getElementById('pacientesTable');
        const emptyState = document.getElementById('emptyState');

        if (!tbody) return;

        if (this.filteredPacientes.length === 0) {
            table.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        table.classList.remove('hidden');
        emptyState.classList.add('hidden');

        tbody.innerHTML = this.filteredPacientes.map(paciente => `
            <tr>
                <td>
                    <div class="patient-info">
                        <div class="patient-avatar">
                            ${paciente.foto ? 
                                `<img src="${paciente.foto}" alt="${paciente.nomeCompleto}">` :
                                `<i class="fas fa-user"></i>`
                            }
                        </div>
                        <div>
                            <div class="font-semibold">${paciente.nomeCompleto}</div>
                            <div class="text-sm text-gray-600">${paciente.cpf}</div>
                        </div>
                    </div>
                </td>
                <td>${paciente.email}</td>
                <td>${paciente.telefone}</td>
                <td>
                    <span class="badge ${paciente.status === 'ativo' ? 'badge-success' : 'badge-secondary'}">
                        ${paciente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary" data-action="editar" data-paciente-id="${paciente.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" data-action="visualizar" data-paciente-id="${paciente.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-action="excluir" data-paciente-id="${paciente.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    showPacienteModal(paciente = null) {
        this.currentPaciente = paciente;
        const modal = document.getElementById('pacienteModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('pacienteForm');

        if (paciente) {
            modalTitle.textContent = 'Editar Paciente';
            this.fillForm(paciente);
        } else {
            modalTitle.textContent = 'Novo Paciente';
            form.reset();
            document.getElementById('pacienteId').value = '';
        }

        this.showModal('pacienteModal');
    }

    fillForm(paciente) {
        const fields = ['pacienteId', 'nomeCompleto', 'cpf', 'email', 'telefone', 'dataNascimento', 
                       'genero', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 
                       'cidade', 'uf', 'convenio', 'numeroCartao', 'validadeCartao'];

        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && paciente[field] !== undefined) {
                element.value = paciente[field];
            }
        });
    }

    async salvarPaciente() {
        try {
            const formData = new FormData(document.getElementById('pacienteForm'));
            const data = Object.fromEntries(formData.entries());
            
            const isEditing = !!data.pacienteId;
            const url = isEditing ? `/api/pacientes/${data.pacienteId}` : '/api/pacientes';
            const method = isEditing ? 'PUT' : 'POST';
            
            const response = await this.request(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            this.showNotification(
                isEditing ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!',
                'success'
            );

            this.closeModal();
            this.loadPacientes();
            this.loadStatsData();
        } catch (error) {
            console.error('Erro ao salvar paciente:', error);
            this.showNotification('Erro ao salvar paciente', 'error');
        }
    }

    async buscarCep() {
        const cep = document.getElementById('cep').value.replace(/\D/g, '');
        
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                
                if (!data.erro) {
                    document.getElementById('logradouro').value = data.logradouro;
                    document.getElementById('bairro').value = data.bairro;
                    document.getElementById('cidade').value = data.localidade;
                    document.getElementById('uf').value = data.uf;
                    document.getElementById('numero').focus();
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
            }
        }
    }

    editarPaciente(id) {
        const paciente = this.pacientes.find(p => p.id === id);
        if (paciente) {
            this.showPacienteModal(paciente);
        }
    }

    verPaciente(id) {
        const paciente = this.pacientes.find(p => p.id === id);
        if (paciente) {
            // Implement patient details view
            console.log('Ver paciente:', paciente);
        }
    }

    async excluirPaciente(id) {
        if (confirm('Tem certeza que deseja excluir este paciente?')) {
            try {
                await this.request(`/api/pacientes/${id}`, { method: 'DELETE' });
                this.showNotification('Paciente excluído com sucesso!', 'success');
                this.loadPacientes();
                this.loadStatsData();
            } catch (error) {
                console.error('Erro ao excluir paciente:', error);
                this.showNotification('Erro ao excluir paciente', 'error');
            }
        }
    }

    closeModal() {
        this.hideModal('pacienteModal');
        this.currentPaciente = null;
    }

    showTableLoading() {
        const loading = document.getElementById('loadingIndicator');
        const table = document.getElementById('pacientesTable');
        
        if (loading) loading.classList.remove('hidden');
        if (table) table.classList.add('hidden');
    }

    hideTableLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) loading.classList.add('hidden');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.PacientesApp = new PacientesApp();
});