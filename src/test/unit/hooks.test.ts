import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnnouncer } from '@/hooks/useAnnouncer.ts';

describe('Parameter 4 & 5 — Accessibility Hooks Unit Tests', () => {
  it('useAnnouncer updates announcement after timeout delay', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAnnouncer());

    expect(result.current.announcement).toBe('');

    act(() => {
      result.current.announce('Analyzing clauses in document...');
    });

    // Before timer advances
    expect(result.current.announcement).toBe('');

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.announcement).toBe('Analyzing clauses in document...');
    vi.useRealTimers();
  });
});
