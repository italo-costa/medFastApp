/**
 * Hook para gerenciar conectividade e configuração da API
 * Específico para ambiente Linux virtualizado
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { apiService } from '../services/apiService';
import { LINUX_CONFIG, setCustomApiUrl } from '../config/apiConfig';

export interface ConnectivityStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  baseUrl: string;
  environment: 'development' | 'production';
  platform: string;
  lastChecked: Date | null;
}

export interface EnvironmentConfig {
  type: 'windows' | 'linux-native' | 'linux-wsl' | 'linux-vm' | 'android-emulator' | 'ios-simulator';
  customUrl?: string;
  autoDetect: boolean;
}

export const useApiConnectivity = (config?: EnvironmentConfig) => {
  const [status, setStatus] = useState<ConnectivityStatus>({
    isConnected: false,
    isLoading: true,
    error: null,
    baseUrl: apiService.baseUrl,
    environment: __DEV__ ? 'development' : 'production',
    platform: Platform.OS,
    lastChecked: null,
  });

  // Configurar URL baseado no ambiente
  const configureEnvironment = useCallback((envConfig: EnvironmentConfig) => {
    let targetUrl = apiService.baseUrl;

    if (envConfig.customUrl) {
      targetUrl = envConfig.customUrl;
    } else {
      switch (envConfig.type) {
        case 'linux-wsl':
          LINUX_CONFIG.configureForLinux('wsl');
          targetUrl = LINUX_CONFIG.WSL_URL;
          break;
        case 'linux-vm':
          LINUX_CONFIG.configureForLinux('vm');
          targetUrl = LINUX_CONFIG.VM_BRIDGE_URL;
          break;
        case 'android-emulator':
          targetUrl = 'http://10.0.2.2:3002/api';
          break;
        case 'ios-simulator':
          targetUrl = 'http://localhost:3002/api';
          break;
        case 'windows':
        case 'linux-native':
        default:
          targetUrl = 'http://localhost:3002/api';
          break;
      }
    }

    if (targetUrl !== apiService.baseUrl) {
      apiService.setBaseUrl(targetUrl);
      setStatus(prev => ({ ...prev, baseUrl: targetUrl }));
    }
  }, []);

  // Testar conectividade
  const testConnection = useCallback(async (): Promise<boolean> => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const isConnected = await apiService.testConnection();
      
      setStatus(prev => ({
        ...prev,
        isConnected,
        isLoading: false,
        error: null,
        lastChecked: new Date(),
      }));

      return isConnected;
    } catch (error: any) {
      const errorMessage = error.message || 'Erro de conectividade';
      
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: errorMessage,
        lastChecked: new Date(),
      }));

      return false;
    }
  }, []);

  // Tentar diferentes URLs automaticamente
  const autoDetectEnvironment = useCallback(async (): Promise<boolean> => {
    const urlsToTry = [
      { url: 'http://localhost:3002/api', type: 'localhost' },
      { url: 'http://10.0.2.2:3002/api', type: 'android-emulator' },
      { url: 'http://192.168.1.100:3002/api', type: 'network-ip' },
      { url: 'http://host.docker.internal:3002/api', type: 'docker' },
    ];

    for (const config of urlsToTry) {
      console.log(`🔍 [Connectivity] Testando: ${config.url}`);
      
      apiService.setBaseUrl(config.url);
      
      try {
        const isConnected = await apiService.testConnection();
        if (isConnected) {
          console.log(`✅ [Connectivity] Conectado via: ${config.type}`);
          setStatus(prev => ({
            ...prev,
            isConnected: true,
            isLoading: false,
            error: null,
            baseUrl: config.url,
            lastChecked: new Date(),
          }));
          return true;
        }
      } catch (error) {
        console.log(`❌ [Connectivity] Falhou: ${config.type}`);
        continue;
      }
    }

    // Nenhuma URL funcionou
    setStatus(prev => ({
      ...prev,
      isConnected: false,
      isLoading: false,
      error: 'Nenhum servidor encontrado. Verifique se o backend está rodando.',
      lastChecked: new Date(),
    }));

    return false;
  }, []);

  // Configurar ambiente específico para Linux
  const configureLinuxEnvironment = useCallback(async (
    vmType: 'wsl' | 'vm' | 'native' | 'docker' = 'native',
    customIp?: string
  ): Promise<boolean> => {
    let targetUrl: string;

    switch (vmType) {
      case 'wsl':
        targetUrl = 'http://localhost:3002/api';
        break;
      case 'vm':
        targetUrl = customIp 
          ? `http://${customIp}:3002/api`
          : 'http://192.168.56.1:3002/api'; // VirtualBox padrão
        break;
      case 'docker':
        targetUrl = 'http://host.docker.internal:3002/api';
        break;
      case 'native':
      default:
        targetUrl = 'http://localhost:3002/api';
        break;
    }

    console.log(`🐧 [Linux] Configurando para ${vmType}: ${targetUrl}`);
    
    apiService.setBaseUrl(targetUrl);
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log(`✅ [Linux] Conectado com sucesso!`);
    } else {
      console.log(`❌ [Linux] Falha na conexão. Tentando auto-detecção...`);
      return await autoDetectEnvironment();
    }

    return isConnected;
  }, [testConnection, autoDetectEnvironment]);

  // Configuração inicial
  useEffect(() => {
    if (config) {
      configureEnvironment(config);
    }

    // Auto-detectar se solicitado ou se não há configuração específica
    if (!config || config.autoDetect) {
      autoDetectEnvironment();
    } else {
      testConnection();
    }
  }, [config, configureEnvironment, autoDetectEnvironment, testConnection]);

  // Recarregar conectividade
  const reload = useCallback(async (): Promise<boolean> => {
    if (config?.autoDetect || !config) {
      return await autoDetectEnvironment();
    } else {
      return await testConnection();
    }
  }, [config, autoDetectEnvironment, testConnection]);

  // Definir URL customizada
  const setCustomUrl = useCallback(async (url: string): Promise<boolean> => {
    apiService.setBaseUrl(url);
    return await testConnection();
  }, [testConnection]);

  // Debug do ambiente atual
  const debugEnvironment = useCallback(() => {
    console.log('🔧 [Connectivity] Estado atual:', {
      ...status,
      config,
      platform: Platform.OS,
      isDev: __DEV__,
    });
  }, [status, config]);

  return {
    // Estado
    status,
    
    // Métodos
    testConnection,
    reload,
    setCustomUrl,
    configureLinuxEnvironment,
    autoDetectEnvironment,
    debugEnvironment,
    
    // Getters convenientes
    isConnected: status.isConnected,
    isLoading: status.isLoading,
    error: status.error,
    baseUrl: status.baseUrl,
  };
};

// Hook simplificado para uso comum
export const useLinuxApiConnectivity = (
  vmType: 'wsl' | 'vm' | 'native' | 'docker' = 'native',
  customIp?: string
) => {
  const connectivity = useApiConnectivity({
    type: `linux-${vmType}` as any,
    autoDetect: true,
  });

  useEffect(() => {
    connectivity.configureLinuxEnvironment(vmType, customIp);
  }, [vmType, customIp]);

  return connectivity;
};

export default useApiConnectivity;