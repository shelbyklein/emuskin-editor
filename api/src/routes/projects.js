// Project routes
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getProjects,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projects');

// All routes require authentication
router.use(authenticate);

// GET /api/projects - Get all user's projects
router.get('/', getProjects);

// POST /api/projects - Create new project
router.post('/', createProject);

// PUT /api/projects/:id - Update project
router.put('/:id', updateProject);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', deleteProject);

module.exports = router;