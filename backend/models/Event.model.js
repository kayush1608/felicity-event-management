const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  eventDescription: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['Normal', 'Merchandise', 'Hackathon'],
    required: true
  },
  eligibility: {
    type: String,
    enum: ['IIIT Only', 'All', 'Non-IIIT Only'],
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  eventStartDate: {
    type: Date,
    required: true
  },
  eventEndDate: {
    type: Date,
    required: true
  },
  registrationLimit: {
    type: Number,
    required: true
  },
  registrationFee: {
    type: Number,
    default: 0
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventTags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed'],
    default: 'Draft'
  },

  customFormFields: [{
    fieldName: String,
    fieldType: {
      type: String,
      enum: ['text', 'textarea', 'number', 'email', 'tel', 'date', 'dropdown', 'checkbox', 'radio', 'file']
    },
    isRequired: Boolean,
    options: [String],
    placeholder: String,
    order: Number
  }],
  formLocked: {
    type: Boolean,
    default: false
  },

  itemDetails: {
    sizes: [String],
    colors: [String],
    variants: [String]
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  purchaseLimit: {
    type: Number,
    default: 1
  },

  teamSize: {
    min: Number,
    max: Number
  },

  totalRegistrations: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalAttendance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});


eventSchema.index({ eventName: 'text', eventDescription: 'text' });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventStartDate: 1 });
eventSchema.index({ eventTags: 1 });

module.exports = mongoose.model('Event', eventSchema);
