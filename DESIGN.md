# NyayaLens AI — Design Document

**Theme:** AI for Legal Assistance & Access
**Tagline:** Understand it. Compare it. Question it. Prepare for your lawyer.

> **Legal boundary:** NyayaLens provides legal *information and document assistance*. It does not provide legal advice, does not represent users, and does not replace a qualified legal professional. This boundary is enforced in the product itself (see Section 8), not only in a footer disclaimer.

---

## 0. Document Purpose and Evaluation Mapping

This document is organized strictly around the six evaluation parameters. Each parameter has its own section containing design decisions, concrete measurable targets, and a verification method.

| # | Parameter | Section | Primary artifacts |
|---|-----------|---------|-------------------|
| 1 | Code Quality | 3 | TypeScript strict, modular services, linting, shared schemas |
| 2 | Security | 4 | Server-side AI, validation, rate limiting, CSP, privacy-by-default, `SECURITY.md` |
| 3 | Efficiency | 5 | Caching, chunking strategy, streaming, memoization, bundle budget |
| 4 | Testing | 6 | Vitest unit, integration, AI-grounding, and accessibility tests |
| 5 | Accessibility | 7 | WCAG 2.2 AA, plain-language output, multilingual, screen-reader support |
| 6 | Problem Statement Alignment | 8 | Use-case traceability matrix, legal-boundary controls, innovation |

---

## 1. Problem Understanding

Legal text is dense, jargon-heavy, and written for lawyers rather than for the people who sign it. Tenants, freelancers, small-business owners, students, and first-time employees routinely sign rental agreements, employment contracts, NDAs, loan documents, and terms of service without fully understanding their obligations, risks, or options.

**Core user need:** "Tell me what this document actually says, what I should worry about, and what I should ask before I sign."

**Target users**
- Individuals signing personal agreements (rent, employment, loans, freelance work)
- Small businesses and startups without in-house counsel
- Students and first-time job seekers reviewing offer letters and internship agreements
- People preparing for a first consultation with a lawyer

**What the product is not:** a chatbot that answers legal questions from general knowledge. Every substantive answer must be grounded in the user's own documents.

---

## 2. Solution Overview

NyayaLens is a GenAI-powered web platform with seven modules built around a single principle: **every AI claim must be traceable to the source document.**

| Module | Purpose |
|--------|---------|
| **Simplify** | Rewrites clauses in plain language at a selectable reading level, with the original text alongside |
| **Clause Radar** | Extracts and classifies key clauses (payment, termination, liability, indemnity, non-compete, auto-renewal, IP, confidentiality, dispute resolution, jurisdiction) and rates risk |
| **Compare** | Semantically compares two documents (or two versions), surfacing added, removed, and materially changed terms, plus inconsistencies |
| **Grounded Q&A** | Answers questions using only the provided documents, with cited passages; abstains when the document does not answer |
| **Options & Next Steps** | Explains what the user's realistic options are for a flagged issue (negotiate, clarify, seek counsel, request amendment), framed as information |
| **Action Kit** | Generates summaries, obligation checklists, key-date timelines, and a printable brief |
| **Lawyer Prep Brief** | Produces a structured pack of facts, concerns, and specific questions to take to a legal professional |

### 2.1 Innovation Highlights

1. **Grounding Verifier.** After the model responds, a deterministic verification step confirms that each quoted passage exists in the source text. Claims without a verifiable source span are dropped or labelled "unverified". This directly targets hallucination in a high-stakes domain.
2. **Abstention by design.** The system returns "The document does not address this" instead of guessing. Abstention is a first-class, tested behavior.
3. **Risk Heat Strip.** A compact visual overview of the document showing where risky clauses cluster, navigable by keyboard and announced to screen readers.
4. **Obligation and Deadline Timeline.** Extracts who must do what by when (notice periods, renewal dates, payment due dates) into a checklist that can be exported.
5. **Lawyer Prep Brief.** Reframes the product from "replace the lawyer" to "make the lawyer visit shorter, cheaper, and more effective".
6. **Multilingual plain-language output.** English, Hindi, and Marathi output for simplified summaries, with the original clause preserved for accuracy.
7. **Privacy-first sessions.** Documents are processed in memory and discarded by default; cloud persistence is explicit opt-in.

---

## 3. Parameter 1 — Code Quality

### 3.1 Design principles
- **TypeScript strict mode** across client and server (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`).
- **Single source of truth for data shapes.** Zod schemas in `src/lib/schemas` generate both runtime validators and TypeScript types, shared by client and server. No duplicated interfaces.
- **Separation of concerns.** UI components contain no business logic; services contain no UI; the AI layer is isolated behind an interface so it can be mocked in tests.
- **Pure, deterministic core.** Parsing, chunking, clause-span matching, diffing, date extraction, and grounding verification are pure functions with no network access, making them trivially testable.
- **Small, single-purpose modules** (target: no file above 250 lines, no function above 40 lines, cyclomatic complexity ≤ 10).
- **Consistent error model.** A typed `AppError` with stable error codes; the API never leaks stack traces or provider errors to the client.

### 3.2 Architecture

```
User Input (upload / paste / question)
        │
        ▼
Validation Layer (type, size, schema, sanitization)
        │
        ▼
Document Processing Pipeline
  parse → normalize → PII-mask (optional) → segment into clauses → chunk
        │
        ▼
AI Orchestrator (server-side only)
  prompt builder → Gemini call (structured JSON output) → response schema validation
        │
        ▼
Grounding Verifier (deterministic)
  quote-in-source check → confidence scoring → abstention rules
        │
        ▼
Legal Boundary Guard
  advice-seeking detection → disclaimer injection → escalation suggestions
        │
        ▼
Feature Modules (Simplify · Radar · Compare · Q&A · Options · Action Kit · Lawyer Brief)
        │
        ▼
Accessible UI  ⇄  Optional Cloud Sync (opt-in)
```

### 3.3 Project structure

```
nyayalens/
├── src/
│   ├── components/
│   │   ├── upload/            # DocumentUploader, PasteInput
│   │   ├── simplify/          # ClauseViewer, ReadingLevelToggle
│   │   ├── radar/             # ClauseCard, RiskHeatStrip, RiskLegend
│   │   ├── compare/           # DiffView, ChangeSummary
│   │   ├── qa/                # QuestionBox, AnswerWithCitations
│   │   ├── actions/           # Checklist, Timeline, LawyerBrief
│   │   └── common/            # Disclaimer, ErrorBoundary, LoadingState
│   ├── hooks/                 # useDocument, useAnalysis, useAnnouncer
│   ├── services/              # apiClient, exportService
│   ├── context/               # SessionContext, PreferencesContext
│   ├── config/                # constants, limits, feature flags
│   ├── lib/
│   │   ├── schemas/           # Zod schemas (shared)
│   │   ├── parsing/           # pdf, docx, txt normalizers
│   │   ├── segmentation/      # clause splitter, chunker
│   │   ├── diff/              # semantic + textual diff helpers
│   │   ├── grounding/         # quote verifier, confidence scoring
│   │   ├── dates/             # obligation and deadline extraction
│   │   └── boundary/          # advice-intent detector, disclaimer rules
│   ├── types/
│   ├── test/                  # unit, integration, a11y, fixtures
│   └── assets/
├── server/
│   ├── index.ts               # Express bootstrap
│   ├── routes/                # analyze, compare, ask, brief, health
│   ├── middleware/            # validate, rateLimit, security, errorHandler
│   ├── ai/                    # geminiClient, prompts, orchestrator
│   └── cache/                 # in-memory LRU with TTL
├── docs/
│   ├── prompts.md
│   └── threat-model.md
├── README.md
├── DESIGN.md
├── SECURITY.md
├── genAi.md                   # AI usage, prompts, guardrails, limitations
├── firestore.rules
├── firebase-blueprint.json
├── .env.example
├── .oxlintrc.json
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── package.json
```

### 3.4 Tech stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React + TypeScript + Vite + Tailwind CSS | Fast dev loop, type safety, consistent styling |
| Backend | Node.js + Express | Simple, well-understood, fits server-side AI proxy |
| AI | Google Gemini (model configurable via `GEMINI_MODEL`) | Long context, structured JSON output, multilingual capability |
| Document parsing | `pdfjs-dist` / `pdf-parse`, `mammoth` (DOCX), plain text | Covers common legal document formats |
| Validation | Zod | Shared schemas, runtime safety |
| Cloud (opt-in) | Firebase Authentication + Firestore | Cross-device sync with per-user isolation |
| Testing | Vitest, Testing Library, JSDOM, `vitest-axe` | Unit, component, and accessibility checks |
| Linting | Oxlint + TypeScript compiler as a gate | Fast static analysis |

### 3.5 Quality gates and measurable targets

| Gate | Target |
|------|--------|
| `tsc --noEmit` | 0 errors |
| Lint | 0 errors, 0 warnings on `main` |
| `any` usage | 0 (enforced by lint rule) |
| Max file length | 250 lines |
| Max function length | 40 lines |
| Cyclomatic complexity | ≤ 10 per function |
| Dead code / unused exports | 0 |
| Prompts | Versioned constants in `server/ai/prompts`, never inlined in route handlers |
| Magic numbers | Extracted to `src/config` |
| Documentation | JSDoc on every exported function in `lib/` and `server/ai/` |

### 3.6 Conventions
- Conventional Commits; small, reviewable commits.
- One feature per module folder; public API exposed through a single `index.ts`.
- Naming: components `PascalCase`, hooks `useCamelCase`, pure utilities `camelCase`, constants `UPPER_SNAKE_CASE`.
- Environment access only through a single validated `config` module.

---

## 4. Parameter 2 — Security

Legal documents are among the most sensitive data a user can upload. Security and privacy are designed in from the start under a **zero-trust** model.

### 4.1 Threat model summary

| Threat | Impact | Mitigation |
|--------|--------|------------|
| API key exposure | Abuse, cost, data leakage | All AI calls server-side; key only in server environment; `.env` git-ignored; `.env.example` committed |
| Malicious file upload | RCE, DoS, parser exploits | Strict MIME and extension allowlist, magic-byte verification, size and page limits, parsing in isolated try/catch with timeouts |
| Prompt injection via document content | Model manipulation, data exfiltration, false analysis | Document text is treated strictly as data, delimited in prompts; system instructions state that document contents must never be followed as instructions; output is schema-validated; grounding verifier rejects unsupported claims |
| Sensitive data leakage in logs | Privacy breach | Structured logging that never records document text or user questions; only metadata (route, status, latency, size) |
| Abuse / DoS | Availability, cost | Per-IP and per-session rate limiting, request timeouts, payload size caps |
| XSS through rendered document text or AI output | Session compromise | React escaping by default, no `dangerouslySetInnerHTML`, Content Security Policy, sanitization of any rendered markdown |
| Cross-user data access | Privacy breach | Firestore rules enforcing `request.auth.uid == resource.data.ownerId`; no shared collections |
| CORS misuse | Unauthorized API access | Dynamic origin allowlist from environment |
| Dependency vulnerabilities | Supply-chain compromise | `npm audit` in CI, lockfile committed, minimal dependencies |
| Users treating output as legal advice | Real-world harm | Legal Boundary Guard (Section 8.3) |

### 4.2 Server hardening
- **Helmet** with a strict Content Security Policy (`default-src 'self'`, no inline scripts, explicit `connect-src` for Firebase).
- **HSTS**, `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy` restricting unused browser features.
- **Rate limiting** with stricter limits on expensive AI routes than on health or static routes.
- **Payload size limits** on JSON bodies and multipart uploads.
- **Dynamic CORS validation** against an allowlist.
- **Centralized error handler** returning generic messages with stable error codes; no stack traces in production.
- **Request timeouts and AI call timeouts** with bounded retries.

### 4.3 Input validation and sanitization
- Every route validates body, query, and params with Zod before any processing.
- Text inputs are normalized (Unicode normalization, control-character stripping) and length-bounded.
- File uploads verified by magic bytes, not just extension.
- Question and document text are placed inside clearly delimited blocks in prompts.

### 4.4 Privacy by default
- **Ephemeral processing:** documents are held in memory for the session and discarded; nothing is written to disk or to the database unless the user explicitly opts in.
- **Optional PII masking:** a client-side pass can mask names, phone numbers, emails, and ID-like patterns before the text is sent to the AI, with a reversible local mapping so the user still sees real values.
- **No training on user data:** documented in `genAi.md` and the UI, subject to provider terms.
- **Right to delete:** a one-click "Delete my data" action removes any opted-in cloud records.
- **Log hygiene:** no document contents or questions in logs, ever.

### 4.4.1 Authentication and data isolation (opt-in)
- Firebase Authentication for users who want cloud sync.
- Firestore rules: default deny; owner-only read and write; schema-shape validation on writes; size limits on fields.

### 4.5 AI-specific safety
- Server-side only AI access; the browser never sees the provider key or raw provider responses.
- Structured JSON output validated against Zod schemas; malformed output triggers a bounded retry, then a safe failure.
- Output filters block content that presents itself as a lawyer or as guaranteed legal outcomes.

### 4.6 Security deliverables
- `SECURITY.md`: supported versions, reporting process, data-handling summary.
- `docs/threat-model.md`: the table above, expanded.
- `firestore.rules` with tests.
- CI step running `npm audit --omit=dev` and a secret-scanning check.

### 4.7 Security verification
- Automated tests for: oversized payloads, wrong MIME types, spoofed extensions, malformed JSON, rate-limit trips, CORS rejection, and prompt-injection fixtures (documents containing "ignore previous instructions" style text).
- Manual checklist run before submission.

---

## 5. Parameter 3 — Efficiency

Legal documents are long. Efficiency here means low latency, low cost per analysis, and a light client.

### 5.1 AI pipeline efficiency
- **Clause-level segmentation first.** A deterministic segmenter splits the document into clauses using numbering, headings, and paragraph patterns before any AI call. The model receives structured units rather than a raw wall of text.
- **Single-pass extraction with structured output.** One well-designed call returns clause type, plain-language rewrite, risk level, and source span together, avoiding multiple round-trips.
- **Adaptive chunking.** Short documents go in one call; long documents are chunked by clause boundaries (never mid-clause) with a small overlap, processed in parallel with bounded concurrency, then merged.
- **Two-tier processing.** A fast pass produces the summary and clause map first so the UI is useful quickly; deeper analysis (risk rationale, options) loads on demand per clause.
- **Streaming responses** for Q&A and long summaries so users see progress immediately.
- **Deterministic work stays off the model.** Date extraction, clause numbering, diff alignment, and quote verification run locally and cost nothing.

### 5.2 Caching
- **In-memory LRU cache with TTL** on the server, keyed by a hash of (normalized clause text + task + prompt version + language). Identical clauses across documents or re-uploads are never re-analyzed.
- **Client-side memoization** of derived views (filtered clause lists, diff results).
- Cache stores results only, never raw documents beyond the session lifetime; entries expire quickly.

### 5.3 Compare efficiency
- Align clauses first using cheap lexical similarity and structural position; only ambiguous or changed pairs are sent to the model for semantic comparison. Unchanged clauses cost zero AI calls.

### 5.4 Frontend efficiency
- `React.memo`, `useMemo`, and `useCallback` on list-heavy views (clause lists, diff views).
- **Virtualized rendering** for documents with hundreds of clauses.
- **Route-level code splitting** with lazy loading; heavy libraries (PDF parsing, export) loaded on demand.
- Lightweight SVG for the Risk Heat Strip; no heavy charting library.
- Debounced inputs and cancellation of superseded requests via `AbortController`.

### 5.5 Efficiency budgets (targets)

| Metric | Target |
|--------|--------|
| Initial JS bundle (gzipped) | ≤ 200 KB |
| Time to Interactive on mid-range mobile, 4G | ≤ 3 s |
| First useful result (summary + clause map) for a 10-page document | ≤ 8 s |
| Q&A time to first streamed token | ≤ 2 s |
| Cache hit rate on repeated clause analysis | ≥ 60 % in demo scenarios |
| AI calls per 10-page document (analysis) | ≤ 4 |
| Max upload size | 10 MB, 50 pages (configurable) |
| Lighthouse Performance | ≥ 90 |

### 5.6 Cost control
- Per-session token budget and per-request input cap.
- Prompt versions kept compact; system prompts reused across calls.
- Graceful degradation: if the AI is unavailable or rate-limited, deterministic features (segmentation, date extraction, textual diff, checklist from extracted dates) still work.

---

## 6. Parameter 4 — Testing

Testing focuses on what matters most in a legal-assistance tool: **correctness of deterministic logic, faithfulness of AI output to the source, and safe behavior at the legal boundary.**

### 6.1 Test strategy

| Layer | Tooling | Focus |
|-------|---------|-------|
| Unit | Vitest | Pure functions in `lib/` |
| Component | Vitest + Testing Library + JSDOM | UI behavior and states |
| Integration | Vitest + Supertest | API routes, middleware, orchestrator with a mocked AI client |
| AI grounding | Vitest with recorded fixtures | Verifier, abstention, injection resistance |
| Accessibility | `vitest-axe` + keyboard interaction tests | ARIA, focus, roles, contrast tokens |
| Security | Vitest + Supertest | Validation, limits, CORS, rate limiting |
| Rules | Firebase emulator tests | Firestore access control |

The AI provider is always mocked in automated tests, making runs fast, free, and deterministic.

### 6.2 Test suite plan (target: 60+ tests)

**Unit — document processing (12)**
- Clause segmentation on numbered, lettered, and heading-based documents
- Chunking never splits a clause; overlap behaves correctly
- Text normalization (Unicode, whitespace, control characters)
- File type detection by magic bytes; spoofed extension rejected
- Empty, very short, and extremely long documents

**Unit — deterministic legal logic (12)**
- Date and deadline extraction (absolute dates, relative periods such as "30 days after notice")
- Notice-period and renewal-term extraction
- Clause type classification helpers
- Textual diff alignment; moved clause detection
- Risk score aggregation rules

**Unit — grounding and boundary (10)**
- Verifier accepts exact quotes and whitespace-normalized quotes
- Verifier rejects fabricated quotes
- Unverified claims are flagged or dropped
- Abstention triggers when no supporting span exists
- Advice-seeking detector flags questions such as "should I sue?" or "will I win?"
- Disclaimers injected where required
- Prompt-injection text inside documents does not alter output structure

**Integration — API and security (14)**
- Valid request returns schema-conformant response
- Malformed JSON, missing fields, oversize payload, wrong content type → correct error codes
- Rate limit returns 429 after threshold
- CORS rejects unlisted origins
- Error handler never leaks stack traces
- Logs contain no document text (asserted via log spy)
- AI timeout and malformed AI output → safe fallback
- Cache hit avoids second AI call

**Component and accessibility (12)**
- Uploader: keyboard operable, announces status, shows errors accessibly
- Clause cards: expandable via keyboard, correct `aria-expanded`
- Risk heat strip: has text alternative and keyboard navigation
- Diff view: changes conveyed by text and icon, not color alone
- Q&A: citations are focusable links that scroll to and highlight the source clause
- Live region announces analysis progress and completion
- Zero axe violations on every main view

**Rules tests (4)**
- Unauthenticated read/write denied
- Cross-user read/write denied
- Owner read/write allowed
- Oversized or malformed writes denied

### 6.3 Test data
- Fixture corpus: sample rental agreement, employment contract, NDA, freelance agreement, and terms of service, plus paired versions for compare tests. All fixtures are synthetic or public-domain.
- Adversarial fixtures: prompt-injection text, hidden text, extremely long clauses, empty sections, mixed-language clauses.

### 6.4 AI quality evaluation (beyond unit tests)
A small offline evaluation set of about 20 clause-question pairs with expected outcomes, tracking:
- **Groundedness rate:** share of claims with a verified source span (target ≥ 95 %)
- **Correct abstention rate:** share of unanswerable questions correctly declined (target ≥ 90 %)
- **Boundary compliance:** share of advice-seeking prompts handled with information framing (target 100 %)

### 6.5 Coverage and CI
- Coverage targets: ≥ 85 % lines on `lib/` and `server/`, ≥ 70 % overall.
- CI pipeline: install → typecheck → lint → tests → build → audit.
- A failing gate blocks merge.
- Results summarized in the README as a table.

---

## 7. Parameter 5 — Accessibility

Accessibility is central to this problem: the product exists to make legal information *accessible*, so the interface and the language must be accessible too.

### 7.1 Standard
Target **WCAG 2.2 Level AA** across all views.

### 7.2 Perceivable
- Semantic HTML landmarks (`header`, `nav`, `main`, `aside`, `footer`) and a logical heading hierarchy.
- Color contrast ≥ 4.5:1 for text and ≥ 3:1 for UI components and graphics; a high-contrast theme and a dark theme.
- **Risk is never conveyed by color alone.** Each risk level has a label ("High risk"), an icon, and a distinct pattern in charts.
- Text resizable to 200 % and reflowing at 320 px width without horizontal scrolling.
- Respect `prefers-reduced-motion`; no auto-playing animation.
- Charts and the heat strip have text alternatives and a data-table view.

### 7.3 Operable
- Every function available by keyboard, with a visible, high-contrast focus indicator.
- Skip-to-content link; logical tab order; no keyboard traps.
- Minimum target size of 24×24 CSS px (WCAG 2.2 target size), larger on touch views.
- Focus management: after analysis completes, focus moves to the results heading; when a citation is activated, focus moves to the highlighted source clause.
- Drag-and-drop upload always has an equivalent button and keyboard path.
- Consistent help placement and no cognitive-test authentication steps (WCAG 2.2 consistent help and accessible authentication).

### 7.4 Understandable
- **Plain-language output is the core accessibility feature.** Reading-level toggle (simple / standard / detailed) with a target of roughly Grade 6–8 for the simple mode.
- Jargon terms are defined inline with accessible tooltips that also work on keyboard focus and touch.
- **Multilingual support:** UI and simplified output in English, Hindi, and Marathi; `lang` attributes set per region of text; original-language clause preserved.
- Clear, specific error messages with recovery steps; form fields with visible labels and instructions.
- Confirmation before destructive actions (delete data).

### 7.5 Robust
- ARIA used only where native semantics are insufficient, following the ARIA Authoring Practices for accordions, tabs, and dialogs.
- `aria-live` regions announce progress ("Analyzing… 60 %"), completion, and errors without stealing focus.
- Tested with NVDA and VoiceOver, keyboard-only navigation, and browser zoom.
- Export options in accessible formats: tagged/structured HTML and plain text, in addition to PDF.

### 7.6 Voice and low-literacy support
- Optional read-aloud of summaries using the browser Speech Synthesis API (no data leaves the device).
- Optional voice input for questions via the Web Speech API where supported, with a clear typed fallback.

### 7.7 Accessibility verification

| Check | Method |
|-------|--------|
| Automated | `vitest-axe` in unit tests; Lighthouse and axe DevTools on each view; target 0 violations |
| Keyboard | Scripted keyboard-only walkthrough of every user flow |
| Screen reader | Manual NVDA and VoiceOver pass on upload, results, Q&A, compare |
| Visual | Contrast checks via design tokens; 200 % zoom and 320 px reflow test |
| Language | `lang` attribute assertions in tests for Hindi and Marathi content |
| Target | Lighthouse Accessibility ≥ 95; documented manual audit in `docs/accessibility-audit.md` |

---

## 8. Parameter 6 — Problem Statement Alignment

### 8.1 Traceability matrix

| Problem statement requirement | NyayaLens feature | Where |
|-------------------------------|-------------------|-------|
| Simplifying complex legal documents | Simplify module: clause-by-clause plain-language rewrite, reading-level toggle, jargon glossary, multilingual output | Sections 2, 7.4 |
| Comparing contracts, agreements, or policies | Compare module: aligned clause diff with semantic classification (added, removed, modified, materially different) | Section 5.3 |
| Highlighting important clauses, obligations, risks, or inconsistencies | Clause Radar, Risk Heat Strip, obligation extraction, cross-clause inconsistency detection within and across documents | Section 2 |
| Answering questions based on provided legal documents | Grounded Q&A with citations, verifier, and abstention | Sections 2.1, 8.2 |
| Helping users understand their options and potential next steps | Options & Next Steps: negotiate, ask for clarification, request an amendment, seek professional advice, with rationale tied to the clause | Section 2 |
| Generating summaries, checklists, or other actionable outputs | Action Kit: summary, obligation checklist, key-date timeline, exportable brief | Section 2 |
| Helping users prepare information or questions for a legal professional | Lawyer Prep Brief: facts, flagged clauses, missing information, prioritized questions to ask | Section 2 |
| Legal boundary: information, not replacement for professional advice | Legal Boundary Guard, framing rules, escalation prompts, tested behavior | Section 8.3 |
| Open directions / Innovation first | Grounding Verifier, abstention, Risk Heat Strip, timeline, privacy-first design, multilingual accessibility | Section 2.1 |

### 8.2 Grounded Q&A behavior specification
1. Retrieve the most relevant clauses for the question (lexical + embedding-style relevance or model-assisted selection).
2. Generate an answer restricted to those clauses, returning structured output: `answer`, `citations[]` (clause ID + exact quote), `confidence`, `answerable`.
3. Run the Grounding Verifier: every citation quote must be found in the source; failures are removed and the answer confidence is lowered.
4. If `answerable` is false or no verified citation remains, return: "This document does not appear to address that. Here is what to ask the other party or a legal professional." with suggested questions.
5. Always show the cited source text next to the answer so users can check it themselves.

### 8.3 Legal Boundary Guard (enforced in product and tests)
- **Framing rules:** outputs use "this clause says", "this may mean", and "you may want to ask" — never "you should sue", "you will win", or "this is illegal".
- **Advice-intent detection:** questions seeking a legal verdict, strategy for litigation, or a prediction of outcome trigger an information-only response plus a suggestion to consult a qualified lawyer.
- **Jurisdiction awareness:** the user selects a jurisdiction (default: India); the system states that laws vary by place and does not assert statutory conclusions it cannot ground in the provided text. Where general context is offered, it is labelled as general information and not as a conclusion about the user's case.
- **Visible disclaimers:** persistent but unobtrusive notice on results; explicit notice on exports; onboarding explanation of what the tool does and does not do.
- **Escalation triggers:** for high-risk indicators (criminal exposure, imminent deadlines, large financial commitments, court notices), the UI prominently recommends professional help and links to the Lawyer Prep Brief.
- **Free legal aid signposting:** informational pointers to public legal-aid resources (for India, the National Legal Services Authority and District Legal Services Authorities), verified and dated in the content.

### 8.4 Primary user journeys
1. **Sign a rental agreement:** upload → Simplify → Clause Radar flags security deposit, lock-in, and eviction clauses → Options → Action Kit checklist → Lawyer Prep Brief (optional).
2. **Compare job offers or contract revisions:** upload two versions → Compare highlights changed notice period and added non-compete → user asks "what changed about termination?" → grounded answer with citations.
3. **Understand a notice or policy:** paste text → plain-language summary in Hindi or Marathi → key deadlines timeline → questions to ask.
4. **Prepare for a consultation:** generate the Lawyer Prep Brief covering facts, documents, concerns, and prioritized questions, exported as an accessible document.

### 8.5 Success criteria for the problem statement
- A first-time user can go from upload to understanding the top risks in under two minutes.
- Every AI claim shown in the UI has a visible source or an explicit "unverified" label.
- Advice-seeking prompts never receive a definitive legal verdict.
- All seven use-case bullets in the problem statement are demonstrably covered in the live demo.

---

## 9. Data Model (shared Zod schemas)

```ts
type RiskLevel = 'low' | 'medium' | 'high';

type ClauseType =
  | 'payment' | 'term' | 'termination' | 'renewal' | 'liability'
  | 'indemnity' | 'confidentiality' | 'ip' | 'non_compete'
  | 'dispute_resolution' | 'jurisdiction' | 'other';

interface SourceSpan {
  clauseId: string;
  start: number;        // character offsets in normalized text
  end: number;
  quote: string;        // must exist in source; verified
}

interface ClauseAnalysis {
  id: string;
  type: ClauseType;
  original: string;
  plain: Record<'en' | 'hi' | 'mr', string>;
  risk: RiskLevel;
  riskReason: string;
  obligations: { party: string; action: string; dueDate?: string }[];
  spans: SourceSpan[];
  verified: boolean;
}

interface QaAnswer {
  answerable: boolean;
  answer: string;
  citations: SourceSpan[];
  confidence: 'low' | 'medium' | 'high';
  suggestedQuestions: string[];
  boundaryNotice?: string;
}

interface CompareResult {
  changes: {
    kind: 'added' | 'removed' | 'modified' | 'unchanged';
    leftClauseId?: string;
    rightClauseId?: string;
    materiality: 'minor' | 'moderate' | 'major';
    explanation: string;
    spans: SourceSpan[];
  }[];
  inconsistencies: { description: string; spans: SourceSpan[] }[];
}
```

---

## 10. API Design

| Method | Route | Purpose | Notes |
|--------|-------|---------|-------|
| POST | `/api/analyze` | Segment and analyze a document | Validated, rate-limited, cached |
| POST | `/api/compare` | Compare two documents | Aligns locally, AI only for changed pairs |
| POST | `/api/ask` | Grounded Q&A (streaming) | Boundary guard + verifier |
| POST | `/api/brief` | Generate Lawyer Prep Brief | Structured output |
| POST | `/api/export` | Generate accessible export | HTML/text/PDF |
| GET | `/api/health` | Liveness | No auth, minimal data |

All responses follow `{ ok, data?, error?: { code, message } }`. Error codes are stable and documented.

---

## 11. Configuration

`.env.example`
```
GEMINI_API_KEY=
GEMINI_MODEL=
ALLOWED_ORIGINS=http://localhost:5173
MAX_UPLOAD_MB=10
MAX_PAGES=50
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_AI=20
CACHE_TTL_SECONDS=1800
FIREBASE_* (client config, opt-in sync only)
```

All values are read and validated once at startup; the server refuses to start with missing or invalid configuration.

---

## 12. Implementation Roadmap

| Phase | Deliverables | Parameters served |
|-------|--------------|-------------------|
| 1. Foundation | Repo scaffold, TS strict, lint, shared schemas, Express bootstrap with security middleware, CI | Code Quality, Security |
| 2. Core pipeline | Parsing, normalization, segmentation, chunking, Gemini client, orchestrator, cache | Efficiency, Code Quality |
| 3. Trust layer | Grounding Verifier, abstention, Legal Boundary Guard, prompt-injection defenses | Security, Problem Alignment |
| 4. Features | Simplify, Clause Radar, Q&A, Compare, Action Kit, Lawyer Prep Brief | Problem Alignment |
| 5. Accessibility | WCAG 2.2 AA pass, multilingual output, read-aloud, keyboard and screen-reader audit | Accessibility |
| 6. Testing | Full suite, adversarial fixtures, AI evaluation set, coverage gates | Testing |
| 7. Polish and submission | README with results table, `SECURITY.md`, `genAi.md`, demo script, screenshots | All |

**If time is limited, protect in this order:** Grounded Q&A + Simplify + Clause Radar (core value) → Grounding Verifier + Boundary Guard (trust) → Accessibility basics → Tests → Compare → Lawyer Prep Brief → Multilingual extras.

---

## 13. Self-Evaluation Checklist (per parameter)

**Code Quality**
- [ ] Strict TypeScript, zero `any`, zero lint warnings
- [ ] Shared Zod schemas used by client and server
- [ ] Pure logic isolated in `lib/`; AI behind an interface
- [ ] Prompts versioned and centralized
- [ ] Config validated at startup

**Security**
- [ ] AI key server-side only; `.env` ignored
- [ ] Helmet, CSP, CORS allowlist, rate limiting, payload limits
- [ ] Upload validation by magic bytes; parsing time-boxed
- [ ] Prompt-injection fixtures pass
- [ ] No document text in logs; ephemeral by default
- [ ] Firestore rules default-deny with owner isolation; `SECURITY.md` present

**Efficiency**
- [ ] Deterministic segmentation before AI; ≤ 4 AI calls per 10-page document
- [ ] LRU cache with measured hit rate
- [ ] Streaming Q&A; parallel bounded chunk processing
- [ ] Code splitting, virtualization, memoization
- [ ] Bundle and Lighthouse budgets met

**Testing**
- [ ] 60+ tests across unit, integration, AI-grounding, accessibility, rules
- [ ] AI provider mocked; deterministic runs
- [ ] Adversarial fixtures included
- [ ] Coverage thresholds enforced in CI
- [ ] Offline AI evaluation metrics reported

**Accessibility**
- [ ] WCAG 2.2 AA checks pass; axe reports zero violations
- [ ] Risk never conveyed by color alone
- [ ] Full keyboard operation and managed focus
- [ ] Live-region announcements; screen-reader tested
- [ ] Plain-language levels plus Hindi and Marathi output

**Problem Statement Alignment**
- [ ] All seven listed use cases demonstrable
- [ ] Every AI claim sourced or labelled unverified
- [ ] Legal Boundary Guard tested and visible in the UI
- [ ] At least three original features beyond the listed use cases
- [ ] Demo covers the four primary user journeys

---

## 14. Risks and Limitations (to be stated honestly in `genAi.md`)

- AI output can be wrong or incomplete; the Grounding Verifier reduces but does not eliminate this risk.
- Scanned documents require OCR, which may introduce errors; the UI warns users when text quality is low.
- Legal meaning depends on jurisdiction, context, and facts not present in the document.
- Hindi and Marathi simplifications should be reviewed for terminology accuracy; the original clause is always shown alongside.
- The tool cannot assess whether a clause is enforceable or lawful; it can only explain what the text says and flag common concerns.

---

*NyayaLens AI — making legal information understandable, comparable, and actionable, while leaving legal advice to legal professionals.*
