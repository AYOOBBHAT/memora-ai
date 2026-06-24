import { AppTheme, brand, radii, spacing, typography, elevation } from './tokens';

/** Inverted editorial — cream workspace with green typography. */
export const lightTheme: AppTheme = {
  dark: false,
  spacing,
  radii,
  elevation,
  typography,
  colors: {
    background: brand.butter,
    surface: '#F7E8A8',
    surfaceSecondary: '#F0DE98',
    surfaceElevated: '#FFFFFF',
    text: brand.green,
    textSecondary: 'rgba(1, 62, 55, 0.62)',
    border: 'rgba(1, 62, 55, 0.12)',
    primary: brand.green,
    primaryText: brand.butter,
    error: '#C45C52',
    tabBar: brand.butter,
    tabBarBorder: 'rgba(1, 62, 55, 0.12)',
    tabBarActive: brand.green,
    tabBarInactive: 'rgba(1, 62, 55, 0.45)',
    userBubble: brand.green,
    userBubbleText: brand.butter,
    aiSurface: '#FFFFFF',
    icon: brand.green,
  },
};
