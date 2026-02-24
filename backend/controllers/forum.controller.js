const Message = require('../models/Message.model');
const Event = require('../models/Event.model');
const Registration = require('../models/Registration.model');

exports.getMessages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { since } = req.query;

    const query = { eventId, parentMessage: null };
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    const messages = await Message.find(query)
      .populate('userId', 'firstName lastName role organizerName')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(100);

    const messageIds = messages.map((m) => m._id);
    const replies = await Message.find({ eventId, parentMessage: { $in: messageIds } })
      .populate('userId', 'firstName lastName role organizerName')
      .sort({ createdAt: 1 });

    const replyMap = {};
    for (const r of replies) {
      const parentId = r.parentMessage.toString();
      if (!replyMap[parentId]) replyMap[parentId] = [];
      replyMap[parentId].push(r);
    }

    const result = messages.map((m) => ({
      ...m.toObject(),
      replies: replyMap[m._id.toString()] || []
    }));

    res.json({ success: true, messages: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching messages', error: error.message });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { content, parentMessage } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const isOrganizer = event.organizerId.toString() === req.user.id;

    if (!isOrganizer) {
      const registration = await Registration.findOne({
        eventId,
        participantId: req.user.id,
        status: 'Approved'
      });
      if (!registration) {
        return res.status(403).json({ success: false, message: 'Only registered participants can post' });
      }
    }

    const message = await Message.create({
      eventId,
      userId: req.user.id,
      content: content.trim(),
      parentMessage: parentMessage || null,
      isAnnouncement: isOrganizer && !parentMessage && req.body.isAnnouncement
    });

    const populated = await Message.findById(message._id)
      .populate('userId', 'firstName lastName role organizerName');

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error posting message', error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const event = await Event.findById(message.eventId);
    const isOrganizer = event && event.organizerId.toString() === req.user.id;
    const isAuthor = message.userId.toString() === req.user.id;

    if (!isOrganizer && !isAuthor) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    await Message.deleteMany({ parentMessage: message._id });
    await Message.findByIdAndDelete(messageId);

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting message', error: error.message });
  }
};

exports.togglePin = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const event = await Event.findById(message.eventId);
    if (!event || event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the organizer can pin messages' });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    res.json({ success: true, pinned: message.isPinned });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling pin', error: error.message });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const existing = message.reactions.findIndex(
      (r) => r.userId.toString() === req.user.id && r.emoji === (emoji || '👍')
    );

    if (existing >= 0) {
      message.reactions.splice(existing, 1);
    } else {
      message.reactions.push({ userId: req.user.id, emoji: emoji || '👍' });
    }

    await message.save();
    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reacting', error: error.message });
  }
};
