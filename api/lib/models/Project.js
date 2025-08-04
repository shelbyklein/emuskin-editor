// Project model for MongoDB
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  identifier: { type: String, required: true },
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  console: { type: mongoose.Schema.Types.Mixed },
  device: { type: mongoose.Schema.Types.Mixed },
  orientations: { type: mongoose.Schema.Types.Mixed },
  availableOrientations: [String],
  currentOrientation: String,
  hasBeenConfigured: Boolean,
  lastModified: { type: Number, default: Date.now },
  createdAt: { type: Number, default: Date.now },
  isPublic: { type: Boolean, default: false }
}, {
  timestamps: false,
  versionKey: false
});

// Use existing model if it exists (for serverless)
export default mongoose.models.Project || mongoose.model('Project', projectSchema);