import { useState } from 'react';
import { X, Minus } from 'lucide-react';
import ChatThread from './ChatThread';
import ChatInput from './ChatInput';
import { assistantChat } from '../../services/api';

export default function AssistantPanel({ onClose }) {
  const [messages, setMessages]   = useState([]);
  const [isTyping, setIsTyping]   = useState(false);
  const [minimized, setMinimized] = useState(false);

  const sendMessage = async (text) => {
    const userMsg = { role: 'user', content: text, ts: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsTyping(true);

    try {
      // Convert to Anthropic message format
      const apiMessages = updated.map(m => ({ role: m.role, content: m.content }));
      const res = await assistantChat(apiMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message, ts: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having a moment. Please try again.",
        ts: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      className="animate-slide-right"
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, zIndex: 200,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>V</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Veori Assistant</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your real estate advisor</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMinimized(o => !o)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4 }}>
            <Minus size={16} />
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4 }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <ChatThread
            messages={messages}
            isTyping={isTyping}
            onSelectPrompt={sendMessage}
            mode="operator"
            senderLabel="Veori Assistant"
            emptyTitle="How can I help you today?"
            emptySubtitle="Ask about your leads, deals, call performance, or get deal analysis."
            emptyIcon="🏠"
          />
          <ChatInput
            onSend={sendMessage}
            disabled={isTyping}
            placeholder="Ask about your leads, deals, strategy…"
          />
        </>
      )}
    </div>
  );
}
