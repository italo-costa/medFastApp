/**
 * Cliente API Unificado - MediApp
 * Centraliza todas as chamadas para a API com tratamento de erro padronizado
 */

class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Método privado para fazer requisições
   */
  async _request(method, endpoint, data = null, customHeaders = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...customHeaders };

    const config = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return result;
    } catch (error) {
      console.error(`❌ [API] Erro na requisição ${method} ${endpoint}:`, error.message);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this._request('GET', fullEndpoint);
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this._request('POST', endpoint, data);
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this._request('PUT', endpoint, data);
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this._request('DELETE', endpoint);
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data) {
    return this._request('PATCH', endpoint, data);
  }

  /**
   * Upload de arquivo
   */
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Adicionar dados extras
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const config = {
      method: 'POST',
      body: formData
      // Não definir Content-Type para FormData - o browser define automaticamente
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return result;
    } catch (error) {
      console.error(`❌ [API] Erro no upload ${endpoint}:`, error.message);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.get('/health');
  }
}

// Métodos específicos para MediApp
class MediAppApi extends ApiClient {
  constructor() {
    super('/api');
  }

  // Médicos
  async getMedicos(params = {}) {
    return this.get('/medicos', params);
  }

  async getMedicoById(id) {
    return this.get(`/medicos/${id}`);
  }

  async createMedico(dados) {
    return this.post('/medicos', dados);
  }

  async updateMedico(id, dados) {
    return this.put(`/medicos/${id}`, dados);
  }

  async deleteMedico(id) {
    return this.delete(`/medicos/${id}`);
  }

  // Pacientes
  async getPacientes(params = {}) {
    return this.get('/pacientes', params);
  }

  async getPacienteById(id) {
    return this.get(`/pacientes/${id}`);
  }

  async createPaciente(dados) {
    return this.post('/pacientes', dados);
  }

  async updatePaciente(id, dados) {
    return this.put(`/pacientes/${id}`, dados);
  }

  async deletePaciente(id) {
    return this.delete(`/pacientes/${id}`);
  }

  // Estatísticas
  async getDashboardStats() {
    return this.get('/statistics/dashboard');
  }

  // ViaCEP
  async consultarCep(cep) {
    return this.get(`/viacep/${cep}`);
  }

  // Utilitários
  async testConnection() {
    try {
      const result = await this.healthCheck();
      return result.success;
    } catch (error) {
      return false;
    }
  }
}

// Instância global da API
const api = new MediAppApi();

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.api = api;
  window.ApiClient = ApiClient;
  window.MediAppApi = MediAppApi;
}

// Exportar para Node.js se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiClient, MediAppApi, api };
}