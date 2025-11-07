/**
 * Configuração da API para MediApp Mobile
 * Detecta automaticamente o ambiente (Windows, Linux/WSL, Android emulador)
 */

import { Platform } from 'react-native';

// Função para detectar se estamos em ambiente de desenvolvimento
const isDevelopment = __DEV__;

// Função para detectar o ambiente e retornar a URL base correta
const getApiBaseUrl = (): string => {
  if (!isDevelopment) {
    // Produção - usar URL de produção
    return 'https://api.mediapp.com.br/api';
  }

  // Desenvolvimento - detectar ambiente
  if (Platform.OS === 'android') {
    // Android emulador - usar IP especial do Android para localhost
    return 'http://10.0.2.2:3002/api';
  } else if (Platform.OS === 'ios') {
    // iOS simulator - pode usar localhost diretamente
    return 'http://localhost:3002/api';
  } else {
    // Web ou outros - usar localhost
    return 'http://localhost:3002/api';
  }
};

// Configurações específicas para diferentes ambientes
export const API_CONFIG = {
  // URL base da API
  BASE_URL: getApiBaseUrl(),
  
  // Timeout padrão para requisições (em ms)
  TIMEOUT: 10000,
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Configurações para desenvolvimento
  DEV: {
    // URLs alternativas para diferentes ambientes de desenvolvimento
    WINDOWS_LOCAL: 'http://localhost:3002/api',
    LINUX_WSL: 'http://localhost:3002/api',
    LINUX_VM: 'http://192.168.1.100:3002/api', // Ajustar IP conforme necessário
    ANDROID_EMULATOR: 'http://10.0.2.2:3002/api',
    IOS_SIMULATOR: 'http://localhost:3002/api',
    
    // IP estático para máquina de desenvolvimento (configurar conforme necessário)
    DEV_MACHINE_IP: '192.168.1.100',
  },
  
  // Endpoints principais
  ENDPOINTS: {
    // Autenticação
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    CHECK_EMAIL: '/auth/check-email',
    
    // Médicos
    DOCTORS: '/medicos',
    DOCTORS_SEARCH: '/medicos/buscar',
    DOCTORS_STATS: '/medicos/estatisticas',
    DOCTORS_SPECIALTIES: '/medicos/especialidades',
    
    // Pacientes
    PATIENTS: '/pacientes',
    PATIENTS_SEARCH: '/pacientes/buscar',
    
    // Prontuários
    RECORDS: '/prontuarios',
    RECORDS_PATIENT: '/prontuarios/paciente',
    
    // Dashboard
    DASHBOARD_STATS: '/dashboard/stats',
    
    // Uploads
    UPLOAD_PHOTO: '/upload/foto',
    UPLOAD_DOCUMENT: '/upload/documento',
    
    // Health check
    HEALTH: '/health',
  },
  
  // Configurações de autenticação
  AUTH: {
    TOKEN_KEY: '@mediapp:auth_token',
    USER_KEY: '@mediapp:user_data',
    REFRESH_TOKEN_KEY: '@mediapp:refresh_token',
  },
  
  // Configurações de cache
  CACHE: {
    PATIENTS_TTL: 5 * 60 * 1000, // 5 minutos
    DOCTORS_TTL: 10 * 60 * 1000, // 10 minutos
    STATS_TTL: 2 * 60 * 1000, // 2 minutos
  },
};

// Função para configurar URL customizada (útil para testes ou ambientes específicos)
export const setCustomApiUrl = (url: string) => {
  // @ts-ignore - Modificação dinâmica para testes
  API_CONFIG.BASE_URL = url;
};

// Função para obter URL completa de um endpoint
export const getEndpointUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, ''); // Remove barra final
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Função para debug - mostra todas as configurações atuais
export const debugApiConfig = () => {
  console.log('🔧 [API Config] Configurações atuais:', {
    platform: Platform.OS,
    isDevelopment,
    baseUrl: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
  });
};

// Configurações específicas para ambiente Linux/WSL
export const LINUX_CONFIG = {
  // Detectar se estamos em WSL
  isWSL: () => {
    // No React Native, não temos acesso direto ao sistema de arquivos
    // Esta detecção seria feita no backend ou através de configuração manual
    return false;
  },
  
  // URLs específicas para diferentes setups Linux
  DOCKER_URL: 'http://host.docker.internal:3002/api',
  VM_BRIDGE_URL: 'http://192.168.56.1:3002/api',
  WSL_URL: 'http://localhost:3002/api',
  
  // Função para configurar automaticamente baseado no ambiente Linux
  configureForLinux: (vmType: 'wsl' | 'docker' | 'vm' | 'native' = 'native') => {
    switch (vmType) {
      case 'wsl':
        setCustomApiUrl(LINUX_CONFIG.WSL_URL);
        break;
      case 'docker':
        setCustomApiUrl(LINUX_CONFIG.DOCKER_URL);
        break;
      case 'vm':
        setCustomApiUrl(LINUX_CONFIG.VM_BRIDGE_URL);
        break;
      default:
        // Manter configuração padrão
        break;
    }
  },
};

export default API_CONFIG;