// Home page displaying all saved skin projects
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import ImportButton from '../components/ImportButton';
import ConsoleIcon from '../components/ConsoleIcon';
import { ControlMapping, ScreenMapping } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loadProject, deleteProject, createProject, clearProject, isLoading: isProjectsLoading } = useProject();
  const { showError } = useToast();
  const [projectImages, setProjectImages] = useState<{ [key: string]: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Use projects directly - no filtering needed
  const userProjects = projects;

  // Load preview images for projects
  useEffect(() => {
    const loadImages = async () => {
      const images: { [key: string]: string } = {};
      
      for (const project of userProjects) {
        // Check for R2 image URLs in the orientation-based structure
        const portraitUrl = project.orientations?.portrait?.backgroundImage?.url;
        const landscapeUrl = project.orientations?.landscape?.backgroundImage?.url;
        const projectId = project.id || project._id;
        
        if (projectId && (portraitUrl || landscapeUrl)) {
          // Prefer portrait image, fall back to landscape
          images[projectId] = portraitUrl || landscapeUrl || '';
        }
      }
      
      setProjectImages(images);
    };

    loadImages();
  }, [userProjects]);

  const handleCreateNew = async () => {
    clearProject(); // Clear any current project
    const projectId = await createProject('New Skin');
    
    if (!projectId) {
      showError('Failed to create project - no ID returned');
      return;
    }
    
    await loadProject(projectId);
    navigate('/editor');
  };

  const handleOpenProject = async (projectId: string) => {
    await loadProject(projectId);
    navigate('/editor');
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!projectId) {
      showError('Cannot delete project: Project ID is missing');
      return;
    }
    
    if (deleteConfirm === projectId) {
      try {
        await deleteProject(projectId);
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Failed to delete project:', error);
        showError('Failed to delete project. Please try again.');
        setDeleteConfirm(null);
      }
    } else {
      setDeleteConfirm(projectId);
      // Reset confirmation after 3 seconds
      setTimeout(() => {
        setDeleteConfirm(null);
      }, 3000);
    }
  };


  const handleImport = async (
    importedName: string,
    importedIdentifier: string,
    importedConsole: string,
    importedControls: ControlMapping[],
    importedScreens: ScreenMapping[],
    importedImage: { file: File; url: string } | null,
    deviceDimensions?: { width: number; height: number }
  ) => {
    // Create a new project with imported data
    clearProject();
    await createProject(importedName);
    
    // Navigate to editor with the imported data
    navigate('/editor', { 
      state: { 
        importedData: {
          name: importedName,
          identifier: importedIdentifier,
          console: importedConsole,
          controls: importedControls,
          screens: importedScreens,
          image: importedImage,
          deviceDimensions
        }
      }
    });
  };


  return (
    <div id="home-container" className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div id="home-header" className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Emulator Skin Generator
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Create custom skins for Delta and Gamma emulators
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <ImportButton onImport={handleImport} />
              <button
                id="create-new-skin-button"
                onClick={handleCreateNew}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create New Skin</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isProjectsLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : (
          <div>
            
            
            {/* Projects Section or Empty State */}
            {userProjects.length === 0 ? (
              <div id="empty-state" className="text-center py-16">
                <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No skins yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Get started by creating your first emulator skin
                </p>
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Create Your First Skin
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Projects</h2>
                </div>
                
                <div id="projects-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {userProjects.map((project) => {
                    const projectId = project.id || project._id;
                    return (
              <div
                key={projectId}
                id={`project-card-${projectId}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden group cursor-pointer"
                onClick={() => handleOpenProject(projectId)}
              >
                {/* Preview Image */}
                <div className="aspect-[9/16] bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                  {projectImages[projectId] ? (
                    <img
                      src={projectImages[projectId]}
                      alt={`${project.name} preview`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Console Icon Badge */}
                  {project.console && (
                    <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-1.5">
                      <ConsoleIcon console={project.console.shortName} className="w-6 h-6" />
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Open Project
                    </span>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {project.name || 'Untitled Skin'}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      {project.console && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                          <ConsoleIcon console={project.console.shortName} className="w-4 h-4" />
                          <span>{project.console.shortName.toUpperCase()}</span>
                        </span>
                      )}
                      {project.device && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded truncate max-w-[120px]">
                          {project.device.model}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(project.lastModified).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/test/${projectId}`);
                        }}
                        className="px-3 py-1 text-xs font-medium rounded transition-colors bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        Test
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!projectId) {
                            console.error('Project ID is undefined!', project);
                            return;
                          }
                          handleDeleteProject(projectId);
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          deleteConfirm === projectId
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {deleteConfirm === projectId ? 'Confirm Delete' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
                  );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;