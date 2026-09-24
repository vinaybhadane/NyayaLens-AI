import { useState, useCallback } from 'react';

/**
 * Hook for managing accessible live region announcements (WCAG 2.2 AA).
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string) => {
    // Clear first to ensure re-announcement of identical sequential messages
    setAnnouncement('');
    setTimeout(() => {
      setAnnouncement(message);
    }, 50);
  }, []);

  return { announcement, announce };
}
