/**
 * 다크모드 지원 Context
 * light / dark / system
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aict_theme') as ThemeMode;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved;
      }
    }
    return 'system';
  });

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 시스템 다크모드 변경 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 테마 저장
  useEffect(() => {
    localStorage.setItem('aict_theme', theme);
  }, [theme]);

  // 실제 다크 모드 여부
  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  // HTML 클래스 업데이트
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [isDark]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 다크모드 CSS 변수
export const darkModeStyles = `
  :root {
    --color-bg-primary: #FFFFFF;
    --color-bg-secondary: #F8F9FA;
    --color-bg-tertiary: #F1F5F9;
    --color-text-primary: #1E293B;
    --color-text-secondary: #64748B;
    --color-text-muted: #94A3B8;
    --color-border: #E2E8F0;
    --color-accent: #10B981;
    --color-accent-light: rgba(16, 185, 129, 0.1);
  }

  :root.dark {
    --color-bg-primary: #0F172A;
    --color-bg-secondary: #1E293B;
    --color-bg-tertiary: #334155;
    --color-text-primary: #F1F5F9;
    --color-text-secondary: #94A3B8;
    --color-text-muted: #64748B;
    --color-border: #334155;
    --color-accent: #34D399;
    --color-accent-light: rgba(52, 211, 153, 0.1);
  }
`;
