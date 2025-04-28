'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import * as React from 'react';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <React.StrictMode>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </React.StrictMode>
  );
}
