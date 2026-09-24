import React, { useState, useCallback } from 'react';
import { useSession } from '../../context/SessionContext.tsx';
import { apiClient } from '../../services/apiClient.ts';
import { Briefcase, Download, HelpCircle, AlertTriangle, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';

export const LawyerPrepBriefView: React.FC = () => {
  const { currentDocument, lawyerBrief, setLawyerBrief, setIsLoading, isLoading, setStatusMessage } =
    useSession();
  const [exporting, setExporting] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!currentDocument) return;
    setIsLoading(true);
    setStatusMessage('Generating Lawyer Prep Brief with prioritized questions...');

    try {
      const fullText = currentDocument.clauses.map((c) => c.original).join('\n\n');
      const res = await apiClient.generateBrief({
        documentTitle: currentDocument.title,
        documentText: fullText,
      });

      setLawyerBrief(res);
      setStatusMessage('Lawyer Prep Brief generated successfully.');
    } catch {
      setStatusMessage('Failed to generate brief.');
    } finally {
      setIsLoading(false);
    }
  }, [currentDocument, setIsLoading, setStatusMessage, setLawyerBrief]);

  const handleExport = useCallback(async (format: 'html' | 'txt') => {
    if (!lawyerBrief) return;
    setExporting(true);

    try {
      const blob = await apiClient.exportData({
        type: 'brief',
        format,
        data: lawyerBrief,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LawyerPrepBrief-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Handle export error
    } finally {
      setExporting(false);
    }
  }, [lawyerBrief]);

  if (!currentDocument) return null;

  return (
    <section aria-labelledby="brief-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id="brief-heading" className="text-xl font-bold text-slate-900 dark:text-white">
            Lawyer Prep Brief
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Structured consultation dossier. Designed to make advocate consultations faster, cheaper,
            and more focused.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!lawyerBrief ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Briefcase className="w-4 h-4" aria-hidden="true" />
              )}
              <span>Generate Brief</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport('html')}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
                <span>Export HTML</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('txt')}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
                <span>Export Text</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {lawyerBrief && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Document:</span>
              <span className="font-bold text-slate-900 dark:text-white">{lawyerBrief.documentTitle}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Prepared On:</span>
              <span className="font-bold text-slate-900 dark:text-white">{lawyerBrief.preparedDate}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Key Parties:</span>
              <span className="font-bold text-slate-900 dark:text-white">{(lawyerBrief.keyParties || []).join(' & ')}</span>
            </div>
          </div>

          {/* Core Purpose */}
          <div className="text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Purpose & Consultation Objective
            </h4>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans">{lawyerBrief.corePurpose}</p>
          </div>

          {/* Ambiguities / Missing Terms */}
          {(lawyerBrief.ambiguitiesOrMissingTerms || []).length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-1.5 uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                Missing Terms or Ambiguities Flagged for Counsel
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {(lawyerBrief.ambiguitiesOrMissingTerms || []).map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Prioritized Questions for Counsel */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              Prioritized Questions to Ask Your Advocate
            </h4>

            <div className="space-y-3">
              {(lawyerBrief.prioritizedQuestions || []).map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{q.question}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        q.priority === 'high'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {q.priority} priority
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-700 dark:text-slate-300">Context: </strong>
                    {q.contextFromDoc}
                  </p>
                  <p className="text-indigo-700 dark:text-indigo-300 font-medium">
                    <strong>Recommended Goal: </strong>
                    {q.suggestedGoal}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Statutory Free Legal Aid & NALSA Section 12 Directory */}
          {lawyerBrief.legalAidInfo && (
            <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 uppercase tracking-wider text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Statutory Free Legal Aid Directory (Section 12, LSA Act 1987)
                </h4>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-mono font-bold text-xs">
                  <span>National Helpline:</span>
                  <a href={`tel:${lawyerBrief.legalAidInfo.helpline || '15100'}`} className="underline">
                    {lawyerBrief.legalAidInfo.helpline || '15100'}
                  </a>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {lawyerBrief.legalAidInfo.eligibilityNote} If you cannot afford a private advocate, you are statutory entitled to free legal counsel and court representation through the District/State Legal Services Authority.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 font-medium text-emerald-800 dark:text-emerald-300">
                <span>Authority: <strong>{lawyerBrief.legalAidInfo.organization}</strong></span>
                {lawyerBrief.legalAidInfo.website && (
                  <a
                    href={lawyerBrief.legalAidInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline hover:text-emerald-900 dark:hover:text-emerald-100"
                  >
                    <span>Visit Official NALSA Portal</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
