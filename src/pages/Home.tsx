// Home page displaying all saved skin projects
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContextHybrid';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ImportButton from '../components/ImportButton';
import LoginModal from '../components/LoginModal';
import MigrationDialog from '../components/MigrationDialog';
import ConsoleIcon from '../components/ConsoleIcon';
import { ControlMapping, ScreenMapping } from '../types';
import { DatabaseDebugger } from '../components/DatabaseDebugger';
import { getAllLocalStorageProjects } from '../utils/localStorageProjects';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loadProject, deleteProject, createProject, clearProject, isLoading: isProjectsLoading } = useProject();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { showError } = useToast();
  const [projectImages, setProjectImages] = useState<{ [key: string]: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  
  // Use projects directly from the API - no filtering needed
  const userProjects = projects;
  
  // Check for local projects when user logs in
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      const localProjects = getAllLocalStorageProjects();
      if (localProjects.length > 0) {
        setShowMigrationDialog(true);
      }
    }
  }, [isAuthenticated, isAuthLoading]);

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

  const handleTemplateSelect = async (templateName: string) => {
    try {
      // Load the template JSON file
      const response = await fetch(`/assets/templates/${templateName}-template.json`);
      if (!response.ok) {
        throw new Error('Failed to load template');
      }
      
      const templateData = await response.json();
      
      // Create a new project with template data
      clearProject();
      const projectId = await createProject(templateData.name);
      
      // Load the project to ensure currentProject is set
      await loadProject(projectId);
      
      // Navigate to editor with the template data
      navigate('/editor', {
        state: {
          templateData: {
            name: templateData.name,
            identifier: templateData.identifier,
            gameTypeIdentifier: templateData.gameTypeIdentifier,
            items: templateData.representations.iphone.edgeToEdge.portrait.items,
            screens: templateData.representations.iphone.edgeToEdge.portrait.screens,
            mappingSize: templateData.representations.iphone.edgeToEdge.portrait.mappingSize,
            extendedEdges: templateData.representations.iphone.edgeToEdge.portrait.extendedEdges,
            menuInsets: templateData.representations.iphone.edgeToEdge.portrait.menuInsets
          }
        }
      });
    } catch (error) {
      console.error('Error loading template:', error);
      showError('Failed to load template. Please try again.');
    }
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
        {isAuthLoading || isProjectsLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : (
          <div>
            
            {/* Non-authenticated welcome message */}
            {!isAuthenticated && (
              <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                      You're using local storage
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                      Your projects are saved in this browser only. Sign in to sync across devices and never lose your work.
                    </p>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg text-sm transition-colors"
                      >
                        Sign in to save to cloud
                      </button>
                      <button
                        onClick={handleCreateNew}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg text-sm transition-colors"
                      >
                        Continue without account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* User Profile Section */}
            {isAuthenticated && user && (
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
            
            {/* Template Section - Always show for authenticated users */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Start with a template:</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {[
                  { shortName: 'gbc', displayName: 'GameBoy Color' },
                  { shortName: 'gba', displayName: 'GameBoy Advance' },
                  { shortName: 'nds', displayName: 'Nintendo DS' },
                  { shortName: 'nes', displayName: 'NES' },
                  { shortName: 'snes', displayName: 'SNES' },
                  { shortName: 'n64', displayName: 'Nintendo 64' },
                  { shortName: 'sg', displayName: 'Genesis' },
                  { shortName: 'ps1', displayName: 'PlayStation' }
                ].map((console) => (
                  <button
                    key={console.shortName}
                    onClick={() => handleTemplateSelect(console.shortName)}
                    className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group hover:scale-105"
                  >
                    <ConsoleIcon 
                      console={console.shortName} 
                      className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform duration-200" 
                    />
                    <span className="text-xs text-center text-gray-700 dark:text-gray-300 font-medium">
                      {console.displayName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
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
                  Get started by creating your first emulator skin or choose a template above
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
                  
                  {/* Storage Type Badge */}
                  <div className="absolute top-2 left-2">
                    {project.isLocal ? (
                      <div className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 shadow-md">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span>Local</span>
                      </div>
                    ) : (
                      <div className="bg-green-500 text-green-900 px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 shadow-md">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                        </svg>
                        <span>Cloud</span>
                      </div>
                    )}
                  </div>
                  
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
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      {/* Migration Dialog */}
      <MigrationDialog
        isOpen={showMigrationDialog}
        onClose={() => setShowMigrationDialog(false)}
      />
      
      {/* Database Debugger */}
      <DatabaseDebugger />
    </div>
  );
};

export default Home;