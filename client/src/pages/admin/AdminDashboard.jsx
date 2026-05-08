import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../utils/axiosInstance';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!stats) return <div className="alert alert-error">Failed to load dashboard.</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview at a glance</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Users', value: stats.totalUsers, cls: '' },
          { label: 'Active Users (30d)', value: stats.activeUsers, cls: 'stat-green' },
          { label: 'Total Quizzes', value: stats.totalQuizzes, cls: 'stat-accent' },
          { label: 'Total Attempts', value: stats.totalAttempts, cls: '' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.subjectStats.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Attempts by Subject</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.subjectStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="_id" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="attempts" fill="var(--accent)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats.subjectStats.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Avg Score by Subject</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.subjectStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="_id" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={v => `${Math.round(v)}%`} />
                <Bar dataKey="avgScore" fill="var(--green)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Attempts</h3>
        {stats.recentAttempts.length === 0 ? (
          <div className="empty-state"><div className="icon">📋</div><p>No attempts yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Quiz</th><th>Subject</th><th>Score</th><th>Date</th></tr></thead>
              <tbody>
                {stats.recentAttempts.map(a => (
                  <tr key={a._id}>
                    <td>{a.userId?.name}</td>
                    <td style={{ fontWeight: 500 }}>{a.quizId?.title}</td>
                    <td><span className="badge badge-subject">{a.quizId?.subject}</span></td>
                    <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: a.percentage >= 80 ? 'var(--green)' : a.percentage >= 50 ? 'var(--accent)' : 'var(--red)' }}>{a.percentage}%</span></td>
                    <td style={{ color: 'var(--text2)', fontSize: '.8rem' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
