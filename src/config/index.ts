/**
 * Application constants, limits, and configuration defaults.
 */
export const APP_CONFIG = {
  APP_NAME: 'NyayaLens AI',
  TAGLINE: 'Understand it. Compare it. Question it. Prepare for your lawyer.',
  MAX_UPLOAD_BYTES: 10 * 1024 * 1024, // 10 MB
  MAX_PAGES: 50,
  MAX_DOCUMENT_CHARACTERS: 200000,
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_AI: 20, // 20 calls/min
  CACHE_TTL_MS: 30 * 60 * 1000, // 30 minutes
  DEFAULT_JURISDICTION: 'India',
  DEFAULT_READING_LEVEL: 'standard' as const,
  DEFAULT_LANGUAGE: 'en' as const,
  API_TIMEOUT_MS: 20000, // 20s
} as const;

export const CLAUSE_TYPE_LABELS: Record<string, string> = {
  payment: 'Payment & Fees',
  term: 'Duration & Term',
  termination: 'Termination & Cancellation',
  renewal: 'Renewal & Extension',
  liability: 'Liability & Damages',
  indemnity: 'Indemnity & Hold Harmless',
  confidentiality: 'Confidentiality & Non-Disclosure',
  ip: 'Intellectual Property & Ownership',
  non_compete: 'Non-Compete & Restrictive Covenants',
  dispute_resolution: 'Dispute Resolution & Arbitration',
  jurisdiction: 'Governing Law & Jurisdiction',
  other: 'General Terms & Conditions',
};

export const RISK_LEVEL_CONFIG = {
  low: {
    label: 'Low Risk',
    color: 'emerald',
    iconName: 'CheckCircle',
    ariaLabel: 'Clause rated low risk, standard terms',
  },
  medium: {
    label: 'Medium Risk / Review Needed',
    color: 'amber',
    iconName: 'AlertTriangle',
    ariaLabel: 'Clause rated medium risk, review details carefully',
  },
  high: {
    label: 'High Risk / Seek Counsel',
    color: 'rose',
    iconName: 'ShieldAlert',
    ariaLabel: 'Clause rated high risk, potential one-sided or onerous liability',
  },
} as const;
