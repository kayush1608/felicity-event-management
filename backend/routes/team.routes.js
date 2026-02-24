const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const teamCtrl = require('../controllers/team.controller');

router.use(protect);
router.use(authorize('participant'));

router.post('/', teamCtrl.createTeam);
router.post('/join', teamCtrl.joinByInvite);
router.post('/:teamId/accept/:memberId', teamCtrl.acceptMember);
router.get('/:id', teamCtrl.getTeam);

module.exports = router;
