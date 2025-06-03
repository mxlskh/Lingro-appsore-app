// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LightColors, DarkColors, AppColors } from '../theme';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: AppColors;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: LightColors
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark(v => !v);
  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
