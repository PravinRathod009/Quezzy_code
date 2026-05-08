/**
 * AuthDebug — temporary component to diagnose logout issues.
 * Add <AuthDebug /> anywhere in App.jsx, open the app, and
 * watch the panel. Remove once the issue is confirmed fixed.
 */
import { useAuth } from '../context/AuthContext';

export default function AuthDebug() {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('qz_token');
  const storedUser = localStorage.getItem('qz_user');

  // Only show in development
  if (import.meta.env.PROD) return null;

  const tokenPreview = token
    ? token.split('.').length === 3
      ? `✅ Valid format (…${token.slice(-12)})`
      : `❌ Malformed token`
    : '❌ No token in localStorage';

  const payload = (() => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch { return null; }
  })();

  const expiry = payload?.exp
    ? new Date(payload.exp * 1000).toLocaleString()
    : 'unknown';

  const isExpired = payload?.exp ? Date.now() / 1000 > payload.exp : false;

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, zIndex: 9999,
      background: '#0d1117', border: '1px solid #30363d',
      borderRadius: 10, padding: '12px 16px', fontSize: 12,
      fontFamily: 'monospace', color: '#e6edf3',
      maxWidth: 340, boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      lineHeight: 1.8
    }}>
      <div style={{ fontWeight: 700, color: '#ffa116', marginBottom: 6 }}>🔍 Auth Debug Panel</div>
      <div><b>loading:</b> {String(loading)}</div>
      <div><b>user (memory):</b> {user ? `✅ ${user.name} (${user.role})` : '❌ null'}</div>
      <div><b>user (storage):</b> {storedUser ? `✅ exists` : '❌ missing'}</div>
      <div><b>token:</b> {tokenPreview}</div>
      {payload && (
        <>
          <div><b>token exp:</b> <span style={{ color: isExpired ? '#f85149' : '#2cbc74' }}>{expiry} {isExpired ? '❌ EXPIRED' : '✅'}</span></div>
          <div><b>user id:</b> {payload.id || payload._id || '?'}</div>
        </>
      )}
      <div style={{ marginTop: 6, color: '#8b949e', fontSize: 11 }}>
        Remove &lt;AuthDebug /&gt; when fixed
      </div>
    </div>
  );
}
