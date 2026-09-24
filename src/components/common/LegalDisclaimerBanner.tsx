import React, { useState } from 'react';
import { AlertCircle, ExternalLink, PhoneCall, ChevronDown, ChevronUp } from 'lucide-react';
import { LEGAL_DISCLAIMERS } from '../../lib/boundary/disclaimers.ts';
import { INDIAN_LEGAL_AID_RESOURCES } from '../../lib/boundary/legalAid.ts';

export const LegalDisclaimerBanner: React.FC = () => {
  const [showLegalAid, setShowLegalAid] = useState(false);

  return (
    <aside
      className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs py-2 px-4 transition-colors"
      aria-label="Legal Boundary and Legal Aid Notice"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            <strong>Legal Information Notice:</strong> {LEGAL_DISCLAIMERS.generalNotice}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setShowLegalAid(!showLegalAid)}
            className="inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
            aria-expanded={showLegalAid}
          >
            <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Free Legal Aid (NALSA 15100)</span>
            {showLegalAid ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Legal Aid Directory */}
      {showLegalAid && (
        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/60 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-800 dark:text-slate-200">
          {INDIAN_LEGAL_AID_RESOURCES.map((resource) => (
            <div
              key={resource.name}
              className="p-2.5 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 shadow-sm"
            >
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>{resource.name}</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                  {resource.level}
                </span>
              </h4>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">{resource.description}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{resource.contact}</span>
                <a
                  href={resource.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                >
                  Portal <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
