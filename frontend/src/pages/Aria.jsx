import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChatThread from '../components/chat/ChatThread';
import ChatInput from '../components/chat/ChatInput';
import { ariaChat } from '../services/api';

const DAILY_LIMIT = 20;
const STORAGE_KEY = 'aria_usage';

function getUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, date: new Date().toDateString() };
    const data = JSON.parse(raw);
    if (data.date !== new Date().toDateString()) return { count: 0, date: new Date().toDateString() };
    return data;
  } catch { return { count: 0, date: new Date().toDateString() }; }
}

function saveUsage(count) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, date: new Date().toDateString() }));
}

function UsagePill({ used, limit }) {
  const remaining = limit - used;
  const amber = remaining <= 5;
  return (
    <span style={{
      fontSize: 12, padding: '3px 10px', borderRadius: 9999,
      background: amber ? 'rgba(245,158,11,0.12)' : 'rgba(71,85,105,0.2)',
      color: amber ? 'var(--amber)' : 'var(--text-muted)',
      fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {remaining} of {limit} messages remaining today
    </span>
  );
}

function LimitCard() {
  return (
    <div style={{
      maxWidth: 380, margin: '8px auto',
      background: 'var(--bg-card)', border: '1px solid var(--border-default)',
      borderRadius: 14, padding: '24px', textAlign: 'center',
      animation: 'fade-in 0.2s ease',
    }}>
      <div style={{ fontSize: 24, marginBottom: 12 }}>✨</div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
        You've used all your free messages today
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
        Sign up free to get 50 messages per day and access to full property analysis.
      </p>
      <Link to="/register" style={{
        display: 'block', background: 'var(--blue)', color: '#fff',
        padding: '11px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14,
        textDecoration: 'none', marginBottom: 10,
      }}>
        Create Free Account
      </Link>
      <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
        Maybe Later
      </button>
    </div>
  );
}

export default function Aria() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [usage, setUsage]       = useState(getUsage);
  const [showLimit, setShowLimit] = useState(false);

  const atLimit = usage.count >= DAILY_LIMIT;

  const send = async (text) => {
    if (atLimit) { setShowLimit(true); return; }

    const userMsg = { role: 'user', content: text, ts: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsTyping(true);

    const newCount = usage.count + 1;
    saveUsage(newCount);
    setUsage({ count: newCount, date: new Date().toDateString() });
    if (newCount >= DAILY_LIMIT) setShowLimit(true);

    try {
      const apiMessages = updated.map(m => ({ role: m.role, content: m.content }));
      const res = await ariaChat(apiMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message, ts: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having a quick technical moment. What's your question about real estate?",
        ts: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-page)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff',
          }}>A</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Aria</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Free AI Real Estate Advisor</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <UsagePill used={usage.count} limit={DAILY_LIMIT} />
          <Link to="/login" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Sign in</Link>
          <Link to="/register" style={{
            fontSize: 13, fontWeight: 600, color: '#fff',
            background: 'var(--blue)', padding: '7px 14px', borderRadius: 7,
          }}>Sign up free</Link>
        </div>
      </header>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ChatThread
          messages={messages}
          isTyping={isTyping}
          onSelectPrompt={send}
          mode="aria"
          senderLabel="Aria"
          emptyTitle="Hi, I'm Aria."
          emptySubtitle="Your free AI advisor for real estate investing. Ask me anything."
          emptyIcon="🏡"
        />

        {showLimit && (
          <div style={{ padding: '0 20px 16px' }}>
            <LimitCard />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={send}
        disabled={isTyping || atLimit}
        placeholder={atLimit ? 'Sign up free to continue chatting…' : 'Ask Aria anything about real estate…'}
      />
    </div>
  );
}
