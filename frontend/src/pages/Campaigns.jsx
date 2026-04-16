import { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import { ScoreBadge } from '../components/ui/Badge';
import { getCampaigns, createCampaign, startCampaign, pauseCampaign, stopCampaign, getCampaignStats, getPhoneHealth } from '../services/api';
import { Zap, Pause, Square, Plus, ChevronRight, Activity } from 'lucide-react';

function PhoneHealthCard({ pn }) {
  const pct = Math.round(((pn.daily_calls_made || 0) / (pn.daily_call_limit || 50)) * 100);
  const statusColor = pn.available ? 'var(--green)' : pn.health_status === 'cooling' ? 'var(--amber)' : 'var(--red)';
  const scoreColor = (pn.spam_score || 100) >= 70 ? 'var(--green)' : (pn.spam_score || 100) >= 40 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ background: 'var(--bg-card-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{pn.friendly_name || pn.number}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pn.state || 'Unknown'} · {pn.area_code}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: scoreColor }}>{pn.spam_score || 100}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>health</div>
        </div>
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>Calls today</span><span>{pn.daily_calls_made || 0} / {pn.daily_call_limit || 50}</span>
        </div>
        <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? 'var(--amber)' : 'var(--blue)', borderRadius: 2, transition: 'width 0.4s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: statusColor, textTransform: 'capitalize' }}>
          {pn.health_status === 'healthy' ? 'Active' : pn.health_status === 'cooling' ? 'Cooling Down' : pn.health_status === 'limit_reached' ? 'Limit Reached' : 'Flagged'}
        </span>
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '', concurrent_lines: 3, daily_limit_per_number: 50,
    calling_hours_start: '09:00', calling_hours_end: '20:00',
    retry_attempts: 3, call_delay_seconds: 3, daily_spend_limit: 100,
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const callsPerHour = form.concurrent_lines * 20;

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await createCampaign(form);
      onCreate();
      onClose();
    } catch { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, width: '90%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>New Campaign</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Campaign Name</label>
              <input value={form.name} onChange={set('name')} required placeholder="e.g. Texas Leads Q1" style={{ padding: '10px 14px', fontSize: 14, borderRadius: 8 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Concurrent Lines: <strong style={{ color: 'var(--text-primary)' }}>{form.concurrent_lines}</strong>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (~{form.concurrent_lines * 20} calls/hr)</span>
              </label>
              <input type="range" min="1" max="5" value={form.concurrent_lines} onChange={set('concurrent_lines')} style={{ width: '100%', accentColor: 'var(--blue)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>1 line</span><span>5 lines</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Start Time</label>
                <input type="time" value={form.calling_hours_start} onChange={set('calling_hours_start')} style={{ padding: '10px 14px', fontSize: 14, borderRadius: 8 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>End Time</label>
                <input type="time" value={form.calling_hours_end} onChange={set('calling_hours_end')} style={{ padding: '10px 14px', fontSize: 14, borderRadius: 8 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { key: 'daily_limit_per_number', label: 'Daily Limit / Number', ph: '50' },
                { key: 'retry_attempts', label: 'Retry Attempts', ph: '3' },
                { key: 'call_delay_seconds', label: 'Delay (sec)', ph: '3' },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{f.label}</label>
                  <input type="number" value={form[f.key]} onChange={set(f.key)} placeholder={f.ph} style={{ padding: '10px 14px', fontSize: 14, borderRadius: 8 }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Daily Spend Limit ($)</label>
              <input type="number" value={form.daily_spend_limit} onChange={set('daily_spend_limit')} placeholder="100" style={{ padding: '10px 14px', fontSize: 14, borderRadius: 8 }} />
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
              <Button type="button" variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
              <Button type="submit" loading={loading} fullWidth>Create Campaign</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [phones, setPhones]       = useState([]);
  const [creating, setCreating]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const load = () => {
    Promise.all([getCampaigns(), getPhoneHealth()])
      .then(([c, p]) => { setCampaigns(c.data.campaigns || []); setPhones(p.data.numbers || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const action = async (fn, id, key) => {
    setActionLoading(a => ({ ...a, [key]: true }));
    await fn(id).catch(() => {});
    setActionLoading(a => ({ ...a, [key]: false }));
    load();
  };

  const statusColor = (s) => ({ active: 'var(--green)', paused: 'var(--amber)', completed: 'var(--text-muted)', draft: 'var(--blue)' })[s] || 'var(--text-muted)';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Campaigns</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setCreating(true)} style={{ gap: 6 }}>
          <Plus size={14} /> New Campaign
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* Campaign list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0', fontSize: 14 }}>Loading…</div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Zap size={36} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No campaigns yet</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Create your first campaign to start calling leads.</p>
            </div>
          ) : campaigns.map(c => (
            <div key={c.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: '20px 22px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(c.status) }} />
                    <span style={{ fontSize: 12, color: statusColor(c.status), textTransform: 'capitalize' }}>{c.status}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {c.concurrent_lines || 3} lines · {c.calling_hours_start}–{c.calling_hours_end}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {c.status === 'draft' || c.status === 'paused' ? (
                    <Button size="sm" onClick={() => action(startCampaign, c.id, `start-${c.id}`)} loading={actionLoading[`start-${c.id}`]} style={{ gap: 5 }}>
                      <Zap size={12} /> Start
                    </Button>
                  ) : c.status === 'active' ? (
                    <>
                      <Button size="sm" variant="warning" onClick={() => action(pauseCampaign, c.id, `pause-${c.id}`)} loading={actionLoading[`pause-${c.id}`]} style={{ gap: 5 }}>
                        <Pause size={12} /> Pause
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => action(stopCampaign, c.id, `stop-${c.id}`)} loading={actionLoading[`stop-${c.id}`]} style={{ gap: 5 }}>
                        <Square size={12} /> Stop
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                  <span>Progress</span>
                  <span>{c.leads_called || 0} / {c.total_leads || 0} leads</span>
                </div>
                <div style={{ height: 5, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${c.total_leads > 0 ? Math.round((c.leads_called / c.total_leads) * 100) : 0}%`,
                    background: 'var(--blue)', borderRadius: 3, transition: 'width 0.5s',
                  }} />
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
                {[
                  { label: 'Answered',    val: c.leads_answered || 0 },
                  { label: 'Offers',      val: c.offers_made || 0 },
                  { label: 'Contracts',   val: c.contracts_sent || 0 },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Phone health sidebar */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
            Phone Number Health
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {phones.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No phone numbers added yet.</div>
            ) : phones.map(pn => <PhoneHealthCard key={pn.id} pn={pn} />)}
          </div>
        </div>
      </div>

      {creating && <CreateModal onClose={() => setCreating(false)} onCreate={load} />}
    </div>
  );
}
