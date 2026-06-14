import { AppTheme, palette, spacing, typography } from './tokens';

export const darkTheme: AppTheme = {
  dark: true,
  spacing,
  typography,
  colors: {
    background: palette.slate950,
    surface: palette.slate900,
    surfaceSecondary: palette.slate800,
    text: palette.slate50,
    textSecondary: palette.slate400,
    border: palette.slate700,
    primary: palette.indigo500,
    primaryText: palette.white,
    error: palette.red500,
    tabBar: palette.slate900,
    tabBarBorder: palette.slate800,
    tabBarActive: palette.indigo400,
    tabBarInactive: palette.slate500,
  },
};
