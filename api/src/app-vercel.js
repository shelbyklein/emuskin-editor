// Express app configuration for Vercel
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDatabase } = require('./config/database-vercel');
const errorHandler = require('./middleware/errorHandler');
const projectRoutes = require('./routes/projects');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:8008',
      'http://localhost:5173',
      'https://emuskin.vercel.app',
      'https://emuskin-generator.vercel.app'
    ];
    
    // Allow requests with no origin (like mobile apps or Postman)
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

app.use('/api/', limiter);

// Health check endpoint (doesn't require database)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasMongoUri: !!process.env.MONGODB_URI
  });
});

// Database connection middleware
app.use(async (req, res, next) => {
  // Skip database for health endpoint
  if (req.path === '/health') {
    return next();
  }
  
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

// API routes
app.use('/api/projects', projectRoutes);

// Root endpoint
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;