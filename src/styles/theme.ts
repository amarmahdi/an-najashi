// Color palette
export const COLORS = {
  primary: '#0c7cd5',  // Primary blue
  primaryDark: '#061a40',  // Dark blue
  primaryLight: '#4d9fff',  // Light blue
  secondary: '#4d76bd',  // Secondary blue
  accent: '#f5dd4b',  // Yellow accent
  success: '#4CAF50',  // Green for success states
  warning: '#FFC107',  // Yellow for warnings
  error: '#F44336',  // Red for errors
  textLight: '#ffffff',  // Light text
  textDark: '#333333',  // Dark text
  textMuted: '#a3c2f7',  // Muted text
  background: '#f5f5f5',  // Light background
  surface: '#ffffff',  // Surface color
  border: '#dddddd',  // Border color
};

// Font sizes
export const FONTS = {
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 24,
  xxlarge: 32,
  xxxlarge: 40,
};

// Spacing
export const SPACING = {
  xsmall: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
};

// Border radius
export const BORDER_RADIUS = {
  small: 4,
  medium: 8,
  large: 16,
  round: 999,
};

// Shadows
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Layout
export const LAYOUT = {
  window: {
    width: '100%',
    height: '100%',
  },
  fullScreen: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
};

// Default theme
export const theme = {
  colors: COLORS,
  fonts: FONTS,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  layout: LAYOUT,
}; 