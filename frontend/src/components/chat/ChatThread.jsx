import { useEffect, useRef } from 'react';
import { AIMessage, UserMessage, TypingIndicator } from './ChatMessage';
import StarterPrompts from './StarterPrompts';
import { useAuth } from '../../hooks/useAuth';

export default function ChatThread({
  messages, isTyping = false, onSelectPrompt,
  mode = 'operator', senderLabel = 'Veori Assistant',
  emptyTitle = 'How can I help you today?',
  emptySubtitle = 'Ask me anything about your leads, deals, or real estate strategy.',
  emptyIcon = '🏠',
}) {
  const bottomRef = useRef(null);
  const { user } = useAuth() || {};
  const initials = user?.full_name?.[0]?.toUpperCase() || 'U';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const isEmpty = messages.length === 0;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
      {isEmpty ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 24, padding: '0 16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{emptyIcon}</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{emptyTitle}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360 }}>{emptySubtitle}</p>
          </div>
          {onSelectPrompt && <StarterPrompts mode={mode} onSelect={onSelectPrompt} />}
        </div>
      ) : (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px' }}>
          {messages.map((m, i) => (
            m.role === 'user'
              ? <UserMessage key={i} content={m.content} initials={initials} timestamp={m.ts} />
              : <AIMessage key={i} content={m.content} senderLabel={senderLabel} isStreaming={isTyping && i === messages.length - 1} />
          ))}
          {isTyping && <TypingIndicator label={senderLabel} />}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
