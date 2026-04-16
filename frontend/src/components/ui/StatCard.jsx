export default function StatCard({ label, value, sub, color = 'var(--text-primary)', icon: Icon, trend }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {Icon && <Icon size={16} color="var(--text-muted)" />}
      </div>

      <div style={{ fontSize: 40, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value ?? '—'}
      </div>

      {(sub || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {trend && (
            <span style={{ fontSize: 12, color: trend > 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
          {sub && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}
