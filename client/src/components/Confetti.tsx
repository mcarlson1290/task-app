import React from "react";

// Confetti component that can be triggered programmatically
const Confetti: React.FC = () => {
  React.useEffect(() => {
    // Load confetti library from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
};

export default Confetti;
