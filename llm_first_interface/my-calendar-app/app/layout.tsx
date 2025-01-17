'use client';

import "./globals.css";
import { useSettings } from '@/store/settings';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { themeMode, themeColor } = useSettings();
  
  return (
    <html lang="en" className={`${themeMode}`} data-theme={themeColor}>
      <body className="min-h-screen bg-background">{children}</body>
    </html>
  );
}
