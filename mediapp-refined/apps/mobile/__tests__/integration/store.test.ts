import { store } from '../../src/store/store';
import { loginStart, loginSuccess, logout } from '../../src/store/slices/authSlice';

describe('Store Integration Tests', () => {
  test('deve configurar store corretamente', () => {
    const state = store.getState();
    
    expect(state.auth).toBeDefined();
    expect(state.patients).toBeDefined();
    expect(state.records).toBeDefined();
  });

  test('deve gerenciar estado de autenticação através do store', () => {
    // Estado inicial
    let state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.user).toBeNull();

    // Iniciar login
    store.dispatch(loginStart());
    state = store.getState();
    expect(state.auth.isLoading).toBe(true);

    // Login bem-sucedido
    const userData = {
      user: {
        id: '1',
        name: 'Dr. Teste',
        email: 'dr.teste@mediapp.com',
        specialty: 'Cardiologia',
        crm: 'CRM123456'
      },
      token: 'jwt_token_123'
    };

    store.dispatch(loginSuccess(userData));
    state = store.getState();
    
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.user).toEqual(userData.user);
    expect(state.auth.token).toBe(userData.token);
    expect(state.auth.isLoading).toBe(false);

    // Logout
    store.dispatch(logout());
    state = store.getState();
    
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
  });

  test('deve manter estado consistente entre slices', () => {
    const state = store.getState();
    
    // Verificar que todos os slices estão presentes
    expect(typeof state.auth).toBe('object');
    expect(typeof state.patients).toBe('object');
    expect(typeof state.records).toBe('object');
    
    // Verificar estrutura básica
    expect(state.auth).toHaveProperty('isAuthenticated');
    expect(state.patients).toHaveProperty('patients');
    expect(state.records).toHaveProperty('records');
  });
});