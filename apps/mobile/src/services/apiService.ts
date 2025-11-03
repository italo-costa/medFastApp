/**
 * Serviço de API para MediApp Mobile
 * Gerencia todas as chamadas HTTP para o backend
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getEndpointUrl, debugApiConfig } from '../config/apiConfig';

// Interfaces
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    specialty?: string;
    crm?: string;
  };
  token: string;
}

interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email?: string;
  address: string;
  emergencyContact: string;
  allergies: string[];
  medications: string[];
  createdAt: string;
  updatedAt: string;
}

interface Doctor {
  id: string;
  nomeCompleto: string;
  cpf: string;
  crm: string;
  especialidade: string;
  telefone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalRecords: number;
  recordsToday: number;
  recordsWeek: number;
}

class ApiService {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.api = this.createAxiosInstance();
    this.setupInterceptors();
    this.loadStoredToken();
    
    // Debug da configuração no desenvolvimento
    if (__DEV__) {
      debugApiConfig();
    }
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.DEFAULT_HEADERS,
    });
  }

  private setupInterceptors(): void {
    // Request interceptor - adiciona token de autenticação
    this.api.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        
        if (__DEV__) {
          console.log(`🌐 [API] ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => {
        console.error('❌ [API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - trata respostas e erros
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        if (__DEV__) {
          console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        }
        return response;
      },
      async (error) => {
        console.error('❌ [API] Response error:', error.response?.status, error.message);
        
        // Se token expirou, remover da storage
        if (error.response?.status === 401) {
          await this.clearAuthData();
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async loadStoredToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(API_CONFIG.AUTH.TOKEN_KEY);
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.error('❌ [API] Error loading stored token:', error);
    }
  }

  private async saveAuthData(token: string, user: any): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [API_CONFIG.AUTH.TOKEN_KEY, token],
        [API_CONFIG.AUTH.USER_KEY, JSON.stringify(user)]
      ]);
      this.authToken = token;
    } catch (error) {
      console.error('❌ [API] Error saving auth data:', error);
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        API_CONFIG.AUTH.TOKEN_KEY,
        API_CONFIG.AUTH.USER_KEY,
        API_CONFIG.AUTH.REFRESH_TOKEN_KEY
      ]);
      this.authToken = null;
    } catch (error) {
      console.error('❌ [API] Error clearing auth data:', error);
    }
  }

  // Métodos de autenticação
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.api.post<ApiResponse<LoginResponse>>(
        API_CONFIG.ENDPOINTS.LOGIN,
        { email, password }
      );

      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        await this.saveAuthData(token, user);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ [API] Login error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post(API_CONFIG.ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('❌ [API] Logout error:', error);
    } finally {
      await this.clearAuthData();
    }
  }

  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    try {
      const response = await this.api.post<ApiResponse<{ available: boolean }>>(
        API_CONFIG.ENDPOINTS.CHECK_EMAIL,
        { email }
      );
      return response.data.data || { available: false };
    } catch (error: any) {
      console.error('❌ [API] Check email error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao verificar email');
    }
  }

  // Métodos de pacientes
  async getPatients(): Promise<Patient[]> {
    try {
      const response = await this.api.get<ApiResponse<Patient[]>>(
        API_CONFIG.ENDPOINTS.PATIENTS
      );
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ [API] Get patients error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar pacientes');
    }
  }

  async searchPatients(query: string): Promise<Patient[]> {
    try {
      const response = await this.api.get<ApiResponse<Patient[]>>(
        `${API_CONFIG.ENDPOINTS.PATIENTS_SEARCH}?q=${encodeURIComponent(query)}`
      );
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ [API] Search patients error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar pacientes');
    }
  }

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    try {
      const response = await this.api.post<ApiResponse<Patient>>(
        API_CONFIG.ENDPOINTS.PATIENTS,
        patient
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao criar paciente');
      }
    } catch (error: any) {
      console.error('❌ [API] Create patient error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao cadastrar paciente');
    }
  }

  // Métodos de médicos
  async getDoctors(): Promise<Doctor[]> {
    try {
      const response = await this.api.get<ApiResponse<Doctor[]>>(
        API_CONFIG.ENDPOINTS.DOCTORS
      );
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ [API] Get doctors error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar médicos');
    }
  }

  async searchDoctors(query: string): Promise<Doctor[]> {
    try {
      const response = await this.api.get<ApiResponse<Doctor[]>>(
        `${API_CONFIG.ENDPOINTS.DOCTORS_SEARCH}?q=${encodeURIComponent(query)}`
      );
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ [API] Search doctors error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar médicos');
    }
  }

  // Métodos do dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await this.api.get<ApiResponse<DashboardStats>>(
        API_CONFIG.ENDPOINTS.DASHBOARD_STATS
      );
      return response.data.data || {
        totalPatients: 0,
        totalDoctors: 0,
        totalRecords: 0,
        recordsToday: 0,
        recordsWeek: 0,
      };
    } catch (error: any) {
      console.error('❌ [API] Get dashboard stats error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar estatísticas');
    }
  }

  // Método de health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.api.get<ApiResponse>(
        API_CONFIG.ENDPOINTS.HEALTH
      );
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('❌ [API] Health check error:', error);
      throw new Error('Servidor indisponível');
    }
  }

  // Método para testar conectividade
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Método para configurar URL customizada (útil para diferentes ambientes)
  setBaseUrl(url: string): void {
    this.api.defaults.baseURL = url;
    if (__DEV__) {
      console.log(`🔧 [API] Base URL alterada para: ${url}`);
    }
  }

  // Getter para obter URL atual
  get baseUrl(): string {
    return this.api.defaults.baseURL || API_CONFIG.BASE_URL;
  }

  // Getter para verificar se está autenticado
  get isAuthenticated(): boolean {
    return !!this.authToken;
  }
}

// Instância singleton do serviço
export const apiService = new ApiService();

// Exports para facilitar importação
export type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  Patient,
  Doctor,
  DashboardStats,
};

export default apiService;