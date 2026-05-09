export type ThemeColorName = 'orange' | 'blue' | 'green' | 'purple';

export interface ThemePalette {
  primary: string;
  surface: string;
  header: string;
  headerText: string;
  tint: string;
}

export const THEME_PALETTES: Record<ThemeColorName, ThemePalette> = {
  orange: {
    primary: '#F97316',
    surface: '#FFF7ED',
    header: '#F97316',
    headerText: '#FFFFFF',
    tint: '#F97316',
  },
  blue: {
    primary: '#0A7EA4',
    surface: '#E0F2FE',
    header: '#0A7EA4',
    headerText: '#FFFFFF',
    tint: '#0A7EA4',
  },
  green: {
    primary: '#16A34A',
    surface: '#DCFCE7',
    header: '#16A34A',
    headerText: '#FFFFFF',
    tint: '#16A34A',
  },
  purple: {
    primary: '#9333EA',
    surface: '#F3E8FF',
    header: '#9333EA',
    headerText: '#FFFFFF',
    tint: '#9333EA',
  },
};

export function getThemePalette(themeName: ThemeColorName): ThemePalette {
  return THEME_PALETTES[themeName] || THEME_PALETTES.orange;
}
