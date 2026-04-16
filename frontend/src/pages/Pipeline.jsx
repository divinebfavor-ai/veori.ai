import { useState, useEffect } from 'react';
import { getDeals, updateDeal } from '../services/api';
import { ScoreBadge, StatusBadge } from '../components/ui/Badge';
import { MapPin, Clock, DollarSign } from 'lucide-react';

const STAGES = [
  { key: 'offer_sent',    label: 'Offer Made',      color: 'var(--blue)'   },
  { key: 'seller_signed', label: 'Under Contract',  color: 'var(--amber)'  },
  { key: 'buyer_found',   label: 'Buyer Search',    color: 'var(--orange)' },
  { key: 'buyer_signed',  label: 'Buyer Signed',    color: 'var(--orange)' },
  { key: 'sent_to_title', label: 'Title',           color: 'var(--green)'  },
  { key: 'closing',       label: 'Closing',         color: 'var(--green)'  },
  { key: 'closed',        label: 'Closed',          color: '#10B981'       },
];

function daysSince(ts) {
  if (!ts) return 0;
  return Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
}

function DealCard({ deal }) {
  return (
    <div style={{
      background: 'var(--bg-card-elevated)', border: '1px solid var(--border-subtle)',
      borderRadius: 10, padding: '14px', marginBottom: 10, cursor: 'grab',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
        {deal.property_address}
      </div>
      {deal.leads && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
          {deal.leads.first_name} {deal.leads.last_name}
        </div>
      )}
      {deal.purchase_price && (
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>
          ${Number(deal.purchase_price).toLocaleString()}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Clock size={10} />{daysSince(deal.created_at)}d
        </div>
        {deal.assignment_fee && (
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)' }}>
            ${Number(deal.assignment_fee).toLocaleString()} fee
          </span>
        )}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeals().then(r => { setDeals(r.data.deals || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const byStage = (key) => deals.filter(d => d.status === key);
  const totalRevenue = deals.filter(d => d.status === 'closed').reduce((s, d) => s + (d.assignment_fee || 0), 0);

  return (
    <div style={{ padding: '28px 32px', maxWidth: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Property Pipeline</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {deals.length} total deals · ${totalRevenue.toLocaleString()} closed revenue
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>Loading…</div>
      ) : (
        <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, minWidth: 'max-content' }}>
            {STAGES.map(stage => {
              const stagDeals = byStage(stage.key);
              return (
                <div key={stage.key} style={{ width: 260, flexShrink: 0 }}>
                  {/* Column header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 12, padding: '0 4px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{stage.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '1px 8px', borderRadius: 9999 }}>
                      {stagDeals.length}
                    </span>
                  </div>

                  {/* Column body */}
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 10, minHeight: 300 }}>
                    {stagDeals.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, paddingTop: 40 }}>
                        No deals here
                      </div>
                    ) : stagDeals.map(deal => (
                      <DealCard key={deal.id} deal={deal} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
