import { useEffect, useState } from 'react';
import api from '../../utils/axiosInstance';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id, name, active) => {
    if (!window.confirm(`${active ? 'Disable' : 'Enable'} user "${name}"?`)) return;
    await api.put(`/admin/users/${id}/toggle`);
    setMsg(`User ${active ? 'disabled' : 'enabled'}.`);
    setTimeout(() => setMsg(''), 3000);
    load();
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">{users.length} registered users</p>
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{msg}</div>}

      <div style={{ marginBottom: '1.25rem' }}>
        <input
          className="form-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
        />
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="card">
          {/* Desktop table */}
          <div className="table-wrap table-mobile-hide">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Joined</th><th>Last Login</th><th>Quizzes</th><th>Avg Score</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: 'var(--text2)', fontSize: '.85rem' }}>{u.email}</td>
                    <td style={{ color: 'var(--text2)', fontSize: '.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={{ color: 'var(--text2)', fontSize: '.8rem' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{u.totalAttempts}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: u.avgScore >= 75 ? 'var(--green)' : u.avgScore >= 50 ? 'var(--accent)' : 'var(--red)' }}>
                        {u.avgScore}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-low' : 'badge-advance'}`}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggle(u._id, u.name, u.isActive)}>
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div>
            {filtered.map(u => (
              <div key={u._id} className="mobile-card-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                  <span className={`badge ${u.isActive ? 'badge-low' : 'badge-advance'}`} style={{ flexShrink: 0 }}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '.8rem', color: 'var(--text2)', flexWrap: 'wrap' }}>
                  <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                  <span>{u.totalAttempts} quizzes</span>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: u.avgScore >= 75 ? 'var(--green)' : u.avgScore >= 50 ? 'var(--accent)' : 'var(--red)' }}>
                    {u.avgScore}%
                  </span>
                </div>
                <button
                  className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => toggle(u._id, u.name, u.isActive)}>
                  {u.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state"><div className="icon">👤</div><p>No users found.</p></div>
          )}
        </div>
      )}
    </div>
  );
}
