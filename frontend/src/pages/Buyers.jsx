import { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import { getBuyers, createBuyer, deleteBuyer } from '../services/api';
import { Plus, Trash2, UserCheck, Phone, Mail } from 'lucide-react';

function AddModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', max_price: '', repair_tolerance: 'any', buy_box_states: '', buy_box_types: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await createBuyer({
        ...form,
        buy_box_states: form.buy_box_states ? form.buy_box_states.split(',').map(s => s.trim()) : [],
        buy_box_types: form.buy_box_types ? form.buy_box_types.split(',').map(s => s.trim()) : [],
        max_price: form.max_price ? Number(form.max_price) : null,
      });
      onAdded(); onClose();
    } catch { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, width: '90%', maxWidth: 500 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Add Buyer</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <form onSubmit={submit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'name',  label: 'Full Name',   type: 'text',   ph: 'John Smith', required: true },
            { key: 'phone', label: 'Phone',        type: 'tel',    ph: '+1 (555) 000-0000' },
            { key: 'email', label: 'Email',        type: 'email',  ph: 'buyer@example.com' },
            { key: 'max_price',       label: 'Max Buy Price ($)', type: 'number', ph: '200000' },
            { key: 'buy_box_states',  label: 'States (comma separated)', type: 'text', ph: 'TX, FL, GA' },
            { key: 'buy_box_types',   label: 'Property Types',   type: 'text', ph: 'SFR, Multi-family' },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{f.label}</label>
              <input type={f.type} required={f.required} value={form[f.key]} onChange={set(f.key)} placeholder={f.ph} style={{ padding: '10px 14px', fontSize: 13, borderRadius: 8 }} />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Repair Tolerance</label>
            <select value={form.repair_tolerance} onChange={set('repair_tolerance')} style={{ padding: '10px 14px', fontSize: 13, borderRadius: 8, cursor: 'pointer' }}>
              {['none','light','medium','heavy','any'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button type="button" variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
            <Button type="submit" loading={loading} fullWidth>Add Buyer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Buyers() {
  const [buyers, setBuyers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);

  const load = () => getBuyers().then(r => { setBuyers(r.data.buyers || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    await deleteBuyer(id).catch(() => {});
    load();
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Buyers</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{buyers.length} active buyers</p>
        </div>
        <Button onClick={() => setAdding(true)} style={{ gap: 6 }}>
          <Plus size={14} /> Add Buyer
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>Loading…</div>
      ) : buyers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <UserCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No buyers yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add your cash buyers to start closing deals.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {buyers.map(b => (
            <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{b.full_name || b.name}</h3>
                  {b.company_name && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{b.company_name}</div>}
                </div>
                <button onClick={() => remove(b.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {b.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}><Phone size={12} />{b.phone}</div>}
                {b.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}><Mail size={12} />{b.email}</div>}
              </div>

              {b.max_price && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-card-elevated)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Max Buy Price</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>${Number(b.max_price).toLocaleString()}</div>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {(b.markets || b.buy_box_states || []).slice(0, 5).map(m => (
                  <span key={m} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: 'rgba(59,130,246,0.1)', color: 'var(--blue)' }}>{m}</span>
                ))}
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: 'rgba(16,185,129,0.1)', color: 'var(--green)', textTransform: 'capitalize' }}>
                  {b.repair_tolerance || b.buys_condition || 'any'} repairs
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && <AddModal onClose={() => setAdding(false)} onAdded={load} />}
    </div>
  );
}
