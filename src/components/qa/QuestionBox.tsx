import React, { useState, useCallback } from 'react';
import { useSession } from '../../context/SessionContext.tsx';
import { useSpeech } from '../../hooks/useSpeech.ts';
import { apiClient } from '../../services/apiClient.ts';
import { QaAnswer } from '../../lib/schemas/qa.ts';
import { Send, Mic, MicOff, BookOpen, AlertOctagon, HelpCircle, Loader2 } from 'lucide-react';

interface QuestionBoxProps {
  onScrollToClause: (clauseId: string) => void;
}

export const QuestionBox: React.FC<QuestionBoxProps> = ({ onScrollToClause }) => {
  const { currentDocument, setHighlightedClauseId } = useSession();
  const { isListening, isRecognitionSupported, startListening, stopListening } = useSpeech();

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [qaAnswer, setQaAnswer] = useState<QaAnswer | null>(null);

  const handleAsk = useCallback(async (queryToAsk?: string) => {
    const q = queryToAsk || question;
    if (!q.trim() || !currentDocument) return;

    setLoading(true);
    try {
      const fullText = currentDocument.clauses.map((c) => c.original).join('\n\n');
      const res = await apiClient.askQuestion({
        question: q,
        documentText: fullText,
        clauses: currentDocument.clauses.map((c) => ({
          id: c.id,
          title: c.title,
          original: c.original,
        })),
      });

      setQaAnswer(res);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [question, currentDocument]);

  const handleCitationClick = useCallback((clauseId: string) => {
    setHighlightedClauseId(clauseId);
    onScrollToClause(clauseId);
  }, [setHighlightedClauseId, onScrollToClause]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setQuestion(transcript);
        handleAsk(transcript);
      });
    }
  }, [isListening, stopListening, startListening, handleAsk]);

  return (
    <section aria-labelledby="qa-heading" className="space-y-6">
      <div>
        <h2 id="qa-heading" className="text-xl font-bold text-slate-900 dark:text-white">
          Grounded Q&A Engine
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Every response is derived strictly from your document with cited passages. NyayaLens abstains
          rather than hallucinating.
        </p>
      </div>

      {/* Question Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="relative"
      >
        <label htmlFor="qa-input" className="sr-only">
          Ask a question about this document
        </label>
        <input
          id="qa-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What happens if I vacate early or fail to pay rent on time?"
          disabled={loading || !currentDocument}
          className="w-full pl-4 pr-24 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          {/* Voice Input Button */}
          {isRecognitionSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-2 rounded-lg border transition-colors ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title={isListening ? 'Stop listening' : 'Ask via voice input'}
              aria-label={isListening ? 'Stop voice recognition' : 'Start voice recognition'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Mic className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !question.trim() || !currentDocument}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow"
            title="Submit question"
            aria-label="Submit question"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>

      {/* Answer Card */}
      {qaAnswer && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {/* Boundary Notice If Advice-Seeking */}
          {qaAnswer.boundaryNotice && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertOctagon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{qaAnswer.boundaryNotice}</span>
            </div>
          )}

          {/* Answer Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {qaAnswer.answerable ? 'Document Finding' : 'Abstention Notice'}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  qaAnswer.confidence === 'high'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : qaAnswer.confidence === 'medium'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {qaAnswer.confidence} confidence
              </span>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
              {qaAnswer.answer}
            </p>
          </div>

          {/* Grounded Citations (Source Spans) */}
          {qaAnswer.citations.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                Verified Citations in Source Document
              </h4>
              <div className="space-y-2">
                {qaAnswer.citations.map((cite, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-xs">
                    <blockquote className="font-serif italic text-slate-700 dark:text-slate-300 border-l-2 border-indigo-500 pl-2">
                      &ldquo;{cite.quote}&rdquo;
                    </blockquote>
                    <button
                      type="button"
                      onClick={() => handleCitationClick(cite.clauseId)}
                      className="shrink-0 px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-[11px] font-semibold"
                    >
                      View Clause →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Follow-up Questions */}
          {qaAnswer.suggestedQuestions.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Suggested questions to ask your counterparty or advocate:
              </h4>
              <div className="flex flex-wrap gap-2">
                {qaAnswer.suggestedQuestions.map((sq, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setQuestion(sq);
                      handleAsk(sq);
                    }}
                    className="text-left text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
