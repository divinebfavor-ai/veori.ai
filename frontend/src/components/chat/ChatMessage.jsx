import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function AIMessage({ content, senderLabel = 'Veori Assistant', isStreaming = false }) {
  return (
    <div style={{ display: 'flex', gap: 12, animation: 'fade-in 0.2s ease forwards', marginBottom: 20 }}>
      {/* AI icon */}
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff',
        }}>V</div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Sender label */}
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
          {senderLabel}
        </div>

        {/* Message body — plain text on background, full markdown support */}
        <div style={{
          fontSize: 14, lineHeight: 1.75, color: 'var(--text-primary)',
          fontWeight: 400,
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p style={{ marginBottom: 12 }}>{children}</p>,
              strong: ({ children }) => <strong style={{ fontWeight: 600, color: '#fff' }}>{children}</strong>,
              em: ({ children }) => <em style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{children}</em>,
              ul: ({ children }) => <ul style={{ marginLeft: 20, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ marginLeft: 20, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</ol>,
              li: ({ children }) => <li style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}>{children}</li>,
              h1: ({ children }) => <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#fff' }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#fff' }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#fff' }}>{children}</h3>,
              code: ({ inline, children }) => inline
                ? <code style={{ background: 'var(--bg-card-elevated)', padding: '1px 6px', borderRadius: 4, fontSize: 13, fontFamily: 'monospace', color: '#93c5fd' }}>{children}</code>
                : <pre style={{ background: 'var(--bg-card-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 16px', margin: '8px 0', overflowX: 'auto' }}>
                    <code style={{ fontFamily: 'monospace', fontSize: 13, color: '#93c5fd' }}>{children}</code>
                  </pre>,
              blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid var(--blue)', paddingLeft: 12, margin: '8px 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{children}</blockquote>,
              table: ({ children }) => <div style={{ overflowX: 'auto', margin: '8px 0' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>{children}</table></div>,
              th: ({ children }) => <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 12 }}>{children}</th>,
              td: ({ children }) => <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>{children}</td>,
              hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '12px 0' }} />,
            }}
          >
            {content}
          </ReactMarkdown>
          {isStreaming && (
            <span style={{ display: 'inline-block', width: 2, height: 16, background: 'var(--blue)', marginLeft: 2, animation: 'blink 0.8s ease infinite', verticalAlign: 'middle' }} />
          )}
        </div>
      </div>
    </div>
  );
}

export function UserMessage({ content, initials = 'U', timestamp }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, animation: 'fade-in 0.2s ease forwards', marginBottom: 20 }}>
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{
          background: 'var(--blue-dim)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '18px 18px 4px 18px',
          fontSize: 14,
          lineHeight: 1.6,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}>
          {content}
        </div>
        {timestamp && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(timestamp)}</span>
        )}
      </div>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--bg-card-elevated)', border: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
        }}>{initials}</div>
      </div>
    </div>
  );
}

export function TypingIndicator({ label = 'Veori Assistant' }) {
  return (
    <div style={{ display: 'flex', gap: 12, animation: 'fade-in 0.2s ease forwards', marginBottom: 20 }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff',
        }}>V</div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
          {label}
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 20 }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--text-muted)',
              animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
