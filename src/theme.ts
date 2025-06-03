// src/theme.ts
import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const BorderRadius = { sm: 4, md: 8, lg: 12 };
export const FontSizes = { sm: 14, md: 16, lg: 18, xl: 24 };

export const LightColors = {
  primary:    '#5B21B6',
  accent:     '#10B981',    // ← здесь
  background: '#F3F4F6',
  card:       '#FFFFFF',
  text:       '#111827',
  muted:      '#6B7280',    // ← и здесь
  border:     '#E5E7EB',
  notification:'#10B981'
};
export const DarkColors = {
  primary:    '#10B981',
  accent:     '#5B21B6',
  background: '#111827',
  card:       '#1E1E1E',
  text:       '#F3F4F6',
  muted:      '#9CA3AF',
  border:     '#27272A',
  notification:'#5B21B6'
};

export type AppColors = typeof LightColors;

export const LightNavTheme: Theme = {
  ...DefaultTheme,
  colors: { ...(DefaultTheme.colors as any), ...LightColors }
};
export const DarkNavTheme: Theme = {
  ...DarkTheme,
  colors: { ...(DarkTheme.colors as any), ...DarkColors }
};
