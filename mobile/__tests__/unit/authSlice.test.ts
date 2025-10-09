import { authSlice, loginStart, loginSuccess, loginFailure, logout, clearError } from '../../src/store/slices/authSlice';

describe('AuthSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  };

  test('deve inicializar com estado correto', () => {
    const state = authSlice.reducer(undefined, { type: 'unknown' });
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('deve definir loading como true quando login inicia', () => {
    const action = loginStart();
    const state = authSlice.reducer(initialState, action);
    
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  test('deve fazer login com sucesso', () => {
    const userData = {
      user: { 
        id: '1', 
        email: 'dr.teste@mediapp.com', 
        name: 'Dr. Teste',
        specialty: 'Cardiologia',
        crm: 'CRM123456'
      },
      token: 'jwt_token_123'
    };
    
    const action = loginSuccess(userData);
    const state = authSlice.reducer(initialState, action);
    
    expect(state.user).toEqual(userData.user);
    expect(state.token).toBe(userData.token);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('deve lidar com erro de login', () => {
    const errorMessage = 'Credenciais inválidas';
    const action = loginFailure(errorMessage);
    
    const state = authSlice.reducer(initialState, action);
    
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  test('deve fazer logout corretamente', () => {
    const authenticatedState = {
      user: { 
        id: '1', 
        email: 'test@test.com', 
        name: 'Test User',
        specialty: 'Test',
        crm: 'TEST123'
      },
      token: 'jwt_token',
      isAuthenticated: true,
      isLoading: false,
      error: null
    };
    
    const action = logout();
    const state = authSlice.reducer(authenticatedState, action);
    
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('deve limpar erro quando necessário', () => {
    const stateWithError = {
      ...initialState,
      error: 'Algum erro'
    };
    
    const action = clearError();
    const state = authSlice.reducer(stateWithError, action);
    
    expect(state.error).toBeNull();
  });
});