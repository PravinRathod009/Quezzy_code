import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';

export default function UserDashboard() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/attempts/my'), api.get('/attempts/rankings')])
      .then(([a, r]) => { setAttempts(a.data); setRankings(r.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const myRank = rankings.findIndex(r => r._id === user._id) + 1;
  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0;

  // Subject radar data
  const subjectMap = {};
  attempts.forEach(a => {
    const sub = a.quizId?.subject || 'Other';
    if (!subjectMap[sub]) subjectMap[sub] = { subject: sub, scores: [] };
    subjectMap[sub].scores.push(a.percentage);
  });
  const radarData = Object.values(subjectMap).map(s => ({
    subject: s.subject, score: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
  }));

  // Trend line data (last 10)
  const trendData = attempts.slice(-10).map((a, i) => ({
    name: `#${i + 1}`, score: a.percentage, quiz: a.quizId?.title
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user.name.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's your learning overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-accent">
          <div className="stat-value">{attempts.length}</div>
          <div className="stat-label">Quizzes Attempted</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-value">{avgScore}%</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--purple)' }}>#{myRank || '—'}</div>
          <div className="stat-label">Platform Rank</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{attempts.filter(a => a.percentage >= 80).length}</div>
          <div className="stat-label">High Scores (≥80%)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {radarData.length > 2 && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Performance by Subject</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <Radar name="Score" dataKey="score" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
        {trendData.length > 1 && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Score Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} formatter={(v, n, p) => [`${v}%`, p.payload.quiz || 'Score']} />
                <Line type="monotone" dataKey="score" stroke="var(--green)" strokeWidth={2} dot={{ fill: 'var(--green)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent attempts */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Attempts</h3>
          <Link to="/history" className="btn btn-ghost btn-sm">View all</Link>
        </div>
        {attempts.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📝</div>
            <p>No attempts yet. <Link to="/quizzes" style={{ color: 'var(--accent)' }}>Take a quiz!</Link></p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Quiz</th><th>Subject</th><th>Score</th><th>Date</th></tr></thead>
              <tbody>
                {attempts.slice(0, 5).map(a => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 500 }}>{a.quizId?.title}</td>
                    <td><span className="badge badge-subject">{a.quizId?.subject}</span></td>
                    <td>
                      <span style={{ color: a.percentage >= 80 ? 'var(--green)' : a.percentage >= 50 ? 'var(--accent)' : 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                        {a.percentage}%
                      </span>
                    </td>
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
