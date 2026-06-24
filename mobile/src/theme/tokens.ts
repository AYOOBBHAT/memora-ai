/** Memora editorial palette — premium green & butter cream. */
export const brand = {
  green: '#013E37',
  greenSurface: '#024940',
  greenMuted: '#035049',
  greenCard: '#045A52',
  greenBorder: 'rgba(255, 239, 179, 0.14)',
  butter: '#FFEFB3',
  butterMuted: 'rgba(255, 239, 179, 0.62)',
  butterSubtle: 'rgba(255, 239, 179, 0.10)',
  butterSoft: 'rgba(255, 239, 179, 0.18)',
  error: '#E8847A',
  errorMuted: 'rgba(232, 132, 122, 0.85)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
  full: 999,
} as const;

/** Minimal elevation — editorial, no glow. */
export const elevation = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  fab: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 34,
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
  border: string;
  primary: string;
  primaryText: string;
  error: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  /** User chat bubble background */
  userBubble: string;
  /** User chat bubble text */
  userBubbleText: string;
  /** AI chat surface */
  aiSurface: string;
  /** Icon tint on cards */
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
