import { AppTheme, brand, radii, spacing, typography, elevation } from './tokens';

/** Primary Memora experience — deep green editorial. */
export const darkTheme: AppTheme = {
  dark: true,
  spacing,
  radii,
  elevation,
  typography,
  colors: {
    background: brand.green,
    surface: brand.greenSurface,
    surfaceSecondary: brand.greenMuted,
    surfaceElevated: brand.greenCard,
    text: brand.butter,
    textSecondary: brand.butterMuted,
    border: brand.greenBorder,
    primary: brand.butter,
    primaryText: brand.green,
    error: brand.error,
    tabBar: brand.green,
    tabBarBorder: brand.greenBorder,
    tabBarActive: brand.butter,
    tabBarInactive: brand.butterMuted,
    userBubble: brand.butter,
    userBubbleText: brand.green,
    aiSurface: brand.greenCard,
    icon: brand.butter,
  },
};
