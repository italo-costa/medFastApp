// Jest setup file - simplified
// Mock react-native modules
jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'android',
      select: jest.fn((options) => options.android),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
    },
    Alert: {
      alert: jest.fn(),
    },
    PermissionsAndroid: {
      PERMISSIONS: {
        CAMERA: 'android.permission.CAMERA',
        READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
        WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
      },
      request: jest.fn(() => Promise.resolve('granted')),
      check: jest.fn(() => Promise.resolve(true)),
    },
  };
});

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};