// Project context for managing skin projects with local storage
import React, { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
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
  deleteProject: (id: string) => void;
  clearProject: () => void;
  getCurrentOrientation: () => 'portrait' | 'landscape';
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  getOrientationData: (orientation?: 'portrait' | 'landscape') => OrientationData | null;
  saveOrientationData: (data: Partial<OrientationData>, orientation?: 'portrait' | 'landscape') => void;
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

  // Migrate projects on load
  const migratedProjects = projects.map(migrateProject);
  if (JSON.stringify(projects) !== JSON.stringify(migratedProjects)) {
    setProjects(migratedProjects);
  }

  const currentProject = migratedProjects.find(p => p.id === currentProjectId) || null;

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
    const project = migratedProjects.find(p => p.id === id);
    if (project) {
      setCurrentProjectId(id);
      
      // Load images from IndexedDB for both orientations if they exist
      const orientations = ['portrait', 'landscape'] as const;
      for (const orientation of orientations) {
        const orientationData = project.orientations?.[orientation];
        if (orientationData?.backgroundImage?.hasStoredImage) {
          try {
            const storedImage = await indexedDBManager.getImage(`${id}-${orientation}`);
            if (storedImage) {
              // Update the project with the restored image URL
              setProjects(prev => prev.map(p => {
                if (p.id === id && p.orientations) {
                  return {
                    ...p,
                    orientations: {
                      ...p.orientations,
                      [orientation]: {
                        ...p.orientations[orientation],
                        backgroundImage: {
                          ...p.orientations[orientation].backgroundImage!,
                          url: storedImage.url
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
      return;
    }

    setProjects(prev => prev.map(project => {
      if (project.id === currentProjectId) {
        return {
          ...project,
          ...updates,
          lastModified: Date.now()
        };
      }
      return project;
    }));
  }, [currentProjectId]);

  const saveProjectImage = useCallback(async (file: File, orientation: 'portrait' | 'landscape' = 'portrait') => {
    if (!currentProjectId || !currentProject) return;
    
    try {
      // Store image in IndexedDB with orientation suffix
      const imageKey = `${currentProjectId}-${orientation}`;
      const url = await indexedDBManager.storeImage(imageKey, file, 'background');
      
      // Update project with new image info
      setProjects(prev => prev.map(project => {
        if (project.id === currentProjectId && project.orientations) {
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
    } catch (error) {
      console.error('Failed to save image to IndexedDB:', error);
      throw error;
    }
  }, [currentProjectId, currentProject]);

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
      return;
    }
    
    const targetOrientation = orientation || getCurrentOrientation();
    
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

  return (
    <ProjectContext.Provider value={{
      currentProject,
      projects,
      createProject,
      loadProject,
      saveProject,
      saveProjectImage,
      deleteProject,
      clearProject,
      getCurrentOrientation,
      setOrientation,
      getOrientationData,
      saveOrientationData
    }}>
      {children}
    </ProjectContext.Provider>
  );
};