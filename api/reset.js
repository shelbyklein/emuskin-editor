// TEMPORARY: Database reset endpoint - DELETE THIS FILE AFTER USE
import { connectToDatabase } from './lib/mongodb.js';
import Project from './lib/models/Project.js';
import { authenticateRequest } from './lib/auth.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate request
    const user = authenticateRequest(req);
    
    // Additional security check - only allow specific users
    // Uncomment and modify this to restrict to your email
    // if (user.email !== 'info@playcase.gg') {
    //   return res.status(403).json({ error: 'Forbidden' });
    // }
    
    // Connect to database
    await connectToDatabase();
    
    // Get count before deletion for confirmation
    const countBefore = await Project.countDocuments({});
    
    // Delete all projects
    const result = await Project.deleteMany({});
    
    // Clear any other collections if needed
    // await OtherModel.deleteMany({});
    
    return res.status(200).json({ 
      message: 'Database reset successful',
      projectsDeleted: result.deletedCount,
      totalProjectsBefore: countBefore,
      warning: 'Remember to delete this API endpoint file after use!'
    });
    
  } catch (error) {
    console.error('Reset Error:', error);
    
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to reset database',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}