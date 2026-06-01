import React, { useEffect } from 'react';
import AIAssistant from './AIAssistant';
import './AIAssistantDock.css';

/**
 * Slide-up AI Assistant panel. The previous floating launcher button was
 * removed; the panel is opened externally (e.g. by Agent Blux) via the
 * `open` prop.
 */
const AIAssistantDock = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
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
  );
};

export default AIAssistantDock;
