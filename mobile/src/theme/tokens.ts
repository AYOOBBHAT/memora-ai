/**
 * Memora Design System — official tokens from the UI specification.
 * Do not introduce colors outside this palette.
 */
export const brand = {
  background: '#013E37',
  surface: '#0A4A43',
  surfaceElevated: '#0F524B',
  primary: '#FFEFB3',
  textPrimary: '#FFEFB3',
  textSecondary: '#E6DCB0',
  textMuted: '#B9C6BE',
  border: 'rgba(255, 239, 179, 0.10)',
  success: '#7DBE8B',
  error: '#E57373',
} as const;

/** Spacing scale: 4, 8, 12, 16, 20, 24, 32 */
export const spacing = {
  xs: 4,
  sm: 8,
  s12: 12,
  md: 16,
  s20: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
  /** Screen horizontal padding per spec */
  screenH: 20,
  /** Screen vertical section padding per spec */
  screenV: 24,
} as const;

/** Card radius 18–20px per spec */
export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
  full: 999,
} as const;

/** Minimal elevation — no glow */
export const elevation = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fab: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

/** Typography scale from specification */
export const typography = {
  h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  /** Legacy aliases — map to spec scale */
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Typography = typeof typography;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  success: string;
  error: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  userBubble: string;
  userBubbleText: string;
  aiSurface: string;
  icon: string;
}

export interface AppTheme {
  dark: boolean;
  colors: ThemeColors;
  spacing: Spacing;
  radii: Radii;
  elevation: typeof elevation;
  typography: Typography;
}
