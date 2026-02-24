const Event = require('../models/Event.model');
const Registration = require('../models/Registration.model');
const User = require('../models/User.model');
const axios = require('axios');

const parseTeamSize = (value) => {
  if (!value) return undefined;
  if (typeof value === 'object' && (value.min !== undefined || value.max !== undefined)) {
    const min = value.min !== undefined ? Number(value.min) : undefined;
    const max = value.max !== undefined ? Number(value.max) : undefined;
    if (!Number.isFinite(min) && !Number.isFinite(max)) return undefined;
    return {
      min: Number.isFinite(min) ? min : max,
      max: Number.isFinite(max) ? max : min
    };
  }

  const raw = String(value).trim();
  const rangeMatch = raw.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (Number.isFinite(min) && Number.isFinite(max)) return { min, max };
  }

  const single = Number(raw);
  if (Number.isFinite(single)) return { min: single, max: single };
  return undefined;
};

const normalizeEventPayload = (body) => {
  const normalized = { ...body };


  if (normalized.name && !normalized.eventName) normalized.eventName = normalized.name;
  if (normalized.description && !normalized.eventDescription) normalized.eventDescription = normalized.description;

  if (normalized.maxParticipants !== undefined && normalized.registrationLimit === undefined) {
    const limit = Number(normalized.maxParticipants);
    if (Number.isFinite(limit) && limit > 0) normalized.registrationLimit = limit;
  }

  if (normalized.price !== undefined && normalized.registrationFee === undefined) {
    const fee = Number(normalized.price);
    if (Number.isFinite(fee) && fee >= 0) normalized.registrationFee = fee;
  }

  if (normalized.stock !== undefined && normalized.stockQuantity === undefined) {
    const qty = Number(normalized.stock);
    if (Number.isFinite(qty) && qty >= 0) normalized.stockQuantity = qty;
  }


  if (normalized.eligibility === 'IIIT-H Only') normalized.eligibility = 'IIIT Only';
  if (normalized.eligibility === 'All Students') normalized.eligibility = 'All';


  if (normalized.date && normalized.eventStartDate === undefined) {
    const time = normalized.time ? String(normalized.time) : '00:00';
    const start = new Date(`${normalized.date}T${time}:00`);
    if (!Number.isNaN(start.getTime())) {
      normalized.eventStartDate = start;
    }
  }


  if (normalized.endDate && normalized.eventEndDate === undefined) {
    const endTime = normalized.endTime ? String(normalized.endTime) : '23:59';
    const end = new Date(`${normalized.endDate}T${endTime}:00`);
    if (!Number.isNaN(end.getTime())) {
      normalized.eventEndDate = end;
    }
  }


  if (normalized.eventStartDate && normalized.eventEndDate === undefined) {
    const start = new Date(normalized.eventStartDate);
    if (!Number.isNaN(start.getTime())) {

      normalized.eventEndDate = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    }
  }

  if (normalized.eventStartDate && normalized.registrationDeadline === undefined) {
    const start = new Date(normalized.eventStartDate);
    if (!Number.isNaN(start.getTime())) {
      normalized.registrationDeadline = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  if (normalized.registrationLimit === undefined) {

    normalized.registrationLimit = 100000;
  }

  if (normalized.teamSize !== undefined) {
    const parsed = parseTeamSize(normalized.teamSize);
    if (parsed) normalized.teamSize = parsed;
  }


  if (typeof normalized.eventTags === 'string') {
    normalized.eventTags = normalized.eventTags.
    split(',').
    map((t) => t.trim()).
    filter(Boolean);
  }


  if (normalized.category) {
    const tags = Array.isArray(normalized.eventTags) ? normalized.eventTags : [];
    if (!tags.includes(normalized.category)) tags.push(normalized.category);
    normalized.eventTags = tags;
  }
  if (normalized.venue) {
    const venueTag = `venue:${String(normalized.venue).trim()}`;
    const tags = Array.isArray(normalized.eventTags) ? normalized.eventTags : [];
    if (venueTag !== 'venue:' && !tags.includes(venueTag)) tags.push(venueTag);
    normalized.eventTags = tags;
  }


  delete normalized.name;
  delete normalized.description;
  delete normalized.maxParticipants;
  delete normalized.price;
  delete normalized.stock;
  delete normalized.problemStatement;
  delete normalized.discordWebhook;
  delete normalized.date;
  delete normalized.time;
  delete normalized.venue;
  delete normalized.category;

  return normalized;
};




exports.getEvents = async (req, res) => {
  try {
    const {
      search,
      eventType,
      eligibility,
      startDate,
      endDate,
      followedClubs,
      organizerId,
      tags
    } = req.query;

    let query = { status: 'Published' };


    if (search) {
      query.$or = [
      { eventName: { $regex: search, $options: 'i' } },
      { eventDescription: { $regex: search, $options: 'i' } }];

    }


    if (eventType) {
      query.eventType = eventType;
    }


    if (eligibility) {
      query.eligibility = eligibility;
    }


    if (startDate || endDate) {
      query.eventStartDate = {};
      if (startDate) query.eventStartDate.$gte = new Date(startDate);
      if (endDate) query.eventStartDate.$lte = new Date(endDate);
    }


    if (followedClubs === 'true' && req.user) {
      const user = await User.findById(req.user.id);
      if (user.followedClubs && user.followedClubs.length > 0) {
        query.organizerId = { $in: user.followedClubs };
      }
    }


    if (organizerId) {
      query.organizerId = organizerId;
    }


    if (tags) {
      query.eventTags = { $in: tags.split(',') };
    }

    const events = await Event.find(query).
    populate('organizerId', 'organizerName category').
    sort({ eventStartDate: 1 });

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};




exports.getTrendingEvents = async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);


    const top = await Registration.aggregate([
    { $match: { createdAt: { $gte: last24Hours } } },
    { $group: { _id: '$eventId', registrationsLast24h: { $sum: 1 } } },
    { $sort: { registrationsLast24h: -1 } },
    { $limit: 5 }]
    );

    const topIds = top.map((t) => t._id);
    const eventsRaw = await Event.find({
      _id: { $in: topIds },
      status: 'Published'
    }).populate('organizerId', 'organizerName category');

    const byId = new Map(eventsRaw.map((e) => [String(e._id), e]));
    const events = top.
    map((t) => {
      const e = byId.get(String(t._id));
      if (!e) return null;
      return {
        ...e.toObject(),
        registrationsLast24h: t.registrationsLast24h
      };
    }).
    filter(Boolean);

    res.json({
      success: true,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trending events',
      error: error.message
    });
  }
};




exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).
    populate('organizerId', 'organizerName category description contactEmail');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};




exports.createEvent = async (req, res) => {
  try {
    const eventData = {
      ...normalizeEventPayload(req.body),
      organizerId: req.user.id,
      status: 'Draft'
    };

    const event = await Event.create(eventData);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
};




exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }


    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    const payload = normalizeEventPayload(req.body);


    if (event.status === 'Draft') {

      Object.assign(event, payload);
    } else if (event.status === 'Published') {

      if (payload.registrationDeadline !== undefined) {
        const newDeadline = new Date(payload.registrationDeadline);
        const oldDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
        if (oldDeadline && newDeadline < oldDeadline) {
          return res.status(400).json({
            success: false,
            message: 'Registration deadline can only be extended (not moved earlier) for published events'
          });
        }
        event.registrationDeadline = payload.registrationDeadline;
      }

      if (payload.registrationLimit !== undefined) {
        const newLimit = Number(payload.registrationLimit);
        const oldLimit = Number(event.registrationLimit) || 0;
        if (oldLimit > 0 && newLimit < oldLimit) {
          return res.status(400).json({
            success: false,
            message: 'Registration limit can only be increased (not decreased) for published events'
          });
        }
        event.registrationLimit = payload.registrationLimit;
      }

      if (payload.eventDescription !== undefined) {
        event.eventDescription = payload.eventDescription;
      }


      if (!event.formLocked && payload.customFormFields !== undefined) {
        event.customFormFields = payload.customFormFields;
      }

      if (payload.status === 'Closed') {
        event.status = 'Closed';
      }
    } else if (event.status === 'Ongoing' || event.status === 'Completed') {

      if (payload.status) {
        event.status = payload.status;
      }
    }

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message
    });
  }
};




exports.publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }


    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish this event'
      });
    }

    if (event.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft events can be published'
      });
    }

    event.status = 'Published';
    await event.save();


    const organizer = await User.findById(req.user.id);
    if (organizer.discordWebhook) {
      try {
        await axios.post(organizer.discordWebhook, {
          content: `🎉 **New Event Published!**\n\n**${event.eventName}**\n${event.eventDescription}\n\n📅 ${event.eventStartDate.toDateString()}\n🎟️ Register now!`
        });
      } catch (discordError) {
        console.error('Discord webhook error:', discordError.message);
      }
    }

    res.json({
      success: true,
      message: 'Event published successfully',
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing event',
      error: error.message
    });
  }
};




exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }


    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }


    if (event.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete non-draft events'
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
};




exports.getEventAnalytics = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }


    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics'
      });
    }

    const registrations = await Registration.find({ eventId: req.params.id }).
    populate('participantId', 'firstName lastName email');

    const analytics = {
      totalRegistrations: event.totalRegistrations,
      totalRevenue: event.totalRevenue,
      totalAttendance: event.totalAttendance,
      registrationLimit: event.registrationLimit,
      availableSlots: event.registrationLimit - event.totalRegistrations,
      registrations: registrations.map((reg) => ({
        participantName: `${reg.participantId.firstName} ${reg.participantId.lastName}`,
        email: reg.participantId.email,
        registrationDate: reg.registrationDate,
        status: reg.status,
        paymentStatus: reg.paymentStatus,
        attended: reg.attended,
        ticketId: reg.ticketId
      }))
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};
