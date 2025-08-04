// Single project operations endpoint
import { connectToDatabase } from '../lib/mongodb.js';
import Project from '../lib/models/Project.js';
import { authenticateRequest } from '../lib/auth.js';

export default async function handler(req, res) {
  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authenticate request
    const user = authenticateRequest(req);
    
    // Connect to database
    await connectToDatabase();

    // Get project ID from URL
    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        // Get single project
        const project = await Project.findOne({ 
          _id: id,
          userEmail: user.email 
        });
        
        if (!project) {
          return res.status(404).json({ error: 'Project not found' });
        }
        
        return res.json(project);

      case 'PUT':
        // Update project
        const { _id, userId, userEmail, ...updateData } = req.body;
        
        const updatedProject = await Project.findOneAndUpdate(
          { 
            _id: id,
            userEmail: user.email 
          },
          { 
            ...updateData,
            lastModified: Date.now()
          },
          { new: true, runValidators: true }
        );
        
        if (!updatedProject) {
          return res.status(404).json({ error: 'Project not found' });
        }
        
        return res.json(updatedProject);

      case 'DELETE':
        // Delete project
        const result = await Project.deleteOne({ 
          _id: id,
          userEmail: user.email 
        });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Project not found' });
        }
        
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return res.status(401).json({ error: error.message });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}