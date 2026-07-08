import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'equity-module-theme';

/** Set to true when dark mode toggle should be available again. */
export const THEME_TOGGLE_ENABLED = false;

export const ThemeContext = createContext(null);

function readStoredTheme() {
  if (!THEME_TOGGLE_ENABLED) {
    return 'light';
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyThemeToDocument(theme) {
  const resolved = THEME_TOGGLE_ENABLED ? theme : 'light';
  document.documentElement.setAttribute('data-theme', resolved);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    const resolved = THEME_TOGGLE_ENABLED ? theme : 'light';
    if (!THEME_TOGGLE_ENABLED && theme !== 'light') {
      setThemeState('light');
    }
    applyThemeToDocument(resolved);
    try {
      localStorage.setItem(STORAGE_KEY, resolved);
    } catch {
      /* ignore storage errors */
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!THEME_TOGGLE_ENABLED) return;
    setThemeState(next === 'dark' ? 'dark' : 'light');
  }, []);

  const toggleTheme = useCallback(() => {
    if (!THEME_TOGGLE_ENABLED) return;
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme: THEME_TOGGLE_ENABLED ? theme : 'light',
      isDark: THEME_TOGGLE_ENABLED && theme === 'dark',
      themeToggleEnabled: THEME_TOGGLE_ENABLED,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

/** Call once before React mount to avoid a light flash on reload. */
export function initThemeFromStorage() {
  applyThemeToDocument(readStoredTheme());
}
