# 📱 MediApp - Guia de Instalação e Configuração

## 🛠️ Pré-requisitos

### Para o Backend:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/))
- **Git** ([Download](https://git-scm.com/))

### Para o Mobile:
- **Android Studio** (para Android) ([Download](https://developer.android.com/studio))
- **Xcode** (para iOS - apenas macOS) ([Download](https://developer.apple.com/xcode/))
- **React Native CLI**: `npm install -g react-native-cli`
- **Java Development Kit (JDK)** 11

## 🚀 Instalação Completa

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd aplicativo
```

### 2. Configuração do Backend

#### 2.1. Instalar Dependências
```bash
cd backend
npm install
```

#### 2.2. Configurar Banco de Dados
```bash
# Criar banco PostgreSQL
createdb mediapp

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas configurações
# DATABASE_URL="postgresql://usuario:senha@localhost:5432/mediapp"
```

#### 2.3. Executar Migrações
```bash
npm run db:migrate
npm run db:generate
npm run db:seed  # (opcional) dados de exemplo
```

#### 2.4. Iniciar Servidor
```bash
npm run dev
```
✅ Backend rodando em: http://localhost:3001

### 3. Configuração do Mobile

#### 3.1. Instalar Dependências
```bash
cd ../mobile
npm install
```

#### 3.2. Configuração Android
```bash
# Verificar configuração
npx react-native doctor

# Instalar dependências nativas
cd android
./gradlew clean
cd ..
```

#### 3.3. Configuração iOS (apenas macOS)
```bash
cd ios
pod install
cd ..
```

#### 3.4. Executar no Dispositivo

**Android:**
```bash
# Conectar dispositivo ou iniciar emulador
npm run android
```

**iOS:**
```bash
# Iniciar simulador
npm run ios
```

## 🔧 Configurações Avançadas

### Configuração do AWS S3 (Opcional)
Para armazenamento de arquivos na nuvem:

```bash
# No arquivo backend/.env
AWS_ACCESS_KEY_ID="sua-access-key"
AWS_SECRET_ACCESS_KEY="sua-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="mediapp-arquivos"
```

### Configuração de Email (Opcional)
Para notificações por email:

```bash
# No arquivo backend/.env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
```

## 🧪 Executar Testes

### Backend
```bash
cd backend
npm test
npm run test:watch  # modo watch
```

### Mobile
```bash
cd mobile
npm test
```

## 📦 Build para Produção

### Backend
```bash
cd backend
npm start
```

### Mobile Android
```bash
cd mobile
npm run build:android
# APK gerado em: android/app/build/outputs/apk/release/
```

### Mobile iOS
```bash
cd mobile
npm run build:ios
# Arquivo .ipa para App Store
```

## 🐛 Solução de Problemas

### Erro: "Metro server failed to start"
```bash
cd mobile
npx react-native start --reset-cache
```

### Erro: "Database connection failed"
```bash
# Verificar se PostgreSQL está rodando
sudo service postgresql start  # Linux
brew services start postgresql  # macOS
```

### Erro: "Android build failed"
```bash
cd mobile/android
./gradlew clean
cd ..
npx react-native run-android
```

### Erro: "iOS pods failed"
```bash
cd mobile/ios
pod deintegrate
pod install
cd ..
```

## 📋 Checklist de Verificação

### ✅ Backend
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL rodando
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Migrações executadas
- [ ] Servidor iniciando sem erros
- [ ] Health check respondendo: http://localhost:3001/health

### ✅ Mobile
- [ ] React Native CLI instalado
- [ ] Android Studio configurado (para Android)
- [ ] Xcode instalado (para iOS - macOS)
- [ ] Dependências instaladas (`npm install`)
- [ ] Dispositivo/emulador conectado
- [ ] App compilando e instalando

## 🆘 Suporte

### Logs Importantes
```bash
# Backend logs
tail -f backend/logs/combined.log

# Metro bundler logs
cd mobile && npx react-native log-android  # Android
cd mobile && npx react-native log-ios      # iOS
```

### Comandos Úteis
```bash
# Limpar cache completo
cd mobile && npx react-native start --reset-cache
rm -rf node_modules && npm install

# Resetar banco de dados
cd backend && npm run db:reset

# Verificar saúde do sistema
curl http://localhost:3001/health
```

## 🌟 Próximos Passos

Após a instalação bem-sucedida:

1. 📚 Leia a [Documentação da API](./API.md)
2. 🎨 Explore as [Telas do App](./SCREENS.md)  
3. 🔒 Configure [Segurança e Compliance](./SECURITY.md)
4. 🚀 Prepare para [Deploy em Produção](./DEPLOY.md)

---

💡 **Dica**: Mantenha sempre as dependências atualizadas e faça backups regulares do banco de dados em produção!