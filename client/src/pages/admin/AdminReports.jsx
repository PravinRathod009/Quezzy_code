import { useState } from 'react';
import api from '../../utils/axiosInstance';

const REPORTS = [
  {
    type: 'users',
    title: 'Registered Users',
    description: 'Full list of all registered users with join date and status.',
    icon: '👥'
  },
  {
    type: 'active-users',
    title: 'Active Users (Last 30 Days)',
    description: 'Users who have logged in during the past 30 days.',
    icon: '🟢'
  },
  {
    type: 'quiz-results',
    title: 'All Quiz Results',
    description: 'Complete list of quiz attempts — user, quiz, score, and date.',
    icon: '📊'
  },
  {
    type: 'leaderboard',
    title: 'Platform Leaderboard',
    description: 'Top 50 users ranked by average score across all quizzes.',
    icon: '🏆'
  },
  {
    type: 'summary',
    title: 'Platform Summary',
    description: 'High-level overview: total users, active users, quizzes, and attempts.',
    icon: '📋'
  }
];

export default function AdminReports() {
  const [generating, setGenerating] = useState({});
  const [errors, setErrors] = useState({});

  const generate = async (type) => {
    setGenerating(g => ({ ...g, [type]: true }));
    setErrors(e => ({ ...e, [type]: '' }));
    try {
      const res = await api.get(`/admin/reports/${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `quizzy-${type}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrors(e => ({ ...e, [type]: 'Failed to generate report. Try again.' }));
    } finally {
      setGenerating(g => ({ ...g, [type]: false }));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">PDF Reports</h1>
        <p className="page-subtitle">Generate and download platform reports</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {REPORTS.map(report => (
          <div key={report.type} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '2rem' }}>{report.icon}</span>
              <div>
                <h3 style={{ fontSize: '.95rem', fontWeight: 600, color: 'var(--text)' }}>{report.title}</h3>
                <p style={{ fontSize: '.825rem', color: 'var(--text2)', marginTop: '.25rem', lineHeight: 1.5 }}>{report.description}</p>
              </div>
            </div>
            {errors[report.type] && (
              <div className="alert alert-error" style={{ padding: '.5rem .75rem', fontSize: '.8rem' }}>{errors[report.type]}</div>
            )}
            <button
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start', marginTop: 'auto' }}
              onClick={() => generate(report.type)}
              disabled={generating[report.type]}>
              {generating[report.type]
                ? <><span className="spinner" style={{ width: 14, height: 14 }} />Generating…</>
                : '⬇ Download PDF'}
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '2rem', background: 'var(--bg3)' }}>
        <h3 style={{ fontSize: '.95rem', fontWeight: 600, marginBottom: '.5rem' }}>📌 Report Notes</h3>
        <ul style={{ paddingLeft: '1.25rem', fontSize: '.85rem', color: 'var(--text2)', lineHeight: 2 }}>
          <li>All reports are generated in real-time with current data.</li>
          <li>Quiz Results report includes the most recent 200 attempts.</li>
          <li>Leaderboard report shows top 50 users by average score.</li>
          <li>Reports are downloaded directly to your device as PDF files.</li>
        </ul>
      </div>
    </div>
  );
}
