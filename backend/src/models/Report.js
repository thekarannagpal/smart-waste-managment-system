const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for anonymous reports
  },
  imageUrl: {
    type: String, // Public URL or path to the image
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  wasteType: {
    type: String, // 'plastic', 'organic', 'mixed', etc. from YOLO
    default: 'unknown'
  },
  confidence: {
    type: Number, // YOLO confidence score
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'completed', 'verified', 'rejected'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  completionProofUrl: {
    type: String,
    default: null
  },
  pointsAwarded: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Create a 2dsphere index for location-based queries (hotspots, clustering)
ReportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Report', ReportSchema);
