const User = require('../models/User.model');
const Event = require('../models/Event.model');
const Registration = require('../models/Registration.model');
const Team = require('../models/Team.model');
const Feedback = require('../models/Feedback.model');
const { generateTicketId, generateQRCode, generateInviteCode } = require('../utils/generators');
const { sendTicketEmail } = require('../utils/emailService');




exports.getDashboard = async (req, res) => {
  try {
    const registrations = await Registration.find({ participantId: req.user.id }).
    populate({
      path: 'eventId',
      populate: { path: 'organizerId', select: 'organizerName category contactEmail' }
    }).
    populate('teamId', 'teamName').
    sort({ createdAt: -1 });

    const now = new Date();

    const upcomingEvents = registrations.filter((reg) =>
    reg.eventId && new Date(reg.eventId.eventStartDate) > now
    );

    const completedEvents = registrations.filter((reg) =>
    reg.eventId && new Date(reg.eventId.eventEndDate) < now
    );

    res.json({
      success: true,
      data: {
        upcomingEvents: upcomingEvents.length,
        completedEvents: completedEvents.length,
        totalRegistrations: registrations.length,
        registrations: registrations.map((reg) => ({
          _id: reg._id,
          event: reg.eventId,
          organizer: reg.eventId?.organizerId || null,
          registrationType: reg.registrationType,
          status: reg.status,
          team: reg.teamId || null,
          ticketId: reg.ticketId,
          attended: reg.attended,
          registeredAt: reg.createdAt
        }))
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




exports.getParticipantEvents = async (req, res) => {
  try {
    const { search, eventType, eligibility, startDate, endDate, followedClubs, tags } = req.query;

    const query = { status: 'Published' };

    if (search) {
      const organizerIds = await User.find({
        role: 'organizer',
        isActive: true,
        organizerName: { $regex: search, $options: 'i' }
      }).distinct('_id');

      query.$or = [
      { eventName: { $regex: search, $options: 'i' } },
      { eventDescription: { $regex: search, $options: 'i' } },
      ...(organizerIds?.length ? [{ organizerId: { $in: organizerIds } }] : [])];

    }

    if (eventType) query.eventType = eventType;
    if (eligibility) query.eligibility = eligibility;

    if (startDate || endDate) {
      query.eventStartDate = {};
      if (startDate) query.eventStartDate.$gte = new Date(startDate);
      if (endDate) query.eventStartDate.$lte = new Date(endDate);
    }

    if (tags) {
      query.eventTags = { $in: tags.split(',') };
    }

    if (followedClubs === 'true') {
      const user = await User.findById(req.user.id).select('followedClubs');
      if (user?.followedClubs?.length) {
        query.organizerId = { $in: user.followedClubs };
      } else {

        return res.json({ success: true, data: [] });
      }
    }

    const events = await Event.find(query).
    populate('organizerId', 'organizerName category description contactEmail').
    sort({ eventStartDate: 1 });

    const user = followedClubs === 'true' ? null : await User.findById(req.user.id).select('interests followedClubs');
    const interests = user?.interests || [];
    const followed = user?.followedClubs?.map((id) => id.toString()) || [];

    const scored = events.map((ev) => {
      let score = 0;
      const evTags = Array.isArray(ev.eventTags) ? ev.eventTags : [];
      for (const tag of evTags) {
        if (interests.some((i) => tag.toLowerCase().includes(i.toLowerCase()))) score += 2;
      }
      if (followed.includes(ev.organizerId?._id?.toString())) score += 1;
      return { event: ev, score };
    });

    scored.sort((a, b) => b.score - a.score || new Date(a.event.eventStartDate) - new Date(b.event.eventStartDate));

    res.json({
      success: true,
      data: scored.map((s) => s.event)
    });
  } catch (error) {
    console.error('Participant events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};




exports.getParticipantEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).
    populate('organizerId', 'organizerName category description contactEmail');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const registration = await Registration.findOne({
      eventId: event._id,
      participantId: req.user.id
    }).select('ticketId attended attendanceTime teamId status registrationDate createdAt');

    res.json({
      success: true,
      data: {
        event,
        isRegistered: !!registration,
        hasAttended: registration ? !!registration.attended : false,
        myTicket: registration ?
        {
          ticketId: registration.ticketId,
          attended: registration.attended,
          attendanceTime: registration.attendanceTime,
          status: registration.status,
          registeredAt: registration.registrationDate || registration.createdAt
        } :
        null
      }
    });
  } catch (error) {
    console.error('Participant event details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};




exports.registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    let { formResponses, merchandiseDetails } = req.body;


    if (typeof formResponses === 'string') {
      try {formResponses = JSON.parse(formResponses);} catch {}
    }
    if (typeof merchandiseDetails === 'string') {
      try {merchandiseDetails = JSON.parse(merchandiseDetails);} catch {}
    }

    if (!formResponses || typeof formResponses !== 'object') formResponses = {};
    if (!merchandiseDetails || typeof merchandiseDetails !== 'object') merchandiseDetails = {};


    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        formResponses[file.fieldname] = {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/registrations/${file.filename}`
        };
      }
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }


    if (event.status !== 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Event is not open for registration'
      });
    }


    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }


    if (event.totalRegistrations >= event.registrationLimit) {
      return res.status(400).json({
        success: false,
        message: 'Registration limit reached'
      });
    }


    const user = await User.findById(req.user.id);
    if (event.eligibility === 'IIIT Only' && user.participantType !== 'IIIT') {
      return res.status(403).json({
        success: false,
        message: 'This event is only for IIIT students'
      });
    }
    if (event.eligibility === 'Non-IIIT Only' && user.participantType === 'IIIT') {
      return res.status(403).json({
        success: false,
        message: 'This event is only for non-IIIT participants'
      });
    }


    const existingRegistration = await Registration.findOne({
      eventId,
      participantId: req.user.id
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }


    let quantity = 1;
    if (event.eventType === 'Merchandise') {
      quantity = parseInt(merchandiseDetails.quantity, 10) || 1;
      if (quantity < 1) {
        return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
      }
      if (event.purchaseLimit && quantity > event.purchaseLimit) {
        return res.status(400).json({ success: false, message: `Maximum purchase limit is ${event.purchaseLimit} per person` });
      }
      if ((event.stockQuantity || 0) < quantity) {
        return res.status(400).json({ success: false, message: 'Not enough stock available' });
      }
    }

    const ticketId = generateTicketId();
    const qrData = {
      ticketId,
      eventId,
      participantId: req.user.id,
      eventName: event.eventName,
      participantName: `${user.firstName} ${user.lastName}`
    };
    const qrCode = await generateQRCode(qrData);

    const amountPaid = (event.registrationFee || 0) * (event.eventType === 'Merchandise' ? quantity : 1);


    const registration = await Registration.create({
      eventId,
      participantId: req.user.id,
      registrationType: event.eventType,
      status: 'Approved',
      formResponses: formResponses || {},
      merchandiseDetails: event.eventType === 'Merchandise' ? merchandiseDetails : {},
      paymentStatus: 'Completed',
      amountPaid,
      ticketId,
      qrCode
    });


    event.totalRegistrations = (Number(event.totalRegistrations) || 0) + 1;
    event.totalRevenue = (Number(event.totalRevenue) || 0) + amountPaid;

    if (event.eventType === 'Merchandise') {
      event.stockQuantity = Math.max(0, (event.stockQuantity || 0) - quantity);
    }

    if (event.totalRegistrations === 1 && event.customFormFields.length > 0) {
      event.formLocked = true;
    }

    await event.save();


    try {
      await sendTicketEmail(user.email, event.eventName, ticketId, qrCode);
    } catch (e) {
      console.error('Ticket email failed (non-blocking):', e);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      registration: {
        ticketId,
        qrCode,
        status: registration.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};




exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).
    select('-password').
    populate('followedClubs', 'organizerName category');

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
    const allowedFields = ['firstName', 'lastName', 'contactNumber', 'collegeName', 'interests', 'followedClubs'];
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




exports.getOrganizers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('followedClubs');
    const followed = new Set((user?.followedClubs || []).map((id) => id.toString()));

    const organizers = await User.find({
      role: 'organizer',
      isActive: true
    }).select('organizerName category description contactEmail');

    const annotated = organizers.map((org) => ({
      _id: org._id,
      organizerName: org.organizerName,
      category: org.category,
      description: org.description,
      contactEmail: org.contactEmail,
      isFollowing: followed.has(org._id.toString())
    }));

    res.json({
      success: true,
      organizers: annotated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching organizers',
      error: error.message
    });
  }
};




exports.getOrganizerDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('followedClubs');
    const followed = new Set((user?.followedClubs || []).map((id) => id.toString()));

    const organizer = await User.findOne({
      _id: req.params.id,
      role: 'organizer',
      isActive: true
    }).select('organizerName category description contactEmail');

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }


    const events = await Event.find({
      organizerId: req.params.id,
      status: { $in: ['Published', 'Ongoing', 'Completed'] }
    }).select('eventName eventType eventStartDate eventEndDate status');

    const now = new Date();
    const upcomingEvents = events.filter((e) => new Date(e.eventStartDate) > now);
    const pastEvents = events.filter((e) => new Date(e.eventEndDate) < now);

    res.json({
      success: true,
      organizer,
      isFollowing: followed.has(String(organizer._id)),
      upcomingEvents,
      pastEvents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching organizer details',
      error: error.message
    });
  }
};




exports.toggleFollowOrganizer = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const organizerId = req.params.id;


    const organizer = await User.findOne({
      _id: organizerId,
      role: 'organizer',
      isActive: true
    });

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    const isFollowing = user.followedClubs.includes(organizerId);

    if (isFollowing) {

      user.followedClubs = user.followedClubs.filter((id) => id.toString() !== organizerId);
    } else {

      user.followedClubs.push(organizerId);
    }

    await user.save();

    res.json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling follow',
      error: error.message
    });
  }
};




exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comments } = req.body;
    const { eventId } = req.params;


    const registration = await Registration.findOne({
      eventId,
      participantId: req.user.id,
      attended: true
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You can only provide feedback for events you have attended'
      });
    }


    const existingFeedback = await Feedback.findOne({
      eventId,
      participantId: req.user.id
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this event'
      });
    }

    const feedback = await Feedback.create({
      eventId,
      participantId: req.user.id,
      rating,
      comments,
      isAnonymous: true
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
};




exports.getRegistrationDetails = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      ticketId: req.params.ticketId,
      participantId: req.user.id
    }).
    populate('eventId', 'eventName eventType eventStartDate eventEndDate').
    populate('participantId', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching registration details',
      error: error.message
    });
  }
};
