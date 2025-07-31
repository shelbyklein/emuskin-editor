// Project manager component for handling save/load operations
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';

interface ProjectManagerProps {
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
  showSavedMessage?: boolean;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ onSave, hasUnsavedChanges = false, showSavedMessage = false }) => {
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
    <div id="project-manager" className="relative">
      <div id="project-manager-header" className="flex items-center space-x-2">
        {/* Current Project Display */}
        <div id="current-project-display" className="text-sm text-gray-600 dark:text-gray-400">
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
        <div id="project-actions" className="flex items-center space-x-1">
          <button
            id="new-project-button"
            onClick={() => setShowNewProject(true)}
            className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            title="New Project"
            aria-label="Create new project"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            id="open-project-button"
            onClick={() => setShowProjectList(!showProjectList)}
            className="p-1.5 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Open Project"
            aria-label="Open existing project"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </button>
          
          {/* Save Button */}
          {currentProject && onSave && (
            <button
              id="save-project-button"
              onClick={onSave}
              className={`p-1.5 transition-colors ${
                showSavedMessage
                  ? 'text-green-600 dark:text-green-400'
                  : hasUnsavedChanges
                  ? 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
              title={showSavedMessage ? 'Saved!' : hasUnsavedChanges ? 'Save project (Cmd/Ctrl+S)' : 'No changes to save'}
              aria-label="Save project"
              disabled={!hasUnsavedChanges && !showSavedMessage}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7.707 14.707a1 1 0 01-1.414 0L3 11.414V17a1 1 0 001 1h12a1 1 0 001-1v-5.586l-3.293 3.293a1 1 0 01-1.414 0L10 12.414l-2.293 2.293z" />
                <path d="M10 2a1 1 0 011 1v5.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 8.586V3a1 1 0 011-1z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* New Project Dialog */}
      {showNewProject && (
        <div id="new-project-dialog" className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64 z-10">
          <h3 id="new-project-dialog-title" className="text-sm font-medium text-gray-900 dark:text-white mb-2">New Project</h3>
          <input
            id="new-project-name"
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNewProject()}
            placeholder="Project name"
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          <div id="new-project-actions" className="flex justify-end space-x-2 mt-2">
            <button
              id="new-project-cancel"
              onClick={() => {
                setShowNewProject(false);
                setNewProjectName('');
              }}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              id="new-project-create"
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
        <div id="project-list" className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 w-72 max-h-64 overflow-y-auto z-10">
          <h3 id="project-list-title" className="text-sm font-medium text-gray-900 dark:text-white px-2 pb-2 border-b dark:border-gray-700">
            Projects
          </h3>
          <div id="project-list-items" className="mt-2 space-y-1">
            {projects.map((project) => (
              <div
                id={`project-item-${project.id}`}
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
                  id={`delete-project-${project.id}`}
                  onClick={() => {
                    if (confirm(`Delete project "${project.name}"?`)) {
                      deleteProject(project.id);
                    }
                  }}
                  className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label={`Delete project ${project.name}`}
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