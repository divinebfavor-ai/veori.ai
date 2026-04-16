const ARIA_PROMPTS = [
  { icon: '📐', title: 'How do I calculate MAO on a deal?' },
  { icon: '🔥', title: 'What makes a seller motivated to sell?' },
  { icon: '💰', title: 'How do I find cash buyers fast?' },
  { icon: '📋', title: 'Walk me through a wholesale deal from start to finish' },
];

const OPERATOR_PROMPTS = [
  { icon: '🔥', title: 'Show me my hottest leads right now' },
  { icon: '📞', title: 'What should I follow up on today?' },
  { icon: '📊', title: 'How did my calls perform this week?' },
  { icon: '✍️', title: 'Help me write a follow up message' },
];

export default function StarterPrompts({ mode = 'aria', onSelect }) {
  const prompts = mode === 'operator' ? OPERATOR_PROMPTS : ARIA_PROMPTS;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
      maxWidth: 600, margin: '0 auto', padding: '0 16px',
    }}>
      {prompts.map((p, i) => (
        <button
          key={i}
          onClick={() => onSelect(p.title)}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
            borderRadius: 12, padding: '14px 16px',
            textAlign: 'left', cursor: 'pointer',
            transition: 'all 0.15s',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-elevated)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
        >
          <span style={{ fontSize: 18 }}>{p.icon}</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 400, lineHeight: 1.4 }}>
            {p.title}
          </span>
        </button>
      ))}
    </div>
  );
}
