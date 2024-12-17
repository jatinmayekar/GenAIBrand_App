import { create } from 'zustand'

type ThemeColor = 'zinc' | 'red' | 'rose' | 'orange' | 'green' | 'blue' | 'yellow' | 'violet';
type ThemeMode = 'light' | 'dark';

interface SettingsStore {
  gesturesEnabled: boolean;
  themeColor: ThemeColor;
  themeMode: ThemeMode;
  setGesturesEnabled: (enabled: boolean) => void;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useSettings = create<SettingsStore>((set) => ({
  gesturesEnabled: true,
  themeColor: 'zinc',
  themeMode: 'light',
  setGesturesEnabled: (enabled) => set({ gesturesEnabled: enabled }),
  setThemeColor: (color) => set({ themeColor: color }),
  setThemeMode: (mode) => set({ themeMode: mode }),
}));