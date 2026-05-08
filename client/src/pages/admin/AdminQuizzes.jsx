import { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import api from '../../utils/axiosInstance';

const LEVELS = ['low', 'medium', 'advance'];
const SUBJECTS = ['Mathematics', 'Science', 'History', 'Geography', 'English', 'Computer Science', 'General Knowledge', 'Other'];

const emptyQuiz = { title: '', description: '', subject: '', level: 'medium', timer: 15, numQuestions: 10 };
const emptyQ = { text: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A' };

// ── CSV Upload Modal ──────────────────────────────────────────
function CsvModal({ quizId, quizTitle, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef();

  const validateRow = (row, i) => {
    const errs = [];
    if (!row.question?.trim()) errs.push(`Row ${i+1}: "question" is required`);
    if (!row.option_a?.trim()) errs.push(`Row ${i+1}: "option_a" is required`);
    if (!row.option_b?.trim()) errs.push(`Row ${i+1}: "option_b" is required`);
    if (!row.option_c?.trim()) errs.push(`Row ${i+1}: "option_c" is required`);
    if (!row.option_d?.trim()) errs.push(`Row ${i+1}: "option_d" is required`);
    if (!['A','B','C','D'].includes((row.correct_answer || '').toUpperCase()))
      errs.push(`Row ${i+1}: "correct_answer" must be A, B, C or D`);
    return errs;
  };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setErrors([]);
    setPreview([]);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: ({ data }) => {
        const allErrs = data.flatMap((row, i) => validateRow(row, i));
        setErrors(allErrs);
        setPreview(data.slice(0, 5));
      }
    });
  };

  const handleDrop = e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

  const submit = () => {
    if (!file || errors.length) return;
    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: async ({ data }) => {
        try {
          const questions = data.map(row => ({
            text: row.question.trim(),
            options: { A: row.option_a.trim(), B: row.option_b.trim(), C: row.option_c.trim(), D: row.option_d.trim() },
            correctAnswer: row.correct_answer.trim().toUpperCase()
          }));
          await api.post(`/quizzes/${quizId}/questions/bulk`, { questions });
          setMsg(`✓ ${questions.length} questions uploaded successfully!`);
          setTimeout(() => { onSuccess(); onClose(); }, 1500);
        } catch (err) {
          setErrors([err.response?.data?.error || 'Upload failed.']);
        } finally { setUploading(false); }
      }
    });
  };

  const downloadTemplate = () => {
    const csv = `question,option_a,option_b,option_c,option_d,correct_answer\nWhat is 2 + 2?,3,4,5,6,B\nWhat is the capital of France?,Berlin,Madrid,Paris,Rome,C`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'quiz_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Upload Questions via CSV</h2>
            <p style={{ fontSize: '.8rem', color: 'var(--text2)', marginTop: '.15rem' }}>Quiz: {quizTitle}</p>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>

        {/* Template download */}
        <div className="alert alert-info" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>CSV columns: <code>question, option_a, option_b, option_c, option_d, correct_answer</code></span>
          <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}>⬇ Template</button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
          style={{
            border: `2px dashed ${file ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center',
            cursor: 'pointer', marginBottom: '1rem', background: file ? 'var(--green-dim)' : 'var(--bg3)',
            transition: 'all .2s'
          }}>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>{file ? '📄' : '📁'}</div>
          {file ? (
            <>
              <div style={{ fontWeight: 600, color: 'var(--green)' }}>{file.name}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginTop: '.25rem' }}>{preview.length} rows parsed (showing first 5)</div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 500, color: 'var(--text)' }}>Drop your CSV here or click to browse</div>
              <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginTop: '.25rem' }}>Only .csv files accepted</div>
            </>
          )}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <strong>Validation errors ({errors.length}):</strong>
            <ul style={{ marginTop: '.5rem', paddingLeft: '1.25rem' }}>
              {errors.slice(0, 8).map((e, i) => <li key={i} style={{ fontSize: '.825rem' }}>{e}</li>)}
              {errors.length > 8 && <li style={{ fontSize: '.8rem' }}>…and {errors.length - 8} more</li>}
            </ul>
          </div>
        )}

        {/* Preview table */}
        {preview.length > 0 && errors.length === 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '.875rem', fontWeight: 600, marginBottom: '.6rem', color: 'var(--text2)' }}>Preview (first {preview.length} rows)</h4>
            <div className="table-wrap" style={{ fontSize: '.78rem' }}>
              <table>
                <thead>
                  <tr><th>#</th><th>Question</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Ans</th></tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text2)' }}>{i + 1}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.question}</td>
                      <td>{row.option_a}</td>
                      <td>{row.option_b}</td>
                      <td>{row.option_c}</td>
                      <td>{row.option_d}</td>
                      <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--green)' }}>{(row.correct_answer||'').toUpperCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {msg && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{msg}</div>}

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!file || errors.length > 0 || uploading}>
            {uploading ? <><span className="spinner" />Uploading…</> : `Upload ${preview.length ? `(${preview.length}+ questions)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Question Form Modal ────────────────────────────────────────
function QuestionModal({ quizId, question, onClose, onSaved }) {
  const [form, setForm] = useState(question || emptyQ);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setOpt = k => e => setForm(f => ({ ...f, options: { ...f.options, [k]: e.target.value } }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (question?._id) {
        await api.put(`/quizzes/${quizId}/questions/${question._id}`, form);
      } else {
        await api.post(`/quizzes/${quizId}/questions`, form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{question ? 'Edit Question' : 'Add Question'}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Question Text</label>
            <textarea className="form-textarea" value={form.text} onChange={set('text')} required placeholder="Enter question…" />
          </div>
          {['A','B','C','D'].map(k => (
            <div className="form-group" key={k}>
              <label className="form-label">Option {k}</label>
              <input className="form-input" value={form.options[k]} onChange={setOpt(k)} required placeholder={`Option ${k}`} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Correct Answer</label>
            <select className="form-select" value={form.correctAnswer} onChange={set('correctAnswer')}>
              {['A','B','C','D'].map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" />Saving…</> : 'Save Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Quiz Form Modal ────────────────────────────────────────────
function QuizModal({ quiz, onClose, onSaved }) {
  const [form, setForm] = useState(quiz || emptyQuiz);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (quiz?._id) await api.put(`/quizzes/${quiz._id}`, form);
      else await api.post('/quizzes', form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{quiz ? 'Edit Quiz' : 'Create Quiz'}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={set('title')} required placeholder="Quiz title" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={set('description')} placeholder="Optional description" style={{ minHeight: 60 }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select className="form-select" value={form.subject} onChange={set('subject')} required>
                <option value="">Select subject</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Level *</label>
              <select className="form-select" value={form.level} onChange={set('level')}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Timer (minutes) *</label>
              <input className="form-input" type="number" min="1" max="180" value={form.timer} onChange={set('timer')} required />
            </div>
            <div className="form-group">
              <label className="form-label">No. of Questions *</label>
              <input className="form-input" type="number" min="1" value={form.numQuestions} onChange={set('numQuestions')} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" />Saving…</> : quiz ? 'Update Quiz' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Questions Panel ────────────────────────────────────────────
function QuestionsPanel({ quiz, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [showCsv, setShowCsv] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/quizzes/${quiz._id}/admin-questions`).then(r => setQuestions(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [quiz._id]);

  const deleteQ = async (qid) => {
    if (!window.confirm('Delete this question?')) return;
    await api.delete(`/quizzes/${quiz._id}/questions/${qid}`);
    load();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 900, padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 680, height: 'calc(100vh - 2rem)', overflowY: 'auto', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{quiz.title}</h2>
            <p style={{ fontSize: '.8rem', color: 'var(--text2)' }}>{questions.length} questions</p>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-success btn-sm" onClick={() => setShowCsv(true)}>📄 Upload CSV</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Question</button>
            <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* CSV format hint */}
        <div className="alert alert-info" style={{ marginBottom: '1rem', fontSize: '.8rem' }}>
          💡 Tip: Upload multiple questions at once using a CSV file with columns: <code>question, option_a, option_b, option_c, option_d, correct_answer</code>
        </div>

        {loading ? <div className="loading-center"><div className="spinner" /></div> : (
          questions.length === 0 ? (
            <div className="empty-state">
              <div className="icon">❓</div>
              <p>No questions yet.</p>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button className="btn btn-success" onClick={() => setShowCsv(true)}>📄 Upload CSV</button>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Manually</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {questions.map((q, i) => (
                <div key={q._id} className="card-sm" style={{ borderLeft: '3px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 600, fontSize: '.85rem' }}>Q{i + 1}</span>
                    <div style={{ display: 'flex', gap: '.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditQ(q)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteQ(q._id)}>Delete</button>
                    </div>
                  </div>
                  <p style={{ fontSize: '.9rem', fontWeight: 500, marginBottom: '.6rem' }}>{q.text}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.3rem' }}>
                    {Object.entries(q.options).map(([k, v]) => (
                      <div key={k} style={{
                        fontSize: '.8rem', padding: '.3rem .6rem', borderRadius: 4,
                        background: k === q.correctAnswer ? 'var(--green-dim)' : 'var(--bg3)',
                        color: k === q.correctAnswer ? 'var(--green)' : 'var(--text2)',
                        border: `1px solid ${k === q.correctAnswer ? 'var(--green)' : 'transparent'}`
                      }}>
                        <strong>{k}.</strong> {v}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {showAdd && <QuestionModal quizId={quiz._id} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {editQ && <QuestionModal quizId={quiz._id} question={editQ} onClose={() => setEditQ(null)} onSaved={() => { setEditQ(null); load(); }} />}
      {showCsv && <CsvModal quizId={quiz._id} quizTitle={quiz.title} onClose={() => setShowCsv(false)} onSuccess={load} />}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editQuiz, setEditQuiz] = useState(null);
  const [manageQuiz, setManageQuiz] = useState(null);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/quizzes').then(r => setQuizzes(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const deleteQuiz = async (id, title) => {
    if (!window.confirm(`Delete "${title}" and all its questions?`)) return;
    await api.delete(`/quizzes/${id}`);
    setMsg('Quiz deleted.');
    setTimeout(() => setMsg(''), 3000);
    load();
  };

  const filtered = quizzes.filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    q.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Manage Quizzes</h1>
          <p className="page-subtitle">{quizzes.length} quizzes total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Quiz</button>
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{msg}</div>}

      <div style={{ marginBottom: '1.25rem' }}>
        <input className="form-input" placeholder="Search quizzes…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">📝</div><p>No quizzes yet. Create one!</p></div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Title</th><th>Subject</th><th>Level</th><th>Timer</th><th>Questions</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(q => (
                    <tr key={q._id}>
                      <td style={{ fontWeight: 500 }}>{q.title}</td>
                      <td><span className="badge badge-subject">{q.subject}</span></td>
                      <td><span className={`badge badge-${q.level}`}>{q.level}</span></td>
                      <td style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{q.timer}m</td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{q.numQuestions}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setManageQuiz(q)}>Questions</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditQuiz(q)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteQuiz(q._id, q.title)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {showCreate && <QuizModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load(); }} />}
      {editQuiz && <QuizModal quiz={editQuiz} onClose={() => setEditQuiz(null)} onSaved={() => { setEditQuiz(null); load(); }} />}
      {manageQuiz && <QuestionsPanel quiz={manageQuiz} onClose={() => setManageQuiz(null)} />}
    </div>
  );
}
