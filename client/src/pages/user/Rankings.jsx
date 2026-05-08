import { useEffect, useState } from 'react';
import api from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';

export default function Rankings() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attempts/rankings').then(r => setRankings(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const myRank = rankings.findIndex(r => r._id === user._id) + 1;

  const medal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏆 Leaderboard</h1>
        <p className="page-subtitle">Top performers on the platform</p>
      </div>

      {myRank > 0 && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          Your current rank: <strong>#{myRank}</strong> out of {rankings.length} users
        </div>
      )}

      <div className="card">
        {/* Desktop table */}
        <div className="table-wrap table-mobile-hide">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Avg Score</th>
                <th>Quizzes</th>
                <th>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r, i) => {
                const isMe = r._id === user._id;
                return (
                  <tr key={r._id} style={{ background: isMe ? 'var(--accent-dim)' : undefined }}>
                    <td>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1rem' }}>
                        {medal(i + 1) || `#${i + 1}`}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: isMe ? 700 : 400, color: isMe ? 'var(--accent)' : 'var(--text)' }}>
                        {r.user?.name} {isMe && <span style={{ fontSize: '.75rem' }}>(you)</span>}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--mono)', fontWeight: 600,
                        color: r.avgScore >= 80 ? 'var(--green)' : r.avgScore >= 50 ? 'var(--accent)' : 'var(--red)'
                      }}>
                        {Math.round(r.avgScore)}%
                      </span>
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{r.totalAttempts}</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--blue)' }}>{r.totalScore}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div>
          {rankings.map((r, i) => {
            const isMe = r._id === user._id;
            return (
              <div key={r._id}
                className="mobile-card-row"
                style={{ background: isMe ? 'var(--accent-dim)' : undefined, borderRadius: isMe ? 'var(--radius)' : undefined, padding: '.75rem .5rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.1rem', minWidth: 32 }}>
                    {medal(i + 1) || `#${i + 1}`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: isMe ? 700 : 500, color: isMe ? 'var(--accent)' : 'var(--text)', fontSize: '.9rem' }}>
                      {r.user?.name} {isMe && <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>(you)</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '.75rem', fontSize: '.8rem', color: 'var(--text2)', marginTop: '.15rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: r.avgScore >= 80 ? 'var(--green)' : r.avgScore >= 50 ? 'var(--accent)' : 'var(--red)' }}>
                        {Math.round(r.avgScore)}%
                      </span>
                      <span>{r.totalAttempts} quizzes</span>
                      <span style={{ color: 'var(--blue)', fontFamily: 'var(--mono)' }}>{r.totalScore} pts</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {rankings.length === 0 && (
          <div className="empty-state"><div className="icon">🏆</div><p>No rankings yet. Be the first!</p></div>
        )}
      </div>
    </div>
  );
}
