import { AppTheme, brand, radii, spacing, typography, elevation } from './tokens';

/**
 * Light preference still uses the green editorial system per spec.
 * Surfaces lighten slightly; text remains on-brand.
 */
export const lightTheme: AppTheme = {
  dark: false,
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
