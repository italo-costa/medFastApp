/**
 * Componente para Gerenciamento de Endereços com ViaCEP
 * Funcionalidades: Busca automática, validação, formatação
 */

class AddressManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn('Container para endereço não encontrado:', containerId);
            return;
        }
        this.isSearching = false;
        this.cache = new Map(); // Cache para CEPs já buscados
        
        this.init();
    }

    init() {
        this.createAddressInterface();
        this.bindEvents();
    }

    createAddressInterface() {
        this.container.innerHTML = `
            <div class="address-manager">
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="fas fa-map-marker-alt"></i>
                        Endereço
                    </h3>
                    
                    <div class="form-grid">
                        <!-- CEP com busca automática -->
                        <div class="form-group cep-group">
                            <label for="cep">CEP *</label>
                            <div class="cep-input-container">
                                <input type="text" 
                                       id="cep" 
                                       name="cep" 
                                       placeholder="00000-000" 
                                       maxlength="9" 
                                       required>
                                <button type="button" class="cep-search-btn" id="cepSearchBtn">
                                    <i class="fas fa-search" id="cepSearchIcon"></i>
                                </button>
                            </div>
                            <div class="cep-status" id="cepStatus"></div>
                        </div>

                        <!-- Logradouro -->
                        <div class="form-group">
                            <label for="logradouro">Logradouro *</label>
                            <input type="text" 
                                   id="logradouro" 
                                   name="logradouro" 
                                   placeholder="Ex: Rua das Flores" 
                                   required>
                        </div>

                        <!-- Número e Complemento -->
                        <div class="form-group">
                            <label for="numero">Número *</label>
                            <input type="text" 
                                   id="numero" 
                                   name="numero" 
                                   placeholder="123" 
                                   required>
                        </div>

                        <div class="form-group">
                            <label for="complemento">Complemento</label>
                            <input type="text" 
                                   id="complemento" 
                                   name="complemento" 
                                   placeholder="Apto 45, Bloco B">
                        </div>

                        <!-- Bairro -->
                        <div class="form-group">
                            <label for="bairro">Bairro *</label>
                            <input type="text" 
                                   id="bairro" 
                                   name="bairro" 
                                   placeholder="Ex: Centro" 
                                   required>
                        </div>

                        <!-- Cidade -->
                        <div class="form-group">
                            <label for="cidade">Cidade *</label>
                            <input type="text" 
                                   id="cidade" 
                                   name="cidade" 
                                   placeholder="Ex: São Paulo" 
                                   required>
                        </div>

                        <!-- UF -->
                        <div class="form-group">
                            <label for="uf">UF *</label>
                            <select id="uf" name="uf" required>
                                <option value="">Selecione</option>
                                <option value="AC">Acre</option>
                                <option value="AL">Alagoas</option>
                                <option value="AP">Amapá</option>
                                <option value="AM">Amazonas</option>
                                <option value="BA">Bahia</option>
                                <option value="CE">Ceará</option>
                                <option value="DF">Distrito Federal</option>
                                <option value="ES">Espírito Santo</option>
                                <option value="GO">Goiás</option>
                                <option value="MA">Maranhão</option>
                                <option value="MT">Mato Grosso</option>
                                <option value="MS">Mato Grosso do Sul</option>
                                <option value="MG">Minas Gerais</option>
                                <option value="PA">Pará</option>
                                <option value="PB">Paraíba</option>
                                <option value="PR">Paraná</option>
                                <option value="PE">Pernambuco</option>
                                <option value="PI">Piauí</option>
                                <option value="RJ">Rio de Janeiro</option>
                                <option value="RN">Rio Grande do Norte</option>
                                <option value="RS">Rio Grande do Sul</option>
                                <option value="RO">Rondônia</option>
                                <option value="RR">Roraima</option>
                                <option value="SC">Santa Catarina</option>
                                <option value="SP">São Paulo</option>
                                <option value="SE">Sergipe</option>
                                <option value="TO">Tocantins</option>
                            </select>
                        </div>

                        <!-- Ponto de Referência -->
                        <div class="form-group full-width">
                            <label for="pontoReferencia">Ponto de Referência</label>
                            <input type="text" 
                                   id="pontoReferencia" 
                                   name="pontoReferencia" 
                                   placeholder="Ex: Próximo ao shopping, em frente à padaria">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const cepInput = document.getElementById('cep');
        const searchBtn = document.getElementById('cepSearchBtn');

        // Máscara de CEP
        cepInput.addEventListener('input', (e) => {
            this.applyCepMask(e.target);
        });

        // Busca automática ao sair do campo
        cepInput.addEventListener('blur', () => {
            this.searchCep();
        });

        // Busca manual via botão
        searchBtn.addEventListener('click', () => {
            this.searchCep();
        });

        // Enter no campo CEP
        cepInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchCep();
            }
        });
    }

    applyCepMask(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        input.value = value;
    }

    async searchCep() {
        const cepInput = document.getElementById('cep');
        const cep = cepInput.value.replace(/\D/g, '');

        // Validar CEP
        if (cep.length !== 8) {
            this.showCepStatus('CEP deve ter 8 dígitos', 'error');
            return;
        }

        // Verificar cache
        if (this.cache.has(cep)) {
            this.fillAddress(this.cache.get(cep));
            this.showCepStatus('CEP encontrado (cache)', 'success');
            return;
        }

        this.setSearching(true);
        this.showCepStatus('Buscando CEP...', 'loading');

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                throw new Error('CEP não encontrado');
            }

            // Salvar no cache
            this.cache.set(cep, data);

            this.fillAddress(data);
            this.showCepStatus('CEP encontrado', 'success');

        } catch (error) {
            this.showCepStatus('CEP não encontrado', 'error');
            console.error('Erro ao buscar CEP:', error);
        } finally {
            this.setSearching(false);
        }
    }

    fillAddress(data) {
        // Preencher campos automaticamente
        document.getElementById('logradouro').value = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('cidade').value = data.localidade || '';
        document.getElementById('uf').value = data.uf || '';

        // Focar no campo número se logradouro foi preenchido
        if (data.logradouro) {
            document.getElementById('numero').focus();
        }

        // Disparar evento personalizado
        this.container.dispatchEvent(new CustomEvent('addressLoaded', {
            detail: data
        }));
    }

    setSearching(isSearching) {
        this.isSearching = isSearching;
        const searchBtn = document.getElementById('cepSearchBtn');
        const searchIcon = document.getElementById('cepSearchIcon');

        if (isSearching) {
            searchBtn.disabled = true;
            searchIcon.className = 'fas fa-spinner fa-spin';
        } else {
            searchBtn.disabled = false;
            searchIcon.className = 'fas fa-search';
        }
    }

    showCepStatus(message, type) {
        const statusElement = document.getElementById('cepStatus');
        statusElement.textContent = message;
        statusElement.className = `cep-status ${type}`;

        // Limpar status após 3 segundos para sucessos
        if (type === 'success') {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'cep-status';
            }, 3000);
        }
    }

    // Método para obter dados do endereço
    getAddressData() {
        return {
            cep: document.getElementById('cep').value,
            logradouro: document.getElementById('logradouro').value,
            numero: document.getElementById('numero').value,
            complemento: document.getElementById('complemento').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            uf: document.getElementById('uf').value,
            pontoReferencia: document.getElementById('pontoReferencia').value
        };
    }

    // Método para definir dados do endereço
    setAddressData(data) {
        if (data.cep) document.getElementById('cep').value = data.cep;
        if (data.logradouro) document.getElementById('logradouro').value = data.logradouro;
        if (data.numero) document.getElementById('numero').value = data.numero;
        if (data.complemento) document.getElementById('complemento').value = data.complemento;
        if (data.bairro) document.getElementById('bairro').value = data.bairro;
        if (data.cidade) document.getElementById('cidade').value = data.cidade;
        if (data.uf) document.getElementById('uf').value = data.uf;
        if (data.pontoReferencia) document.getElementById('pontoReferencia').value = data.pontoReferencia;
    }

    // Validar endereço completo
    validateAddress() {
        const errors = [];
        const data = this.getAddressData();

        if (!data.cep || data.cep.replace(/\D/g, '').length !== 8) {
            errors.push('CEP é obrigatório e deve ter 8 dígitos');
        }

        if (!data.logradouro.trim()) {
            errors.push('Logradouro é obrigatório');
        }

        if (!data.numero.trim()) {
            errors.push('Número é obrigatório');
        }

        if (!data.bairro.trim()) {
            errors.push('Bairro é obrigatório');
        }

        if (!data.cidade.trim()) {
            errors.push('Cidade é obrigatória');
        }

        if (!data.uf) {
            errors.push('UF é obrigatória');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Formatar endereço para exibição
    formatAddress() {
        const data = this.getAddressData();
        const parts = [];

        if (data.logradouro) parts.push(data.logradouro);
        if (data.numero) parts.push(data.numero);
        if (data.complemento) parts.push(data.complemento);
        if (data.bairro) parts.push(data.bairro);
        if (data.cidade && data.uf) parts.push(`${data.cidade}/${data.uf}`);
        if (data.cep) parts.push(`CEP: ${data.cep}`);

        return parts.join(', ');
    }

    // Método para carregar endereço existente
    loadAddress(addressData) {
        if (!addressData) return;
        
        try {
            // Mapear campos diferentes entre API e componente
            const mappedData = {
                cep: addressData.cep || '',
                logradouro: addressData.rua || addressData.logradouro || addressData.street || '',
                numero: addressData.numero || addressData.number || '',
                complemento: addressData.complemento || addressData.complement || '',
                bairro: addressData.bairro || addressData.neighborhood || '',
                cidade: addressData.cidade || addressData.city || '',
                uf: addressData.estado || addressData.uf || addressData.state || '',
                pontoReferencia: addressData.pontoReferencia || addressData.reference || ''
            };
            
            this.setAddressData(mappedData);
        } catch (error) {
            console.error('Erro ao carregar endereço existente:', error);
        }
    }

    // Método para obter dados formatados para API
    getData() {
        const data = this.getAddressData();
        return {
            address: {
                cep: data.cep,
                street: data.logradouro,
                number: data.numero,
                complement: data.complemento,
                neighborhood: data.bairro,
                city: data.cidade,
                state: data.uf,
                reference: data.pontoReferencia
            }
        };
    }

    // Método para limpar dados
    clearData() {
        document.getElementById('cep').value = '';
        document.getElementById('logradouro').value = '';
        document.getElementById('numero').value = '';
        document.getElementById('complemento').value = '';
        document.getElementById('bairro').value = '';
        document.getElementById('cidade').value = '';
        document.getElementById('uf').value = '';
        document.getElementById('pontoReferencia').value = '';
        
        // Limpar status
        const statusElement = document.getElementById('cepStatus');
        statusElement.textContent = '';
        statusElement.className = 'cep-status';
    }
}

// CSS para o componente de endereço
const addressManagerStyles = `
<style>
.address-manager {
    width: 100%;
}

.cep-group {
    position: relative;
}

.cep-input-container {
    display: flex;
    gap: 8px;
    align-items: stretch;
}

.cep-input-container input {
    flex: 1;
}

.cep-search-btn {
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 45px;
}

.cep-search-btn:hover:not(:disabled) {
    background: #5a6fd8;
    transform: translateY(-1px);
}

.cep-search-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.cep-status {
    font-size: 0.85rem;
    margin-top: 5px;
    padding: 4px 8px;
    border-radius: 4px;
    display: none;
}

.cep-status.success {
    display: block;
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.cep-status.error {
    display: block;
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.cep-status.loading {
    display: block;
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.form-group.full-width {
    grid-column: 1 / -1;
}

/* Grid responsivo para formulário */
.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

/* Campos de endereço específicos */
.form-group input,
.form-group select {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: white;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #495057;
}

/* Responsivo */
@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .cep-input-container {
        flex-direction: column;
    }
    
    .cep-search-btn {
        height: 40px;
    }
}

/* Estados visuais para campos preenchidos automaticamente */
.auto-filled {
    background-color: #f0f8ff !important;
    border-color: #667eea !important;
}

/* Animação suave para preenchimento automático */
.address-manager input {
    transition: background-color 0.5s ease, border-color 0.5s ease;
}
</style>
`;

// Adicionar estilos ao head
if (!document.getElementById('address-manager-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'address-manager-styles';
    styleElement.innerHTML = addressManagerStyles;
    document.head.appendChild(styleElement);
}

// Exportar para uso global
window.AddressManager = AddressManager;