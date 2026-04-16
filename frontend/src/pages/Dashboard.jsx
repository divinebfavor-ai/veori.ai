import { useState, useEffect } from 'react';
import StatCard from '../components/ui/StatCard';
import { StatusBadge, ScoreBadge } from '../components/ui/Badge';
import { getDashboardStats, getLiveCalls } from '../services/api';
import { Users, Phone, Flame, Calendar, FileText, DollarSign, Activity } from 'lucide-react';

function fmt(n) {
  if (!n) return '0';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
  return n.toString();
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [live, setLive]   = useState([]);

  useEffect(() => {
    getDashboardStats().then(r => setStats(r.data)).catch(() => {});
    const poll = () => getLiveCalls().then(r => setLive(r.data.calls || [])).catch(() => {});
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  const pipeline = [
    { label: 'New Leads',     count: stats?.totalLeads || 0,        color: 'var(--blue)'  },
    { label: 'Contacted',     count: stats?.contacted || 0,         color: 'var(--text-secondary)' },
    { label: 'Interested',    count: stats?.interested || 0,        color: 'var(--amber)' },
    { label: 'Appt Set',      count: stats?.totalAppointments || 0, color: 'var(--orange)' },
    { label: 'Under Contract',count: stats?.totalDeals || 0,        color: 'var(--green)' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Leads"        value={stats?.totalLeads ?? '—'}        icon={Users}     />
        <StatCard label="Calls Today"        value={stats?.callsToday ?? '—'}        icon={Phone}     />
        <StatCard label="Hot Leads"          value={stats?.hotLeads ?? '—'}          icon={Flame}     color="var(--orange)" />
        <StatCard label="Appts Today"        value={stats?.totalAppointments ?? '—'} icon={Calendar}  color="var(--amber)" />
        <StatCard label="Under Contract"     value={stats?.totalDeals ?? '—'}        icon={FileText}  color="var(--green)" />
        <StatCard label="Revenue This Month" value={fmt(stats?.totalRevenue)}         icon={DollarSign} color="var(--green)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
        {/* Live call feed */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={15} color="var(--text-muted)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Live Calls</span>
            </div>
            {live.length > 0 && (
              <span style={{
                background: 'rgba(239,68,68,0.15)', color: 'var(--red)',
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999,
                animation: 'blink 1.5s ease infinite',
              }}>
                {live.length} ACTIVE
              </span>
            )}
          </div>

          {live.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No active calls right now
            </div>
          ) : (
            <div>
              {live.map(call => (
                <div key={call.id} style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  {/* Waveform animation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    {[0,1,2,3,4].map(i => (
                      <span key={i} style={{
                        width: 3, borderRadius: 2,
                        background: 'var(--green)',
                        animation: `waveform 0.8s ease ${i * 0.1}s infinite`,
                        display: 'block',
                      }} />
                    ))}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {call.leads?.first_name} {call.leads?.last_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {call.leads?.property_address}
                    </div>
                  </div>

                  <ScoreBadge score={call.motivation_score} />

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {timeAgo(call.started_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline funnel */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: '20px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
            Pipeline Funnel
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pipeline.map(({ label, count, color }) => {
              const max = Math.max(...pipeline.map(p => p.count), 1);
              const pct = (count / max) * 100;
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, background: color,
                      borderRadius: 3, transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Activity</span>
        </div>
        <div style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
          Activity will appear here as calls are made and deals are updated.
        </div>
      </div>
    </div>
  );
}
