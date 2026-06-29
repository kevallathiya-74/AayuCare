export const COLORS = {
  primary: '#14B8A6',
  secondary: '#0EA5E9',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const FONTS = {
  regular: 'System', // You can replace this with a custom font if configured
  medium: 'System-Medium',
  bold: 'System-Bold',
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
};
