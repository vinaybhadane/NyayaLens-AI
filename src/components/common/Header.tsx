import React from 'react';
import { usePreferences } from '../../context/PreferencesContext.tsx';
import { useSession } from '../../context/SessionContext.tsx';
import { LanguageCode, ReadingLevel } from '../../lib/schemas/common.ts';
import { ShieldCheck, Moon, Sun, Contrast, Trash2, Scale } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    language,
    setLanguage,
    readingLevel,
    setReadingLevel,
    highContrast,
    setHighContrast,
    theme,
    toggleTheme,
  } = usePreferences();

  const { currentDocument, clearSession } = useSession();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Skip to Content Link for Keyboard Users (WCAG 2.2 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:p-3 focus:bg-amber-400 focus:text-slate-950 focus:font-bold focus:rounded focus:outline-none focus:ring-4 focus:ring-amber-500"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm flex items-center justify-center">
            <Scale className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">NyayaLens AI</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                Information Engine
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Understand it. Compare it. Question it. Prepare for your lawyer.
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs">
          {/* Ephemeral Privacy Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 text-emerald-400"
            title="Documents are held in browser memory for this session and discarded by default."
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline font-medium">Ephemeral Session</span>
          </div>

          {/* Reading Level Selector */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded border border-slate-700">
            <label htmlFor="reading-level-select" className="sr-only">
              Reading Level
            </label>
            <span className="text-slate-400 px-1 font-medium hidden md:inline">Level:</span>
            {(['simple', 'standard', 'detailed'] as ReadingLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setReadingLevel(lvl)}
                className={`px-2 py-1 rounded capitalize font-medium transition-colors ${
                  readingLevel === lvl
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                aria-pressed={readingLevel === lvl}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded border border-slate-700">
            {(
              [
                { code: 'en', label: 'EN' },
                { code: 'hi', label: 'हिन्दी' },
                { code: 'mr', label: 'मराठी' },
              ] as { code: LanguageCode; label: string }[]
            ).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  language === lang.code
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                aria-pressed={language === lang.code}
                lang={lang.code}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={() => setHighContrast(!highContrast)}
            className={`p-1.5 rounded border transition-colors ${
              highContrast
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
            }`}
            title="Toggle High Contrast Mode (WCAG 2.2 AA)"
            aria-label="Toggle High Contrast Mode"
            aria-pressed={highContrast}
          >
            <Contrast className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Dark/Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700 transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Sun className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          {/* Clear Session Data */}
          {currentDocument && (
            <button
              type="button"
              onClick={clearSession}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-900/60 text-rose-200 border border-rose-700 hover:bg-rose-800 transition-colors font-medium"
              title="Purge current document from memory"
              aria-label="Purge current document from browser memory"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden lg:inline">Clear</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
