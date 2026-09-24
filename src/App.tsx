import React, { Suspense } from 'react';
import { Header } from './components/common/Header.tsx';
import { LegalDisclaimerBanner } from './components/common/LegalDisclaimerBanner.tsx';
import { LiveAnnouncer } from './components/common/LiveAnnouncer.tsx';
import { DocumentUploader } from './components/upload/DocumentUploader.tsx';
import { ClauseViewer } from './components/simplify/ClauseViewer.tsx';
import { useSession, ActiveModule } from './context/SessionContext.tsx';
import {
  FileText,
  Radar,
  GitCompare,
  HelpCircle,
  Lightbulb,
  CheckSquare,
  Briefcase,
} from 'lucide-react';

// Lazy-loaded secondary views for code-splitting and sub-second initial load performance
const ClauseRadar = React.lazy(() =>
  import('./components/radar/ClauseRadar.tsx').then((m) => ({ default: m.ClauseRadar }))
);
const DiffView = React.lazy(() =>
  import('./components/compare/DiffView.tsx').then((m) => ({ default: m.DiffView }))
);
const QuestionBox = React.lazy(() =>
  import('./components/qa/QuestionBox.tsx').then((m) => ({ default: m.QuestionBox }))
);
const OptionsView = React.lazy(() =>
  import('./components/options/OptionsView.tsx').then((m) => ({ default: m.OptionsView }))
);
const ActionKit = React.lazy(() =>
  import('./components/actions/ActionKit.tsx').then((m) => ({ default: m.ActionKit }))
);
const LawyerPrepBriefView = React.lazy(() =>
  import('./components/brief/LawyerPrepBriefView.tsx').then((m) => ({ default: m.LawyerPrepBriefView }))
);

const ModuleFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-3"
  >
    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading module...</span>
  </div>
);

export const App: React.FC = () => {
  const {
    currentDocument,
    activeModule,
    setActiveModule,
    statusMessage,
    highlightedClauseId,
    setHighlightedClauseId,
  } = useSession();

  const navItems: { id: ActiveModule; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'simplify', label: 'Simplify', icon: FileText },
    { id: 'radar', label: 'Clause Radar', icon: Radar },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'qa', label: 'Grounded Q&A', icon: HelpCircle },
    { id: 'options', label: 'Options & Steps', icon: Lightbulb },
    { id: 'actions', label: 'Action Kit', icon: CheckSquare },
    { id: 'brief', label: 'Lawyer Brief', icon: Briefcase },
  ];

  const handleScrollToClause = (clauseId: string) => {
    setActiveModule('simplify');
    setHighlightedClauseId(clauseId);
    setTimeout(() => {
      const el = document.getElementById(clauseId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header />
      <LegalDisclaimerBanner />
      <LiveAnnouncer message={statusMessage} />

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Document Uploader & Preamble */}
        <DocumentUploader />

        {currentDocument && (
          <div className="mt-8 space-y-6">
            {/* Module Navigation Tabs */}
            <nav
              aria-label="NyayaLens Module Navigation"
              className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveModule(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Active Module Content with Suspense Code Splitting */}
            <div className="transition-all">
              <Suspense fallback={<ModuleFallback />}>
                {activeModule === 'simplify' && (
                  <ClauseViewer
                    clauses={currentDocument.clauses}
                    highlightedClauseId={highlightedClauseId}
                  />
                )}

                {activeModule === 'radar' && (
                  <ClauseRadar
                    clauses={currentDocument.clauses}
                    onSelectClause={handleScrollToClause}
                    selectedClauseId={highlightedClauseId}
                  />
                )}

                {activeModule === 'compare' && <DiffView />}

                {activeModule === 'qa' && (
                  <QuestionBox onScrollToClause={handleScrollToClause} />
                )}

                {activeModule === 'options' && <OptionsView />}

                {activeModule === 'actions' && <ActionKit />}

                {activeModule === 'brief' && <LawyerPrepBriefView />}
              </Suspense>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NyayaLens AI — AI for Legal Assistance & Access</span>
          <span className="text-[11px]">
            Compliant with WCAG 2.2 AA • Ephemeral & Zero-Trust Architecture
          </span>
        </div>
      </footer>
    </div>
  );
};
