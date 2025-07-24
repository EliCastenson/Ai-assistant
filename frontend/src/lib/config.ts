export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: 10000,
  },

  // App Configuration
  app: {
    name: 'AI Assistant',
    version: '1.0.0',
    environment: import.meta.env.MODE,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },

  // Feature Flags
  features: {
    voiceInput: true,
    pushNotifications: true,
    aiSuggestions: true,
    fileSearch: true,
    webSearch: true,
  },

  // UI Configuration
  ui: {
    theme: {
      primary: '#2563eb',
      secondary: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    animations: {
      enabled: true,
      duration: 300,
    },
  },

  // AI Configuration
  ai: {
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.7,
  },

  // Storage Keys
  storage: {
    authToken: 'auth_token',
    userPreferences: 'user_preferences',
    pushSubscription: 'push_subscription',
  },
} as const

export type Config = typeof config 