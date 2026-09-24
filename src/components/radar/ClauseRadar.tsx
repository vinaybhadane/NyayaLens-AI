import React, { useState, useMemo } from 'react';
import { ClauseAnalysis } from '../../lib/schemas/clause.ts';
import { RiskHeatStrip } from './RiskHeatStrip.tsx';
import { CLAUSE_TYPE_LABELS } from '../../config/index.ts';
import { ShieldAlert, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ClauseRadarProps {
  clauses: ClauseAnalysis[];
  onSelectClause: (clauseId: string) => void;
  selectedClauseId?: string | null;
}

export const ClauseRadar: React.FC<ClauseRadarProps> = ({
  clauses,
  onSelectClause,
  selectedClauseId,
}) => {
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedClauseId, setExpandedClauseId] = useState<string | null>(null);

  const filteredClauses = useMemo(() => {
    return clauses.filter((c) => {
      const matchesRisk = riskFilter === 'all' || c.risk === riskFilter;
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      return matchesRisk && matchesType;
    });
  }, [clauses, riskFilter, typeFilter]);

  const { highCount, medCount, lowCount } = useMemo(() => {
    let high = 0;
    let med = 0;
    let low = 0;
    for (const c of clauses) {
      if (c.risk === 'high') high++;
      else if (c.risk === 'medium') med++;
      else if (c.risk === 'low') low++;
    }
    return { highCount: high, medCount: med, lowCount: low };
  }, [clauses]);

  return (
    <section aria-labelledby="radar-heading" className="space-y-6">
      <div>
        <h2 id="radar-heading" className="text-xl font-bold text-slate-900 dark:text-white">
          Clause Radar & Risk Assessment
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Automated clause classification, risk rating, and keyboard-navigable heat strip.
        </p>
      </div>

      {/* Visual Risk Heat Strip */}
      <RiskHeatStrip
        clauses={clauses}
        onSelectClause={onSelectClause}
        selectedClauseId={selectedClauseId}
      />

      {/* Metrics & Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric Cards */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
          <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          <div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">{highCount}</div>
            <div className="text-xs font-semibold text-rose-800 dark:text-rose-200">High Risk Clauses</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{medCount}</div>
            <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">Medium Risk Clauses</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
          <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{lowCount}</div>
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">Low Risk Clauses</div>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="filter-risk" className="font-semibold text-slate-700 dark:text-slate-300">
              Filter Risk:
            </label>
            <select
              id="filter-risk"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
              className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
            >
              <option value="all">All Risks ({clauses.length})</option>
              <option value="high">High Risk ({highCount})</option>
              <option value="medium">Medium Risk ({medCount})</option>
              <option value="low">Low Risk ({lowCount})</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label htmlFor="filter-type" className="font-semibold text-slate-700 dark:text-slate-300">
              Filter Type:
            </label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
            >
              <option value="all">All Types</option>
              {Object.entries(CLAUSE_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filtered Clause Cards */}
      <div className="space-y-4">
        {filteredClauses.map((clause) => {
          const isExpanded = expandedClauseId === clause.id;

          return (
            <div
              key={clause.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedClauseId(isExpanded ? null : clause.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase border">
                    {clause.risk} risk
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{clause.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Type: {CLAUSE_TYPE_LABELS[clause.type] || clause.type}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" aria-hidden="true" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-xs space-y-3">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Risk Rationale: </span>
                    <span className="text-slate-600 dark:text-slate-400">{clause.riskReason}</span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-serif whitespace-pre-line text-slate-700 dark:text-slate-300">
                    {clause.original}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
