import React, { useState, useRef, useEffect } from 'react';
import './AIAssistant.css';
import { aiChatAPI } from '../../services/api';

const AIAssistant = ({ variant = 'page', onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const isPanel = variant === 'panel';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const data = await aiChatAPI.sendMessage(text, 'all');
      const reply = data.reply || data.message || '';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply || 'No response.',
          meta: data.intent ? `Intent: ${data.intent}` : null,
        },
      ]);
    } catch (e) {
      // Log the technical error for debugging, but never surface raw backend
      // errors (which may contain secrets like API keys) in the UI.
      console.error('AI assistant request failed:', e);
      setError('Agent Blux is temporarily unavailable. Please try again later.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={`ai-assistant ${isPanel ? 'ai-assistant--panel' : ''}`}>
      <header className="ai-assistant-header">
        <div className="ai-assistant-header-row">
          <h2 id={isPanel ? 'ai-assistant-dock-title' : undefined}>Agent Blux</h2>
          {isPanel && onClose && (
            <button
              type="button"
              className="ai-assistant-close"
              onClick={onClose}
              aria-label="Close Agent Blux"
            >
              ×
            </button>
          )}
        </div>
        {!isPanel && (
          <p>
            Ask about your portfolio and the market. Answers use your logged-in data and the latest
            CSE summary in the system (English only).
          </p>
        )}
        {isPanel && (
          <p className="ai-assistant-header-short">
            Portfolio &amp; market answers (English). Tap outside or press Esc to close.
          </p>
        )}
      </header>

      <div className="ai-assistant-messages" aria-live="polite">
        {messages.length === 0 && !loading && (
          <p className="ai-assistant-disclaimer" style={{ margin: 0 }}>
            Example: &quot;What are my largest holdings?&quot; or &quot;What were the top movers in the market?&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`ai-assistant-msg ${m.role}`}>
            {m.content}
            {m.meta && <div className="ai-assistant-meta">{m.meta}</div>}
          </div>
        ))}
        {loading && (
          <div className="ai-assistant-msg assistant">Thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="ai-assistant-error">{error}</p>}

      <div className="ai-assistant-form">
        <div className="ai-assistant-row">
          <textarea
            className="ai-assistant-input"
            rows={2}
            placeholder="Ask a question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <button type="button" className="ai-assistant-send" onClick={send} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
        <p className="ai-assistant-disclaimer">
          Not financial advice. Figures come from your portfolio and uploaded market data; verify important numbers in
          the app.
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
