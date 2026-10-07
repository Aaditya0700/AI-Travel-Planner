import { useState, useRef, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService.js';
import Spinner from './Spinner.jsx';

function TravelChatbot({ trip }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback((role, content) => {
    setMessages((prev) => [...prev, { role, content, timestamp: Date.now() }]);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();

    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);
    setError(null);
    addMessage('user', text);

    try {
      const historyForBackend = messages.map((m) => ({ role: m.role, content: m.content }));
      const reply = await chatService.sendMessage(trip.id, text, historyForBackend);
      addMessage('assistant', reply);
    } catch (err) {
      const message = err?.status === 0
        ? 'Could not reach the server. Check your connection.'
        : err?.message || 'Something went wrong. Please try again.';
      setError(message);
      addMessage('assistant', `⚠️ ${message}`);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const clearError = () => setError(null);

  return (
    <section className="chatbot-card card" aria-label="AI Travel Assistant">
      <header className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-icon" aria-hidden="true">✨</span>
          <span>AI Travel Assistant</span>
        </div>
        <span className="chatbot-trip">{trip.destination}</span>
      </header>

      <div className="chatbot-messages" role="log" aria-live="polite" aria-label="Conversation">
        {messages.length === 0 && (
          <div className="chatbot-welcome">
            <p>Hi! I can help with your <strong>{trip.destination}</strong> trip.</p>
            <p className="chatbot-suggestions">
              Ask me things like:
              <br />
              <span>• "What's my remaining budget?"</span>
              <br />
              <span>• "What should I do on Day 1?"</span>
              <br />
              <span>• "Can I afford a nice dinner?"</span>
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`chatbot-message ${msg.role}`}>
            <div className="chatbot-bubble">{msg.content}</div>
          </div>
        ))}

        {sending && (
          <div className="chatbot-message assistant">
            <div className="chatbot-bubble chatbot-loading">
              <Spinner label="" size="small" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="chatbot-error alert alert-error" role="alert">
          <span className="alert-body">{error}</span>
          <button type="button" className="alert-close" onClick={clearError} aria-label="Dismiss">×</button>
        </div>
      )}

      <form className="chatbot-input-form" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your trip..."
          disabled={sending}
          aria-label="Your message"
          maxLength={1000}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={sending || !input.trim()}
          aria-label={sending ? 'Sending...' : 'Send message'}
        >
          {sending ? <Spinner label="Sending..." size="small" /> : '➤'}
        </button>
      </form>
    </section>
  );
}

export default TravelChatbot;