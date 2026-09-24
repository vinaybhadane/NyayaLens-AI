import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext.tsx';
import { apiClient } from '../../services/apiClient.ts';
import {
  SAMPLE_RENTAL_AGREEMENT,
  REVISED_RENTAL_AGREEMENT,
} from '../../test/fixtures/agreements.ts';
import { GitCompare, PlusCircle, MinusCircle, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';

export const DiffView: React.FC = () => {
  const { compareResult, setCompareResult, setIsLoading, isLoading, setStatusMessage } = useSession();

  const [leftText, setLeftText] = useState(SAMPLE_RENTAL_AGREEMENT);
  const [rightText, setRightText] = useState(REVISED_RENTAL_AGREEMENT);
  const [filterKind, setFilterKind] = useState<'all' | 'added' | 'removed' | 'modified'>('all');

  const handleCompare = async () => {
    setIsLoading(true);
    setStatusMessage('Aligning clauses and calculating semantic differences...');

    try {
      const res = await apiClient.compareDocuments({
        leftTitle: 'Original Agreement',
        leftText,
        rightTitle: 'Revised Agreement',
        rightText,
      });

      setCompareResult(res);
      setStatusMessage(`Comparison complete. Identified ${res.changes.length} clause variations.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Comparison failed.';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChanges = compareResult?.changes.filter(
    (c) => filterKind === 'all' || c.kind === filterKind
  );

  return (
    <section aria-labelledby="compare-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id="compare-heading" className="text-xl font-bold text-slate-900 dark:text-white">
            Document Version Comparison
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aligned clause diff surfacing added, removed, and materially altered legal provisions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCompare}
          disabled={isLoading || !leftText.trim() || !rightText.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <GitCompare className="w-4 h-4" aria-hidden="true" />
          )}
          <span>Run Compare</span>
        </button>
      </div>

      {/* Input Textboxes if no comparison yet */}
      {!compareResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <label htmlFor="left-contract-text" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Original Document Version
            </label>
            <textarea
              id="left-contract-text"
              rows={8}
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <label htmlFor="right-contract-text" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Revised Document Version
            </label>
            <textarea
              id="right-contract-text"
              rows={8}
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {compareResult && (
        <div className="space-y-4">
          {/* Inconsistencies Alert */}
          {compareResult.inconsistencies.length > 0 && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs"
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span>Cross-Clause Inconsistencies Detected</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {compareResult.inconsistencies.map((inc, i) => (
                  <li key={i}>{inc.description}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Filter Changes:</span>
            <div className="flex items-center gap-1">
              {(['all', 'modified', 'added', 'removed'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setFilterKind(kind)}
                  className={`px-2.5 py-1 rounded capitalize font-medium ${
                    filterKind === kind
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {kind}
                </button>
              ))}
            </div>
          </div>

          {/* Aligned Cards */}
          <div className="space-y-4">
            {filteredChanges?.map((change, idx) => {
              const isAdded = change.kind === 'added';
              const isRemoved = change.kind === 'removed';
              const isModified = change.kind === 'modified';

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isAdded && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                          <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          [+] Added
                        </span>
                      )}
                      {isRemoved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300">
                          <MinusCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          [-] Removed
                        </span>
                      )}
                      {isModified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300">
                          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                          [~] Modified
                        </span>
                      )}
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {change.rightTitle || change.leftTitle || 'Clause'}
                      </h4>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {change.materiality} materiality
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <strong className="text-slate-700 dark:text-slate-300">Explanation: </strong>
                    {change.explanation}
                  </p>

                  {/* Side-by-side or difference text */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-serif">
                    {change.leftText && (
                      <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-slate-800 dark:text-slate-200">
                        <span className="block font-sans font-bold text-rose-800 dark:text-rose-300 text-[10px] uppercase mb-1">
                          Original Version
                        </span>
                        <p>{change.leftText}</p>
                      </div>
                    )}
                    {change.rightText && (
                      <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200">
                        <span className="block font-sans font-bold text-emerald-800 dark:text-emerald-300 text-[10px] uppercase mb-1">
                          Revised Version
                        </span>
                        <p>{change.rightText}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
