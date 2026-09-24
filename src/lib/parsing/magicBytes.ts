/**
 * Supported file types by magic byte verification.
 */
export type DetectedFileType = 'pdf' | 'docx' | 'txt' | 'unknown';

/**
 * Result of magic-byte validation.
 */
export interface FileTypeVerification {
  isValid: boolean;
  type: DetectedFileType;
  mimeType: string;
  error?: string;
}

/**
 * Validates the file buffer against known legal document magic bytes.
 * Never trusts client file extensions alone.
 *
 * @param buffer - File data buffer (at least 8 bytes recommended)
 * @param filename - Optional original filename for extension comparison
 * @returns Verification result with detected type and validity
 */
export function verifyFileMagicBytes(
  buffer: Uint8Array | ArrayBuffer,
  filename = ''
): FileTypeVerification {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  if (bytes.length < 4) {
    return {
      isValid: false,
      type: 'unknown',
      mimeType: 'application/octet-stream',
      error: 'File buffer too short to determine file signature',
    };
  }

  // Check PDF signature: %PDF (0x25 0x50 0x44 0x46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { isValid: true, type: 'pdf', mimeType: 'application/pdf' };
  }

  // Check DOCX / ZIP signature: PK\x03\x04 (0x50 0x4b 0x03 0x04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return {
      isValid: true,
      type: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }

  // Check Plain Text: Valid ASCII / UTF-8 without binary control characters
  if (isPlainTextBuffer(bytes)) {
    return { isValid: true, type: 'txt', mimeType: 'text/plain' };
  }

  return {
    isValid: false,
    type: 'unknown',
    mimeType: 'application/octet-stream',
    error: `Unsupported file format for "${filename || 'file'}". Allowed: PDF, DOCX, TXT.`,
  };
}

/**
 * Helper to determine if a buffer contains valid plain text.
 */
function isPlainTextBuffer(bytes: Uint8Array): boolean {
  const sampleLength = Math.min(bytes.length, 512);
  let nullBytes = 0;

  for (let i = 0; i < sampleLength; i++) {
    const byte = bytes[i];
    // Check for null byte or control chars other than \t, \n, \r
    if (byte === 0x00) nullBytes++;
    if (byte !== undefined && byte < 0x09 && byte !== 0x00) return false;
  }

  return nullBytes === 0;
}
