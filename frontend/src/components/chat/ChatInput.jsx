import { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ChatInput({ onSend, disabled = false, placeholder = 'Message Veori Assistant…' }) {
  const [text, setText] = useState('');
  const ref = useRef(null);

  // Auto-resize textarea up to 5 lines
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineH = 22;
    const maxH = lineH * 5 + 28;
    el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  }, [text]);

  const send = () => {
    const msg = text.trim();
    if (!msg || disabled) return;
    setText('');
    onSend(msg);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{
      padding: '12px 16px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
    }}>
      <div style={{
        position: 'relative',
        background: 'var(--bg-page)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        transition: 'border-color 0.15s',
      }}
      onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--blue)'}
      onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
      >
        <textarea
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKey}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          style={{
            width: '100%',
            padding: '14px 52px 14px 16px',
            background: 'transparent',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            color: 'var(--text-primary)',
            resize: 'none',
            display: 'block',
            lineHeight: '22px',
            outline: 'none',
            boxShadow: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || disabled}
          style={{
            position: 'absolute', right: 10, bottom: 10,
            width: 32, height: 32, borderRadius: 8,
            background: text.trim() && !disabled ? 'var(--blue)' : 'var(--bg-card-elevated)',
            border: 'none', cursor: text.trim() && !disabled ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >
          <ArrowUp size={16} color={text.trim() && !disabled ? '#fff' : 'var(--text-muted)'} />
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  );
}
