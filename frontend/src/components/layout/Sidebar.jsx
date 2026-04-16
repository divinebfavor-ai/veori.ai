import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, Phone, Zap, Radio, GitMerge,
  UserCheck, Settings, LogOut, Activity
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/leads',      icon: Users,           label: 'Leads'        },
  { to: '/campaigns',  icon: Zap,             label: 'Campaigns'    },
  { to: '/live',       icon: Radio,           label: 'Live Calls'   },
  { to: '/pipeline',   icon: GitMerge,        label: 'Pipeline'     },
  { to: '/buyers',     icon: UserCheck,       label: 'Buyers'       },
  { to: '/settings',   icon: Settings,        label: 'Settings'     },
];

export default function Sidebar({ liveCalls = 0 }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => { signOut(); navigate('/login'); };

  return (
    <aside style={{
      width: 220, minWidth: 220, height: '100vh',
      background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
          }}>V</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Veori AI</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Built to Achieve</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            color: isActive ? 'var(--blue)' : 'var(--text-secondary)',
            background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
            transition: 'all 0.12s',
            textDecoration: 'none',
          })}
          onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon size={16} />
            <span>{label}</span>
            {to === '/live' && liveCalls > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'var(--red)', color: '#fff',
                fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 9999,
                animation: 'blink 1.5s ease infinite',
              }}>{liveCalls}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--blue-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: 'var(--blue)',
          }}>
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name || 'Operator'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.plan || 'hustle'} plan
            </div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 8,
          background: 'transparent', color: 'var(--text-muted)',
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          border: 'none', transition: 'color 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
