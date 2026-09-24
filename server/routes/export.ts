import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.ts';
import { exportRequestSchema } from '../../src/lib/schemas/brief.ts';
import { LEGAL_DISCLAIMERS } from '../../src/lib/boundary/disclaimers.ts';

const router = Router();

/**
 * POST /api/export
 * Generates an accessible, structured HTML or plain text export of the analysis or brief.
 */
router.post(
  '/',
  validateBody(exportRequestSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type, format, data } = req.body;

      if (format === 'html') {
        const html = generateAccessibleHtml(type, data);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="nyayalens-${type}.html"`);
        res.send(html);
        return;
      }

      const txt = generatePlainText(type, data);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="nyayalens-${type}.txt"`);
      res.send(txt);
    } catch (err) {
      next(err);
    }
  }
);

function generateAccessibleHtml(type: string, data: Record<string, unknown>): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NyayaLens AI — ${escapeHtml(type.toUpperCase())}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #1e293b; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    .disclaimer { background: #fef2f2; border-left: 4px solid #b91c1c; padding: 1rem; margin: 1.5rem 0; font-size: 0.9rem; color: #7f1d1d; }
    .card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
    .badge-high { background: #fee2e2; color: #991b1b; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #d1fae5; color: #065f46; }
  </style>
</head>
<body>
  <header>
    <h1>NyayaLens AI — Legal Document Report</h1>
    <div class="disclaimer" role="note" aria-label="Legal disclaimer">
      <strong>Important Notice:</strong> ${LEGAL_DISCLAIMERS.exportNotice}
    </div>
  </header>
  <main>
    <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
  </main>
</body>
</html>`;
}

function generatePlainText(type: string, data: Record<string, unknown>): string {
  return `=======================================================
NYAYALENS AI — ${type.toUpperCase()} EXPORT
=======================================================

DISCLAIMER:
${LEGAL_DISCLAIMERS.exportNotice}

-------------------------------------------------------
DATA DETAILS:
-------------------------------------------------------
${JSON.stringify(data, null, 2)}
`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default router;
