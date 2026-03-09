const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  roomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ChatRoom', 
    required: true 
  },
  providerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, 
  customerId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  date: { type: Date, required: true },
  proposedDate: { type: Date },
  proposedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rescheduleRequestedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected', 'in_transit', 'reschedule_requested'], 
    default: 'pending' 
  },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);