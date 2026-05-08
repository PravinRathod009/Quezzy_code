import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/axiosInstance';

export function Result() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(state?.attempt || null);
  const [questions] = useState(state?.questions || []);
  const [correctAnswers] = useState(state?.correctAnswers || {});
  const [loading, setLoading] = useState(!state?.attempt);

  useEffect(() => {
    if (!attempt) {
      api.get(`/attempts/${id}`).then(r => setAttempt(r.data)).finally(() => setLoading(false));
    }
  }, [id, attempt]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!attempt) return <div className="alert alert-error">Result not found.</div>;

  const pct = attempt.percentage;
  const pieData = [
    { name: 'Correct', value: attempt.correctCount, color: 'var(--green)' },
    { name: 'Wrong', value: attempt.wrongCount, color: 'var(--red)' },
    { name: 'Skipped', value: attempt.skippedCount, color: 'var(--text3)' }
  ].filter(d => d.value > 0);

  const grade = pct >= 90 ? { label: 'Excellent!', color: 'var(--green)' }
    : pct >= 75 ? { label: 'Great job!', color: 'var(--accent)' }
    : pct >= 50 ? { label: 'Good try!', color: 'var(--blue)' }
    : { label: 'Keep practicing', color: 'var(--red)' };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '2rem' }}>
        <div style={{ fontSize: '3.5rem', fontFamily: 'var(--mono)', fontWeight: 700, color: grade.color }}>{pct}%</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: grade.color, marginTop: '.5rem' }}>{grade.label}</div>
        <div style={{ fontSize: '.875rem', color: 'var(--text2)', marginTop: '.25rem' }}>
          {attempt.quizId?.title || 'Quiz complete'}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card stat-green"><div className="stat-value">{attempt.correctCount}</div><div className="stat-label">Correct</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--red)' }}>{attempt.wrongCount}</div><div className="stat-label">Wrong</div></div>
        <div className="stat-card"><div className="stat-value">{attempt.skippedCount}</div><div className="stat-label">Skipped</div></div>
        <div className="stat-card"><div className="stat-value">{Math.floor(attempt.timeTaken / 60)}:{String(attempt.timeTaken % 60).padStart(2, '0')}</div><div className="stat-label">Time taken</div></div>
      </div>

      {/* Responsive: 2-col on desktop, 1-col on mobile */}
      <div className="result-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '.95rem', fontWeight: 600, marginBottom: '1rem' }}>Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <h3 style={{ fontSize: '.95rem', fontWeight: 600, marginBottom: '.5rem' }}>Score Summary</h3>
          {[
            ['Total questions', attempt.totalQuestions],
            ['Score', `${attempt.score}/${attempt.totalQuestions}`],
            ['Percentage', `${pct}%`],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.875rem', borderBottom: '1px solid var(--border)', paddingBottom: '.4rem' }}>
              <span style={{ color: 'var(--text2)' }}>{label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {questions.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '.95rem', fontWeight: 600, marginBottom: '1rem' }}>Question Review</h3>
          {questions.map((q, i) => {
            const userAns = attempt.answers?.find(a => a.questionId === q._id || a.questionId?._id === q._id)?.selected;
            const correct = correctAnswers[q._id];
            const isCorrect = userAns && userAns === correct;
            const isWrong = userAns && userAns !== correct;
            return (
              <div key={q._id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.4rem' }}>
                  <span style={{ fontFamily: 'var(--mono)', color: isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : 'var(--text3)', fontWeight: 600, fontSize: '.9rem', flexShrink: 0 }}>
                    {isCorrect ? '✓' : isWrong ? '✗' : '○'}
                  </span>
                  <span style={{ fontSize: '.9rem', fontWeight: 500 }}>{q.text}</span>
                </div>
                <div style={{ marginLeft: '1.5rem', fontSize: '.8rem', color: 'var(--text2)' }}>
                  {userAns && <span style={{ color: isCorrect ? 'var(--green)' : 'var(--red)' }}>Your answer: {userAns}. {q.options[userAns]}  </span>}
                  {!isCorrect && correct && <span style={{ color: 'var(--green)' }}>Correct: {correct}. {q.options[correct]}</span>}
                  {!userAns && <span style={{ color: 'var(--text3)' }}>Skipped — Correct: {correct}. {q.options[correct]}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/quizzes" className="btn btn-primary">Try another quiz</Link>
        <Link to="/history" className="btn btn-ghost">View history</Link>
      </div>
    </div>
  );
}

export function History() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/attempts/my').then(r => setAttempts(r.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Attempt History</h1>
        <p className="page-subtitle">{attempts.length} total attempts</p>
      </div>
      {attempts.length === 0 ? (
        <div className="empty-state"><div className="icon">📂</div><p>No attempts yet. <Link to="/quizzes" style={{ color: 'var(--accent)' }}>Take a quiz!</Link></p></div>
      ) : (
        <div className="card">
          {/* Desktop table */}
          <div className="table-wrap table-mobile-hide">
            <table>
              <thead><tr><th>Quiz</th><th>Subject</th><th>Level</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Date</th></tr></thead>
              <tbody>
                {attempts.map(a => (
                  <tr key={a._id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/result/${a._id}`}>
                    <td style={{ fontWeight: 500 }}>{a.quizId?.title}</td>
                    <td><span className="badge badge-subject">{a.quizId?.subject}</span></td>
                    <td><span className={`badge badge-${a.quizId?.level}`}>{a.quizId?.level}</span></td>
                    <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: a.percentage >= 80 ? 'var(--green)' : a.percentage >= 50 ? 'var(--accent)' : 'var(--red)' }}>{a.percentage}%</span></td>
                    <td style={{ color: 'var(--green)' }}>{a.correctCount}</td>
                    <td style={{ color: 'var(--red)' }}>{a.wrongCount}</td>
                    <td style={{ color: 'var(--text2)', fontSize: '.8rem' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile card list */}
          <div className="history-mobile-list">
            {attempts.map(a => (
              <div key={a._id}
                className="mobile-card-row"
                style={{ cursor: 'pointer' }}
                onClick={() => window.location.href = `/result/${a._id}`}
              >
                <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text)', marginBottom: '.25rem' }}>{a.quizId?.title}</div>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.25rem' }}>
                  <span className="badge badge-subject">{a.quizId?.subject}</span>
                  <span className={`badge badge-${a.quizId?.level}`}>{a.quizId?.level}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '.825rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: a.percentage >= 80 ? 'var(--green)' : a.percentage >= 50 ? 'var(--accent)' : 'var(--red)' }}>{a.percentage}%</span>
                  <span style={{ color: 'var(--green)' }}>✓ {a.correctCount}</span>
                  <span style={{ color: 'var(--red)' }}>✗ {a.wrongCount}</span>
                  <span style={{ color: 'var(--text2)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
