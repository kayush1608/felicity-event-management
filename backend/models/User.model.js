const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['participant', 'organizer', 'admin'],
    required: true
  },

  firstName: {
    type: String,
    required: function () {return this.role === 'participant';}
  },
  lastName: {
    type: String,
    required: function () {return this.role === 'participant';}
  },
  participantType: {
    type: String,
    enum: ['IIIT', 'Non-IIIT'],
    required: function () {return this.role === 'participant';}
  },
  collegeName: {
    type: String,
    required: function () {return this.role === 'participant';}
  },
  contactNumber: {
    type: String,
    required: function () {return this.role === 'participant';}
  },
  interests: [{
    type: String
  }],
  followedClubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  organizerName: {
    type: String,
    required: function () {return this.role === 'organizer';}
  },
  category: {
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Management', 'Other'],
    required: function () {return this.role === 'organizer';}
  },
  description: {
    type: String
  },
  contactEmail: {
    type: String
  },
  discordWebhook: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});


userSchema.index({ role: 1 });
userSchema.index({ organizerName: 'text' });

module.exports = mongoose.model('User', userSchema);
