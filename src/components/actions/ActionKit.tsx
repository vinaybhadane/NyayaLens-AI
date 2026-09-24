import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext.tsx';
import { CheckSquare, Calendar, Filter, Clock, Copy, Check, Download, Lightbulb } from 'lucide-react';

export const ActionKit: React.FC = () => {
  const { currentDocument } = useSession();
  const [completedObligations, setCompletedObligations] = useState<Set<string>>(new Set());
  const [partyFilter, setPartyFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!currentDocument) return null;

  // Flatten all obligations across clauses
  const allObligations = currentDocument.clauses.flatMap((c) =>
    c.obligations.map((ob, idx) => ({
      id: `${c.id}-ob-${idx}`,
      clauseId: c.id,
      clauseTitle: c.title,
      ...ob,
    }))
  );

  // Flatten all actionable options across clauses
  const allActions = currentDocument.clauses.flatMap((c) =>
    (c.options || []).map((opt, idx) => ({
      id: `${c.id}-opt-${idx}`,
      clauseId: c.id,
      clauseTitle: c.title,
      ...opt,
    }))
  );

  const parties = Array.from(new Set(allObligations.map((o) => o.party))).filter(Boolean);

  const filteredObligations = allObligations.filter(
    (o) => partyFilter === 'all' || o.party === partyFilter
  );

  const toggleObligation = (id: string) => {
    setCompletedObligations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyWording = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChecklist = () => {
    const lines = [
      `NYAYALENS AI — ACTION CHECKLIST & OBLIGATIONS`,
      `Document: ${currentDocument.title}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      `--------------------------------------------------`,
      ``,
      `[EXECUTIVE SUMMARY]`,
      currentDocument.summary,
      ``,
      `[OBLIGATIONS & ACTION ITEMS]`,
      ...allObligations.map((ob) => {
        const status = completedObligations.has(ob.id) ? '[DONE]' : '[TODO]';
        return `${status} ${ob.party}: ${ob.action} (${ob.clauseTitle})`;
      }),
      ``,
      `[CRITICAL DEADLINES & TIMELINE]`,
      ...currentDocument.timeline.map((ev) => `- [${ev.type.toUpperCase()}] ${ev.dateOrPeriod}: ${ev.description}`),
      ``,
      `[RECOMMENDED COUNTER-PROPOSALS & NEXT STEPS]`,
      ...allActions.map((act) => `- [${act.category.toUpperCase()}] ${act.title}: ${act.sampleWording}`),
      ``,
      `--------------------------------------------------`,
      `Legal Disclaimer: For informational guidance only. Not professional legal advice.`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ActionChecklist-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const completionPercent = allObligations.length > 0
    ? Math.round((completedObligations.size / allObligations.length) * 100)
    : 0;

  return (
    <section aria-labelledby="action-kit-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id="action-kit-heading" className="text-xl font-bold text-slate-900 dark:text-white">
            Action Kit & Obligation Checklist
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Structured obligations, responsible parties, and key date timeline extracted directly from the text.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportChecklist}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          <span>Export Action Plan (.txt)</span>
        </button>
      </div>

      {/* Executive Summary Card with Progress */}
      <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
            Executive Summary & Action Readiness
          </h3>
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
            {completedObligations.size} of {allObligations.length} Done ({completionPercent}%)
          </span>
        </div>
        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
          {currentDocument.summary}
        </p>

        {/* Progress Bar */}
        {allObligations.length > 0 && (
          <div className="w-full bg-indigo-200 dark:bg-indigo-900/50 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Obligations Checklist */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>Obligations Checklist</span>
            </h3>

            {/* Party Filter */}
            {parties.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <label htmlFor="party-filter-select" className="sr-only">
                  Filter by party
                </label>
                <select
                  id="party-filter-select"
                  value={partyFilter}
                  onChange={(e) => setPartyFilter(e.target.value)}
                  className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <option value="all">All Parties ({allObligations.length})</option>
                  {parties.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {filteredObligations.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No obligations extracted for this view.</p>
            ) : (
              filteredObligations.map((ob) => {
                const isChecked = completedObligations.has(ob.id);
                return (
                  <label
                    key={ob.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleObligation(ob.id)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-900 dark:text-white">{ob.party}:</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {ob.clauseTitle}
                        </span>
                      </div>
                      <p className={`text-slate-700 dark:text-slate-300 ${isChecked ? 'line-through' : ''}`}>
                        {ob.action}
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Timeline & Key Dates */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>Key-Date Timeline & Deadlines</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {currentDocument.timeline.length} events
            </span>
          </div>

          <div className="space-y-3">
            {currentDocument.timeline.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No specific deadlines detected in this document.</p>
            ) : (
              currentDocument.timeline.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shrink-0">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {event.dateOrPeriod}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {event.type}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{event.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Actionable Negotiation Playbook & Counter-Proposals */}
      {allActions.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Actionable Negotiation Playbook & Counter-Proposals</span>
            </h3>
            <span className="text-xs text-slate-500">
              {allActions.length} actionable recommendations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allActions.map((action) => (
              <div
                key={action.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {action.title}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {action.category}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                {action.sampleWording && action.sampleWording !== 'N/A' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Suggested Counter-Proposal Wording:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyWording(action.id, action.sampleWording)}
                        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {copiedId === action.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 italic">
                      "{action.sampleWording}"
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
