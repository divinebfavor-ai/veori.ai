import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { register } from '../services/api';

export default function Register() {
  const [form, setForm]     = useState({ email: '', password: '', full_name: '', company_name: '' });
  const [error, setError]   = useState('');
  const [loading, setLoad]  = useState(false);
  const { signIn }  = useAuth();
  const navigate    = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoad(true);
    try {
      const res = await register(form);
      signIn(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoad(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'var(--blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 auto 16px',
          }}>V</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Veori AI
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Start closing deals with AI</p>
        </div>

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 16, padding: '32px 28px',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: 'var(--text-primary)' }}>
            Create your account
          </h2>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'full_name',     label: 'Full Name',     type: 'text',     ph: 'Alex Johnson'        },
              { key: 'company_name',  label: 'Company Name',  type: 'text',     ph: 'Johnson Investments'  },
              { key: 'email',         label: 'Email',         type: 'email',    ph: 'you@company.com'      },
              { key: 'password',      label: 'Password',      type: 'password', ph: 'Min 8 characters'     },
            ].map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{f.label}</label>
                <input
                  type={f.type} required={f.key !== 'company_name'}
                  value={form[f.key]} onChange={set(f.key)}
                  placeholder={f.ph}
                  style={{ padding: '10px 14px', fontSize: 14, borderRadius: 8 }}
                />
              </div>
            ))}

            <button type="submit" disabled={loading} style={{
              marginTop: 8, padding: '12px', borderRadius: 8,
              background: loading ? 'var(--blue-dim)' : 'var(--blue)',
              color: '#fff', fontWeight: 600, fontSize: 14, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {loading && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
              {loading ? 'Creating account…' : 'Create account — free to start'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
            By creating an account you agree to our Terms of Service.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
