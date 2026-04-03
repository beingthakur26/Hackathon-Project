import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Atom } from 'lucide-react';
import { useAgentStore } from '../features/agent/useAgentStore';
import { Button } from '../ui/components/Button';
import { FadeIn } from '../ui/animations/FadeIn';
import './AgentPage.css';

const SUGGESTIONS = [
  'What makes a compound toxic?',
  'Explain the TPSA descriptor',
  'What is Lipinski\'s Rule of Five?',
  'Suggest a safer analogue for aspirin',
];

const AgentPage: React.FC = () => {
  const { messages, loading, sendMessage, clear } = useAgentStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    await sendMessage(text);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="agent-page">
      <div className="container">
        <FadeIn>
          <div className="page-header page-header--split">
            <h1 className="page-title">AI <em>Agent</em>.</h1>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" icon={<Trash2 size={15} />} onClick={clear} className="clear-chat-btn">
                Clear Session
              </Button>
            )}
          </div>
        </FadeIn>

        <div className="agent-chat-layout">
          <div className="chat-viewport">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <div className="empty-icon"><Atom size={40} /></div>
                <h3>Ask about toxicity, descriptors, or structures.</h3>
                <div className="suggestion-list">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="suggestion-item" onClick={() => setInput(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="messages-list">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      className={`message-row is-${msg.role}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="message-bubble">
                        <div className="message-text">{msg.content}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <div className="message-row is-assistant">
                    <div className="message-bubble is-loading">
                      <span className="dot" /><span className="dot" /><span className="dot" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="chat-input-wrapper">
            <div className="input-container">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Message ToxinAI Agent..."
                rows={1}
              />
              <button 
                className="send-button" 
                onClick={handleSend} 
                disabled={!input.trim() || loading}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
