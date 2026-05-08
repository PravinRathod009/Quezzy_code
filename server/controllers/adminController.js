const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const PDFDocument = require('pdfkit');

exports.getDashboardStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalUsers, activeUsers, totalQuizzes, totalAttempts, recentAttempts] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', lastLogin: { $gte: thirtyDaysAgo } }),
      Quiz.countDocuments({ isActive: true }),
      Attempt.countDocuments(),
      Attempt.find().sort('-createdAt').limit(5)
        .populate('userId', 'name')
        .populate('quizId', 'title subject')
    ]);
    const subjectStats = await Attempt.aggregate([
      { $lookup: { from: 'quizzes', localField: 'quizId', foreignField: '_id', as: 'quiz' } },
      { $unwind: '$quiz' },
      { $group: { _id: '$quiz.subject', attempts: { $sum: 1 }, avgScore: { $avg: '$percentage' } } },
      { $sort: { attempts: -1 } }
    ]);
    res.json({ totalUsers, activeUsers, totalQuizzes, totalAttempts, recentAttempts, subjectStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort('-createdAt');
    const userIds = users.map(u => u._id);
    const attemptStats = await Attempt.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', totalAttempts: { $sum: 1 }, avgScore: { $avg: '$percentage' } } }
    ]);
    const statsMap = Object.fromEntries(attemptStats.map(s => [s._id.toString(), s]));
    const result = users.map(u => ({
      ...u.toObject(),
      totalAttempts: statsMap[u._id.toString()]?.totalAttempts || 0,
      avgScore: Math.round(statsMap[u._id.toString()]?.avgScore || 0)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllAttempts = async (req, res) => {
  try {
    const { quizId } = req.query;
    const filter = quizId ? { quizId } : {};
    const attempts = await Attempt.find(filter)
      .populate('userId', 'name email')
      .populate('quizId', 'title subject level')
      .sort('-createdAt');
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ user, message: `User ${user.isActive ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PDF Reports ───────────────────────────────────────────────

const buildPDF = (doc, title, subtitle) => {
  doc.fontSize(22).font('Helvetica-Bold').text('Quizzy', 50, 40);
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#333').text(title, 50, 75);
  doc.fontSize(10).font('Helvetica').fillColor('#666').text(subtitle, 50, 100);
  doc.moveTo(50, 120).lineTo(550, 120).stroke('#ddd');
  return 140;
};

const tableRow = (doc, y, cols, isHeader = false) => {
  const colWidths = [30, 160, 150, 80, 80];
  const x = 50;
  if (isHeader) doc.rect(x, y - 4, 500, 20).fill('#f5f5f5').stroke('#eee');
  cols.forEach((text, i) => {
    const cx = x + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.fontSize(9)
      .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(isHeader ? '#333' : '#555')
      .text(String(text).substring(0, 30), cx, y, { width: colWidths[i] - 4, ellipsis: true });
  });
  return y + 20;
};

exports.generateReport = async (req, res) => {
  try {
    const { type } = req.params;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quizzy-report-${type}.pdf`);
    doc.pipe(res);

    if (type === 'users') {
      let y = buildPDF(doc, 'Registered Users Report', `Generated on ${new Date().toLocaleDateString()}`);
      y = tableRow(doc, y, ['#', 'Name', 'Email', 'Joined', 'Status'], true);
      const users = await User.find({ role: 'user' }).sort('-createdAt');
      users.forEach((u, i) => {
        if (y > 720) { doc.addPage(); y = 50; }
        y = tableRow(doc, y, [i + 1, u.name, u.email, u.createdAt.toLocaleDateString(), u.isActive ? 'Active' : 'Inactive']);
      });
    } else if (type === 'active-users') {
      let y = buildPDF(doc, 'Active Users Report (Last 30 Days)', `Generated on ${new Date().toLocaleDateString()}`);
      y = tableRow(doc, y, ['#', 'Name', 'Email', 'Last Login', 'Attempts'], true);
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const users = await User.find({ role: 'user', lastLogin: { $gte: cutoff } });
      const ids = users.map(u => u._id);
      const stats = await Attempt.aggregate([
        { $match: { userId: { $in: ids } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ]);
      const sm = Object.fromEntries(stats.map(s => [s._id.toString(), s.count]));
      users.forEach((u, i) => {
        if (y > 720) { doc.addPage(); y = 50; }
        y = tableRow(doc, y, [i + 1, u.name, u.email, u.lastLogin?.toLocaleDateString() || '-', sm[u._id.toString()] || 0]);
      });
    } else if (type === 'quiz-results') {
      let y = buildPDF(doc, 'All Quiz Results', `Generated on ${new Date().toLocaleDateString()}`);
      y = tableRow(doc, y, ['#', 'User', 'Quiz', 'Score', 'Date'], true);
      const attempts = await Attempt.find()
        .populate('userId', 'name').populate('quizId', 'title')
        .sort('-createdAt').limit(200);
      attempts.forEach((a, i) => {
        if (y > 720) { doc.addPage(); y = 50; }
        y = tableRow(doc, y, [i + 1, a.userId?.name, a.quizId?.title, `${a.percentage}%`, a.createdAt.toLocaleDateString()]);
      });
    } else if (type === 'leaderboard') {
      let y = buildPDF(doc, 'Platform Leaderboard', `Generated on ${new Date().toLocaleDateString()}`);
      y = tableRow(doc, y, ['Rank', 'User', 'Email', 'Avg Score', 'Attempts'], true);
      const rankings = await Attempt.aggregate([
        { $group: { _id: '$userId', avgScore: { $avg: '$percentage' }, totalAttempts: { $sum: 1 } } },
        { $sort: { avgScore: -1 } }, { $limit: 50 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' }
      ]);
      rankings.forEach((r, i) => {
        if (y > 720) { doc.addPage(); y = 50; }
        y = tableRow(doc, y, [i + 1, r.user.name, r.user.email, `${Math.round(r.avgScore)}%`, r.totalAttempts]);
      });
    } else if (type === 'summary') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [totalUsers, activeUsers, totalQuizzes, totalAttempts] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'user', lastLogin: { $gte: thirtyDaysAgo } }),
        Quiz.countDocuments(),
        Attempt.countDocuments()
      ]);
      let y = buildPDF(doc, 'Platform Summary Report', `Generated on ${new Date().toLocaleDateString()}`);
      const stats = [
        ['Total Registered Users', totalUsers],
        ['Active Users (Last 30d)', activeUsers],
        ['Total Quizzes', totalQuizzes],
        ['Total Attempts', totalAttempts]
      ];
      stats.forEach(([label, val]) => {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text(label + ':', 50, y);
        doc.fontSize(14).font('Helvetica').fillColor('#555').text(String(val), 280, y);
        y += 30;
      });
    } else {
      return res.status(400).json({ error: 'Invalid report type.' });
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
