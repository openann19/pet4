import { useEffect, useState } from 'react';

interface AnnouncerProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  clearDelay?: number;
}

/**
 * Live region announcer for screen readers
 * Announces dynamic content changes to assistive technologies
 */
export function Announcer({ 
  message, 
  politeness = 'polite',
  clearDelay = 5000 
}: AnnouncerProps): JSX.Element {
  const [announcement, setAnnouncement] = useState(message);

  useEffect(() => {
    setAnnouncement(message);
    
    if (clearDelay > 0 && message) {
      const timeout = setTimeout(() => {
        setAnnouncement('');
      }, clearDelay);
      
      return () => { clearTimeout(timeout); };
    }
    
    return (): void => {
      // No cleanup needed when clearDelay is 0 or message is empty
    };
  }, [message, clearDelay]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

/**
 * Hook for making screen reader announcements
 */
export function useAnnouncer(): {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
  announcement: string;
  politeness: 'polite' | 'assertive';
} {
  const [announcement, setAnnouncement] = useState('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');

  const announce = (message: string, level: 'polite' | 'assertive' = 'polite'): void => {
    setAnnouncement(message);
    setPoliteness(level);
    
    // Clear after 5 seconds
    setTimeout(() => {
      setAnnouncement('');
    }, 5000);
  };

  return { announce, announcement, politeness };
}
