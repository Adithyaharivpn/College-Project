// User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["customer", "tradesperson", "admin"],
    required: true,
  },
  profilePictureUrl: { type: String, default: '' },
  tradeCategory: [{ type: String }],
  experience: { type: Number },
  hourlyRate: { type: Number }, // Added
  bio: { type: String }, // Added
  phoneNumber: { type: String }, // Added
  location: { type: String },
  mapLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "approved", "rejected"],
      default: "unverified"
  },
  verificationDocuments: [{ type: String }],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },

}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;