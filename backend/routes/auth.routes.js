const express = require('express');
const router = express.Router();
const {
  registerParticipant,
  login,
  getMe,
  updatePassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { rateLimit } = require('../middleware/rateLimit.middleware');


router.post('/register', rateLimit({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'auth:register' }), registerParticipant);
router.post('/login', rateLimit({ windowMs: 10 * 60 * 1000, max: 60, keyPrefix: 'auth:login' }), login);


router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

module.exports = router;
