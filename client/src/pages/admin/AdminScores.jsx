import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../utils/axiosInstance';

export default function AdminScores() {
  const [attempts, setAttempts] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/attempts'),
      api.get('/attempts/rankings'),
      api.get('/quizzes')
    ]).then(([a, r, q]) => {
      setAttempts(a.data);
      setRankings(r.data);
      setQuizzes(q.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = selectedQuiz ? attempts.filter(a => a.quizId?._id === selectedQuiz) : attempts;

  // Chart: attempts per quiz
  const quizAttemptMap = {};
  attempts.forEach(a => {
    const t = a.quizId?.title || 'Unknown';
    quizAttemptMap[t] = (quizAttemptMap[t] || 0) + 1;
  });
  const chartData = Object.entries(quizAttemptMap).map(([name, count]) => ({ name: name.length > 15 ? name.slice(0, 15) + '…' : name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Scores & Rankings</h1>
        <p className="page-subtitle">{attempts.length} total attempts</p>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Attempts per Quiz</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="count" fill="var(--blue)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: '1rem' }}>
        {/* All Attempts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>All Scores</h3>
            <select className="form-select" style={{ maxWidth: 200 }} value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)}>
              <option value="">All quizzes</option>
              {quizzes.map(q => <option key={q._id} value={q._id}>{q.title}</option>)}
            </select>
          </div>
          <div className="table-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table>
              <thead><tr><th>User</th><th>Quiz</th><th>Score</th><th>Date</th></tr></thead>
              <tbody>
                {filtered.slice(0, 50).map(a => (
                  <tr key={a._id}>
                    <td>{a.userId?.name}</td>
                    <td style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{a.quizId?.title}</td>
                    <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: a.percentage >= 80 ? 'var(--green)' : a.percentage >= 50 ? 'var(--accent)' : 'var(--red)' }}>{a.percentage}%</span></td>
                    <td style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rankings */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>🏆 Platform Rankings</h3>
          <div className="table-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table>
              <thead><tr><th>Rank</th><th>User</th><th>Avg</th><th>Attempts</th></tr></thead>
              <tbody>
                {rankings.map((r, i) => (
                  <tr key={r._id}>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.user?.name}</td>
                    <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--green)' }}>{Math.round(r.avgScore)}%</span></td>
                    <td style={{ color: 'var(--text2)' }}>{r.totalAttempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
