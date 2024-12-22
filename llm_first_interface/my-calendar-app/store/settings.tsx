import { create } from 'zustand'

type ThemeColor = 'zinc' | 'red' | 'rose' | 'orange' | 'green' | 'blue' | 'yellow' | 'violet';
type ThemeMode = 'light' | 'dark';

interface SettingsStore {
  gesturesEnabled: boolean;
  themeColor: ThemeColor;
  themeMode: ThemeMode;
  calendarScale: number;
  backgroundImage: string | null;
  backgroundOpacity: number;

  setGesturesEnabled: (enabled: boolean) => void;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setCalendarScale: (scale: number) => void;
  setBackgroundImage: (image: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;
}

export const useSettings = create<SettingsStore>((set) => ({
  gesturesEnabled: true,
  themeColor: 'zinc',
  themeMode: 'light',
  calendarScale: 1,
  backgroundImage: null,
  backgroundOpacity: 0.5,

  setGesturesEnabled: (enabled) => set({ gesturesEnabled: enabled }),
  setThemeColor: (color) => set({ themeColor: color }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  setCalendarScale: (scale) => set({ calendarScale: scale }),
  setBackgroundImage: (image) => set({ backgroundImage: image }),
  setBackgroundOpacity: (opacity) => set({ backgroundOpacity: opacity }),
}));