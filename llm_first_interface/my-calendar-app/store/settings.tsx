import { create } from 'zustand'

type ThemeColor = 'zinc' | 'red' | 'rose' | 'orange' | 'green' | 'blue' | 'yellow' | 'violet';
type ThemeMode = 'light' | 'dark';

interface SettingsStore {
  themeColor: ThemeColor;
  themeMode: ThemeMode;
  backgroundImage: string | null;
  backgroundOpacity: number;
  textColor: string;

  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setBackgroundImage: (image: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setTextColor: (color: string) => void;
}

export const useSettings = create<SettingsStore>((set) => ({
  themeColor: 'zinc',
  themeMode: 'light',
  backgroundImage: null,
  backgroundOpacity: 0.5,
  textColor: 'black',

  setThemeColor: (color) => set({ themeColor: color }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  setBackgroundImage: (image) => set({ backgroundImage: image }),
  setBackgroundOpacity: (opacity) => set({ backgroundOpacity: opacity }),
  setTextColor: (color) => set({ textColor: color})
}));