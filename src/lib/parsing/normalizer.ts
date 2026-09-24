/**
 * Normalizes input document text for consistent deterministic processing.
 * Performs Unicode normalization (NFKC), normalizes line endings, strips control characters.
 *
 * @param rawText - Raw input string
 * @returns Clean, normalized text
 */
export function normalizeText(rawText: string): string {
  if (!rawText) return '';

  return rawText
    // Unicode normalization
    .normalize('NFKC')
    // Standardize CRLF to LF
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Strip control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove whitespace on lines that only contain spaces or tabs
    .replace(/^[ \t]+$/gm, '')
    // Normalize excessive horizontal whitespace within lines
    .replace(/[ \t]+/g, ' ')
    // Collapse 3+ newlines to double newline
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * PII masking replacement map for client-side privacy preservation.
 */
export interface PiiMaskResult {
  maskedText: string;
  replacements: Map<string, string>;
}

/**
 * Client-side reversible PII masking for names, emails, phone numbers, and IDs.
 *
 * @param text - Normalized input text
 * @returns Masked text with reversible lookup map
 */
export function maskPii(text: string): PiiMaskResult {
  const replacements = new Map<string, string>();
  let counter = 1;

  // Mask Emails
  let masked = text.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (match) => {
      const placeholder = `[EMAIL_${counter++}]`;
      replacements.set(placeholder, match);
      return placeholder;
    }
  );

  // Mask Phone numbers (Indian & international formats)
  masked = masked.replace(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4}/g,
    (match) => {
      const placeholder = `[PHONE_${counter++}]`;
      replacements.set(placeholder, match);
      return placeholder;
    }
  );

  // Mask PAN / Aadhaar / SSN formats
  masked = masked.replace(
    /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b|\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    (match) => {
      const placeholder = `[ID_${counter++}]`;
      replacements.set(placeholder, match);
      return placeholder;
    }
  );

  return { maskedText: masked, replacements };
}

/**
 * Restores masked PII in text using the stored replacement map.
 *
 * @param text - Text with placeholders
 * @param replacements - Map of placeholder to original value
 * @returns Text with original values restored
 */
export function unmaskPii(text: string, replacements: Map<string, string>): string {
  let restored = text;
  for (const [placeholder, original] of replacements.entries()) {
    restored = restored.replaceAll(placeholder, original);
  }
  return restored;
}
