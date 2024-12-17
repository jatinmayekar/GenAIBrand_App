import { create } from 'zustand'

interface SettingsStore {
  gesturesEnabled: boolean;
  themeColor: 'stone' | 'red';
  themeShade: '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';
  setGesturesEnabled: (enabled: boolean) => void;
  setThemeColor: (color: 'stone' | 'red') => void;
  setThemeShade: (shade: '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950') => void;
}

export const useSettings = create<SettingsStore>((set) => ({
  gesturesEnabled: true,
  themeColor: 'stone',
  themeShade: '500',
  setGesturesEnabled: (enabled) => set({ gesturesEnabled: enabled }),
  setThemeColor: (color) => set({ themeColor: color }),
  setThemeShade: (shade) => set({ themeShade: shade }),
}));