import React, { useState, useMemo } from 'react';
import { useSession } from '../../context/SessionContext.tsx';
import { Lightbulb, MessageSquare, Edit3, Shield, Users } from 'lucide-react';

export const OptionsView: React.FC = () => {
  const { currentDocument } = useSession();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Collect options across all clauses (memoized)
  const allOptions = useMemo(() => {
    if (!currentDocument) return [];
    return currentDocument.clauses.flatMap((c) =>
      c.options.map((opt, idx) => ({
        id: `${c.id}-opt-${idx}`,
        clauseId: c.id,
        clauseTitle: c.title,
        risk: c.risk,
        ...opt,
      }))
    );
  }, [currentDocument]);

  const filteredOptions = useMemo(() => {
    return allOptions.filter(
      (o) => categoryFilter === 'all' || o.category === categoryFilter
    );
  }, [allOptions, categoryFilter]);

  if (!currentDocument) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'negotiate':
        return <Users className="w-4 h-4 text-indigo-500" aria-hidden="true" />;
      case 'clarify':
        return <MessageSquare className="w-4 h-4 text-sky-500" aria-hidden="true" />;
      case 'request_amendment':
        return <Edit3 className="w-4 h-4 text-emerald-500" aria-hidden="true" />;
      default:
        return <Shield className="w-4 h-4 text-amber-500" aria-hidden="true" />;
    }
  };

  return (
    <section aria-labelledby="options-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id="options-heading" className="text-xl font-bold text-slate-900 dark:text-white">
            Practical Options & Next Steps
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Informational pathways for handling flagged clauses: negotiation strategies, clarification
            drafts, and amendment wording.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
          {(['all', 'clarify', 'negotiate', 'request_amendment', 'seek_counsel'] as const).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOptions.length === 0 ? (
          <p className="text-xs text-slate-500 italic col-span-2">
            No specific options generated for this filter category.
          </p>
        ) : (
          filteredOptions.map((opt) => (
            <div
              key={opt.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {getCategoryIcon(opt.category)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{opt.title}</h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Tied to: {opt.clauseTitle}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {opt.category.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {opt.description}
              </p>

              {opt.sampleWording && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 text-[11px] mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                    <span>Sample Draft Language to Propose:</span>
                  </div>
                  <p className="font-serif italic text-slate-800 dark:text-slate-200">
                    &ldquo;{opt.sampleWording}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};
