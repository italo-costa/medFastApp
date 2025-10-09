import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    primaryContainer: '#E3F2FD',
    secondary: '#4CAF50',
    secondaryContainer: '#E8F5E8',
    error: '#F44336',
    errorContainer: '#FFEBEE',
    warning: '#FF9800',
    success: '#4CAF50',
    surface: '#FFFFFF',
    background: '#F5F5F5',
    onSurface: '#333333',
    onBackground: '#333333',
    outline: '#E0E0E0',
  },
  fonts: {
    ...MD3LightTheme.fonts,
    bodyLarge: {
      ...MD3LightTheme.fonts.bodyLarge,
      fontSize: 16,
    },
    bodyMedium: {
      ...MD3LightTheme.fonts.bodyMedium,
      fontSize: 14,
    },
    titleLarge: {
      ...MD3LightTheme.fonts.titleLarge,
      fontSize: 22,
      fontWeight: 'bold' as const,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};