import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const Icon = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const HamburgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/quizzes', label: 'Quizzes', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to: '/history', label: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/rankings', label: 'Rankings', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/admin/quizzes', label: 'Manage Quizzes', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to: '/admin/users', label: 'Users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { to: '/admin/scores', label: 'Scores', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' },
  { to: '/admin/reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

const MOBILE_BP = 768;

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BP);
  const links = isAdmin ? adminLinks : userLinks;

  // Track mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BP;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = (isMobile && mobileOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, mobileOpen]);

  const handleLinkClick = () => {
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const sidebarTransform = isMobile
    ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)')
    : 'translateX(0)';

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
      </button>

      {/* Mobile overlay backdrop */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside style={{
        width: collapsed && !isMobile ? 60 : 'var(--sidebar-w)',
        position: 'fixed', top: 0, left: 0,
        height: '100vh', background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', zIndex: 100,
        transition: 'width .3s, transform .3s',
        overflow: 'hidden',
        transform: sidebarTransform,
      }}>
        {/* Logo */}
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
          {(!collapsed || isMobile) && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)' }}>⚡ Quizzy</span>
          )}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(c => !c)}
              className="btn btn-icon btn-ghost"
              style={{ flexShrink: 0 }}
            >
              <Icon d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </button>
          )}
        </div>

        {/* User info */}
        {(!collapsed || isMobile) && user && (
          <div style={{ padding: '.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: '.15rem' }}>Signed in as</div>
            <div style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <span className={`badge ${isAdmin ? 'badge-advance' : 'badge-low'}`} style={{ marginTop: '.25rem' }}>
              {isAdmin ? 'Admin' : 'User'}
            </span>
          </div>
        )}

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '.5rem 0', overflowY: 'auto' }}>
          {links.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} onClick={handleLinkClick} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '.75rem',
              padding: (collapsed && !isMobile) ? '.65rem' : '.65rem 1rem',
              justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start',
              fontSize: '.875rem', color: isActive ? 'var(--accent)' : 'var(--text2)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              borderRight: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              textDecoration: 'none', transition: 'all .15s',
            })}>
              <Icon d={icon} />
              {(!collapsed || isMobile) && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '.75rem', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start', gap: '.75rem' }}>
            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            {(!collapsed || isMobile) && 'Logout'}
          </button>
        </div>
      </aside>
    </>
  );
}
