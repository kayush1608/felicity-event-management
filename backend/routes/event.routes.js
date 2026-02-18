const express = require('express');
const router = express.Router();
const {
  getEvents,
  getTrendingEvents,
  getEventById,
  createEvent,
  updateEvent,
  publishEvent,
  deleteEvent,
  getEventAnalytics
} = require('../controllers/event.controller');
const { protect, authorize } = require('../middleware/auth.middleware');


router.get('/', getEvents);
router.get('/trending', getTrendingEvents);
router.get('/:id', getEventById);


router.post('/', protect, authorize('organizer'), createEvent);
router.put('/:id', protect, authorize('organizer'), updateEvent);
router.put('/:id/publish', protect, authorize('organizer'), publishEvent);
router.delete('/:id', protect, authorize('organizer'), deleteEvent);
router.get('/:id/analytics', protect, authorize('organizer'), getEventAnalytics);

module.exports = router;
