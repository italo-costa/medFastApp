import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store/store';
import { theme } from './src/theme/theme';

const App = () => {
  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container}>
          <StatusBar backgroundColor="#2196F3" barStyle="light-content" />
          <ScrollView contentInsetAdjustmentBehavior="automatic">
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>🏥</Text>
                <Text style={styles.appName}>MediApp</Text>
              </View>
              <Text style={styles.subtitle}>
                Sistema de Prontuários Médicos
              </Text>
            </View>

            <View style={styles.content}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🚀 Bem-vindo ao MediApp!</Text>
                <Text style={styles.cardDescription}>
                  Aplicativo completo para gestão de prontuários médicos, 
                  desenvolvido para profissionais de saúde.
                </Text>
              </View>

              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Funcionalidades Principais:</Text>
                
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>👨‍⚕️</Text>
                  <Text style={styles.featureText}>Gestão de Pacientes</Text>
                </View>

                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>📋</Text>
                  <Text style={styles.featureText}>Prontuários Digitais</Text>
                </View>

                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>🔬</Text>
                  <Text style={styles.featureText}>Exames e Arquivos</Text>
                </View>

                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>⚠️</Text>
                  <Text style={styles.featureText}>Alergias e Contraindicações</Text>
                </View>

                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>👥</Text>
                  <Text style={styles.featureText}>Acesso Colaborativo</Text>
                </View>

                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>🔒</Text>
                  <Text style={styles.featureText}>Segurança LGPD</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Começar</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Desenvolvido com ❤️ para profissionais de saúde
                </Text>
                <Text style={styles.versionText}>v1.0.0</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </PaperProvider>
    </ReduxProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingVertical: 40,
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
  content: {
    padding: 20,
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
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#555',
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