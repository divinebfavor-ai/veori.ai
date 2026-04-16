import { useState, useEffect, useRef } from 'react';
import { StatusBadge, ScoreBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getLeads, bulkImport, updateLead, getCalls } from '../services/api';
import {
  Upload, Search, Filter, X, Phone, ChevronRight,
  MapPin, User, Clock, Plus
} from 'lucide-react';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim().replace(/^"|"$/g, ''); });
    return obj;
  }).filter(r => r.phone || r.first_name);
}

const COLUMN_MAP = {
  first_name: ['first_name','first','fname'],
  last_name:  ['last_name','last','lname'],
  phone:      ['phone','phone_number','cell','mobile'],
  property_address: ['property_address','address','street'],
  property_city:    ['property_city','city'],
  property_state:   ['property_state','state'],
  property_zip:     ['property_zip','zip','zipcode'],
  estimated_value:  ['estimated_value','value','arv'],
  estimated_equity: ['estimated_equity','equity'],
  source:           ['source','lead_source'],
};

function mapColumns(raw) {
  return raw.map(row => {
    const mapped = {};
    Object.entries(COLUMN_MAP).forEach(([canonical, aliases]) => {
      const key = Object.keys(row).find(k => aliases.includes(k));
      if (key) mapped[canonical] = row[key];
    });
    // Pass through any unmapped keys
    Object.keys(row).forEach(k => { if (!mapped[k]) mapped[k] = row[k]; });
    return mapped;
  });
}

// Lead profile drawer
function LeadDrawer({ lead, onClose }) {
  const [tab, setTab] = useState('overview');
  const [calls, setCalls] = useState([]);
  const [notes, setNotes] = useState(lead.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCalls({ lead_id: lead.id }).then(r => setCalls(r.data.calls || [])).catch(() => {});
  }, [lead.id]);

  const saveNotes = async () => {
    setSaving(true);
    await updateLead(lead.id, { notes }).catch(() => {});
    setSaving(false);
  };

  const tabs = ['overview', 'calls', 'transcripts', 'notes'];

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, zIndex: 50,
      background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
      animation: 'slide-right 0.25s ease forwards',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              {lead.first_name} {lead.last_name}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} />{lead.property_address}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <ScoreBadge score={lead.motivation_score} />
          <StatusBadge status={lead.status} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '12px 14px', background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab === t ? 'var(--blue)' : 'transparent'}`,
            color: tab === t ? 'var(--blue)' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s',
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Section title="Contact">
              <Row label="Phone" val={lead.phone} />
              <Row label="Email" val={lead.email || '—'} />
            </Section>
            <Section title="Property">
              <Row label="Address" val={lead.property_address} />
              <Row label="City" val={lead.property_city} />
              <Row label="State" val={lead.property_state} />
              <Row label="Zip" val={lead.property_zip} />
              <Row label="Type" val={lead.property_type || '—'} />
              <Row label="Est. Value" val={lead.estimated_value ? '$' + Number(lead.estimated_value).toLocaleString() : '—'} />
              <Row label="Est. Equity" val={lead.estimated_equity ? '$' + Number(lead.estimated_equity).toLocaleString() : '—'} />
            </Section>
            <Section title="Lead Info">
              <Row label="Source" val={lead.source || '—'} />
              <Row label="Call Count" val={lead.call_count || 0} />
              <Row label="Last Call" val={lead.last_call_date ? new Date(lead.last_call_date).toLocaleDateString() : '—'} />
              <Row label="Personality" val={lead.seller_personality || '—'} />
            </Section>
          </div>
        )}

        {tab === 'calls' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {calls.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>No calls recorded yet.</div>
            ) : calls.map(c => (
              <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {c.started_at ? new Date(c.started_at).toLocaleDateString() : '—'}
                  </span>
                  <ScoreBadge score={c.motivation_score} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <StatusBadge status={c.status} />
                  {c.outcome && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.outcome.replace(/_/g, ' ')}</span>}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {c.duration_seconds ? `${Math.floor(c.duration_seconds / 60)}:${String(c.duration_seconds % 60).padStart(2, '0')}` : '—'}
                  </span>
                </div>
                {c.ai_summary && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>{c.ai_summary}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === 'transcripts' && (
          <div>
            {calls.filter(c => c.transcript).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No transcripts available.</div>
            ) : calls.filter(c => c.transcript).map(c => (
              <div key={c.id} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  {c.started_at ? new Date(c.started_at).toLocaleDateString() : '—'}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
                  {c.transcript}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'notes' && (
          <div>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this seller…"
              style={{ width: '100%', minHeight: 200, padding: '12px 14px', fontSize: 13, borderRadius: 8, resize: 'vertical', lineHeight: 1.6 }}
            />
            <Button onClick={saveNotes} loading={saving} style={{ marginTop: 10 }}>Save Notes</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function Row({ label, val }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 400 }}>{val || '—'}</span>
    </div>
  );
}

// CSV Import Modal
function ImportModal({ onClose, onImported }) {
  const [step, setStep]       = useState('upload'); // upload | preview | importing | done
  const [rows, setRows]       = useState([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult]   = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      const mapped = mapColumns(parsed);
      setRows(mapped);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const runImport = async () => {
    setStep('importing');
    // Batch in chunks of 500
    const chunks = [];
    for (let i = 0; i < rows.length; i += 500) chunks.push(rows.slice(i, i + 500));

    let imported = 0;
    for (const chunk of chunks) {
      await bulkImport({ leads: chunk }).catch(() => {});
      imported += chunk.length;
      setProgress(Math.round((imported / rows.length) * 100));
    }
    setResult({ total: rows.length, imported });
    setStep('done');
    onImported?.();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        borderRadius: 16, width: '90%', maxWidth: 640, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Import Leads from CSV</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {step === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--blue)' : 'var(--border-default)'}`,
                borderRadius: 12, padding: '48px 24px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
                background: dragging ? 'rgba(59,130,246,0.05)' : 'transparent',
              }}
            >
              <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>Drop your CSV here</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>or click to browse — up to 10,000 leads</p>
              <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            </div>
          )}

          {step === 'preview' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{rows.length.toLocaleString()} leads</strong> detected. Preview (first 10):
              </p>
              <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card-elevated)' }}>
                      {['First Name','Last Name','Phone','Address','State'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((r, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>{r.first_name || '—'}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>{r.last_name || '—'}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>{r.phone || '—'}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.property_address || '—'}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{r.property_state || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <Button variant="secondary" onClick={() => setStep('upload')}>Back</Button>
                <Button onClick={runImport}>Import {rows.length.toLocaleString()} Leads</Button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 20 }}>Importing leads…</p>
              <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--blue)', borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>{progress}% complete</p>
            </div>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Import Complete</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                {result?.imported?.toLocaleString()} leads imported successfully.
              </p>
              <Button onClick={onClose} style={{ marginTop: 20 }}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Leads() {
  const [leads, setLeads]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [importing, setImporting] = useState(false);

  const load = () => {
    setLoading(true);
    getLeads({ search, status, limit: 100 })
      .then(r => { setLeads(r.data.leads || []); setTotal(r.data.total || r.data.leads?.length || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Leads</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{total.toLocaleString()} total leads</p>
        </div>
        <Button onClick={() => setImporting(true)} style={{ gap: 6 }}>
          <Upload size={14} /> Import CSV
        </Button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, address…"
            style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 8 }}
          />
        </div>
        <select
          value={status} onChange={e => setStatus(e.target.value)}
          style={{ padding: '9px 12px', fontSize: 13, borderRadius: 8, cursor: 'pointer' }}
        >
          <option value="">All Statuses</option>
          {['new','calling','contacted','interested','appointment_set','offer_made','under_contract','closed','dnc'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Name','Phone','Address','State','Score','Status','Source','Last Called',''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No leads found. Import a CSV to get started.</td></tr>
            ) : leads.map((lead, i) => (
              <tr key={lead.id}
                onClick={() => setSelected(lead)}
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {lead.first_name} {lead.last_name}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{lead.phone}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.property_address || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{lead.property_state || '—'}</td>
                <td style={{ padding: '12px 16px' }}><ScoreBadge score={lead.motivation_score} /></td>
                <td style={{ padding: '12px 16px' }}><StatusBadge status={lead.status} /></td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{lead.source || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{lead.last_call_date ? new Date(lead.last_call_date).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '12px 16px' }}><ChevronRight size={14} color="var(--text-muted)" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <LeadDrawer lead={selected} onClose={() => setSelected(null)} />}
      {importing && <ImportModal onClose={() => setImporting(false)} onImported={load} />}
    </div>
  );
}
