import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const colors = {
  light: {
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#3B82F6',
    primarySoft: '#EFF6FF',
    secondary: '#0F172A',
    accent: '#06B6D4',
    accentSoft: '#ECFEFF',

    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceHover: '#F1F5F9',

    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',

    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: '#E2E8F0',

    success: '#10B981',
    successSoft: '#ECFDF5',
    successDark: '#059669',
    warning: '#F59E0B',
    warningSoft: '#FFFBEB',
    warningDark: '#D97706',
    danger: '#EF4444',
    dangerSoft: '#FEF2F2',
    dangerDark: '#DC2626',
    info: '#3B82F6',
    infoSoft: '#EFF6FF',

    inputBackground: '#F8FAFC',
    inputBorder: '#CBD5E1',
    inputFocusBorder: '#2563EB',

    shadow: 'rgba(15, 23, 42, 0.08)',
    overlay: 'rgba(15, 23, 42, 0.5)',
    shimmer: '#E2E8F0',

    tabBar: '#FFFFFF',
    tabBarActive: '#2563EB',
    tabBarInactive: '#94A3B8',

    headerGradientStart: '#1E40AF',
    headerGradientEnd: '#2563EB',

    cardGradientStart: '#2563EB',
    cardGradientEnd: '#7C3AED',

    statusApproved: '#10B981',
    statusPending: '#F59E0B',
    statusRejected: '#EF4444',
  },
  dark: {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    primarySoft: '#1E293B',
    secondary: '#F8FAFC',
    accent: '#22D3EE',
    accentSoft: '#164E63',

    background: '#0F172A',
    surface: '#1E293B',
    surfaceHover: '#334155',

    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textInverse: '#FFFFFF',

    border: '#334155',
    borderLight: '#1E293B',
    divider: '#334155',

    success: '#34D399',
    successSoft: '#064E3B',
    successDark: '#10B981',
    warning: '#FBBF24',
    warningSoft: '#78350F',
    warningDark: '#F59E0B',
    danger: '#F87171',
    dangerSoft: '#7F1D1D',
    dangerDark: '#EF4444',
    info: '#60A5FA',
    infoSoft: '#1E3A5F',

    inputBackground: '#1E293B',
    inputBorder: '#475569',
    inputFocusBorder: '#3B82F6',

    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shimmer: '#334155',

    tabBar: '#1E293B',
    tabBarActive: '#3B82F6',
    tabBarInactive: '#64748B',

    headerGradientStart: '#1E3A5F',
    headerGradientEnd: '#1E40AF',

    cardGradientStart: '#1E40AF',
    cardGradientEnd: '#5B21B6',

    statusApproved: '#34D399',
    statusPending: '#FBBF24',
    statusRejected: '#F87171',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export type ThemeColors = typeof colors.light;
export type ColorScheme = 'light' | 'dark';

// Internal colors object - DO NOT export or use directly in components
// Always use useTheme() hook to get the current theme colors
const _internalColors = colors;

export const getColors = (scheme: ColorScheme = 'light'): ThemeColors => _internalColors[scheme];
export const isSmallScreen = SCREEN_WIDTH < 375;

// Export colors for ThemeContext use only - DO NOT import this in components
export { colors as __themeColors__ };
