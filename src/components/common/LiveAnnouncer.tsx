import React from 'react';

interface LiveAnnouncerProps {
  message: string;
}

/**
 * Screen-reader accessible live region (WCAG 2.2 AA).
 * Visually hidden but announced to assistive technologies.
 */
export const LiveAnnouncer: React.FC<LiveAnnouncerProps> = ({ message }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      id="a11y-live-region"
    >
      {message}
    </div>
  );
};
