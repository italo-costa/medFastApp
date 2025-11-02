/**
 * Componente para Gerenciamento de Convênios/Planos de Saúde
 * Funcionalidades: Cadastro, validação, busca de convênios
 */

class InsuranceManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn('Container para convênio não encontrado:', containerId);
            return;
        }
        this.insuranceProviders = this.getInsuranceProviders();
        
        this.init();
    }

    init() {
        this.createInsuranceInterface();
        this.bindEvents();
    }

    createInsuranceInterface() {
        this.container.innerHTML = `
            <div class="insurance-manager">
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="fas fa-credit-card"></i>
                        Convênio / Plano de Saúde
                    </h3>
                    
                    <div class="insurance-type-selector">
                        <label class="radio-option">
                            <input type="radio" name="tipoAtendimento" value="particular" checked>
                            <span class="radio-custom"></span>
                            <span class="radio-label">
                                <i class="fas fa-user"></i>
                                Particular
                            </span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="tipoAtendimento" value="convenio">
                            <span class="radio-custom"></span>
                            <span class="radio-label">
                                <i class="fas fa-credit-card"></i>
                                Convênio
                            </span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="tipoAtendimento" value="sus">
                            <span class="radio-custom"></span>
                            <span class="radio-label">
                                <i class="fas fa-hospital"></i>
                                SUS
                            </span>
                        </label>
                    </div>

                    <div class="insurance-details" id="insuranceDetails" style="display: none;">
                        <div class="form-grid">
                            <!-- Convênio -->
                            <div class="form-group">
                                <label for="convenio">Convênio/Operadora *</label>
                                <div class="select-with-search">
                                    <select id="convenio" name="convenio">
                                        <option value="">Selecione o convênio</option>
                                        ${this.getInsuranceOptions()}
                                    </select>
                                    <input type="text" 
                                           id="convenioSearch" 
                                           class="insurance-search"
                                           placeholder="Digite para buscar..." 
                                           style="display: none;">
                                </div>
                            </div>

                            <!-- Número da Carteirinha -->
                            <div class="form-group">
                                <label for="numeroCarteirinha">Número da Carteirinha *</label>
                                <input type="text" 
                                       id="numeroCarteirinha" 
                                       name="numeroCarteirinha" 
                                       placeholder="Ex: 123456789012">
                            </div>

                            <!-- Validade -->
                            <div class="form-group">
                                <label for="validadeCarteirinha">Validade da Carteirinha</label>
                                <input type="month" 
                                       id="validadeCarteirinha" 
                                       name="validadeCarteirinha">
                            </div>

                            <!-- Tipo de Plano -->
                            <div class="form-group">
                                <label for="tipoPlano">Tipo de Plano</label>
                                <select id="tipoPlano" name="tipoPlano">
                                    <option value="">Selecione</option>
                                    <option value="basico">Básico</option>
                                    <option value="executivo">Executivo</option>
                                    <option value="premium">Premium</option>
                                    <option value="master">Master</option>
                                    <option value="empresarial">Empresarial</option>
                                    <option value="individual">Individual</option>
                                    <option value="familiar">Familiar</option>
                                </select>
                            </div>

                            <!-- Status -->
                            <div class="form-group">
                                <label for="statusConvenio">Status</label>
                                <select id="statusConvenio" name="statusConvenio">
                                    <option value="ativo" selected>Ativo</option>
                                    <option value="inativo">Inativo</option>
                                    <option value="suspenso">Suspenso</option>
                                    <option value="bloqueado">Bloqueado</option>
                                </select>
                            </div>

                            <!-- Nome do Titular (se diferente) -->
                            <div class="form-group">
                                <label for="nomeTitular">Nome do Titular</label>
                                <input type="text" 
                                       id="nomeTitular" 
                                       name="nomeTitular" 
                                       placeholder="Se diferente do paciente">
                            </div>

                            <!-- Observações -->
                            <div class="form-group full-width">
                                <label for="observacoesConvenio">Observações do Convênio</label>
                                <textarea id="observacoesConvenio" 
                                          name="observacoesConvenio" 
                                          placeholder="Informações importantes sobre o convênio..."
                                          rows="3"></textarea>
                            </div>
                        </div>

                        <!-- Verificação de Elegibilidade -->
                        <div class="insurance-verification">
                            <button type="button" class="btn btn-info" id="verifyInsurance">
                                <i class="fas fa-check-circle"></i>
                                Verificar Elegibilidade
                            </button>
                            <div class="verification-status" id="verificationStatus"></div>
                        </div>
                    </div>

                    <!-- Informações SUS -->
                    <div class="sus-info" id="susInfo" style="display: none;">
                        <div class="info-card">
                            <i class="fas fa-info-circle"></i>
                            <div>
                                <h4>Atendimento pelo SUS</h4>
                                <p>Paciente será atendido pelo Sistema Único de Saúde. Não é necessário informar dados de convênio.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Mudança no tipo de atendimento
        const radioButtons = document.querySelectorAll('input[name="tipoAtendimento"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                this.handleAttendanceTypeChange(radio.value);
            });
        });

        // Busca de convênio
        document.getElementById('convenioSearch').addEventListener('input', (e) => {
            this.searchInsurance(e.target.value);
        });

        // Toggle entre select e search
        document.getElementById('convenio').addEventListener('focus', () => {
            this.toggleInsuranceSearch(true);
        });

        // Verificação de elegibilidade
        document.getElementById('verifyInsurance').addEventListener('click', () => {
            this.verifyInsurance();
        });

        // Validação da carteirinha
        document.getElementById('numeroCarteirinha').addEventListener('blur', () => {
            this.validateInsuranceCard();
        });

        // Auto-preenchimento do titular
        document.addEventListener('DOMContentLoaded', () => {
            this.setupTitularAutoFill();
        });
    }

    handleAttendanceTypeChange(type) {
        const insuranceDetails = document.getElementById('insuranceDetails');
        const susInfo = document.getElementById('susInfo');

        // Esconder tudo primeiro
        insuranceDetails.style.display = 'none';
        susInfo.style.display = 'none';

        switch (type) {
            case 'convenio':
                insuranceDetails.style.display = 'block';
                this.setRequiredFields(true);
                break;
            case 'sus':
                susInfo.style.display = 'block';
                this.setRequiredFields(false);
                break;
            case 'particular':
            default:
                this.setRequiredFields(false);
                break;
        }

        // Disparar evento
        this.container.dispatchEvent(new CustomEvent('attendanceTypeChanged', {
            detail: { type }
        }));
    }

    setRequiredFields(required) {
        const convenio = document.getElementById('convenio');
        const numeroCarteirinha = document.getElementById('numeroCarteirinha');

        if (required) {
            convenio.setAttribute('required', '');
            numeroCarteirinha.setAttribute('required', '');
        } else {
            convenio.removeAttribute('required');
            numeroCarteirinha.removeAttribute('required');
        }
    }

    toggleInsuranceSearch(showSearch) {
        const select = document.getElementById('convenio');
        const search = document.getElementById('convenioSearch');

        if (showSearch) {
            select.style.display = 'none';
            search.style.display = 'block';
            search.focus();
        } else {
            select.style.display = 'block';
            search.style.display = 'none';
        }
    }

    searchInsurance(query) {
        const select = document.getElementById('convenio');
        const options = select.querySelectorAll('option');

        options.forEach(option => {
            if (option.value === '') return; // Skip placeholder

            const text = option.textContent.toLowerCase();
            const match = text.includes(query.toLowerCase());
            option.style.display = match ? 'block' : 'none';
        });
    }

    async verifyInsurance() {
        const convenio = document.getElementById('convenio').value;
        const numeroCarteirinha = document.getElementById('numeroCarteirinha').value;
        const statusElement = document.getElementById('verificationStatus');

        if (!convenio || !numeroCarteirinha) {
            this.showVerificationStatus('Preencha o convênio e número da carteirinha', 'error');
            return;
        }

        this.showVerificationStatus('Verificando elegibilidade...', 'loading');

        try {
            // Simular verificação (em produção, chamar API do convênio)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Resultado simulado
            const isValid = Math.random() > 0.3; // 70% de chance de ser válido
            
            if (isValid) {
                this.showVerificationStatus('✓ Carteirinha válida e ativa', 'success');
                document.getElementById('statusConvenio').value = 'ativo';
            } else {
                this.showVerificationStatus('✗ Carteirinha inválida ou inativa', 'error');
                document.getElementById('statusConvenio').value = 'inativo';
            }
        } catch (error) {
            this.showVerificationStatus('Erro na verificação. Tente novamente.', 'error');
        }
    }

    showVerificationStatus(message, type) {
        const statusElement = document.getElementById('verificationStatus');
        statusElement.textContent = message;
        statusElement.className = `verification-status ${type}`;
    }

    validateInsuranceCard() {
        const numeroCarteirinha = document.getElementById('numeroCarteirinha');
        const numero = numeroCarteirinha.value.trim();

        if (!numero) return;

        // Validação básica (ajustar conforme necessário)
        if (numero.length < 8) {
            this.showFieldError(numeroCarteirinha, 'Número muito curto');
        } else if (numero.length > 20) {
            this.showFieldError(numeroCarteirinha, 'Número muito longo');
        } else {
            this.clearFieldError(numeroCarteirinha);
        }
    }

    showFieldError(field, message) {
        field.classList.add('field-error');
        
        // Remover erro anterior
        const existingError = field.parentNode.querySelector('.field-error-message');
        if (existingError) {
            existingError.remove();
        }

        // Adicionar nova mensagem
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error-message';
        errorElement.textContent = message;
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.classList.remove('field-error');
        const errorElement = field.parentNode.querySelector('.field-error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    setupTitularAutoFill() {
        // Auto-preencher titular com nome do paciente se disponível
        const nomeCompleto = document.getElementById('nomeCompleto');
        const nomeTitular = document.getElementById('nomeTitular');

        if (nomeCompleto && nomeTitular) {
            nomeCompleto.addEventListener('blur', () => {
                if (nomeCompleto.value && !nomeTitular.value) {
                    nomeTitular.value = nomeCompleto.value;
                }
            });
        }
    }

    getInsuranceData() {
        const tipoAtendimento = document.querySelector('input[name="tipoAtendimento"]:checked').value;
        
        if (tipoAtendimento === 'convenio') {
            return {
                tipoAtendimento,
                convenio: document.getElementById('convenio').value,
                numeroCarteirinha: document.getElementById('numeroCarteirinha').value,
                validadeCarteirinha: document.getElementById('validadeCarteirinha').value,
                tipoPlano: document.getElementById('tipoPlano').value,
                statusConvenio: document.getElementById('statusConvenio').value,
                nomeTitular: document.getElementById('nomeTitular').value,
                observacoesConvenio: document.getElementById('observacoesConvenio').value
            };
        }

        return { tipoAtendimento };
    }

    setInsuranceData(data) {
        if (data.tipoAtendimento) {
            document.querySelector(`input[name="tipoAtendimento"][value="${data.tipoAtendimento}"]`).checked = true;
            this.handleAttendanceTypeChange(data.tipoAtendimento);
        }

        if (data.convenio) document.getElementById('convenio').value = data.convenio;
        if (data.numeroCarteirinha) document.getElementById('numeroCarteirinha').value = data.numeroCarteirinha;
        if (data.validadeCarteirinha) document.getElementById('validadeCarteirinha').value = data.validadeCarteirinha;
        if (data.tipoPlano) document.getElementById('tipoPlano').value = data.tipoPlano;
        if (data.statusConvenio) document.getElementById('statusConvenio').value = data.statusConvenio;
        if (data.nomeTitular) document.getElementById('nomeTitular').value = data.nomeTitular;
        if (data.observacoesConvenio) document.getElementById('observacoesConvenio').value = data.observacoesConvenio;
    }

    getInsuranceProviders() {
        return [
            'Unimed', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'Golden Cross',
            'Notre Dame Intermédica', 'Hapvida', 'Prevent Senior', 'São Cristóvão',
            'Medial Saúde', 'Cruz Azul', 'Cassi', 'Geap', 'Postal Saúde',
            'Petrobras Distribuidora', 'Correios', 'Banco do Brasil', 'Caixa Econômica',
            'Porto Seguro', 'Allianz Care', 'Omint', 'Blue Med', 'Green Line',
            'Life Empresarial', 'Marítima Saúde', 'Total Care', 'Unihosp'
        ].sort();
    }

    getInsuranceOptions() {
        return this.insuranceProviders
            .map(provider => `<option value="${provider}">${provider}</option>`)
            .join('');
    }

    // Método para carregar dados de convênio existente
    loadInsurance(insuranceData) {
        if (!insuranceData) return;
        
        try {
            // Mapear campos diferentes entre API e componente
            const mappedData = {
                tipoAtendimento: insuranceData.tipo || insuranceData.type || 'sus',
                convenio: insuranceData.operadora || insuranceData.provider || '',
                numeroCarteirinha: insuranceData.numeroCarteirinha || insuranceData.cardNumber || '',
                validadeCarteirinha: insuranceData.validadeCarteirinha || insuranceData.validUntil || '',
                tipoPlano: insuranceData.tipoPlano || insuranceData.planType || '',
                statusConvenio: insuranceData.status || 'ativo',
                nomeTitular: insuranceData.titular || insuranceData.holder || '',
                observacoesConvenio: insuranceData.observacoes || insuranceData.notes || ''
            };
            
            this.setInsuranceData(mappedData);
        } catch (error) {
            console.error('Erro ao carregar dados de convênio existente:', error);
        }
    }

    // Método para obter dados formatados para API
    getData() {
        const data = this.getInsuranceData();
        
        if (data.tipoAtendimento === 'convenio') {
            return {
                insurance: {
                    type: data.tipoAtendimento,
                    provider: data.convenio,
                    cardNumber: data.numeroCarteirinha,
                    validUntil: data.validadeCarteirinha,
                    planType: data.tipoPlano,
                    status: data.statusConvenio,
                    holder: data.nomeTitular,
                    notes: data.observacoesConvenio
                }
            };
        }
        
        return {
            insurance: {
                type: data.tipoAtendimento
            }
        };
    }

    // Método para limpar dados
    clearData() {
        // Voltar para SUS como padrão
        document.querySelector('input[name="tipoAtendimento"][value="sus"]').checked = true;
        this.handleAttendanceTypeChange('sus');
        
        // Limpar campos de convênio
        document.getElementById('convenio').value = '';
        document.getElementById('numeroCarteirinha').value = '';
        document.getElementById('validadeCarteirinha').value = '';
        document.getElementById('tipoPlano').value = '';
        document.getElementById('statusConvenio').value = 'ativo';
        document.getElementById('nomeTitular').value = '';
        document.getElementById('observacoesConvenio').value = '';
    }
}

// CSS para o componente de convênio
const insuranceManagerStyles = `
<style>
.insurance-manager {
    width: 100%;
}

.insurance-type-selector {
    display: flex;
    gap: 20px;
    margin-bottom: 25px;
    flex-wrap: wrap;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 12px 16px;
    border: 2px solid #e9ecef;
    border-radius: 10px;
    transition: all 0.3s ease;
    background: white;
}

.radio-option:hover {
    border-color: #667eea;
    background: #f8f9ff;
}

.radio-option input[type="radio"] {
    display: none;
}

.radio-custom {
    width: 20px;
    height: 20px;
    border: 2px solid #dee2e6;
    border-radius: 50%;
    position: relative;
    transition: all 0.3s ease;
}

.radio-option input[type="radio"]:checked + .radio-custom {
    border-color: #667eea;
    background: #667eea;
}

.radio-option input[type="radio"]:checked + .radio-custom::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
}

.radio-option input[type="radio"]:checked ~ .radio-label {
    color: #667eea;
    font-weight: 600;
}

.radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.radio-label i {
    font-size: 1.1rem;
}

.insurance-details {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 25px;
    margin-top: 20px;
}

.select-with-search {
    position: relative;
}

.insurance-search {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 12px 15px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
}

.insurance-verification {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #dee2e6;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.verification-status {
    padding: 10px 15px;
    border-radius: 8px;
    font-weight: 500;
    display: none;
}

.verification-status.success {
    display: block;
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.verification-status.error {
    display: block;
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.verification-status.loading {
    display: block;
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.sus-info {
    background: #e3f2fd;
    border-radius: 12px;
    padding: 25px;
    margin-top: 20px;
}

.info-card {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    color: #1565c0;
}

.info-card i {
    font-size: 1.5rem;
    margin-top: 3px;
}

.info-card h4 {
    margin: 0 0 8px 0;
    font-size: 1.1rem;
}

.info-card p {
    margin: 0;
    line-height: 1.5;
}

.field-error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
}

.field-error-message {
    color: #dc3545;
    font-size: 0.85rem;
    margin-top: 5px;
    font-weight: 500;
}

/* Responsivo */
@media (max-width: 768px) {
    .insurance-type-selector {
        flex-direction: column;
        gap: 10px;
    }
    
    .radio-option {
        justify-content: center;
    }
    
    .insurance-verification {
        align-items: stretch;
    }
}
</style>
`;

// Adicionar estilos ao head
if (!document.getElementById('insurance-manager-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'insurance-manager-styles';
    styleElement.innerHTML = insuranceManagerStyles;
    document.head.appendChild(styleElement);
}

// Exportar para uso global
window.InsuranceManager = InsuranceManager;