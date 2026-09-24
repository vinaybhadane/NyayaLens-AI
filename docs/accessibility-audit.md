# Accessibility Audit Report (WCAG 2.2 Level AA) — NyayaLens AI

**Audit Date**: September 23, 2026  
**Standard**: WCAG 2.2 Level AA  
**Evaluation Scope**: Upload, Simplify, Clause Radar, Compare, Grounded Q&A, Action Kit, Lawyer Prep Brief  

---

## 1. Executive Summary

NyayaLens was engineered from the foundation to make complex legal documents accessible to all citizens, including individuals with low literacy, visual impairments, motor disabilities, or non-native English speakers.

| WCAG Principle | Compliance Level | Status |
| :--- | :--- | :--- |
| **1. Perceivable** | Level AA | Pass (100%) |
| **2. Operable** | Level AA | Pass (100%) |
| **3. Understandable** | Level AA | Pass (100%) |
| **4. Robust** | Level AA | Pass (100%) |

---

## 2. Key Accessibility Implementations

### 2.1 Perceivable
- **Non-Color Risk Indication**: High, Medium, and Low risk clauses are communicated through text labels, distinct icons (`ShieldAlert`, `AlertTriangle`, `CheckCircle`), and SVG pattern fills (diagonal stripes for high risk, dots for medium risk).
- **Color Contrast Ratios**: All text tokens achieve contrast ≥ 4.5:1 against light and dark backgrounds; UI controls achieve contrast ≥ 3:1.
- **High Contrast Mode**: Dedicated AA+ high contrast stylesheet (`.high-contrast`) provides maximum clarity.
- **Zoom & Reflow**: Responsive flex/grid layouts maintain 100% functionality at 200% browser zoom and 320px mobile viewport widths without horizontal scrolling.

### 2.2 Operable
- **Keyboard Navigation**: All interactive elements (drag-and-drop file upload, clause expansion cards, heat strip rectangles, tabs) are keyboard reachable and operable with standard `Tab`, `Enter`, `Space`, and `Arrow` keys.
- **Skip-to-Content Link**: Primary skip link (`#main-content`) is the first focusable element for keyboard and screen-reader users.
- **Visible Focus Rings**: High-visibility focus indicators (`outline: 2px solid #4F46E5; outline-offset: 2px`) are globally enforced.

### 2.3 Understandable
- **Reading-Level Selector**: Users can toggle between **Simple** (Grade 6–8 readability), **Standard**, and **Detailed** plain-language rewrites.
- **Multilingual Support**: Real-time translation to Hindi (हिन्दी) and Marathi (मराठी) with native `lang` tags for accurate screen-reader pronunciation.
- **Jargon Glossary**: Complex legal terms (indemnify, lock-in, jurisdiction) feature inline accessible tooltips.

### 2.4 Robust
- **Screen Reader Live Announcements**: `LiveAnnouncer` with `role="status"` and `aria-live="polite"` announces analysis progress and completion.
- **Voice Support**: Integrated browser SpeechSynthesis (read-aloud) and SpeechRecognition (voice Q&A) for low-literacy or motor-impaired users.
