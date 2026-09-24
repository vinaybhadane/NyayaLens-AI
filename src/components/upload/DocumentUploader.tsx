import React, { useState, useRef } from 'react';
import { useSession } from '../../context/SessionContext.tsx';
import { usePreferences } from '../../context/PreferencesContext.tsx';
import { apiClient } from '../../services/apiClient.ts';
import { verifyFileMagicBytes } from '../../lib/parsing/magicBytes.ts';
import { maskPii } from '../../lib/parsing/normalizer.ts';
import {
  SAMPLE_RENTAL_AGREEMENT,
  SAMPLE_EMPLOYMENT_CONTRACT,
} from '../../test/fixtures/agreements.ts';
import { UploadCloud, FileText, Lock, Sparkles, Loader2, AlertCircle } from 'lucide-react';

export const DocumentUploader: React.FC = () => {
  const { setCurrentDocument, setIsLoading, isLoading, setStatusMessage, piiMasked, setPiiMasked } =
    useSession();
  const { language, readingLevel } = usePreferences();

  const [pasteText, setPasteText] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async (textToAnalyze: string, title: string) => {
    if (!textToAnalyze.trim()) {
      setErrorMessage('Please enter or upload a legal document to analyze.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    setStatusMessage('Analyzing document clauses, rating risks, and verifying grounding...');

    try {
      let processedText = textToAnalyze;
      if (piiMasked) {
        const masked = maskPii(processedText);
        processedText = masked.maskedText;
      }

      const result = await apiClient.analyzeDocument({
        title: title || 'Analyzed Agreement',
        text: processedText,
        targetLanguage: language,
        readingLevel,
        piiMasked,
      });

      setCurrentDocument(result);
      setStatusMessage(`Analysis complete. Found ${result.clauses.length} structured clauses.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setErrorMessage(msg);
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    setErrorMessage('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const verification = verifyFileMagicBytes(arrayBuffer, file.name);

      if (!verification.isValid) {
        setErrorMessage(verification.error || 'Invalid file format. Only PDF, DOCX, and TXT are supported.');
        return;
      }

      // Read text content
      const text = new TextDecoder('utf-8').decode(arrayBuffer);
      setPasteText(text);
      await handleAnalyze(text, file.name);
    } catch {
      setErrorMessage('Failed to read document buffer. Please paste the text directly.');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <section
      aria-labelledby="upload-heading"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 max-w-4xl mx-auto my-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 id="upload-heading" className="text-xl font-bold text-slate-900 dark:text-white">
            Upload or Paste Legal Document
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rental agreements, employment contracts, NDAs, or notices. Processed ephemerally in memory.
          </p>
        </div>

        {/* PII Masking Switch */}
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <input
            type="checkbox"
            checked={piiMasked}
            onChange={(e) => setPiiMasked(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <span>Client-Side PII Masking</span>
        </label>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload document file. Drag and drop PDF, DOCX, or TXT here, or press enter to select file."
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <UploadCloud className="w-10 h-10 text-indigo-500 mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Drop your document here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports PDF, DOCX, TXT up to 10MB</p>
      </div>

      {/* Paste Text Area */}
      <div className="mt-4">
        <label htmlFor="document-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Document Title (optional)
        </label>
        <input
          id="document-title"
          type="text"
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          placeholder="e.g., Residential Rental Agreement 2026"
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
        />

        <label htmlFor="paste-textarea" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Or Paste Legal Text
        </label>
        <textarea
          id="paste-textarea"
          rows={5}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste clauses, terms, or entire agreement here..."
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
        />
      </div>

      {/* Action Buttons & Sample Templates */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Load sample:</span>
          <button
            type="button"
            onClick={() => {
              setDocTitle('Residential Lease Agreement');
              setPasteText(SAMPLE_RENTAL_AGREEMENT);
            }}
            className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
          >
            <FileText className="w-3 h-3 text-indigo-500" aria-hidden="true" />
            Rental Agreement
          </button>
          <button
            type="button"
            onClick={() => {
              setDocTitle('Employment Agreement');
              setPasteText(SAMPLE_EMPLOYMENT_CONTRACT);
            }}
            className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
          >
            <FileText className="w-3 h-3 text-indigo-500" aria-hidden="true" />
            Employment Contract
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleAnalyze(pasteText, docTitle)}
          disabled={isLoading || !pasteText.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Analyze Document</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
