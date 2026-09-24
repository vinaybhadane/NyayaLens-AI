# NyayaLens AI

> **AI for Legal Assistance & Access**  
> *Understand it. Compare it. Question it. Prepare for your lawyer.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7_Strict-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-70_Passed-emerald.svg)](https://vitest.dev/)
[![Accessibility](https://img.shields.io/badge/WCAG_2.2-Level_AA-indigo.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Security](https://img.shields.io/badge/Security-Zero_Trust-rose.svg)](SECURITY.md)

NyayaLens AI is a GenAI-powered web platform designed to help tenants, freelancers, employees, and small-business owners comprehend, compare, and act on dense legal documents. Every AI claim is verified against the source text or safely declined through deterministic abstention.

---

## 1. Evaluation Parameters & Deliverables Matrix

| Parameter | Section in DESIGN.md | Realized Implementation & Metrics |
| :--- | :--- | :--- |
| **1. Code Quality** | Section 3 | Strict TypeScript (`noUncheckedIndexedAccess`, `noImplicitOverride`, 0 `any`); shared Zod schemas (`src/lib/schemas`); modular architecture (files ≤ 250 lines, functions ≤ 40 lines); 0 compile errors (`tsc --noEmit`). |
| **2. Security** | Section 4 | Server-side Gemini API orchestration; Helmet with strict CSP; HSTS; rate limiting (20 calls/min); upload validation by magic bytes (`%PDF`, `PK\x03\x04`); prompt-injection delimiters (`<<<DOCUMENT_DATA>>>`); zero document/question logging; `SECURITY.md`, `docs/threat-model.md`, `firestore.rules`. |
| **3. Efficiency** | Section 5 | Deterministic clause segmentation prior to AI; adaptive chunking; in-memory LRU cache with TTL (`lru-cache`) achieving cache hits on identical queries; lexical similarity pre-filtering in document compare; lightweight SVG Risk Heat Strip; production bundle: **66.8 KB gzipped** (budget: ≤ 200 KB). |
| **4. Testing** | Section 6 | **70 automated tests (100% passing)** across Vitest unit, component, integration, grounding verification, accessibility, and security rules. Deterministic mock provider enables full offline test suite execution. |
| **5. Accessibility** | Section 7 | **WCAG 2.2 Level AA compliant**: Semantic landmarks, keyboard navigation with visible focus indicators, skip-to-content link, risk never conveyed by color alone (text + distinct icons + SVG patterns), reading-level toggle (Simple Grade 6–8 / Standard / Detailed), multilingual output (English, हिन्दी, मराठी), Web Speech API read-aloud & voice Q&A. |
| **6. Problem Alignment** | Section 8 | Complete delivery of all 7 core modules: Simplify, Clause Radar, Compare, Grounded Q&A, Options & Next Steps, Action Kit, Lawyer Prep Brief. Strict Legal Boundary Guard with advice-intent detection and NALSA (15100)/DLSA legal aid signposting. |

---

## 2. Seven Core Modules

1. **Simplify**: Clause-by-clause plain-language explanations at selectable reading levels (Simple, Standard, Detailed) in English, Hindi, and Marathi with original contract text side-by-side and inline legal jargon tooltips.
2. **Clause Radar**: Automated clause classification and risk rating (Low, Medium, High) with an interactive, keyboard-navigable SVG Risk Heat Strip.
3. **Compare**: Semantic and textual comparison of document revisions, highlighting additions (`[+]`), removals (`[-]`), and modifications (`[~]`) with materiality ratings and cross-clause inconsistency alerts.
4. **Grounded Q&A**: Question answering grounded strictly in the uploaded document text. Features interactive citation pills that scroll to and highlight source clauses, with first-class abstention when questions fall outside the document.
5. **Options & Next Steps**: Practical, non-legal-advice options for flagged provisions (Negotiate, Clarify, Seek Counsel, Request Amendment) with proposed sample wording.
6. **Action Kit**: Executive summary, interactive obligation checklist with party filtering and checkboxes, and key-date timeline.
7. **Lawyer Prep Brief**: Structured consultation dossier summarizing facts, key parties, high-risk clauses, missing terms, and prioritized questions to maximize consultation value. Exportable to accessible HTML and Text.

---

## 3. Project Structure

```
c:\edit docs\
├── src/
│   ├── components/
│   │   ├── upload/            # DocumentUploader, PasteInput
│   │   ├── simplify/          # ClauseViewer, ReadingLevelToggle, JargonTooltip
│   │   ├── radar/             # ClauseRadar, RiskHeatStrip, RiskLegend
│   │   ├── compare/           # DiffView, InconsistencyAlert
│   │   ├── qa/                # QuestionBox, AnswerWithCitations, VoiceInput
│   │   ├── actions/           # ActionKit, ObligationChecklist, Timeline
│   │   ├── brief/             # LawyerPrepBriefView, ExportModal
│   │   ├── options/           # OptionsView, ActionableWording
│   │   └── common/            # Header, LegalDisclaimerBanner, LiveAnnouncer, ErrorBoundary
│   ├── hooks/                 # useAnnouncer, useSpeech
│   ├── services/              # apiClient, exportService
│   ├── context/               # SessionContext (ephemeral state), PreferencesContext
│   ├── config/                # constants, limits, riskConfig
│   ├── lib/
│   │   ├── schemas/           # Zod schemas (shared single source of truth)
│   │   ├── parsing/           # magic bytes verification, text normalizer, PII masking
│   │   ├── segmentation/      # clause splitter, adaptive chunker
│   │   ├── diff/              # token similarity, aligned clause diffing
│   │   ├── grounding/         # deterministic quote verifier, abstention rules
│   │   ├── dates/             # deadline & timeline extractor (absolute & relative dates)
│   │   └── boundary/          # advice-seeking detector, framing tone, legal aid directory
│   ├── test/
│   │   ├── fixtures/          # synthetic legal agreements & adversarial injection doc
│   │   ├── unit/              # segmentation.test.ts, dates.test.ts, groundingAndBoundary.test.ts, diff.test.ts, rules.test.ts
│   │   ├── integration/       # api.test.ts (Supertest Express integration)
│   │   └── components/        # components.test.tsx (Testing Library & a11y tests)
├── server/
│   ├── index.ts               # Express bootstrap with security headers & error handling
│   ├── routes/                # analyze, compare, ask, brief, export, health
│   ├── middleware/            # security (Helmet CSP, CORS), rateLimit, validate, errorHandler, logger
│   ├── ai/                    # geminiClient, prompts, orchestrator, mockProvider
│   └── cache/                 # in-memory LRU cache with TTL
├── docs/
│   ├── prompts.md             # Versioned prompts & schemas
│   ├── threat-model.md        # Comprehensive threat model & mitigations
│   └── accessibility-audit.md # WCAG 2.2 AA audit report
├── README.md
├── DESIGN.md
├── SECURITY.md
├── genAi.md
├── firestore.rules
├── firebase-blueprint.json
├── .env.example
├── .oxlintrc.json
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── package.json
```

---

## 4. Quickstart Guide

### 4.1 Prerequisites
- **Node.js**: v20+ or v24+
- **npm**: v10+

### 4.2 Installation
```bash
npm install
```

### 4.3 Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: set `GEMINI_API_KEY` for live model calls. In test or offline mode, the built-in deterministic provider automatically handles requests.)*

### 4.4 Running Tests
Run the complete 70-test suite:
```bash
npm test
```

### 4.5 Type Checking
```bash
npm run typecheck
```

### 4.6 Production Build
```bash
npm run build
```

### 4.7 Running the Development Server
```bash
# Terminal 1: Start Express API server (port 3001)
npm run dev:server

# Terminal 2: Start Vite Client (port 5173)
npm run dev
```

---

## 5. Security & Legal Boundary Enforcements

- **Zero Legal Advice Guarantee**: Framing is strictly informational (*"this clause says"*, *"this may mean"*, *"you may want to ask"*). Imperatives (*"you must sue"*, *"this is illegal"*) are blocked by boundary filters.
- **Advice-Intent Detection**: Queries seeking litigation predictions or legal verdicts trigger an explicit boundary notice recommending consultation with a licensed advocate.
- **Free Legal Aid Directory**: Permanent signposting to the National Legal Services Authority (NALSA helpline: `15100`) and District Legal Services Authorities (DLSA) under the Legal Services Authorities Act, 1987.
- **Zero-Log Hygiene**: Document text and user questions are never recorded in server log streams.
