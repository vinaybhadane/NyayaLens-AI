import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import { PreferencesProvider } from './context/PreferencesContext.tsx';
import { SessionProvider } from './context/SessionContext.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PreferencesProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
