import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import { getPhoneNumbers, addPhoneNumber, updatePhoneNumber, deletePhoneNumber } from '../services/api';
import { Eye, EyeOff, Plus, Trash2, Phone, Shield, Bell, CreditCard, Key, User } from 'lucide-react';

const TABS = [
  { key: 'account',  label: 'Account',    icon: User     },
  { key: 'api',      label: 'API Keys',   icon: Key      },
  { key: 'numbers',  label: 'Phone Numbers', icon: Phone },
  { key: 'compliance', label: 'Compliance', icon: Shield },
  { key: 'billing',  label: 'Billing',    icon: CreditCard },
];

function ApiKeyRow({ label, envKey, value }) {
  const [show, setShow] = useState(false);
  const masked = value ? '•'.repeat(24) + (value.slice(-4) || '') : 'Not configured';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{envKey}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: value ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
          {show ? (value || 'Not set') : masked}
        </span>
        <button onClick={() => setShow(s => !s)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

function PhoneTab() {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);
  const [form, setForm]       = useState({ number: '', friendly_name: '', state: '', area_code: '' });

  const load = () => getPhoneNumbers().then(r => { setNumbers(r.data.phone_numbers || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    await addPhoneNumber(form).catch(() => {});
    setAdding(false); setForm({ number: '', friendly_name: '', state: '', area_code: '' }); load();
  };

  const toggle = async (pn) => {
    await updatePhoneNumber(pn.id, { is_active: !pn.is_active }).catch(() => {});
    load();
  };

  const scoreColor = (s) => s >= 70 ? 'var(--green)' : s >= 40 ? 'var(--amber)' : 'var(--red)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage your calling numbers and monitor their health.</p>
        <Button onClick={() => setAdding(a => !a)} size="sm" style={{ gap: 5 }}>
          <Plus size={13} /> Add Number
        </Button>
      </div>

      {adding && (
        <form onSubmit={add} style={{ background: 'var(--bg-card-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '16px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          {[
            { key: 'number', label: 'Number', ph: '+15551234567', required: true },
            { key: 'friendly_name', label: 'Friendly Name', ph: 'Texas Line 1' },
            { key: 'state', label: 'State', ph: 'TX' },
            { key: 'area_code', label: 'Area Code', ph: '512' },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.label}</label>
              <input required={f.required} value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} placeholder={f.ph} style={{ padding: '8px 12px', fontSize: 13, borderRadius: 7, width: 160 }} />
            </div>
          ))}
          <Button type="submit" size="sm">Save</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
        </form>
      )}

      {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div> : numbers.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No phone numbers added yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {numbers.map(pn => (
            <div key={pn.id} style={{ background: 'var(--bg-card-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{pn.friendly_name || pn.number}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pn.number} · {pn.state || '?'} · Area {pn.area_code || '?'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: scoreColor(pn.spam_score || 100) }}>{pn.spam_score || 100}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>health</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{pn.daily_calls_made || 0}/{pn.daily_call_limit || 50}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>today</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => toggle(pn)} style={{
                  width: 40, height: 22, borderRadius: 11, cursor: 'pointer', border: 'none',
                  background: pn.is_active ? 'var(--blue)' : 'var(--border-default)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', top: 2, left: pn.is_active ? 20 : 2,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </button>
                <button onClick={async () => { await deletePhoneNumber(pn.id).catch(() => {}); load(); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState('account');
  const { user } = useAuth();

  const planLimits = { free: 50, hustle: 200, grind: 500, empire: 2000, dynasty: '∞' };
  const callsPct = user ? Math.round(((user.calls_used || 0) / (user.calls_limit || 500)) * 100) : 0;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 28 }}>Settings</h1>

      <div style={{ display: 'flex', gap: 28 }}>
        {/* Tab nav */}
        <div style={{ width: 180, flexShrink: 0 }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 8, border: 'none',
              background: tab === key ? 'rgba(59,130,246,0.1)' : 'transparent',
              color: tab === key ? 'var(--blue)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s',
              marginBottom: 2,
            }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '24px' }}>
          {tab === 'account' && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Account Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Full Name',    val: user?.full_name     },
                  { label: 'Email',        val: user?.email         },
                  { label: 'Company',      val: user?.company_name  },
                  { label: 'Plan',         val: (user?.plan || 'hustle').charAt(0).toUpperCase() + (user?.plan || 'hustle').slice(1) },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{r.val || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'api' && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>API Keys</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>These are set as environment variables on your Railway backend.</p>
              {[
                { label: 'Anthropic API Key',  key: 'ANTHROPIC_API_KEY'         },
                { label: 'Vapi API Key',        key: 'VAPI_API_KEY'              },
                { label: 'ElevenLabs Key',      key: 'ELEVENLABS_API_KEY'        },
                { label: 'Twilio Account SID',  key: 'TWILIO_ACCOUNT_SID'        },
                { label: 'Supabase URL',        key: 'SUPABASE_URL'              },
              ].map(k => <ApiKeyRow key={k.key} label={k.label} envKey={k.key} value={null} />)}
            </div>
          )}

          {tab === 'numbers' && <PhoneTab />}

          {tab === 'compliance' && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Compliance & DNC</h2>
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  All calls comply with TCPA regulations: no calls before 9am or after 8pm local time, maximum 3 attempts per lead per week, and automatic DNC enforcement.
                </p>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>DNC management coming soon — add numbers manually via the Leads page.</p>
            </div>
          )}

          {tab === 'billing' && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Billing & Usage</h2>
              <div style={{ background: 'var(--bg-card-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{user?.plan || 'Hustle'} Plan</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>AI Assistant: {planLimits[user?.plan || 'hustle']} messages/mo</div>
                  </div>
                  <Button size="sm">Upgrade</Button>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>Calls used this month</span>
                    <span>{user?.calls_used || 0} / {user?.calls_limit || 500}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${callsPct}%`, background: callsPct > 80 ? 'var(--amber)' : 'var(--blue)', borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
