import '@testing-library/jest-dom';

// Mock Web Speech API SpeechSynthesis
if (typeof window !== 'undefined') {
  window.speechSynthesis = {
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    getVoices: () => [],
    pending: false,
    speaking: false,
    paused: false,
    onvoiceschanged: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };

  // Mock window.scrollTo
  window.scrollTo = () => {};

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
