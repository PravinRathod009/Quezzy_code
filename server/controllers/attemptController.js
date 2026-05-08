const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');

exports.submitAttempt = async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;
    // Block re-attempt
    const existing = await Attempt.findOne({ userId: req.user._id, quizId });
    if (existing) return res.status(409).json({ error: 'You have already attempted this quiz.' });

    const questions = await Question.find({ quizId }).sort('order');
    if (!questions.length) return res.status(400).json({ error: 'No questions found for this quiz.' });

    let correctCount = 0;
    const gradedAnswers = questions.map(q => {
      const userAnswer = answers.find(a => a.questionId === q._id.toString());
      const selected = userAnswer ? userAnswer.selected : null;
      if (selected && selected === q.correctAnswer) correctCount++;
      return { questionId: q._id, selected };
    });

    const totalQuestions = questions.length;
    const wrongCount = gradedAnswers.filter(a => a.selected && a.selected !== questions.find(q => q._id.toString() === a.questionId.toString())?.correctAnswer).length;
    const skippedCount = gradedAnswers.filter(a => !a.selected).length;
    const score = correctCount;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    const attempt = await Attempt.create({
      userId: req.user._id,
      quizId,
      answers: gradedAnswers,
      score,
      totalQuestions,
      correctCount,
      wrongCount,
      skippedCount,
      timeTaken: timeTaken || 0,
      percentage
    });
    res.status(201).json({ attempt, correctAnswers: Object.fromEntries(questions.map(q => [q._id, q.correctAnswer])) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ userId: req.user._id })
      .populate('quizId', 'title subject level')
      .sort('-createdAt');
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAttemptById = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('quizId', 'title subject level')
      .populate('answers.questionId');
    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });
    if (attempt.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied.' });
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRankings = async (req, res) => {
  try {
    const { quizId } = req.query;
    const filter = quizId ? { quizId } : {};
    const rankings = await Attempt.aggregate([
      { $match: filter },
      { $group: { _id: '$userId', avgScore: { $avg: '$percentage' }, totalAttempts: { $sum: 1 }, totalScore: { $sum: '$score' } } },
      { $sort: { avgScore: -1, totalScore: -1 } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.name': 1, 'user.email': 1, avgScore: 1, totalAttempts: 1, totalScore: 1 } }
    ]);
    const withRank = rankings.map((r, i) => ({ ...r, rank: i + 1 }));
    res.json(withRank);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
