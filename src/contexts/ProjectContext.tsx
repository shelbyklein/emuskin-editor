// Project context for managing skin projects with local storage
import React, { createContext, useContext, ReactNode, useEffect, useCallback, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ControlMapping, Device, Console, ScreenMapping } from '../types';
import { indexedDBManager } from '../utils/indexedDB';
import { useAuth } from './AuthContext';

interface OrientationData {
  controls: ControlMapping[];
  screens: ScreenMapping[];
  backgroundImage: {
    fileName?: string;
    url: string | null;
    hasStoredImage?: boolean; // Flag to indicate if image is in IndexedDB
  } | null;
  menuInsetsEnabled?: boolean;
  menuInsetsBottom?: number;
}

interface Project {
  id: string;
  name: string;
  identifier: string;
  console: Console | null;
  device: Device | null;
  // User ownership and sharing
  userId?: string; // WordPress user ID - optional for backward compatibility
  isPublic?: boolean; // Whether project can be viewed by others
  createdAt?: number; // Creation timestamp
  // Legacy support - will be migrated to orientations
  controls?: ControlMapping[];
  screens?: ScreenMapping[];
  backgroundImage?: {
    fileName?: string;
    url: string | null;
    hasStoredImage?: boolean;
  } | null;
  menuInsetsEnabled?: boolean;
  menuInsetsBottom?: number;
  // New orientation-based structure
  orientations?: {
    portrait: OrientationData;
    landscape: OrientationData;
  };
  currentOrientation?: 'portrait' | 'landscape';
  hasBeenConfigured?: boolean; // Track if user has configured console/device
  lastModified: number;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  createProject: (name: string, initialData?: Partial<Project>) => string;
  loadProject: (id: string) => void;
  saveProject: (updates: Partial<Project>) => void;
  saveProjectImage: (file: File, orientation?: 'portrait' | 'landscape') => Promise<void>;
  storeTemporaryImage: (file: File, orientation?: 'portrait' | 'landscape') => Promise<string>;
  deleteProject: (id: string) => void;
  clearProject: () => void;
  getCurrentOrientation: () => 'portrait' | 'landscape';
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  getOrientationData: (orientation?: 'portrait' | 'landscape') => OrientationData | null;
  saveOrientationData: (data: Partial<OrientationData>, orientation?: 'portrait' | 'landscape') => void;
  saveProjectWithOrientation: (projectUpdates: Partial<Project>, orientationData?: Partial<OrientationData>, orientation?: 'portrait' | 'landscape') => void;
}

const defaultOrientationData: OrientationData = {
  controls: [],
  screens: [],
  backgroundImage: null,
  menuInsetsEnabled: false,
  menuInsetsBottom: 0
};

const defaultProject: Project = {
  id: '',
  name: 'Untitled Skin',
  identifier: 'com.playcase.default.skin',
  console: null,
  device: null,
  orientations: {
    portrait: { ...defaultOrientationData },
    landscape: { ...defaultOrientationData }
  },
  currentOrientation: 'portrait',
  hasBeenConfigured: false,
  lastModified: Date.now()
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

// Helper function to migrate legacy projects to orientation-based structure
const migrateProject = (project: Project): Project => {
  let migrated = project;
  
  if (!project.orientations) {
    migrated = {
      ...project,
      orientations: {
        portrait: {
          controls: project.controls || [],
          screens: project.screens || [],
          backgroundImage: project.backgroundImage || null,
          menuInsetsEnabled: project.menuInsetsEnabled || false,
          menuInsetsBottom: project.menuInsetsBottom || 0
        },
        landscape: { ...defaultOrientationData }
      },
      currentOrientation: 'portrait',
      // Remove legacy fields
      controls: undefined,
      screens: undefined,
      backgroundImage: undefined,
      menuInsetsEnabled: undefined,
      menuInsetsBottom: undefined
    };
  }
  
  // Mark projects as configured if they have console and device (backward compatibility)
  if (migrated.hasBeenConfigured === undefined) {
    migrated.hasBeenConfigured = !!(migrated.console && migrated.device);
  }
  
  return migrated;
};

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useLocalStorage<Project[]>('emuskin-projects', []);
  const [currentProjectId, setCurrentProjectId] = useLocalStorage<string | null>('emuskin-current-project', null);
  const { user } = useAuth();

  // Always migrate projects on the fly to ensure we have the latest data
  const activeProjects = projects.map(migrateProject);
  const currentProject = activeProjects.find(p => p.id === currentProjectId) || null;
  
  // Debug log currentProject changes
  useEffect(() => {
    if (currentProject) {
      console.log('ProjectContext: currentProject updated:', {
        id: currentProject.id,
        name: currentProject.name,
        identifier: currentProject.identifier,
        lastModified: currentProject.lastModified
      });
    }
  }, [currentProject?.name, currentProject?.identifier, currentProject?.lastModified]);

  // Initialize IndexedDB on mount
  useEffect(() => {
    indexedDBManager.init().catch(console.error);
    // Clean up old images periodically
    indexedDBManager.clearOldImages(30).catch(console.error);
  }, []);

  const createProject = (name: string, initialData?: Partial<Project>): string => {
    const newProject: Project = {
      ...defaultProject,
      id: `project-${Date.now()}`,
      name,
      ...initialData,
      userId: user?.id, // Automatically assign current user's ID
      createdAt: Date.now(), // Add creation timestamp
      orientations: {
        portrait: { ...defaultOrientationData },
        landscape: { ...defaultOrientationData }
      },
      currentOrientation: 'portrait',
      lastModified: Date.now()
    };
    
    setProjects(prev => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
    return newProject.id;
  };

  const loadProject = async (id: string) => {
    const project = activeProjects.find(p => p.id === id);
    if (project) {
      setCurrentProjectId(id);
      
      // Load images from IndexedDB for both orientations if they exist
      const orientations = ['portrait', 'landscape'] as const;
      for (const orientation of orientations) {
        const orientationData = project.orientations?.[orientation];
        console.log(`Checking ${orientation} orientation:`, {
          hasOrientationData: !!orientationData,
          hasBackgroundImage: !!orientationData?.backgroundImage,
          hasStoredImage: orientationData?.backgroundImage?.hasStoredImage
        });
        if (orientationData?.backgroundImage?.hasStoredImage) {
          try {
            console.log(`Loading ${orientation} image for project ${id}`);
            const storedImage = await indexedDBManager.getImage(`${id}-${orientation}`, 'background');
            console.log(`getImage result for ${orientation}:`, storedImage);
            if (storedImage) {
              console.log(`Found ${orientation} image in IndexedDB:`, storedImage.fileName, storedImage.url);
              // Update the project with the restored image URL
              setProjects(prev => prev.map(p => {
                if (p.id === id && p.orientations) {
                  // Clean up old blob URL if it exists
                  const oldUrl = p.orientations[orientation].backgroundImage?.url;
                  if (oldUrl && oldUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(oldUrl);
                  }
                  
                  return {
                    ...p,
                    orientations: {
                      ...p.orientations,
                      [orientation]: {
                        ...p.orientations[orientation],
                        backgroundImage: {
                          fileName: storedImage.fileName,
                          url: storedImage.url,
                          hasStoredImage: true
                        }
                      }
                    }
                  };
                }
                return p;
              }));
            }
          } catch (error) {
            console.error(`Failed to load ${orientation} image from IndexedDB:`, error);
          }
        }
      }
      
      // Also check for legacy image format
      if (project.backgroundImage?.hasStoredImage && !project.orientations?.portrait.backgroundImage?.hasStoredImage) {
        try {
          const storedImage = await indexedDBManager.getImage(id);
          if (storedImage) {
            setProjects(prev => prev.map(p => {
              if (p.id === id && p.orientations) {
                return {
                  ...p,
                  orientations: {
                    ...p.orientations,
                    portrait: {
                      ...p.orientations.portrait,
                      backgroundImage: {
                        fileName: project.backgroundImage?.fileName,
                        url: storedImage.url,
                        hasStoredImage: true
                      }
                    }
                  }
                };
              }
              return p;
            }));
          }
        } catch (error) {
          console.error('Failed to load legacy image from IndexedDB:', error);
        }
      }
    }
  };

  const saveProject = useCallback((updates: Partial<Project>) => {
    if (!currentProjectId) {
      console.error('No project to save - currentProjectId is null');
      return;
    }

    console.log('ProjectContext.saveProject called:', {
      projectId: currentProjectId,
      updates: {
        name: updates.name,
        identifier: updates.identifier,
        consoleShortName: updates.console?.shortName,
        deviceModel: updates.device?.model
      }
    });

    setProjects(prev => {
      const newProjects = prev.map(project => {
        if (project.id === currentProjectId) {
          // Ensure we maintain the migrated structure when updating
          const migratedProject = migrateProject(project);
          const updatedProject = {
            ...migratedProject,
            ...updates,
            lastModified: Date.now()
          };
          console.log('Project updated in state:', {
            id: updatedProject.id,
            name: updatedProject.name,
            console: updatedProject.console?.shortName
          });
          return updatedProject;
        }
        return project;
      });
      console.log('All projects after update:', newProjects.map(p => ({ id: p.id, name: p.name })));
      return newProjects;
    });
  }, [currentProjectId]);

  const saveProjectImage = useCallback(async (file: File, orientation: 'portrait' | 'landscape' = 'portrait') => {
    console.log('saveProjectImage called:', {
      hasCurrentProjectId: !!currentProjectId,
      currentProjectId,
      hasCurrentProject: !!currentProject,
      fileName: file.name,
      orientation
    });
    
    if (!currentProjectId || !currentProject) {
      console.log('Cannot save image - no current project');
      return;
    }
    
    try {
      console.log('Storing image in IndexedDB...');
      // Store image in IndexedDB - the storeImage function will add the orientation to the ID
      const url = await indexedDBManager.storeImage(`${currentProjectId}-${orientation}`, file, 'background');
      console.log('Image stored in IndexedDB, URL:', url);
      
      // Update project with new image info
      console.log('Updating project state with image info...');
      setProjects(prev => prev.map(project => {
        if (project.id === currentProjectId && project.orientations) {
          console.log(`Updating ${orientation} orientation with image data`);
          return {
            ...project,
            orientations: {
              ...project.orientations,
              [orientation]: {
                ...project.orientations[orientation],
                backgroundImage: {
                  fileName: file.name,
                  url,
                  hasStoredImage: true
                }
              }
            },
            lastModified: Date.now()
          };
        }
        return project;
      }));
      console.log('Project state updated with image');
    } catch (error) {
      console.error('Failed to save image to IndexedDB:', error);
      throw error;
    }
  }, [currentProjectId, currentProject]);

  const storeTemporaryImage = useCallback(async (file: File, orientation: 'portrait' | 'landscape' = 'portrait'): Promise<string> => {
    if (!currentProjectId) {
      throw new Error('No project loaded');
    }
    
    try {
      // Store image in IndexedDB but don't update project state
      const url = await indexedDBManager.storeImage(`${currentProjectId}-${orientation}`, file, 'background');
      return url;
    } catch (error) {
      console.error('Failed to store temporary image:', error);
      throw error;
    }
  }, [currentProjectId]);

  const deleteProject = async (id: string) => {
    // Delete associated images from IndexedDB
    try {
      await indexedDBManager.deleteProjectImages(id);
    } catch (error) {
      console.error('Failed to delete project images:', error);
    }
    
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProjectId === id) {
      setCurrentProjectId(null);
    }
  };

  const clearProject = () => {
    setCurrentProjectId(null);
  };

  const getCurrentOrientation = useCallback((): 'portrait' | 'landscape' => {
    return currentProject?.currentOrientation || 'portrait';
  }, [currentProject?.currentOrientation]);

  const setOrientation = useCallback((orientation: 'portrait' | 'landscape') => {
    if (!currentProjectId || !currentProject) return;
    
    setProjects(prev => prev.map(project => {
      if (project.id === currentProjectId) {
        return {
          ...project,
          currentOrientation: orientation,
          lastModified: Date.now()
        };
      }
      return project;
    }));
  }, [currentProjectId, currentProject]);

  const getOrientationData = useCallback((orientation?: 'portrait' | 'landscape'): OrientationData | null => {
    if (!currentProject?.orientations) return null;
    const targetOrientation = orientation || getCurrentOrientation();
    return currentProject.orientations[targetOrientation] || null;
  }, [currentProject?.orientations, getCurrentOrientation]);

  const saveOrientationData = useCallback((data: Partial<OrientationData>, orientation?: 'portrait' | 'landscape') => {
    if (!currentProjectId || !currentProject?.orientations) {
      console.error('Cannot save orientation data - no project or orientations');
      return;
    }
    
    const targetOrientation = orientation || getCurrentOrientation();
    
    console.log('ProjectContext.saveOrientationData called:', {
      projectId: currentProjectId,
      targetOrientation,
      dataKeys: Object.keys(data),
      numControls: data.controls?.length,
      numScreens: data.screens?.length,
      hasBackgroundImage: !!data.backgroundImage
    });
    
    setProjects(prev => prev.map(project => {
      if (project.id === currentProjectId && project.orientations) {
        return {
          ...project,
          orientations: {
            ...project.orientations,
            [targetOrientation]: {
              ...project.orientations[targetOrientation],
              ...data
            }
          },
          lastModified: Date.now()
        };
      }
      return project;
    }));
  }, [currentProjectId, currentProject?.orientations, getCurrentOrientation]);
  
  // Combined save function that updates both project and orientation data atomically
  const saveProjectWithOrientation = useCallback((
    projectUpdates: Partial<Project>,
    orientationData?: Partial<OrientationData>,
    orientation?: 'portrait' | 'landscape'
  ) => {
    if (!currentProjectId) {
      console.error('No project to save - currentProjectId is null');
      return;
    }
    
    const targetOrientation = orientation || getCurrentOrientation();
    
    console.log('ProjectContext.saveProjectWithOrientation called:', {
      projectId: currentProjectId,
      projectUpdates: {
        name: projectUpdates.name,
        identifier: projectUpdates.identifier,
        consoleShortName: projectUpdates.console?.shortName,
        deviceModel: projectUpdates.device?.model
      },
      orientationDataKeys: orientationData ? Object.keys(orientationData) : [],
      targetOrientation
    });
    
    setProjects(prev => {
      const newProjects = prev.map(project => {
        if (project.id === currentProjectId) {
          // Migrate if needed
          const migratedProject = migrateProject(project);
          
          // Build the updated project with both project and orientation updates
          let updatedProject = {
            ...migratedProject,
            ...projectUpdates,
            lastModified: Date.now()
          };
          
          // Apply orientation data if provided
          if (orientationData && updatedProject.orientations) {
            updatedProject = {
              ...updatedProject,
              orientations: {
                ...updatedProject.orientations,
                [targetOrientation]: {
                  ...updatedProject.orientations[targetOrientation],
                  ...orientationData
                }
              }
            };
          }
          
          console.log('Project updated with combined data:', {
            id: updatedProject.id,
            name: updatedProject.name,
            console: updatedProject.console?.shortName,
            hasOrientationData: !!orientationData
          });
          
          return updatedProject;
        }
        return project;
      });
      
      console.log('All projects after combined update:', newProjects.map(p => ({ id: p.id, name: p.name })));
      return newProjects;
    });
  }, [currentProjectId, getCurrentOrientation]);

  return (
    <ProjectContext.Provider value={{
      currentProject,
      projects,
      createProject,
      loadProject,
      saveProject,
      saveProjectImage,
      storeTemporaryImage,
      deleteProject,
      clearProject,
      getCurrentOrientation,
      setOrientation,
      getOrientationData,
      saveOrientationData,
      saveProjectWithOrientation
    }}>
      {children}
    </ProjectContext.Provider>
  );
};