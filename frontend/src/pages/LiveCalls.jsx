import { useState, useEffect, useRef } from 'react';
import { getLiveCalls, takeoverCall, returnToAI } from '../services/api';
import { ScoreBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Headphones, Mic, MicOff, Phone, PhoneOff, AlertCircle, Brain } from 'lucide-react';

function CallDuration({ startedAt }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const base = startedAt ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000) : 0;
    setSecs(base);
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const m = Math.floor(secs / 60), s = secs % 60;
  return <span>{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>;
}

function Waveform({ active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 28 }}>
      {[0,1,2,3,4,5,6].map(i => (
        <div key={i} style={{
          width: 3, borderRadius: 2,
          background: active ? 'var(--green)' : 'var(--text-muted)',
          animation: active ? `waveform ${0.6 + i * 0.08}s ease ${i * 0.07}s infinite` : 'none',
          height: active ? undefined : 4,
        }} />
      ))}
    </div>
  );
}

const SIGNAL_COLORS = {
  'Financial Pressure': 'var(--red)',
  'Inherited Property': 'var(--blue)',
  'Tired Landlord':     'var(--amber)',
  'Divorce':            'var(--orange)',
  'Behind on Taxes':    'var(--red)',
  'Property Damage':    'var(--amber)',
  'Vacant':             'var(--blue)',
  'Motivated to Sell':  'var(--green)',
};

function SignalTag({ label }) {
  const color = SIGNAL_COLORS[label] || 'var(--text-secondary)';
  return (
    <span style={{
      fontSize: 11, padding: '2px 8px', borderRadius: 9999,
      background: `${color}20`, color, fontWeight: 500,
    }}>{label}</span>
  );
}

function ScoreGauge({ score }) {
  const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--text-muted)';
  const glow = score >= 70 ? `0 0 16px ${color}` : 'none';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 48, fontWeight: 800, color, lineHeight: 1,
        letterSpacing: '-0.04em', textShadow: glow,
        transition: 'all 0.5s ease',
      }}>{score || '—'}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Motivation Score</div>
    </div>
  );
}

function CallPanel({ call, onTakeover, onReturnAI }) {
  const [takenOver, setTakenOver] = useState(call.operator_took_over || false);
  const [coaching, setCoaching]   = useState([
    'Listen for pain points before presenting the offer.',
    'If they hesitate, validate their concern before moving forward.',
    `Based on the property, suggest $${Math.round((Number(call.leads?.estimated_value || 150000) * 0.6 / 1000)) * 1000} as your opening offer.`,
  ]);

  const handleTakeover = async () => {
    await takeoverCall({ call_id: call.id, vapi_call_id: call.vapi_call_id }).catch(() => {});
    setTakenOver(true);
    onTakeover?.(call.id);
  };

  const handleReturn = async () => {
    await returnToAI({ call_id: call.id, vapi_call_id: call.vapi_call_id }).catch(() => {});
    setTakenOver(false);
    onReturnAI?.(call.id);
  };

  const transcript = call.transcript || '';
  const lines = transcript.split('\n').filter(Boolean).slice(-20); // last 20 lines

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${takenOver ? 'var(--amber)' : 'var(--border-subtle)'}`,
      borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: takenOver ? '0 0 20px rgba(245,158,11,0.2)' : 'none',
      minWidth: 0,
    }}>
      {/* Card header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {call.leads?.first_name} {call.leads?.last_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{call.leads?.property_address}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
            <CallDuration startedAt={call.started_at} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Duration</div>
        </div>
      </div>

      {/* Score + waveform */}
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
        <ScoreGauge score={call.motivation_score} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Waveform active={call.status === 'in_progress'} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {takenOver ? '🎤 You' : '🤖 AI'}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          {call.seller_personality && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'capitalize' }}>
              {call.seller_personality}
            </div>
          )}
          {call.offer_made && (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>
              ${Number(call.offer_made).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Key signals */}
      {call.key_signals?.length > 0 && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {call.key_signals.map(s => <SignalTag key={s} label={s.replace(/_/g, ' ')} />)}
        </div>
      )}

      {/* Live transcript */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', maxHeight: 160, minHeight: 80 }}>
        {lines.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>Awaiting transcript…</div>
        ) : lines.map((line, i) => {
          const isAlex = line.toLowerCase().startsWith('alex') || line.toLowerCase().startsWith('ai:');
          return (
            <div key={i} style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 4, color: isAlex ? 'var(--blue)' : 'var(--text-primary)' }}>
              {line}
            </div>
          );
        })}
      </div>

      {/* Coaching panel (takeover mode) */}
      {takenOver && (
        <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.08)', borderTop: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Brain size={12} /> AI Coaching
          </div>
          {coaching.map((tip, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5, lineHeight: 1.5, display: 'flex', gap: 6 }}>
              <span style={{ color: 'var(--amber)', flexShrink: 0 }}>›</span>
              {tip}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
        {takenOver ? (
          <Button variant="warning" size="sm" onClick={handleReturn} fullWidth>
            <Brain size={13} /> Return to AI
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="sm" style={{ flex: 1 }}>
              <Headphones size={13} /> Listen
            </Button>
            <Button variant="warning" size="sm" style={{ flex: 1 }} onClick={handleTakeover}>
              <Mic size={13} /> Take Over
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function LiveCalls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const poll = () => getLiveCalls().then(r => { setCalls(r.data.calls || []); setLoading(false); }).catch(() => setLoading(false));
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Live Calls</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {calls.length > 0 ? `${calls.length} active call${calls.length > 1 ? 's' : ''}` : 'No active calls'}
          </p>
        </div>
        {calls.length > 0 && (
          <span style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--red)', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 9999, animation: 'blink 1.5s ease infinite' }}>
            LIVE
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '80px 0', fontSize: 14 }}>Loading…</div>
      ) : calls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <PhoneOff size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No Active Calls</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Start a campaign or initiate a call from the Leads page.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(calls.length, 3)}, 1fr)`,
          gap: 16,
        }}>
          {calls.map(call => (
            <CallPanel key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  );
}
