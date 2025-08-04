// Single entry point for Vercel - all code in one file to avoid function limit
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Create Express app
const app = express();

// Cached database connection for serverless
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Database connection
async function connectDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      throw new Error('Database configuration error: MONGODB_URI not set');
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, options).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Project Schema
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

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

// Middleware
app.use(helmet());

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:8008',
      'http://localhost:5173',
      'https://emuskin.vercel.app',
      'https://emuskin-generator.vercel.app',
      'https://emuskin-editor.vercel.app',
      'https://emuskin-maker.vercel.app'
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.path === '/health'
});

app.use('/api/', limiter);

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.email) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      email: decoded.email,
      id: decoded.id || decoded.email
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasMongoUri: !!process.env.MONGODB_URI
  });
});

// Root
app.get('/', (req, res) => {
  res.json({ 
    message: 'Emulator Skin Generator API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      projects: '/api/projects'
    }
  });
});

// Database middleware for API routes
app.use('/api', async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({ 
      error: 'Database connection failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
    });
  }
});

// Get all projects for user
app.get('/api/projects', authenticate, async (req, res) => {
  try {
    const projects = await Project.find({ userEmail: req.user.email })
      .sort({ lastModified: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
app.get('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id,
      userEmail: req.user.email 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
app.post('/api/projects', authenticate, async (req, res) => {
  try {
    // Generate ID if not provided
    const projectId = req.body._id || req.body.id || `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const projectData = {
      ...req.body,
      _id: projectId,
      userId: req.user.id || req.user.email,
      userEmail: req.user.email,
      lastModified: Date.now(),
      createdAt: req.body.createdAt || Date.now()
    };
    
    // Ensure required fields have defaults
    if (!projectData.name) projectData.name = 'Untitled Project';
    if (!projectData.identifier) projectData.identifier = 'com.default.skin';
    
    console.log('Creating project with data:', JSON.stringify({
      _id: projectData._id,
      name: projectData.name,
      userEmail: projectData.userEmail
    }));
    
    const project = new Project(projectData);
    await project.save();
    
    console.log('Project created successfully:', project._id);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error.message);
    console.error('Full error:', error);
    
    // Send more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Failed to create project';
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.code === 11000 ? 'Project with this ID already exists' : undefined
    });
  }
});

// Update project
app.put('/api/projects/:id', authenticate, async (req, res) => {
  try {
    // Don't allow updating certain fields
    const { _id, userId, userEmail, ...updateData } = req.body;
    
    const project = await Project.findOneAndUpdate(
      { 
        _id: req.params.id,
        userEmail: req.user.email 
      },
      { 
        ...updateData,
        lastModified: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    console.log('Project updated successfully:', project._id);
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error.message);
    res.status(500).json({ 
      error: 'Failed to update project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete project
app.delete('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const result = await Project.deleteOne({ 
      _id: req.params.id,
      userEmail: req.user.email 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export for Vercel
module.exports = app;