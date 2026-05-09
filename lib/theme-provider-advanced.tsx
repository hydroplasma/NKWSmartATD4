import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSchoolConfig } from '@/lib/school-config';
import { THEME_PALETTES, type ThemeColorName } from '@/lib/theme-palettes';

interface ThemeContextType {
  themeName: ThemeColorName;
  setThemeName: (name: ThemeColorName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function AdvancedThemeProvider({ children }: { children: React.ReactNode }) {
  const { config } = useSchoolConfig();
  const [themeName, setThemeName] = useState<ThemeColorName>(config.themeColor);

  useEffect(() => {
    setThemeName(config.themeColor);
    applyTheme(config.themeColor);
  }, [config.themeColor]);

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAdvancedTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAdvancedTheme must be used within AdvancedThemeProvider');
  }
  return context;
}

function applyTheme(themeName: ThemeColorName) {
  const palette = THEME_PALETTES[themeName];
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--color-primary', palette.primary);
    document.documentElement.style.setProperty('--color-surface', palette.surface);
    document.documentElement.style.setProperty('--color-header', palette.header);
    document.documentElement.style.setProperty('--color-header-text', palette.headerText);
    document.documentElement.style.setProperty('--color-tint', palette.tint);
  }
}
