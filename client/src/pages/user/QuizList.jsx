import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosInstance';

const SUBJECTS = ['All', 'Mathematics', 'Science', 'History', 'Geography', 'English', 'Computer Science', 'General Knowledge'];
const LEVELS = ['All', 'low', 'medium', 'advance'];

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('All');
  const [level, setLevel] = useState('All');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/quizzes').then(r => setQuizzes(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = quizzes.filter(q =>
    (subject === 'All' || q.subject === subject) &&
    (level === 'All' || q.level === level) &&
    (q.title.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quizzes</h1>
        <p className="page-subtitle">{quizzes.length} quizzes available</p>
      </div>

      {/* Filters - responsive flex wrap */}
      <div className="filter-bar" style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <input
          className="form-input"
          placeholder="Search quizzes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 240, minWidth: 140, flex: '1 1 140px' }}
        />
        <select
          className="form-select"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{ maxWidth: 200, minWidth: 140, flex: '1 1 140px' }}
        >
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          className="form-select"
          value={level}
          onChange={e => setLevel(e.target.value)}
          style={{ maxWidth: 160, minWidth: 120, flex: '1 1 120px' }}
        >
          {LEVELS.map(l => <option key={l}>{l === 'All' ? 'All levels' : l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">🔍</div><p>No quizzes found.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
          {filtered.map(q => (
            <div key={q._id} className="card" style={{ cursor: 'pointer', transition: 'border .15s', border: `1px solid var(--border)` }}
              onClick={() => !q.attempted && navigate(`/quiz/${q._id}`)}
              onMouseEnter={e => !q.attempted && (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                <span className="badge badge-subject">{q.subject}</span>
                <span className={`badge badge-${q.level}`}>{q.level.charAt(0).toUpperCase() + q.level.slice(1)}</span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '.35rem', color: q.attempted ? 'var(--text2)' : 'var(--text)' }}>{q.title}</h3>
              {q.description && <p style={{ fontSize: '.825rem', color: 'var(--text3)', marginBottom: '.75rem', lineHeight: 1.5 }}>{q.description}</p>}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '.8rem', color: 'var(--text2)', marginBottom: '1rem' }}>
                <span>⏱ {q.timer} min</span>
                <span>📝 {q.numQuestions} questions</span>
              </div>
              {q.attempted ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem', color: 'var(--green)' }}>
                  <span>✓</span> Already attempted
                </div>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/quiz/${q._id}`); }}>
                  Start Quiz →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
