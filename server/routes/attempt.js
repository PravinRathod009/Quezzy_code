const router = require('express').Router();
const { submitAttempt, getMyAttempts, getAttemptById, getRankings } = require('../controllers/attemptController');
const verifyToken = require('../middleware/verifyToken');

router.post('/submit', verifyToken, submitAttempt);
router.get('/my', verifyToken, getMyAttempts);
router.get('/rankings', verifyToken, getRankings);
router.get('/:id', verifyToken, getAttemptById);

module.exports = router;
