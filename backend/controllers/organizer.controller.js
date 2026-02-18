const User = require('../models/User.model');
const Event = require('../models/Event.model');
const Registration = require('../models/Registration.model');
const Feedback = require('../models/Feedback.model');
const PasswordResetRequest = require('../models/PasswordResetRequest.model');




exports.getDashboard = async (req, res) => {
  try {
    const events = await Event.find({ organizerId: req.user.id }).
    sort({ createdAt: -1 });


    const completedEvents = events.filter((e) => e.status === 'Completed');
    const totalRegistrations = completedEvents.reduce((sum, e) => sum + e.totalRegistrations, 0);
    const totalRevenue = completedEvents.reduce((sum, e) => sum + e.totalRevenue, 0);
    const totalAttendance = completedEvents.reduce((sum, e) => sum + e.totalAttendance, 0);

    res.json({
      success: true,
      data: {
        events,
        analytics: {
          totalEvents: events.length,
          completedEvents: completedEvents.length,
          totalRegistrations,
          totalRevenue,
          totalAttendance
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message
    });
  }
};




exports.getEventParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }


    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { search, status } = req.query;
    let query = { eventId: req.params.eventId };

    if (status) {
      query.status = status;
    }

    const registrations = await Registration.find(query).
    populate('participantId', 'firstName lastName email contactNumber').
    populate('teamId', 'teamName').
    sort({ registrationDate: -1 });


    let filteredRegistrations = registrations;
    if (search) {
      filteredRegistrations = registrations.filter((reg) => {
        const fullName = `${reg.participantId.firstName} ${reg.participantId.lastName}`.toLowerCase();
        const email = reg.participantId.email.toLowerCase();
        return fullName.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
      });
    }

    res.json({
      success: true,
      count: filteredRegistrations.length,
      participants: filteredRegistrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching participants',
      error: error.message
    });
  }
};




exports.updateRegistrationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const registration = await Registration.findById(req.params.registrationId).
    populate('eventId');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }


    if (registration.eventId.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const wasApproved = registration.status === 'Approved';
    registration.status = status;

    if (!wasApproved && status === 'Approved' && registration.registrationType === 'Merchandise') {
      registration.paymentStatus = 'Completed';


      const event = await Event.findById(registration.eventId);
      if (event.stockQuantity > 0) {
        event.stockQuantity -= registration.merchandiseDetails.quantity || 1;
        await event.save();
      }


      const User = require('../models/User.model');
      const user = await User.findById(registration.participantId);
      const { sendTicketEmail } = require('../utils/emailService');
      await sendTicketEmail(user.email, event.eventName, registration.ticketId, registration.qrCode);
    }

    await registration.save();

    res.json({
      success: true,
      message: 'Registration status updated',
      registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
};




exports.scanQRAndMarkAttendance = async (req, res) => {
  try {
    const { ticketId, eventId } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }


    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to scan for this event'
      });
    }

    const registration = await Registration.findOne({ ticketId, eventId }).
    populate('participantId', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket or event mismatch'
      });
    }

    if (registration.attended) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked',
        attendanceTime: registration.attendanceTime
      });
    }

    registration.attended = true;
    registration.attendanceTime = new Date();
    await registration.save();


    event.totalAttendance += 1;
    await event.save();

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      participant: {
        name: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
        email: registration.participantId.email,
        ticketId: registration.ticketId,
        attendanceTime: registration.attendanceTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error scanning QR code',
      error: error.message
    });
  }
};




exports.getAttendanceReport = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }


    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const registrations = await Registration.find({ eventId: req.params.eventId }).
    populate('participantId', 'firstName lastName email contactNumber').
    sort({ attendanceTime: -1 });

    const attended = registrations.filter((r) => r.attended);
    const notAttended = registrations.filter((r) => !r.attended);

    res.json({
      success: true,
      data: {
        totalRegistrations: registrations.length,
        totalAttended: attended.length,
        totalNotAttended: notAttended.length,
        attendedList: attended.map((r) => ({
          name: `${r.participantId.firstName} ${r.participantId.lastName}`,
          email: r.participantId.email,
          ticketId: r.ticketId,
          attendanceTime: r.attendanceTime
        })),
        notAttendedList: notAttended.map((r) => ({
          name: `${r.participantId.firstName} ${r.participantId.lastName}`,
          email: r.participantId.email,
          ticketId: r.ticketId
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance report',
      error: error.message
    });
  }
};




exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};




exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['organizerName', 'category', 'description', 'contactEmail', 'discordWebhook'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};




exports.requestPasswordReset = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for password reset'
      });
    }


    const existingRequest = await PasswordResetRequest.findOne({
      organizerId: req.user.id,
      status: 'Pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending password reset request'
      });
    }

    const request = await PasswordResetRequest.create({
      organizerId: req.user.id,
      reason
    });

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted successfully',
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting password reset request',
      error: error.message
    });
  }
};




exports.getEventFeedback = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }


    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { rating } = req.query;
    let query = { eventId: req.params.eventId };

    if (rating) {
      query.rating = parseInt(rating);
    }

    const feedbacks = await Feedback.find(query).sort({ submittedAt: -1 });


    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0 ?
    feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks :
    0;

    const ratingDistribution = {
      1: feedbacks.filter((f) => f.rating === 1).length,
      2: feedbacks.filter((f) => f.rating === 2).length,
      3: feedbacks.filter((f) => f.rating === 3).length,
      4: feedbacks.filter((f) => f.rating === 4).length,
      5: feedbacks.filter((f) => f.rating === 5).length
    };

    res.json({
      success: true,
      data: {
        totalFeedbacks,
        averageRating: averageRating.toFixed(2),
        ratingDistribution,
        feedbacks: feedbacks.map((f) => ({
          rating: f.rating,
          comments: f.comments,
          submittedAt: f.submittedAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
};
