import React, { createContext, useContext, useState } from 'react';
import { DocumentAnalysis, CompareResult, LawyerBrief } from '../lib/schemas/index.ts';

export type ActiveModule =
  | 'simplify'
  | 'radar'
  | 'compare'
  | 'qa'
  | 'options'
  | 'actions'
  | 'brief';

interface SessionContextType {
  currentDocument: DocumentAnalysis | null;
  setCurrentDocument: (doc: DocumentAnalysis | null) => void;
  compareResult: CompareResult | null;
  setCompareResult: (res: CompareResult | null) => void;
  lawyerBrief: LawyerBrief | null;
  setLawyerBrief: (brief: LawyerBrief | null) => void;
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
  piiMasked: boolean;
  setPiiMasked: (masked: boolean) => void;
  highlightedClauseId: string | null;
  setHighlightedClauseId: (id: string | null) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDocument, setCurrentDocument] = useState<DocumentAnalysis | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [lawyerBrief, setLawyerBrief] = useState<LawyerBrief | null>(null);
  const [activeModule, setActiveModule] = useState<ActiveModule>('simplify');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [piiMasked, setPiiMasked] = useState(false);
  const [highlightedClauseId, setHighlightedClauseId] = useState<string | null>(null);

  const clearSession = () => {
    setCurrentDocument(null);
    setCompareResult(null);
    setLawyerBrief(null);
    setHighlightedClauseId(null);
    setStatusMessage('Session reset. All documents purged from browser memory.');
  };

  return (
    <SessionContext.Provider
      value={{
        currentDocument,
        setCurrentDocument,
        compareResult,
        setCompareResult,
        lawyerBrief,
        setLawyerBrief,
        activeModule,
        setActiveModule,
        isLoading,
        setIsLoading,
        statusMessage,
        setStatusMessage,
        piiMasked,
        setPiiMasked,
        highlightedClauseId,
        setHighlightedClauseId,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
