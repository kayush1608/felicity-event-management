const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  teamLeaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamSize: {
    type: Number,
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected'],
      default: 'Pending'
    },
    inviteDate: {
      type: Date,
      default: Date.now
    },
    responseDate: Date
  }],
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Forming', 'Complete', 'Cancelled'],
    default: 'Forming'
  }
}, {
  timestamps: true
});


teamSchema.index({ eventId: 1 });
teamSchema.index({ teamLeaderId: 1 });

module.exports = mongoose.model('Team', teamSchema);
