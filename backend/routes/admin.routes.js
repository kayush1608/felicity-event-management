const express = require('express');
const router = express.Router();
const {
  getDashboard,
  createOrganizer,
  getOrganizers,
  updateOrganizerStatus,
  deleteOrganizer,
  getPasswordResetRequests,
  processPasswordResetRequest,
  getParticipants
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');


router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboard);
router.post('/organizers', createOrganizer);
router.get('/organizers', getOrganizers);
router.put('/organizers/:id/status', updateOrganizerStatus);
router.delete('/organizers/:id', deleteOrganizer);
router.get('/password-reset-requests', getPasswordResetRequests);
router.put('/password-reset-requests/:id', processPasswordResetRequest);
router.get('/participants', getParticipants);

module.exports = router;
