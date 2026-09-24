import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/components/common/Header.tsx';
import { LegalDisclaimerBanner } from '@/components/common/LegalDisclaimerBanner.tsx';
import { LiveAnnouncer } from '@/components/common/LiveAnnouncer.tsx';
import { RiskHeatStrip } from '@/components/radar/RiskHeatStrip.tsx';
import { ClauseRadar } from '@/components/radar/ClauseRadar.tsx';
import { ClauseViewer } from '@/components/simplify/ClauseViewer.tsx';
import { DiffView } from '@/components/compare/DiffView.tsx';
import { QuestionBox } from '@/components/qa/QuestionBox.tsx';
import { PreferencesProvider } from '@/context/PreferencesContext.tsx';
import { SessionProvider } from '@/context/SessionContext.tsx';
import { ClauseAnalysis } from '@/lib/schemas/clause.ts';

const mockClauses: ClauseAnalysis[] = [
  {
    id: 'clause-1',
    type: 'payment',
    title: 'Clause 1: Rent Payment',
    original: 'Monthly rent is INR 25,000 payable on 5th of each month.',
    plain: {
      en: 'You must pay 25,000 rent by the 5th of each month.',
      hi: 'आपको हर महीने की 5 तारीख तक 25,000 किराया देना होगा।',
      mr: 'तुम्हाला प्रत्येक महिन्याच्या 5 तारखेपर्यंत 25,000 भाडे द्यावे लागेल.',
    },
    risk: 'low',
    riskReason: 'Standard payment clause.',
    obligations: [{ party: 'Tenant', action: 'Pay rent' }],
    options: [{ category: 'clarify', title: 'Payment method', description: 'Ask for bank details' }],
    spans: [{ clauseId: 'clause-1', start: 0, end: 20, quote: 'Monthly rent is INR 25,000' }],
    verified: true,
  },
  {
    id: 'clause-2',
    type: 'indemnity',
    title: 'Clause 2: Indemnity & Liability',
    original: 'Tenant shall indemnify Landlord from all claims.',
    plain: {
      en: 'Tenant pays for all legal damages.',
      hi: 'किरायेदार सभी नुकसान की भरपाई करेगा।',
      mr: 'भाडेकरू सर्व नुकसानीची भरपाई करेल.',
    },
    risk: 'high',
    riskReason: 'Unilateral indemnity clause.',
    obligations: [{ party: 'Tenant', action: 'Indemnify landlord' }],
    options: [{ category: 'negotiate', title: 'Limit liability', description: 'Cap indemnity' }],
    spans: [{ clauseId: 'clause-2', start: 0, end: 25, quote: 'Tenant shall indemnify' }],
    verified: true,
  },
];

describe('Parameter 4 & 5 — Component & Accessibility Tests (12 tests)', () => {
  // 1. Skip-to-content link
  it('1. header renders visible skip-to-content link for keyboard users', () => {
    render(
      <PreferencesProvider>
        <SessionProvider>
          <Header />
        </SessionProvider>
      </PreferencesProvider>
    );
    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  // 2. Language switch in Header
  it('2. header allows switching language between EN, Hindi, and Marathi', () => {
    render(
      <PreferencesProvider>
        <SessionProvider>
          <Header />
        </SessionProvider>
      </PreferencesProvider>
    );
    const hiBtn = screen.getByText('हिन्दी');
    fireEvent.click(hiBtn);
    expect(hiBtn).toHaveAttribute('aria-pressed', 'true');
  });

  // 3. Reading level toggle in Header
  it('3. reading level toggle updates selection across simple, standard, and detailed', () => {
    render(
      <PreferencesProvider>
        <SessionProvider>
          <Header />
        </SessionProvider>
      </PreferencesProvider>
    );
    const simpleBtn = screen.getByText('simple');
    fireEvent.click(simpleBtn);
    expect(simpleBtn).toHaveAttribute('aria-pressed', 'true');
  });

  // 4. LegalDisclaimerBanner displays disclaimer and NALSA helpline
  it('4. displays persistent disclaimer and accessible NALSA legal aid helpline 15100', () => {
    render(<LegalDisclaimerBanner />);
    expect(screen.getByText(/Free Legal Aid \(NALSA 15100\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Legal Information Notice:/i)).toBeInTheDocument();
  });

  // 5. Expandable Legal Aid Directory in LegalDisclaimerBanner
  it('5. legal aid button expands the detailed legal aid directory', () => {
    render(<LegalDisclaimerBanner />);
    const btn = screen.getByRole('button', { name: /Free Legal Aid/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/District Legal Services Authority/i)).toBeInTheDocument();
  });

  // 6. LiveAnnouncer polite aria-live region
  it('6. LiveAnnouncer renders role="status" and aria-live="polite" for screen-readers', () => {
    render(<LiveAnnouncer message="Analyzing document..." />);
    const region = document.getElementById('a11y-live-region');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Analyzing document...');
  });

  // 7. RiskHeatStrip keyboard navigation
  it('7. RiskHeatStrip allows keyboard navigation via ArrowRight / ArrowLeft', () => {
    const onSelect = vi.fn();
    render(
      <RiskHeatStrip
        clauses={mockClauses}
        onSelectClause={onSelect}
      />
    );
    const svgRegion = screen.getByRole('region', { name: /Visual document risk heat strip/i });
    expect(svgRegion).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    fireEvent.keyDown(buttons[0]!, { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenCalled();
  });

  // 8. ClauseRadar risk filter
  it('8. ClauseRadar filters clauses by risk level (high, medium, low)', () => {
    const onSelect = vi.fn();
    render(
      <ClauseRadar
        clauses={mockClauses}
        onSelectClause={onSelect}
      />
    );
    expect(screen.getByText(/Clause 1: Rent Payment/i)).toBeInTheDocument();
    expect(screen.getByText(/Clause 2: Indemnity & Liability/i)).toBeInTheDocument();

    const riskSelect = screen.getByLabelText(/Filter Risk:/i);
    fireEvent.change(riskSelect, { target: { value: 'high' } });

    expect(screen.queryByText(/Clause 1: Rent Payment/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Clause 2: Indemnity & Liability/i)).toBeInTheDocument();
  });

  // 9. ClauseViewer split view and text-to-speech button
  it('9. ClauseViewer renders original text, plain rewrite, and text-to-speech button', () => {
    render(
      <PreferencesProvider>
        <ClauseViewer clauses={mockClauses} />
      </PreferencesProvider>
    );
    expect(screen.getAllByText(/Original Contract Text/i).length).toBe(2);
    expect(screen.getAllByText(/Plain Language Explanation/i).length).toBe(2);
    expect(screen.getByLabelText(/Read plain language rewrite of Clause 1/i)).toBeInTheDocument();
  });

  // 10. Jargon tooltip in ClauseViewer
  it('10. ClauseViewer provides accessible jargon tooltips for complex legal terms', () => {
    render(
      <PreferencesProvider>
        <ClauseViewer clauses={mockClauses} />
      </PreferencesProvider>
    );
    const termBtn = screen.getByRole('button', { name: /indemnify/i });
    expect(termBtn).toBeInTheDocument();
    expect(termBtn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(termBtn);
    expect(termBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  // 11. DiffView renders compare controls
  it('11. DiffView renders original and revised document input panes', () => {
    render(
      <SessionProvider>
        <DiffView />
      </SessionProvider>
    );
    expect(screen.getByLabelText(/Original Document Version/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Revised Document Version/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run Compare/i })).toBeInTheDocument();
  });

  // 12. QuestionBox renders input and submit button
  it('12. QuestionBox provides accessible input with question placeholder', () => {
    const onScroll = vi.fn();
    render(
      <SessionProvider>
        <QuestionBox onScrollToClause={onScroll} />
      </SessionProvider>
    );
    const input = screen.getByPlaceholderText(/What happens if I vacate early/i);
    expect(input).toBeInTheDocument();
    expect(screen.getByLabelText(/Submit question/i)).toBeInTheDocument();
  });
});
