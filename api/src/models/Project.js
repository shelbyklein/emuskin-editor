// Project model for MongoDB
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Use the same ID format as frontend (project-timestamp)
  _id: {
    type: String,
    required: true,
    default: () => `project-${Date.now()}`
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  identifier: {
    type: String,
    required: true,
    default: 'com.playcase.default.skin'
  },
  
  // Console and device stored as objects to match frontend
  console: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  device: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // User identification
  userId: {
    type: String,
    required: true
  },
  
  userEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  
  hasBeenConfigured: {
    type: Boolean,
    default: false
  },
  
  // Store full orientation data as mixed type
  orientations: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      portrait: {
        controls: [],
        screens: [],
        backgroundImage: null,
        menuInsetsEnabled: false,
        menuInsetsBottom: 0,
        menuInsetsLeft: 0,
        menuInsetsRight: 0
      },
      landscape: {
        controls: [],
        screens: [],
        backgroundImage: null,
        menuInsetsEnabled: false,
        menuInsetsBottom: 0,
        menuInsetsLeft: 0,
        menuInsetsRight: 0
      }
    }
  },
  
  availableOrientations: {
    type: [String],
    default: ['portrait']
  },
  
  currentOrientation: {
    type: String,
    enum: ['portrait', 'landscape'],
    default: 'portrait'
  },
  
  // Timestamps
  lastModified: {
    type: Number,
    default: Date.now
  }
}, {
  timestamps: { 
    createdAt: 'createdAt',
    updatedAt: false // We use lastModified instead
  },
  // Disable version key
  versionKey: false,
  // Use string ID
  _id: false
});

// Ensure compound index for user queries
projectSchema.index({ userEmail: 1, lastModified: -1 });

// Override toJSON to match frontend expectations
projectSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

// Pre-save middleware to update lastModified
projectSchema.pre('save', function(next) {
  this.lastModified = Date.now();
  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;