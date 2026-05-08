import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export function ThemeToggle() {
  const toggle = () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'light' ? '' : 'light';
  };
  return (
    <button
      onClick={toggle}
      className="btn btn-icon btn-ghost theme-toggle-btn"
      title="Toggle theme"
      style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 200 }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    </button>
  );
}
