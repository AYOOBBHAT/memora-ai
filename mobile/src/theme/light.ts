import { AppTheme, palette, spacing, typography } from './tokens';

export const lightTheme: AppTheme = {
  dark: false,
  spacing,
  typography,
  colors: {
    background: palette.slate50,
    surface: palette.white,
    surfaceSecondary: palette.slate100,
    text: palette.slate900,
    textSecondary: palette.slate500,
    border: palette.slate200,
    primary: palette.indigo600,
    primaryText: palette.white,
    error: palette.red500,
    tabBar: palette.white,
    tabBarBorder: palette.slate200,
    tabBarActive: palette.indigo600,
    tabBarInactive: palette.slate400,
  },
};
