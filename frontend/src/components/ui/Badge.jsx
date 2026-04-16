export default function Badge({ label, color = 'default', dot = true, size = 'sm' }) {
  const colors = {
    default: { bg: 'rgba(71,85,105,0.3)', text: '#94A3B8', dot: '#475569' },
    green:   { bg: 'rgba(16,185,129,0.15)', text: '#10B981', dot: '#10B981' },
    amber:   { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', dot: '#F59E0B' },
    red:     { bg: 'rgba(239,68,68,0.15)',  text: '#EF4444', dot: '#EF4444' },
    blue:    { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6', dot: '#3B82F6' },
    orange:  { bg: 'rgba(249,115,22,0.15)', text: '#F97316', dot: '#F97316' },
  };
  const c = colors[color] || colors.default;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.text,
      fontSize: size === 'sm' ? 11 : 13,
      fontWeight: 500,
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: 9999,
      whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

// Motivation score badge
export function ScoreBadge({ score }) {
  if (!score && score !== 0) return <Badge label="Unscored" color="default" />;
  const color = score >= 70 ? 'green' : score >= 40 ? 'amber' : 'default';
  return <Badge label={score} color={color} />;
}

// Lead status badge
export function StatusBadge({ status }) {
  const map = {
    new:             { label: 'New',             color: 'blue'    },
    calling:         { label: 'Calling',         color: 'amber'   },
    contacted:       { label: 'Contacted',       color: 'default' },
    interested:      { label: 'Interested',      color: 'green'   },
    appointment_set: { label: 'Appt Set',        color: 'green'   },
    offer_made:      { label: 'Offer Made',      color: 'orange'  },
    under_contract:  { label: 'Under Contract',  color: 'orange'  },
    closed:          { label: 'Closed',          color: 'green'   },
    dnc:             { label: 'DNC',             color: 'red'     },
    dead:            { label: 'Dead',            color: 'red'     },
  };
  const entry = map[status] || { label: status, color: 'default' };
  return <Badge label={entry.label} color={entry.color} />;
}
