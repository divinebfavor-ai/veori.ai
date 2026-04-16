export default function Button({
  children, onClick, variant = 'primary', size = 'md',
  disabled = false, loading = false, style = {}, type = 'button', fullWidth = false
}) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'var(--font)', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', borderRadius: 'var(--radius-md)',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '9px 16px', fontSize: 14 },
    lg: { padding: '12px 20px', fontSize: 15 },
  };

  const variants = {
    primary: { background: 'var(--blue)', color: '#fff' },
    secondary: { background: 'var(--bg-card-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
    danger:  { background: 'var(--red)', color: '#fff' },
    warning: { background: 'var(--amber)', color: '#fff' },
    ghost:   { background: 'transparent', color: 'var(--text-secondary)' },
    success: { background: 'var(--green)', color: '#fff' },
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = disabled ? '0.5' : '1'; }}
    >
      {loading ? (
        <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      ) : children}
    </button>
  );
}
