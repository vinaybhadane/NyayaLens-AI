import React, { useState } from 'react';
import { ClauseAnalysis } from '../../lib/schemas/clause.ts';
import { usePreferences } from '../../context/PreferencesContext.tsx';
import { useSpeech } from '../../hooks/useSpeech.ts';
import { Volume2, VolumeX, ShieldAlert, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface ClauseViewerProps {
  clauses: ClauseAnalysis[];
  highlightedClauseId?: string | null;
}

const LEGAL_GLOSSARY: Record<string, string> = {
  indemnify: 'To agree to pay for damages, losses, or legal costs incurred by the other party.',
  lockin: 'A fixed duration during which neither party can terminate the agreement without penalty.',
  jurisdiction: 'The specific court or geographic territory that has authority to decide disputes.',
  arbitration: 'A private dispute resolution procedure outside of regular civil court.',
  confidentiality: 'The obligation not to disclose or share sensitive business information.',
  liability: 'Legal responsibility or financial obligation for damages or failure to perform.',
};

export const ClauseViewer: React.FC<ClauseViewerProps> = ({ clauses, highlightedClauseId }) => {
  const { language } = usePreferences();
  const { speak, stopSpeaking, isSpeaking } = useSpeech();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const getRiskBadge = (risk: ClauseAnalysis['risk']) => {
    switch (risk) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            High Risk
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            Medium Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Low Risk
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="clauses-container">
      {clauses.map((clause) => {
        const isHighlighted = highlightedClauseId === clause.id;
        const plainText = clause.plain[language] || clause.plain.en;

        return (
          <article
            key={clause.id}
            id={clause.id}
            className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
              isHighlighted
                ? 'border-indigo-500 ring-4 ring-indigo-200 dark:ring-indigo-900/60 shadow-lg'
                : 'border-slate-200 dark:border-slate-800 shadow-sm'
            }`}
          >
            {/* Header & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {clause.title}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  {clause.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getRiskBadge(clause.risk)}
                {/* Text-to-Speech button */}
                <button
                  type="button"
                  onClick={() => (isSpeaking ? stopSpeaking() : speak(plainText))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  title="Read plain language summary aloud"
                  aria-label={`Read plain language rewrite of ${clause.title} aloud`}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-4 h-4 text-rose-500" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Split Comparison View: Original vs Plain Language */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Clause Text */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide text-[10px]">
                  Original Contract Text
                </h4>
                <p className="text-slate-800 dark:text-slate-200 font-serif leading-relaxed whitespace-pre-line">
                  {clause.original}
                </p>
              </div>

              {/* Plain Language Rewrite */}
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2 uppercase tracking-wide text-[10px] flex items-center justify-between">
                  <span>Plain Language Explanation</span>
                  <span className="font-mono text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                    {language.toUpperCase()}
                  </span>
                </h4>
                <p
                  className="text-slate-900 dark:text-slate-100 font-sans leading-relaxed text-sm"
                  lang={language}
                >
                  {plainText}
                </p>

                {/* Risk Rationale */}
                <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Why it matters: </span>
                  {clause.riskReason}
                </div>
              </div>
            </div>

            {/* Jargon Helper Tooltips */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Key terms:</span>
              {Object.entries(LEGAL_GLOSSARY).map(([term, def]) => {
                if (!clause.original.toLowerCase().includes(term)) return null;
                const isTooltipOpen = activeTooltip === `${clause.id}-${term}`;

                return (
                  <div key={term} className="relative inline-block">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTooltip(isTooltipOpen ? null : `${clause.id}-${term}`)
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-[11px] font-medium border border-slate-200 dark:border-slate-700"
                      aria-expanded={isTooltipOpen}
                    >
                      <HelpCircle className="w-3 h-3 text-indigo-500" aria-hidden="true" />
                      <span className="capitalize">{term}</span>
                    </button>
                    {isTooltipOpen && (
                      <div
                        role="tooltip"
                        className="absolute z-30 bottom-full left-0 mb-2 w-64 p-2.5 rounded-lg bg-slate-900 text-white text-[11px] leading-snug shadow-xl border border-slate-700"
                      >
                        <p className="font-bold capitalize mb-1 text-indigo-300">{term}</p>
                        <p>{def}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
};
