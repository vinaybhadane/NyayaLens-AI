import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, ReadingLevel } from '../lib/schemas/common.ts';

interface PreferencesContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  readingLevel: ReadingLevel;
  setReadingLevel: (level: ReadingLevel) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>('standard');
  const [highContrast, setHighContrast] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <PreferencesContext.Provider
      value={{
        language,
        setLanguage,
        readingLevel,
        setReadingLevel,
        highContrast,
        setHighContrast,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
