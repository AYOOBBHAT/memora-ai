import { AppTheme, brand, radii, spacing, typography, elevation } from './tokens';

/** Canonical Memora experience — matches design specification */
export const darkTheme: AppTheme = {
  dark: true,
  spacing,
  radii,
  elevation,
  typography,
  colors: {
    background: brand.background,
    surface: brand.surface,
    surfaceSecondary: brand.surfaceElevated,
    surfaceElevated: brand.surfaceElevated,
    text: brand.textPrimary,
    textSecondary: brand.textSecondary,
    textMuted: brand.textMuted,
    border: brand.border,
    primary: brand.primary,
    primaryText: brand.background,
    success: brand.success,
    error: brand.error,
    tabBar: brand.background,
    tabBarBorder: brand.border,
    tabBarActive: brand.primary,
    tabBarInactive: brand.textMuted,
    userBubble: brand.primary,
    userBubbleText: brand.background,
    aiSurface: brand.surface,
    icon: brand.primary,
  },
};
