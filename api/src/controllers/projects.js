// Project controller - handles CRUD operations
const Project = require('../models/Project');

// Get all projects for authenticated user
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ 
      userEmail: req.user.email 
    }).sort({ lastModified: -1 });
    
    console.log(`Found ${projects.length} projects for user ${req.user.email}`);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// Create new project
const createProject = async (req, res, next) => {
  try {
    const { name, identifier, console, device, hasBeenConfigured } = req.body;
    
    // Generate ID in same format as frontend
    const projectId = `project-${Date.now()}`;
    
    const project = new Project({
      _id: projectId,
      name,
      identifier,
      console,
      device,
      hasBeenConfigured,
      userId: req.user.id,
      userEmail: req.user.email
    });
    
    await project.save();
    
    console.log(`Created project ${projectId} for user ${req.user.email}`);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// Update existing project
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find project and verify ownership
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.userEmail !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }
    
    // Update allowed fields
    const updates = req.body;
    const allowedUpdates = [
      'name', 'identifier', 'console', 'device', 
      'hasBeenConfigured', 'orientations', 
      'availableOrientations', 'currentOrientation'
    ];
    
    // Apply updates
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        project[field] = updates[field];
      }
    });
    
    // Update lastModified
    project.lastModified = Date.now();
    
    await project.save();
    
    console.log(`Updated project ${id} for user ${req.user.email}`);
    res.json(project);
  } catch (error) {
    next(error);
  }
};

// Delete project
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find project and verify ownership
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.userEmail !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to delete this project' });
    }
    
    await project.deleteOne();
    
    console.log(`Deleted project ${id} for user ${req.user.email}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject
};