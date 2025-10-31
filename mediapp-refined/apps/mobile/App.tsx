import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Provider as PaperProvider, Button, Card, Appbar } from 'react-native-paper';
import { Provider as ReduxProvider, useSelector, useDispatch } from 'react-redux';
import { store } from './src/store/store';
import { theme } from './src/theme/theme';
import { loginAsync } from './src/store/slices/authSlice';

// Componente principal da tela inicial
const HomeScreen = () => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const auth = useSelector((state: any) => state.auth);

  useEffect(() => {
    // Animação de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Demo de login com credenciais de teste
      await dispatch(loginAsync({ 
        email: 'medico@teste.com', 
        password: '123456' 
      }) as any);
      
      Alert.alert('Sucesso', 'Login realizado com sucesso!', [
        { text: 'OK', onPress: () => console.log('Login confirmado') }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Falha no login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: '👨‍⚕️', title: 'Gestão de Pacientes', description: 'Cadastro e controle completo' },
    { icon: '📋', title: 'Prontuários Digitais', description: 'Histórico médico detalhado' },
    { icon: '🔬', title: 'Exames e Arquivos', description: 'Armazenamento seguro' },
    { icon: '⚠️', title: 'Alergias e Contraindicações', description: 'Alertas importantes' },
    { icon: '👥', title: 'Acesso Colaborativo', description: 'Equipe médica conectada' },
    { icon: '🔒', title: 'Segurança LGPD', description: 'Proteção de dados' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1976D2" barStyle="light-content" />
      
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="MediApp" subtitle="Sistema Médico" />
        <Appbar.Action 
          icon="account-circle" 
          onPress={() => Alert.alert('Perfil', 'Funcionalidade em desenvolvimento')} 
        />
      </Appbar.Header>

      <ScrollView 
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🏥</Text>
            <Text style={styles.appName}>MediApp</Text>
          </View>
          <Text style={styles.subtitle}>
            Sistema de Prontuários Médicos
          </Text>
          {auth.isAuthenticated && (
            <Text style={styles.welcomeText}>
              Bem-vindo, {auth.user?.name || 'Médico'}!
            </Text>
          )}
        </Animated.View>

        <View style={styles.content}>
          <Card style={styles.welcomeCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>🚀 Bem-vindo ao MediApp!</Text>
              <Text style={styles.cardDescription}>
                Aplicativo completo para gestão de prontuários médicos, 
                desenvolvido para profissionais de saúde.
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.featuresCard}>
            <Card.Content>
              <Text style={styles.featuresTitle}>Funcionalidades Principais:</Text>
              
              {features.map((feature, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.feature}
                  onPress={() => Alert.alert(feature.title, feature.description)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureText}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>

          <View style={styles.actionContainer}>
            {!auth.isAuthenticated ? (
              <Button 
                mode="contained" 
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
              >
                {isLoading ? 'Entrando...' : 'Fazer Login'}
              </Button>
            ) : (
              <View style={styles.authenticatedActions}>
                <Button 
                  mode="contained" 
                  onPress={() => Alert.alert('Dashboard', 'Abrindo painel principal...')}
                  style={styles.primaryButton}
                  contentStyle={styles.buttonContent}
                >
                  Acessar Dashboard
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => Alert.alert('Pacientes', 'Lista de pacientes em desenvolvimento')}
                  style={styles.secondaryButton}
                  contentStyle={styles.buttonContent}
                >
                  Ver Pacientes
                </Button>
              </View>
            )}
          </View>

          <Card style={styles.statsCard}>
            <Card.Content>
              <Text style={styles.statsTitle}>Estatísticas do Sistema</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>13</Text>
                  <Text style={styles.statLabel}>Médicos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>5</Text>
                  <Text style={styles.statLabel}>Pacientes</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>3</Text>
                  <Text style={styles.statLabel}>Exames</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Desenvolvido com ❤️ para profissionais de saúde
            </Text>
            <Text style={styles.versionText}>v1.1.0 - Build melhorado</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const App = () => {
  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={theme}>
        <HomeScreen />
      </PaperProvider>
    </ReduxProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  appbar: {
    backgroundColor: '#1976D2',
    elevation: 4,
  },
  header: {
    backgroundColor: '#1976D2',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 40,
    marginRight: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  featuresCard: {
    marginBottom: 16,
    elevation: 2,
  },
  featuresContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionContainer: {
    marginBottom: 16,
  },
  authenticatedActions: {
    gap: 12,
  },
  primaryButton: {
    marginBottom: 8,
    borderRadius: 8,
  },
  secondaryButton: {
    borderRadius: 8,
    borderColor: '#1976D2',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 5,
  },
  versionText: {
    fontSize: 12,
    color: '#bbb',
  },
});

export default App;