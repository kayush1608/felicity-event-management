const Team = require('../models/Team.model');
const Event = require('../models/Event.model');
const Registration = require('../models/Registration.model');
const User = require('../models/User.model');
const { generateInviteCode, generateTicketId, generateQRCode } = require('../utils/generators');
const { sendTicketEmail } = require('../utils/emailService');

exports.createTeam = async (req, res) => {
  try {
    const { teamName, eventId } = req.body;
    if (!teamName || !eventId) return res.status(400).json({ success: false, message: 'teamName and eventId required' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.teamSize || !event.teamSize.min) return res.status(400).json({ success: false, message: 'Event does not support teams' });

    // Prevent duplicate: user already leads or belongs to a team for this event
    const existingTeam = await Team.findOne({
      eventId: event._id,
      $or: [
        { teamLeaderId: req.user.id },
        { 'members.userId': req.user.id }
      ]
    });
    if (existingTeam) return res.status(400).json({ success: false, message: 'You already have a team for this event' });

    const inviteCode = generateInviteCode();
    const team = await Team.create({
      teamName: String(teamName).trim(),
      eventId: event._id,
      teamLeaderId: req.user.id,
      teamSize: event.teamSize?.max || event.teamSize?.min || 2,
      inviteCode,
      members: [{ userId: req.user.id, status: 'Accepted', joinedAt: new Date() }]
    });

    return res.json({ success: true, data: team });
  } catch (error) {
    console.error('Create team error:', error);
    return res.status(500).json({ success: false, message: 'Error creating team', error: error.message });
  }
};

exports.joinByInvite = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ success: false, message: 'inviteCode required' });

    const team = await Team.findOne({ inviteCode });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.isComplete) return res.status(400).json({ success: false, message: 'Team is already complete' });

    if (team.teamLeaderId.toString() === req.user.id) return res.status(400).json({ success: false, message: 'Leader already part of team' });

    const already = team.members.find((m) => m.userId?.toString() === req.user.id);
    if (already) return res.json({ success: true, message: 'Already invited/part of team', data: team });

    // Prevent joining if user already belongs to another team for same event
    const existingTeam = await Team.findOne({
      eventId: team.eventId,
      _id: { $ne: team._id },
      $or: [
        { teamLeaderId: req.user.id },
        { 'members.userId': req.user.id }
      ]
    });
    if (existingTeam) return res.status(400).json({ success: false, message: 'You already belong to a team for this event' });

    team.members.push({ userId: req.user.id, status: 'Pending', joinedAt: new Date() });
    await team.save();

    return res.json({ success: true, message: 'Join request sent', data: team });
  } catch (error) {
    console.error('Join team error:', error);
    return res.status(500).json({ success: false, message: 'Error joining team', error: error.message });
  }
};

exports.acceptMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (team.teamLeaderId.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Only leader can accept members' });

    const member = team.members.find((m) => m._id.toString() === memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found in team' });

    if (member.status !== 'Pending') return res.status(400).json({ success: false, message: 'Member not pending' });

    member.status = 'Accepted';
    member.responseDate = new Date();
    await team.save();

    const acceptedCount = team.members.filter((m) => m.status === 'Accepted').length;
    const required = Number(team.teamSize || 0);
    if (acceptedCount >= required) {
      team.isComplete = true;
      team.status = 'Complete';
      await team.save();

      const userIds = [...new Set([team.teamLeaderId.toString(), ...team.members.filter((m) => m.status === 'Accepted').map((m) => m.userId.toString())])];
      const event = await Event.findById(team.eventId);

      for (const uid of userIds) {
        const exists = await Registration.findOne({ eventId: event._id, participantId: uid });
        if (exists) {
          if (!exists.teamId) {
            exists.teamId = team._id;
            await exists.save();
          }
          continue;
        }

        const ticketId = generateTicketId();
        const qr = await generateQRCode({ eventId: event._id, ticketId, participantId: uid });

        const reg = await Registration.create({
          eventId: event._id,
          participantId: uid,
          registrationType: 'Hackathon',
          status: 'Approved',
          teamId: team._id,
          paymentStatus: 'Completed',
          amountPaid: 0,
          ticketId,
          qrCode: qr
        });

        event.totalRegistrations = Number(event.totalRegistrations || 0) + 1;
        await event.save();

        try {
          const user = await User.findById(uid).select('email name');
          if (user?.email) {
            await sendTicketEmail(user.email, event.eventName, ticketId, qr);
          }
        } catch (e) {
          console.warn('Ticket email send failed:', e.message || e);
        }
      }
    }

    return res.json({ success: true, message: 'Member accepted', data: team });
  } catch (error) {
    console.error('Accept member error:', error);
    return res.status(500).json({ success: false, message: 'Error accepting member', error: error.message });
  }
};

exports.getTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id).populate('members.userId', 'name email firstName lastName').populate('teamLeaderId', 'name email firstName lastName');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    return res.json({ success: true, data: team });
  } catch (error) {
    console.error('Get team error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching team', error: error.message });
  }
};

exports.getMyTeamForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const team = await Team.findOne({
      eventId,
      $or: [
        { teamLeaderId: req.user.id },
        { 'members.userId': req.user.id }
      ]
    }).populate('members.userId', 'name email firstName lastName').populate('teamLeaderId', 'name email firstName lastName');

    if (!team) return res.json({ success: true, data: null });
    return res.json({ success: true, data: team });
  } catch (error) {
    console.error('Get my team error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching team', error: error.message });
  }
};
