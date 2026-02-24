const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  reason: { type: String, default: '' },
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

auditLogSchema.index({ eventId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
