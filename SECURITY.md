# Security Policy — NyayaLens AI

## 1. Zero-Trust Security Philosophy

Legal documents uploaded by individuals, tenants, employees, and small business owners contain some of the most sensitive personal and commercial data imaginable. NyayaLens AI implements a strict **Zero-Trust Model**:

1. **Server-Side AI Isolation**: All LLM interactions (Google Gemini) are orchestrated exclusively server-side. The client application never has access to the AI API key, raw system instructions, or raw model streaming endpoints.
2. **Ephemeral Sessions by Default**: Documents are held in volatile memory only for the duration of the active session. Nothing is persisted to disk, local filesystems, or databases unless a user explicitly opts in to Cloud Sync.
3. **Strict Zero-Log Hygiene**: Our structured application logger (`server/middleware/logger.ts`) is architecturally prohibited from logging document contents, clause text, or user questions. Only operational metadata (HTTP verb, route, status code, latency, and payload byte size) is recorded.
4. **Prompt Injection Hardening**: All untrusted document text is enclosed within strict delimiter tags (`<<<DOCUMENT_DATA>>>...<<<DOCUMENT_DATA>>>`). System instructions explicitly state that text inside these tags represents untrusted data and must never be followed as instructions or commands.
5. **Deterministic Grounding Verification**: AI outputs are verified by a deterministic algorithm (`src/lib/grounding/verifier.ts`) that matches citations against normalized source text. Claims that cannot be verified in the source are dropped or labeled as unverified.

---

## 2. Supported Versions

| Version | Supported | Status |
| :--- | :--- | :--- |
| `1.0.x` | Yes | Active Release |
| `< 1.0.0` | No | Deprecated |

---

## 3. Threat Model Summary & Protections

| Threat Vector | Mitigation Strategy | Implemented In |
| :--- | :--- | :--- |
| **API Key Exposure** | Server-side only proxy; `.env` git-ignored; strict `.env.example`. | `server/ai/geminiClient.ts` |
| **Malicious File Uploads** | Magic-byte signature verification (`%PDF`, `PK\x03\x04`, plain text); spoofed extension rejection; 10MB payload ceiling. | `src/lib/parsing/magicBytes.ts` |
| **Prompt Injection** | Delimited data wrappers; model system instructions forbidding command execution; pre-scan heuristics. | `server/ai/prompts.ts`, `src/lib/boundary/adviceDetector.ts` |
| **Data Leakage in Logs** | Redacted structured logging; zero body logging. | `server/middleware/logger.ts` |
| **Denial of Service (DoS)** | Stricter IP rate limiting on expensive AI endpoints (20 calls/min); request size limits. | `server/middleware/rateLimit.ts` |
| **XSS & Code Injection** | Strict Content Security Policy (CSP); React JSX HTML escaping; no `dangerouslySetInnerHTML`. | `server/middleware/security.ts` |
| **Unauthorized Advice** | Legal Boundary Guard: detects advice-seeking intent; enforces informational framing; displays disclaimers. | `src/lib/boundary/` |

---

## 4. Reporting a Vulnerability

If you discover a security vulnerability or privacy concern within NyayaLens, please report it responsibly:
- **Email**: `security@nyayalens.internal` (or submit a confidential issue)
- **Response SLA**: Initial triage within 24 hours; remediation plan within 72 hours.
- Please include reproduction steps, sample payload, and potential impact. Do not disclose vulnerabilities publicly prior to coordinated release.
