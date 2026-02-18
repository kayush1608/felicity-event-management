const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getEventParticipants,
  updateRegistrationStatus,
  scanQRAndMarkAttendance,
  getAttendanceReport,
  getProfile,
  updateProfile,
  requestPasswordReset,
  getEventFeedback
} = require('../controllers/organizer.controller');
const { protect, authorize } = require('../middleware/auth.middleware');


router.use(protect);
router.use(authorize('organizer'));

router.get('/dashboard', getDashboard);
router.get('/events/:eventId/participants', getEventParticipants);
router.put('/registrations/:registrationId/status', updateRegistrationStatus);
router.post('/attendance/scan', scanQRAndMarkAttendance);
router.get('/events/:eventId/attendance', getAttendanceReport);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/password-reset-request', requestPasswordReset);
router.get('/events/:eventId/feedback', getEventFeedback);

module.exports = router;
