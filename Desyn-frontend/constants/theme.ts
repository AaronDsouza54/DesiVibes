// Design tokens for Desyn — South Asian social platform
// Color palette inspired by saffron, indigo, and rose tones on dark backgrounds.

export const Colors = {
  // Brand
  saffron: '#F59E0B',
  saffronLight: '#FCD34D',
  saffronDark: '#B45309',

  indigo: '#6366F1',
  indigoLight: '#818CF8',
  indigoDark: '#4338CA',

  rose: '#F43F5E',
  roseLight: '#FB7185',
  roseDark: '#BE123C',

  // Backgrounds
  bgPrimary: '#0A0A0F',
  bgSecondary: '#12121A',
  bgCard: '#1A1A26',
  bgElevated: '#22223A',

  // Text
  textPrimary: '#F8F8FF',
  textSecondary: '#A0A0C0',
  textMuted: '#60607A',
  textInverse: '#0A0A0F',

  // Borders
  border: '#2A2A40',
  borderLight: '#3A3A55',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Specific UI
  tabBar: '#10101A',
  tabBarBorder: '#1E1E30',

  // Gradients (use as array in LinearGradient)
  gradientSaffron: ['#F59E0B', '#F43F5E'] as [string, string],
  gradientIndigo: ['#6366F1', '#8B5CF6'] as [string, string],
  gradientCard: ['#1A1A26', '#12121A'] as [string, string],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.5 },
  caption: { fontSize: 11, fontWeight: '400' as const },
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
};
