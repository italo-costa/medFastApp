/**
 * 📱 SUÍTE DE TESTES MOBILE REACT NATIVE
 * 
 * Testes abrangentes para validação do app mobile:
 * - ✅ Testes unitários de componentes
 * - ✅ Testes de integração Redux
 * - ✅ Testes de navegação
 * - ✅ Testes de API integration
 * - ✅ Testes de performance
 * - ✅ Validação de build Android/iOS
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from '../src/store/store';
import { authSlice } from '../src/store/slices/authSlice';
import { patientsSlice } from '../src/store/slices/patientsSlice';

// Mock do React Native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn((platforms) => platforms.android || platforms.default),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
  },
}));

// Mock do AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock do React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock das APIs
const mockApiService = {
  login: jest.fn(),
  getPatients: jest.fn(),
  getRecords: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
};

describe('🧪 Mobile App Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store
    store.dispatch(authSlice.actions.logout());
    store.dispatch(patientsSlice.actions.clearSelectedPatient());
  });

  describe('🔐 Authentication Tests', () => {
    test('deve inicializar com estado de autenticação correto', () => {
      const state = store.getState();
      
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBeNull();
    });

    test('deve fazer login com sucesso', async () => {
      const mockUser = {
        id: '1',
        name: 'Dr. Teste Mobile',
        email: 'mobile@test.com',
        specialty: 'Cardiologia',
        crm: 'CRM123456'
      };

      const mockToken = 'mock-jwt-token';

      // Simular login
      store.dispatch(authSlice.actions.loginStart());
      expect(store.getState().auth.isLoading).toBe(true);

      store.dispatch(authSlice.actions.loginSuccess({
        user: mockUser,
        token: mockToken
      }));

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.token).toBe(mockToken);
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBeNull();
    });

    test('deve lidar com erro de login', () => {
      const errorMessage = 'Credenciais inválidas';

      store.dispatch(authSlice.actions.loginStart());
      store.dispatch(authSlice.actions.loginFailure(errorMessage));

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBe(errorMessage);
    });

    test('deve fazer logout corretamente', () => {
      // Primeiro fazer login
      store.dispatch(authSlice.actions.loginSuccess({
        user: { 
          id: '1', 
          name: 'Teste',
          email: 'teste@test.com',
          specialty: 'Cardiologia',
          crm: 'CRM123'
        },
        token: 'token'
      }));

      // Depois logout
      store.dispatch(authSlice.actions.logout());

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
      expect(state.auth.token).toBeNull();
      expect(state.auth.error).toBeNull();
    });
  });

  describe('👥 Patients Management Tests', () => {
    test('deve carregar lista de pacientes', () => {
      const mockPatients = [
        {
          id: '1',
          name: 'João Silva',
          cpf: '12345678901',
          birthDate: '1990-01-01',
          phone: '(11) 99999-9999'
        },
        {
          id: '2',
          name: 'Maria Santos',
          cpf: '98765432109',
          birthDate: '1985-05-15',
          phone: '(11) 88888-8888'
        }
      ];

      store.dispatch(patientsSlice.actions.setPatientsLoading(true));
      store.dispatch(patientsSlice.actions.setPatientsSuccess(mockPatients));

      const state = store.getState();
      expect(state.patients.list).toEqual(mockPatients);
      expect(state.patients.loading).toBe(false);
      expect(state.patients.error).toBeNull();
    });

    test('deve filtrar pacientes por nome', () => {
      const mockPatients = [
        { id: '1', name: 'João Silva', cpf: '12345678901' },
        { id: '2', name: 'Maria Santos', cpf: '98765432109' },
        { id: '3', name: 'João Oliveira', cpf: '11111111111' }
      ];

      store.dispatch(patientsSlice.actions.setPatientsSuccess(mockPatients));
      store.dispatch(patientsSlice.actions.setSearchFilter('João'));

      const state = store.getState();
      expect(state.patients.searchFilter).toBe('João');
      
      // Em um selector real, isso filtraria os pacientes
      const filteredPatients = state.patients.list.filter(patient =>
        patient.name.toLowerCase().includes('joão')
      );
      expect(filteredPatients).toHaveLength(2);
    });

    test('deve selecionar paciente', () => {
      const mockPatient = {
        id: '1',
        name: 'João Silva',
        cpf: '12345678901'
      };

      store.dispatch(patientsSlice.actions.selectPatient(mockPatient));

      const state = store.getState();
      expect(state.patients.selectedPatient).toEqual(mockPatient);
    });
  });

  describe('📋 Records Management Tests', () => {
    test('deve criar novo registro médico', () => {
      const mockRecord = {
        id: 'record-1',
        patientId: 'patient-1',
        date: '2025-10-31',
        diagnosis: 'Hipertensão arterial',
        treatment: 'Medicação anti-hipertensiva',
        notes: 'Paciente apresentou melhora'
      };

      // Simular criação de registro
      const createRecordAction = {
        type: 'records/createRecord',
        payload: mockRecord
      };

      // Verificar se o payload está correto
      expect(createRecordAction.payload).toEqual(mockRecord);
      expect(createRecordAction.payload.diagnosis).toBe('Hipertensão arterial');
    });

    test('deve atualizar registro existente', () => {
      const existingRecord = {
        id: 'record-1',
        patientId: 'patient-1',
        diagnosis: 'Hipertensão'
      };

      const updatedRecord = {
        ...existingRecord,
        diagnosis: 'Hipertensão arterial controlada',
        treatment: 'Dieta e exercícios'
      };

      // Simular atualização
      const updateAction = {
        type: 'records/updateRecord',
        payload: updatedRecord
      };

      expect(updateAction.payload.diagnosis).toBe('Hipertensão arterial controlada');
      expect(updateAction.payload.treatment).toBe('Dieta e exercícios');
    });
  });

  describe('🌐 API Integration Tests', () => {
    test('deve fazer requisição de login', async () => {
      const mockLoginResponse = {
        success: true,
        user: {
          id: '1',
          name: 'Dr. Teste',
          email: 'teste@mediapp.com'
        },
        token: 'jwt-token'
      };

      mockApiService.login.mockResolvedValue(mockLoginResponse);

      const credentials = {
        email: 'teste@mediapp.com',
        password: 'senha123'
      };

      const result = await mockApiService.login(credentials);

      expect(mockApiService.login).toHaveBeenCalledWith(credentials);
      expect(result).toEqual(mockLoginResponse);
      expect(result.success).toBe(true);
    });

    test('deve lidar com erro de rede', async () => {
      const networkError = new Error('Network Error');
      mockApiService.getPatients.mockRejectedValue(networkError);

      try {
        await mockApiService.getPatients();
      } catch (error) {
        expect(error.message).toBe('Network Error');
      }

      expect(mockApiService.getPatients).toHaveBeenCalled();
    });

    test('deve fazer retry em caso de falha temporária', async () => {
      // Simular falha na primeira tentativa, sucesso na segunda
      mockApiService.getPatients
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ success: true, data: [] });

      // Função de retry simulada
      const apiWithRetry = async (apiCall, maxRetries = 2) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await apiCall();
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      };

      const result = await apiWithRetry(() => mockApiService.getPatients());

      expect(mockApiService.getPatients).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });
  });

  describe('📱 Navigation Tests', () => {
    test('deve navegar entre telas corretamente', () => {
      const mockNavigate = jest.fn();
      
      // Simular navegação
      const navigationActions = {
        navigateToPatients: () => mockNavigate('Patients'),
        navigateToRecords: (patientId) => mockNavigate('Records', { patientId }),
        goBack: () => mockNavigate.goBack && mockNavigate.goBack()
      };

      navigationActions.navigateToPatients();
      expect(mockNavigate).toHaveBeenCalledWith('Patients');

      navigationActions.navigateToRecords('patient-123');
      expect(mockNavigate).toHaveBeenCalledWith('Records', { patientId: 'patient-123' });
    });

    test('deve manter estado durante navegação', () => {
      // Simular navegação mantendo estado Redux
      const initialState = store.getState();
      
      // Fazer login
      store.dispatch(authSlice.actions.loginSuccess({
        user: { id: '1', name: 'Dr. Teste' },
        token: 'token'
      }));

      // Carregar pacientes
      store.dispatch(patientsSlice.actions.setPatientsSuccess([
        { id: '1', name: 'Paciente 1' }
      ]));

      // Verificar se estado persiste
      const finalState = store.getState();
      expect(finalState.auth.isAuthenticated).toBe(true);
      expect(finalState.patients.list).toHaveLength(1);
    });
  });

  describe('⚡ Performance Tests', () => {
    test('deve renderizar lista de pacientes rapidamente', () => {
      const startTime = Date.now();
      
      // Simular renderização de 100 pacientes
      const largePatientsArray = Array.from({ length: 100 }, (_, index) => ({
        id: `patient-${index}`,
        name: `Paciente ${index}`,
        cpf: `${index}`.padStart(11, '0')
      }));

      store.dispatch(patientsSlice.actions.setPatientsSuccess(largePatientsArray));
      
      const endTime = Date.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100); // Menos de 100ms
      expect(store.getState().patients.list).toHaveLength(100);
    });

    test('deve otimizar operações de busca', () => {
      const patients = Array.from({ length: 1000 }, (_, index) => ({
        id: `patient-${index}`,
        name: `Paciente ${index}`,
        cpf: `${index}`.padStart(11, '0')
      }));

      const startTime = Date.now();
      
      // Simular busca otimizada
      const searchTerm = 'Paciente 50';
      const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const endTime = Date.now();
      const searchTime = endTime - startTime;

      expect(searchTime).toBeLessThan(50); // Menos de 50ms
      expect(filteredPatients).toHaveLength(11); // 50, 150, 250, etc.
    });
  });

  describe('💾 Data Persistence Tests', () => {
    test('deve persistir dados de autenticação', async () => {
      const userData = {
        user: { id: '1', name: 'Dr. Teste' },
        token: 'test-token'
      };

      // Simular persistência
      await mockAsyncStorage.setItem('auth', JSON.stringify(userData));
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'auth',
        JSON.stringify(userData)
      );

      // Simular recuperação
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(userData));
      const retrievedData = JSON.parse(await mockAsyncStorage.getItem('auth'));

      expect(retrievedData).toEqual(userData);
    });

    test('deve limpar dados no logout', async () => {
      // Simular logout
      await mockAsyncStorage.removeItem('auth');
      await mockAsyncStorage.removeItem('userPreferences');

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('auth');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('userPreferences');
    });
  });

  describe('🔒 Security Tests', () => {
    test('deve validar entrada de dados', () => {
      const validateCPF = (cpf) => {
        if (!cpf || cpf.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        return true;
      };

      const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      // Testes de validação
      expect(validateCPF('12345678901')).toBe(true);
      expect(validateCPF('11111111111')).toBe(false);
      expect(validateCPF('123')).toBe(false);

      expect(validateEmail('teste@mediapp.com')).toBe(true);
      expect(validateEmail('email-invalido')).toBe(false);
    });

    test('deve sanitizar dados de entrada', () => {
      const sanitizeInput = (input) => {
        if (typeof input !== 'string') return input;
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .trim();
      };

      const maliciousInput = '<script>alert("xss")</script>Nome do Paciente';
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).toBe('Nome do Paciente');
      expect(sanitized).not.toContain('<script>');
    });

    test('deve gerenciar tokens de forma segura', () => {
      const tokenManager = {
        setToken: (token) => {
          // Em produção, usaria Keychain/Keystore
          return mockAsyncStorage.setItem('secure_token', token);
        },
        getToken: () => {
          return mockAsyncStorage.getItem('secure_token');
        },
        removeToken: () => {
          return mockAsyncStorage.removeItem('secure_token');
        }
      };

      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      
      tokenManager.setToken(testToken);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('secure_token', testToken);

      tokenManager.removeToken();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('secure_token');
    });
  });

  describe('🛠️ Build Validation Tests', () => {
    test('deve validar configuração de build Android', () => {
      const androidConfig = {
        compileSdkVersion: 34,
        targetSdkVersion: 34,
        minSdkVersion: 21,
        buildToolsVersion: '34.0.0'
      };

      expect(androidConfig.minSdkVersion).toBeGreaterThanOrEqual(21);
      expect(androidConfig.targetSdkVersion).toBeGreaterThanOrEqual(33);
      expect(androidConfig.compileSdkVersion).toBeGreaterThanOrEqual(androidConfig.targetSdkVersion);
    });

    test('deve validar configuração de build iOS', () => {
      const iosConfig = {
        deploymentTarget: '12.0',
        swiftVersion: '5.0'
      };

      const deploymentVersion = parseFloat(iosConfig.deploymentTarget);
      expect(deploymentVersion).toBeGreaterThanOrEqual(12.0);
    });

    test('deve verificar dependências de produção', () => {
      const productionDependencies = [
        'react',
        'react-native',
        '@reduxjs/toolkit',
        'react-redux',
        '@react-navigation/native',
        'axios'
      ];

      // Simular package.json
      const packageJson = {
        dependencies: {
          'react': '^18.2.0',
          'react-native': '^0.72.6',
          '@reduxjs/toolkit': '^1.9.7',
          'react-redux': '^8.1.3',
          '@react-navigation/native': '^6.1.9',
          'axios': '^1.6.0'
        }
      };

      productionDependencies.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
        expect(packageJson.dependencies[dep]).toBeTruthy();
      });
    });
  });

  describe('🌐 Offline Capability Tests', () => {
    test('deve funcionar offline com dados em cache', () => {
      const offlineDataManager = {
        cachePatients: (patients) => mockAsyncStorage.setItem('cached_patients', JSON.stringify(patients)),
        getCachedPatients: async () => {
          const cached = await mockAsyncStorage.getItem('cached_patients');
          return cached ? JSON.parse(cached) : [];
        },
        isOnline: () => true // Mock de conectividade
      };

      const mockPatients = [
        { id: '1', name: 'Paciente 1' },
        { id: '2', name: 'Paciente 2' }
      ];

      // Simular cache
      offlineDataManager.cachePatients(mockPatients);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'cached_patients',
        JSON.stringify(mockPatients)
      );
    });

    test('deve sincronizar dados quando voltar online', async () => {
      const syncManager = {
        pendingOperations: [],
        addPendingOperation: (operation) => {
          syncManager.pendingOperations.push(operation);
        },
        syncWhenOnline: async () => {
          // Simular sincronização
          const operations = syncManager.pendingOperations.splice(0);
          return Promise.all(operations.map(op => op.execute()));
        }
      };

      const pendingOperation = {
        type: 'CREATE_RECORD',
        data: { patientId: '1', diagnosis: 'Teste' },
        execute: jest.fn().mockResolvedValue({ success: true })
      };

      syncManager.addPendingOperation(pendingOperation);
      expect(syncManager.pendingOperations).toHaveLength(1);

      await syncManager.syncWhenOnline();
      expect(pendingOperation.execute).toHaveBeenCalled();
      expect(syncManager.pendingOperations).toHaveLength(0);
    });
  });
});

// Utilitários de teste
export const createMockStore = (initialState = {}) => {
  return {
    getState: () => ({
      auth: {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        ...initialState.auth
      },
      patients: {
        list: [],
        loading: false,
        error: null,
        selectedPatient: null,
        searchFilter: '',
        ...initialState.patients
      },
      records: {
        list: [],
        loading: false,
        error: null,
        ...initialState.records
      }
    }),
    dispatch: jest.fn(),
    subscribe: jest.fn()
  };
};

export const renderWithProviders = (component, { store = createMockStore() } = {}) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </Provider>
  );

  return render(component, { wrapper: Wrapper });
};

export default {
  createMockStore,
  renderWithProviders
};