const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});


feedbackSchema.index({ eventId: 1 });
feedbackSchema.index({ participantId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
