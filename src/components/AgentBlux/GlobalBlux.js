import React, { useCallback } from 'react';
import AgentBlux from './AgentBlux';
import { useAgentStatus } from '../../hooks/useAgentStatus';
import { useBluxSignal } from '../../hooks/useBluxSignal';
import './GlobalBlux.css';

/**
 * Always-on floating Agent Blux mascot. Rendered once at the app root so it
 * stays pinned to the bottom-right corner regardless of which screen/tab the
 * user is on. Clicking it opens the AI Assistant dock.
 */
const GlobalBlux = ({ onOpenAIAssistant, holdingSymbols = [] }) => {
  const { name, status, patchStatus } = useAgentStatus({ pollMs: 4000 });

  // Keep the backend status fresh from CSE market sentiment (market-wide when
  // no holdings are supplied at the app level).
  useBluxSignal({ holdingSymbols, patchStatus, enabled: true });

  const interactive = typeof onOpenAIAssistant === 'function';

  const handleClick = useCallback(() => {
    if (interactive) onOpenAIAssistant();
  }, [interactive, onOpenAIAssistant]);

  return (
    <div className="global-blux">
      <div className="global-blux__avatar">
        <AgentBlux
          name={name}
          status={status}
          size={240}
          onChat={interactive ? handleClick : undefined}
        />
      </div>
    </div>
  );
};

export default GlobalBlux;
