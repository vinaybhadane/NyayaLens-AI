# GenAI Architecture, Guardrails & Limitations — NyayaLens AI

## 1. Role of Generative AI in NyayaLens

NyayaLens utilizes Google Gemini (`gemini-1.5-flash` or configurable model) as a structured semantic extraction and natural language rewriting engine. Crucially, **the AI is never used as an ungrounded conversational chatbot**. Every substantive output is grounded in the user's specific document.

---

## 2. Guardrails & Architecture

```
User Document
     │
     ▼
[Deterministic Segmentation & Date Extraction] (pure TypeScript, 0 tokens)
     │
     ▼
[AI Orchestrator with Strict Delimiters] (server-side only)
     │
     ▼
[Structured JSON Output Validation] (Zod schema conformance)
     │
     ▼
[Grounding Verifier] (deterministic string & token verification)
     │
     ▼
[Legal Boundary Guard] (advice-intent check + disclaimer injection)
     │
     ▼
User Presentation with Side-by-Side Original Source
```

1. **Deterministic Segmentation First**: Documents are split into structured legal clauses by numbers, headers, and paragraphs before reaching the LLM.
2. **Untrusted Data Boundaries**: All document text is wrapped in `<<<DOCUMENT_DATA>>>...<<<DOCUMENT_DATA>>>` delimiters with system prompts instructing the model to treat text strictly as data.
3. **Grounding Verifier**: An algorithmic verification step verifies that every cited quotation exists in the source text. Unsupported claims are removed or flagged as `unverified`.
4. **Abstention by Design**: If a question cannot be answered from the document, the model returns `"answerable": false` and prompts the user with questions to ask their lawyer or counterparty.

---

## 3. Honest Statement of Risks & Limitations

As required by Section 14 of `DESIGN.md`, the following operational limitations are transparently stated:

1. **AI Output Is Not Legal Advice**: NyayaLens provides document information and plain-language assistance only. It cannot represent users, formulate litigation strategy, or predict judicial outcomes.
2. **Non-Elimination of Risk**: The Grounding Verifier significantly curtails hallucination, but cannot eliminate all potential semantic misinterpretations. Users should always review the original clause shown alongside.
3. **Jurisdiction & Context Sensitivity**: The legal meaning of any clause depends heavily on statutory law, local case precedent, and external facts not contained in the text.
4. **Multilingual Phrasing**: Plain-language summaries in Hindi (हिन्दी) and Marathi (मराठी) are designed for accessibility and conceptual clarity; the original English clause remains the governing reference text.
5. **Enforceability vs Explanation**: NyayaLens explains what a clause says and flags common onerous terms, but cannot certify whether a clause is legally enforceable or void under statutory law (e.g., Section 27 of the Indian Contract Act, 1872 regarding restraints of trade).
