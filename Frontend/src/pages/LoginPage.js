import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Dumbbell, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUnverifiedEmail(null);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      const detail = error.response?.data?.detail || 'Invalid email or password';
      const isUnverified = error.response?.status === 403 && detail.toLowerCase().includes('verify');
      if (isUnverified) {
        setUnverifiedEmail(email);
      } else {
        toast.error(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => { setEmail(e.target.value); setUnverifiedEmail(null); };
  const handlePasswordChange = (e) => { setPassword(e.target.value); setUnverifiedEmail(null); };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '28rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', backgroundColor: '#007AFF', borderRadius: '0.375rem', marginBottom: '1rem' }}>
            <Dumbbell style={{ width: '2rem', height: '2rem', color: 'white' }} />
          </div>
          <h1 className="barlow" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--text)', marginBottom: '0.5rem' }}>FITTRACK</h1>
          <p style={{ color: 'var(--text-2)', letterSpacing: '0.05em' }}>Track your gains, build your strength</p>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '2rem' }}>
          <h2 className="barlow" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', marginBottom: '1.5rem' }}>Login</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Email</label>
              <input type="email" value={email} onChange={handleEmailChange} required
                style={{ width: '100%', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#007AFF'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={handlePasswordChange} required
                  style={{ width: '100%', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '0.5rem 2.5rem 0.5rem 0.75rem', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#007AFF'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {showPassword ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
                </button>
              </div>
            </div>

            {unverifiedEmail && (
              <div style={{ backgroundColor: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.4)', borderRadius: '0.375rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <p style={{ color: '#FF9F0A', fontSize: '0.875rem', margin: 0 }}>Account not verified.</p>
                <button type="button" onClick={() => navigate('/verify-email', { state: { email: unverifiedEmail } })}
                  style={{ color: '#FF9F0A', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Verify here →
                </button>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', backgroundColor: loading ? '#0066DD' : '#007AFF', color: 'white', fontWeight: 700, padding: '0.75rem', borderRadius: '0.375rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: '1rem' }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#007AFF', fontWeight: 500, textDecoration: 'none' }}>Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}