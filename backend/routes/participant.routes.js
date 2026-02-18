const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getParticipantEvents,
  getParticipantEventDetails,
  registerForEvent,
  getProfile,
  updateProfile,
  getOrganizers,
  getOrganizerDetails,
  toggleFollowOrganizer,
  submitFeedback,
  getRegistrationDetails
} = require('../controllers/participant.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { optionalUploadAny } = require('../middleware/optionalUpload.middleware');


router.use(protect);
router.use(authorize('participant'));

router.get('/dashboard', getDashboard);


router.get('/events', getParticipantEvents);
router.get('/events/:id', getParticipantEventDetails);


router.post('/events/:eventId/register', optionalUploadAny(), registerForEvent);
router.post('/events/:eventId/feedback', submitFeedback);

router.post('/register/:eventId', optionalUploadAny(), registerForEvent);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/organizers', getOrganizers);
router.get('/organizers/:id', getOrganizerDetails);
router.post('/organizers/:id/follow', toggleFollowOrganizer);
router.post('/organizers/:id/unfollow', toggleFollowOrganizer);
router.post('/feedback/:eventId', submitFeedback);
router.get('/registration/:ticketId', getRegistrationDetails);

module.exports = router;
