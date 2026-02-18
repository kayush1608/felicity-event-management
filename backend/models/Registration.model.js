const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
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
  registrationType: {
    type: String,
    enum: ['Normal', 'Merchandise', 'Hackathon'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'],
    default: 'Approved'
  },

  formResponses: mongoose.Schema.Types.Mixed,


  merchandiseDetails: {
    size: String,
    color: String,
    variant: String,
    quantity: Number
  },
  paymentProof: {
    type: String
  },


  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },


  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Completed'
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  ticketId: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: {
    type: String
  },


  attended: {
    type: Boolean,
    default: false
  },
  attendanceTime: {
    type: Date
  },

  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});


registrationSchema.index({ eventId: 1, participantId: 1 }, { unique: true });
registrationSchema.index({ status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
