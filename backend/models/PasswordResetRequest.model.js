const mongoose = require('mongoose');

const passwordResetRequestSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  adminComments: {
    type: String
  },
  newPassword: {
    type: String
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  resolvedDate: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});


passwordResetRequestSchema.index({ organizerId: 1 });
passwordResetRequestSchema.index({ status: 1 });

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
