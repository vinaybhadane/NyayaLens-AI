import React, { useState } from 'react';
import { ClauseAnalysis } from '../../lib/schemas/clause.ts';

interface RiskHeatStripProps {
  clauses: ClauseAnalysis[];
  onSelectClause: (clauseId: string) => void;
  selectedClauseId?: string | null;
}

export const RiskHeatStrip: React.FC<RiskHeatStripProps> = ({
  clauses,
  onSelectClause,
  selectedClauseId,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  if (clauses.length === 0) return null;

  const total = clauses.length;
  const itemWidth = 100 / total;

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % total;
      setFocusedIndex(next);
      const target = clauses[next];
      if (target) onSelectClause(target.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + total) % total;
      setFocusedIndex(prev);
      const target = clauses[prev];
      if (target) onSelectClause(target.id);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const target = clauses[index];
      if (target) onSelectClause(target.id);
    }
  };

  return (
    <div
      className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 my-4"
      aria-labelledby="heat-strip-label"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 id="heat-strip-label" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Document Risk Heat Strip
        </h3>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Use ← / → arrows to navigate clauses
        </span>
      </div>

      {/* Accessible SVG Heat Strip */}
      <svg
        role="region"
        aria-label="Visual document risk heat strip. High, medium, and low risk clauses mapped sequentially."
        className="w-full h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
      >
        <defs>
          {/* High risk pattern: diagonal stripes */}
          <pattern id="high-risk-stripe" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#991B1B" strokeWidth="1" />
          </pattern>
          {/* Medium risk pattern: dots */}
          <pattern id="med-risk-dots" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#B45309" />
          </pattern>
        </defs>

        {clauses.map((clause, idx) => {
          const x = idx * itemWidth;
          const isSelected = selectedClauseId === clause.id || focusedIndex === idx;
          const fill =
            clause.risk === 'high'
              ? '#DC2626'
              : clause.risk === 'medium'
              ? '#D97706'
              : '#10B981';

          return (
            <g
              key={clause.id}
              role="button"
              tabIndex={0}
              aria-label={`${clause.title}: ${clause.risk.toUpperCase()} risk. Press enter to inspect.`}
              onClick={() => onSelectClause(clause.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="cursor-pointer focus:outline-none"
            >
              {/* Solid base */}
              <rect
                x={x}
                y="0"
                width={itemWidth}
                height="20"
                fill={fill}
                stroke={isSelected ? '#1E1B4B' : '#FFFFFF'}
                strokeWidth={isSelected ? '1.5' : '0.2'}
              />
              {/* Accessible pattern overlay for colorblind users */}
              {clause.risk === 'high' && (
                <rect x={x} y="0" width={itemWidth} height="20" fill="url(#high-risk-stripe)" opacity="0.6" />
              )}
              {clause.risk === 'medium' && (
                <rect x={x} y="0" width={itemWidth} height="20" fill="url(#med-risk-dots)" opacity="0.5" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
