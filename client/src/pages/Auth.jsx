import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthCard({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '.5rem' }}>⚡ Quizzy</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', marginBottom: '.25rem' }}>{title}</h1>
          <p style={{ fontSize: '.875rem', color: 'var(--text2)' }}>{subtitle}</p>
        </div>
        <div className="card">{children}</div>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      console.log("login submit run")
      const user = await login(form.email, form.password);
      console.log("Login user",user)
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to continue">
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: '.5rem' }} disabled={loading}>
          {loading ? <><span className="spinner" />Signing in…</> : 'Sign in'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.875rem', color: 'var(--text2)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Register</Link>
      </p>
    </AuthCard>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', adminCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.adminCode);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <AuthCard title="Create account" subtitle="Start your learning journey">
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Full name</label>
          <input className="form-input" placeholder="Jane Doe" value={form.name} onChange={set('name')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <input type="checkbox" checked={showAdminCode} onChange={e => setShowAdminCode(e.target.checked)} />
            I have an admin code
          </label>
          {showAdminCode && (
            <input className="form-input" style={{ marginTop: '.4rem' }} placeholder="Admin code" value={form.adminCode} onChange={set('adminCode')} />
          )}
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: '.5rem' }} disabled={loading}>
          {loading ? <><span className="spinner" />Creating account…</> : 'Create account'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.875rem', color: 'var(--text2)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
      </p>
    </AuthCard>
  );
}
