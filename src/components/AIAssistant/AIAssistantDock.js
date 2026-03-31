import React, { useEffect } from 'react';
import AIAssistant from './AIAssistant';
import './AIAssistantDock.css';

/**
 * Floating circular button + slide-up panel. Mount once inside the main app shell (logged-in layout).
 */
const AIAssistantDock = ({ open, onOpen, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  return (
    <>
      {!open && (
        <button
          type="button"
          className="ai-assistant-fab"
          onClick={onOpen}
          aria-label="Open AI Assistant"
          title="AI Assistant"
        >
          <svg className="ai-assistant-fab-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path
              fill="currentColor"
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h10v2H7V9zm0-3h10v2H7V6zm0 6h7v2H7v-2z"
            />
          </svg>
        </button>
      )}

      {open && (
        <>
          <div className="ai-assistant-backdrop" onClick={onClose} role="presentation" />
          <div
            className="ai-assistant-dock-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-assistant-dock-title"
          >
            <AIAssistant variant="panel" onClose={onClose} />
          </div>
        </>
      )}
    </>
  );
};

export default AIAssistantDock;
