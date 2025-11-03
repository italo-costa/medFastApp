/**
 * Tela de Teste de Conectividade
 * Permite testar e configurar a conexão com o backend
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useLinuxApiConnectivity } from '../hooks/useApiConnectivity';
import { apiService } from '../services/apiService';

const ConnectivityTestScreen: React.FC = () => {
  const [customUrl, setCustomUrl] = useState('');
  const [vmType, setVmType] = useState<'wsl' | 'vm' | 'native' | 'docker'>('native');
  const [customIp, setCustomIp] = useState('192.168.1.100');

  const connectivity = useLinuxApiConnectivity(vmType, customIp);

  const testUrls = [
    { label: 'Localhost', url: 'http://localhost:3002/api', description: 'Windows/Linux Nativo' },
    { label: 'Android Emulator', url: 'http://10.0.2.2:3002/api', description: 'Android Studio Emulator' },
    { label: 'IP Personalizado', url: `http://${customIp}:3002/api`, description: 'IP da máquina host' },
    { label: 'Docker', url: 'http://host.docker.internal:3002/api', description: 'Ambiente Docker' },
    { label: 'WSL', url: 'http://localhost:3002/api', description: 'Windows Subsystem for Linux' },
  ];

  const handleTestUrl = async (url: string, label: string) => {
    try {
      const success = await connectivity.setCustomUrl(url);
      Alert.alert(
        success ? 'Sucesso' : 'Falha',
        success 
          ? `Conectado com sucesso via ${label}!`
          : `Não foi possível conectar via ${label}. Verifique se o servidor está rodando.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao testar conectividade');
    }
  };

  const handleCustomUrlTest = async () => {
    if (!customUrl.trim()) {
      Alert.alert('Erro', 'Digite uma URL válida');
      return;
    }

    try {
      const success = await connectivity.setCustomUrl(customUrl);
      Alert.alert(
        success ? 'Sucesso' : 'Falha',
        success 
          ? 'Conectado com sucesso!'
          : 'Não foi possível conectar. Verifique a URL e se o servidor está rodando.'
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao testar URL customizada');
    }
  };

  const handleAutoDetect = async () => {
    try {
      const success = await connectivity.autoDetectEnvironment();
      Alert.alert(
        success ? 'Sucesso' : 'Falha',
        success 
          ? `Auto-detecção bem-sucedida! Conectado em: ${connectivity.baseUrl}`
          : 'Não foi possível detectar automaticamente um servidor. Verifique se o backend está rodando.'
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro na auto-detecção');
    }
  };

  const getStatusColor = () => {
    if (connectivity.isLoading) return styles.statusLoading;
    return connectivity.isConnected ? styles.statusConnected : styles.statusDisconnected;
  };

  const getStatusText = () => {
    if (connectivity.isLoading) return 'Testando...';
    return connectivity.isConnected ? 'Conectado' : 'Desconectado';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏥 MediApp - Teste de Conectividade</Text>
        <Text style={styles.subtitle}>Configuração para Ambiente Linux</Text>
      </View>

      {/* Status Atual */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View style={[styles.statusIndicator, getStatusColor()]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
        
        <Text style={styles.info}>URL Atual: {connectivity.baseUrl}</Text>
        <Text style={styles.info}>Plataforma: {Platform.OS}</Text>
        
        {connectivity.error && (
          <Text style={styles.error}>Erro: {connectivity.error}</Text>
        )}
        
        {connectivity.status.lastChecked && (
          <Text style={styles.info}>
            Último teste: {connectivity.status.lastChecked.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Configuração de Ambiente Linux */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🐧 Configuração Linux/VM</Text>
        
        <View style={styles.vmTypeContainer}>
          {(['native', 'wsl', 'vm', 'docker'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.vmTypeButton,
                vmType === type && styles.vmTypeButtonActive
              ]}
              onPress={() => setVmType(type)}
            >
              <Text style={[
                styles.vmTypeText,
                vmType === type && styles.vmTypeTextActive
              ]}>
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="IP da máquina host (ex: 192.168.1.100)"
          value={customIp}
          onChangeText={setCustomIp}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => connectivity.configureLinuxEnvironment(vmType, customIp)}
        >
          <Text style={styles.buttonText}>Configurar Ambiente Linux</Text>
        </TouchableOpacity>
      </View>

      {/* URLs de Teste Rápido */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Teste Rápido</Text>
        
        {testUrls.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.testUrlButton}
            onPress={() => handleTestUrl(item.url, item.label)}
          >
            <View>
              <Text style={styles.testUrlLabel}>{item.label}</Text>
              <Text style={styles.testUrlDescription}>{item.description}</Text>
              <Text style={styles.testUrlUrl}>{item.url}</Text>
            </View>
            <Text style={styles.testUrlArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* URL Customizada */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 URL Customizada</Text>
        
        <TextInput
          style={styles.input}
          placeholder="http://seu-servidor:3002/api"
          value={customUrl}
          onChangeText={setCustomUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.button} onPress={handleCustomUrlTest}>
          <Text style={styles.buttonText}>Testar URL Customizada</Text>
        </TouchableOpacity>
      </View>

      {/* Ações */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleAutoDetect}>
          <Text style={styles.primaryButtonText}>🔍 Auto-Detectar Servidor</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={connectivity.reload}>
          <Text style={styles.secondaryButtonText}>🔄 Recarregar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.debugButton} onPress={connectivity.debugEnvironment}>
          <Text style={styles.debugButtonText}>🐛 Debug Console</Text>
        </TouchableOpacity>
      </View>

      {/* Informações de Ajuda */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>💡 Dicas para Ambiente Linux:</Text>
        <Text style={styles.helpText}>
          • WSL: Use localhost:3002{'\n'}
          • VirtualBox: Use IP da máquina host (ex: 192.168.56.1){'\n'}
          • Docker: Use host.docker.internal:3002{'\n'}
          • Nativo: Use localhost:3002{'\n'}
          • Android Emulator: Use 10.0.2.2:3002
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDisconnected: {
    backgroundColor: '#f44336',
  },
  statusLoading: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  error: {
    fontSize: 14,
    color: '#f44336',
    marginTop: 5,
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  vmTypeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  vmTypeButton: {
    flex: 1,
    padding: 10,
    margin: 2,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    alignItems: 'center',
  },
  vmTypeButtonActive: {
    backgroundColor: '#2196F3',
  },
  vmTypeText: {
    fontSize: 12,
    color: '#666',
  },
  vmTypeTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testUrlButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  testUrlLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  testUrlDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  testUrlUrl: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  testUrlArrow: {
    fontSize: 18,
    color: '#2196F3',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#9C27B0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
  },
  helpSection: {
    backgroundColor: '#fff3e0',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#E65100',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default ConnectivityTestScreen;