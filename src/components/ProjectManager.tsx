// Project manager component for handling save/load operations
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';

const ProjectManager: React.FC = () => {
  const { currentProject, projects, createProject, loadProject, deleteProject } = useProject();
  const [showProjectList, setShowProjectList] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);

  const handleNewProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProject(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {/* Current Project Display */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {currentProject ? (
            <>
              <span className="font-medium">{currentProject.name}</span>
              <span className="text-xs ml-2">
                (saved {formatDate(currentProject.lastModified)})
              </span>
            </>
          ) : (
            <span className="italic">No project loaded</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowNewProject(true)}
            className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            title="New Project"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            onClick={() => setShowProjectList(!showProjectList)}
            className="p-1.5 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Open Project"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* New Project Dialog */}
      {showNewProject && (
        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64 z-10">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">New Project</h3>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNewProject()}
            placeholder="Project name"
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => {
                setShowNewProject(false);
                setNewProjectName('');
              }}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleNewProject}
              disabled={!newProjectName.trim()}
              className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Project List */}
      {showProjectList && projects.length > 0 && (
        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 w-72 max-h-64 overflow-y-auto z-10">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white px-2 pb-2 border-b dark:border-gray-700">
            Projects
          </h3>
          <div className="mt-2 space-y-1">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  currentProject?.id === project.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <button
                  onClick={() => {
                    loadProject(project.id);
                    setShowProjectList(false);
                  }}
                  className="flex-1 text-left"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {project.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(project.lastModified)}
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete project "${project.name}"?`)) {
                      deleteProject(project.id);
                    }
                  }}
                  className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;