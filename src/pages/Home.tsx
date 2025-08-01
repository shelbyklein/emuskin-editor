// Home page displaying all saved skin projects
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContextV2';
import { useAuth } from '../contexts/AuthContext';
import { indexedDBManager } from '../utils/indexedDB';
import ImportButton from '../components/ImportButton';
import LoginModal from '../components/LoginModal';
import ConsoleIcon from '../components/ConsoleIcon';
import { ControlMapping, ScreenMapping } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loadProject, deleteProject, createProject, clearProject } = useProject();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [projectImages, setProjectImages] = useState<{ [key: string]: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Filter projects to show only current user's projects
  const userProjects = useMemo(() => {
    return projects.filter(project => 
      !project.userId || // Show legacy projects without userId
      (user && project.userId === user.id) // Show projects belonging to current user
    );
  }, [projects, user]);

  // Load preview images for projects
  useEffect(() => {
    const loadImages = async () => {
      const images: { [key: string]: string } = {};
      
      for (const project of userProjects) {
        // Check for image in the new orientation-based structure
        const hasPortraitImage = project.orientations?.portrait?.backgroundImage?.hasStoredImage;
        const hasLandscapeImage = project.orientations?.landscape?.backgroundImage?.hasStoredImage;
        // Also check legacy structure for backward compatibility
        const hasLegacyImage = project.backgroundImage?.hasStoredImage;
        
        if (project.id && (hasPortraitImage || hasLandscapeImage || hasLegacyImage)) {
          try {
            // Try portrait image first (most common)
            let imageData = null;
            if (hasPortraitImage) {
              imageData = await indexedDBManager.getImage(`${project.id}-portrait`);
            }
            // Fall back to landscape if no portrait
            if (!imageData && hasLandscapeImage) {
              imageData = await indexedDBManager.getImage(`${project.id}-landscape`);
            }
            // Fall back to legacy format
            if (!imageData && hasLegacyImage) {
              imageData = await indexedDBManager.getImage(project.id);
            }
            
            if (imageData) {
              images[project.id] = imageData.url;
            }
          } catch (error) {
            console.error('Failed to load image for project:', project.id, error);
          }
        }
      }
      
      setProjectImages(images);
    };

    loadImages();

    // No cleanup needed as we're using IndexedDB URLs directly
  }, [userProjects]);

  const handleCreateNew = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    clearProject(); // Clear any current project
    const projectId = createProject('New Skin');
    await loadProject(projectId);
    navigate('/editor');
  };

  const handleOpenProject = async (projectId: string) => {
    await loadProject(projectId);
    navigate('/editor');
  };

  const handleDeleteProject = (projectId: string) => {
    if (deleteConfirm === projectId) {
      deleteProject(projectId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(projectId);
      // Reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
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
    createProject(importedName);
    
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
                {isAuthenticated && user 
                  ? `Welcome back, ${user.displayName}!` 
                  : 'Create custom skins for Delta and Gamma emulators'}
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
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : !isAuthenticated ? (
          <div id="login-prompt" className="text-center py-16 max-w-2xl mx-auto">
            <svg className="mx-auto h-20 w-20 text-blue-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Sign in to Create Your Skins
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Create an account or sign in to start designing custom emulator skins. 
              Your projects will be saved to your account and accessible from any device.
            </p>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Benefits of signing in:</h3>
              <ul className="text-left inline-block space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Save unlimited skin projects</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Access your projects from any device</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Share skins with the community (coming soon)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Automatic backups and version history</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Sign in with Playcase</span>
            </button>
          </div>
        ) : userProjects.length === 0 ? (
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
          <div>
            {/* User Profile Section */}
            {user && (
              <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.displayName}
                        className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-medium">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {user.displayName}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {userProjects.length} {userProjects.length === 1 ? 'project' : 'projects'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Member since today
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Projects Section */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Projects</h2>
            </div>
            
            <div id="projects-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userProjects.map((project) => (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden group cursor-pointer"
                onClick={() => handleOpenProject(project.id)}
              >
                {/* Preview Image */}
                <div className="aspect-[9/16] bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                  {projectImages[project.id] ? (
                    <img
                      src={projectImages[project.id]}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        deleteConfirm === project.id
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {deleteConfirm === project.id ? 'Confirm Delete' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
};

export default Home;