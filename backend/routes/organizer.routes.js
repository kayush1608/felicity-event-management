const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getEventParticipants,
  updateRegistrationStatus,
  scanQRAndMarkAttendance,
  getAttendanceReport,
  manualAttendanceOverride,
  getAuditLogs,
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
router.put('/attendance/override', manualAttendanceOverride);
router.get('/events/:eventId/audit-logs', getAuditLogs);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/password-reset-request', requestPasswordReset);
router.get('/events/:eventId/feedback', getEventFeedback);

module.exports = router;
