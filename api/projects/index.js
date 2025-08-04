// Projects API endpoint - handles all project operations
import { connectToDatabase } from '../lib/mongodb.js';
import Project from '../lib/models/Project.js';
import { authenticateRequest } from '../lib/auth.js';

export default async function handler(req, res) {
  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authenticate request
    const user = authenticateRequest(req);
    
    // Connect to database
    await connectToDatabase();

    // Get project ID from query
    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        if (id) {
          // Get single project
          const project = await Project.findOne({ 
            _id: id,
            userEmail: user.email 
          });
          
          if (!project) {
            return res.status(404).json({ error: 'Project not found' });
          }
          
          return res.json(project);
        } else {
          // Get all projects for user
          const projects = await Project.find({ userEmail: user.email })
            .sort({ lastModified: -1 });
          return res.json(projects);
        }

      case 'POST':
        // Create new project
        const projectData = {
          ...req.body,
          _id: req.body._id || req.body.id || `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          userEmail: user.email,
          lastModified: Date.now(),
          createdAt: req.body.createdAt || Date.now()
        };
        
        // Ensure required fields
        if (!projectData.name) projectData.name = 'Untitled Project';
        if (!projectData.identifier) projectData.identifier = 'com.default.skin';
        
        const project = new Project(projectData);
        await project.save();
        
        return res.status(201).json(project);

      case 'PUT':
        // Update project
        if (!id) {
          return res.status(400).json({ error: 'Project ID required' });
        }
        
        // Don't allow updating certain fields
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
        if (!id) {
          return res.status(400).json({ error: 'Project ID required' });
        }
        
        const result = await Project.deleteOne({ 
          _id: id,
          userEmail: user.email 
        });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Project not found' });
        }
        
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
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