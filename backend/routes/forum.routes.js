const express = require('express');
const router = express.Router();
const { getMessages, postMessage, deleteMessage, togglePin, reactToMessage } = require('../controllers/forum.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/events/:eventId/messages', getMessages);
router.post('/events/:eventId/messages', postMessage);
router.delete('/messages/:messageId', deleteMessage);
router.put('/messages/:messageId/pin', togglePin);
router.post('/messages/:messageId/react', reactToMessage);

module.exports = router;
