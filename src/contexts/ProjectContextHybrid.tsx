// Hybrid Project Context - Uses API for authenticated users, localStorage for non-authenticated
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { ControlMapping, Device, Console, ScreenMapping } from '../types';
import { useAuth } from './AuthContext';
import { projectsAPI, isApiAvailable } from '../utils/api';
import { 
  saveProjectToLocalStorage, 
  loadProjectFromLocalStorage, 
  getAllLocalStorageProjects, 
  deleteLocalStorageProject,
  isLocalStorageAvailable 
} from '../utils/localStorageProjects';
import { useToast } from './ToastContext';

interface OrientationData {
  controls: ControlMapping[];
  screens: ScreenMapping[];
  backgroundImage: {
    fileName?: string;
    url: string | null;
    hasStoredImage?: boolean;
  } | null;
  menuInsetsEnabled?: boolean;
  menuInsetsBottom?: number;
  menuInsetsLeft?: number;
  menuInsetsRight?: number;
}

interface Project {
  id: string;
  _id?: string;
  name: string;
  identifier: string;
  console: Console | null;
  device: Device | null;
  orientations?: {
    portrait: OrientationData;
    landscape: OrientationData;
  };
  availableOrientations?: Array<'portrait' | 'landscape'>;
  currentOrientation?: 'portrait' | 'landscape';
  hasBeenConfigured?: boolean;
  lastModified: number;
  userId?: string;
  createdAt?: number;
  isLocal?: boolean; // Flag to indicate if project is stored locally
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  createProject: (name: string, initialData?: Partial<Project>) => Promise<string>;
  loadProject: (id: string) => Promise<void>;
  saveProject: (updates: Partial<Project>) => Promise<void>;
  saveProjectImage: (file: File, orientation?: 'portrait' | 'landscape') => Promise<void>;
  storeTemporaryImage: (file: File, orientation?: 'portrait' | 'landscape') => Promise<string>;
  deleteProject: (id: string) => Promise<void>;
  clearProject: () => void;
  getCurrentOrientation: () => 'portrait' | 'landscape';
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  getOrientationData: (orientation?: 'portrait' | 'landscape') => OrientationData | null;
  saveOrientationData: (data: Partial<OrientationData>, orientation?: 'portrait' | 'landscape') => Promise<void>;
  saveProjectWithOrientation: (projectUpdates: Partial<Project>, orientationData?: Partial<OrientationData>, orientation?: 'portrait' | 'landscape') => Promise<void>;
  isLoading: boolean;
  migrateLocalProjectsToCloud: () => Promise<number>; // Returns number of migrated projects
}

const defaultOrientationData: OrientationData = {
  controls: [],
  screens: [],
  backgroundImage: null,
  menuInsetsEnabled: false,
  menuInsetsBottom: 0,
  menuInsetsLeft: 0,
  menuInsetsRight: 0
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess, showWarning } = useToast();

  // Load consoles and devices data
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [consolesRes, devicesRes] = await Promise.all([
          fetch('/assets/gameTypeIdentifiers.json'),
          fetch('/assets/iphone-sizes.json')
        ]);

        const consolesData = await consolesRes.json();
        const devicesData = await devicesRes.json();

        setConsoles(consolesData.gameTypes || []);
        setDevices(devicesData.devices || []);
      } catch (error) {
        console.error('Failed to load configuration data:', error);
      }
    };

    loadData();
  }, []);

  // Load projects based on authentication status
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      try {
        if (isAuthenticated && isApiAvailable()) {
          // Load from API for authenticated users
          const apiProjects = await projectsAPI.getProjects();
          setProjects(apiProjects);
        } else if (!isAuthenticated && isLocalStorageAvailable()) {
          // Load from localStorage for non-authenticated users
          const localProjects = getAllLocalStorageProjects();
          setProjects(localProjects);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        showError('Failed to load projects');
        
        // Fallback to localStorage if API fails
        if (!isAuthenticated && isLocalStorageAvailable()) {
          const localProjects = getAllLocalStorageProjects();
          setProjects(localProjects);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [isAuthenticated, showError]);

  const normalizeProject = (project: any): Project => {
    // Ensure both id and _id exist
    const id = project.id || project._id || `local_${Date.now()}`;
    return {
      ...project,
      id: id,
      _id: project._id || id,
    };
  };

  const createProject = useCallback(async (name: string, initialData?: Partial<Project>): Promise<string> => {
    try {
      const newProject: Project = {
        id: `project_${Date.now()}`,
        name,
        identifier: 'com.playcase.default.skin',
        console: null,
        device: null,
        orientations: {
          portrait: { ...defaultOrientationData },
          landscape: { ...defaultOrientationData }
        },
        availableOrientations: ['portrait'],
        currentOrientation: 'portrait',
        hasBeenConfigured: false,
        lastModified: Date.now(),
        createdAt: Date.now(),
        ...initialData
      };

      if (isAuthenticated && isApiAvailable()) {
        // Create in API for authenticated users
        const createdProject = await projectsAPI.createProject({
          ...newProject,
          userId: user?.id || user?.email
        });
        const normalized = normalizeProject(createdProject);
        setProjects(prev => [...prev, normalized]);
        setCurrentProject(normalized);
        return normalized.id;
      } else {
        // Create in localStorage for non-authenticated users
        newProject.isLocal = true;
        saveProjectToLocalStorage(newProject);
        setProjects(prev => [...prev, newProject]);
        setCurrentProject(newProject);
        
        // Show warning about local storage
        if (!isAuthenticated) {
          showWarning('Project saved locally. Sign in to sync across devices.');
        }
        
        return newProject.id;
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      showError('Failed to create project');
      throw error;
    }
  }, [isAuthenticated, user, showError, showWarning]);

  const loadProject = useCallback(async (id: string): Promise<void> => {
    if (!id) {
      showError('Cannot load project: Project ID is missing');
      return;
    }

    setIsLoading(true);
    try {
      let project: Project | null = null;

      if (isAuthenticated && isApiAvailable()) {
        // Load from API for authenticated users
        project = await projectsAPI.getProject(id);
      } else {
        // Load from localStorage
        project = loadProjectFromLocalStorage(id);
      }

      if (project) {
        const normalized = normalizeProject(project);
        setCurrentProject(normalized);
        
        // Also ensure it's in the projects list
        setProjects(prev => {
          const exists = prev.some(p => p.id === normalized.id);
          if (!exists) {
            return [...prev, normalized];
          }
          return prev;
        });
      } else {
        showError('Project not found');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      showError('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, showError]);

  const saveProject = useCallback(async (updates: Partial<Project>): Promise<void> => {
    if (!currentProject) {
      showError('No project to save');
      return;
    }

    try {
      const updatedProject = {
        ...currentProject,
        ...updates,
        lastModified: Date.now()
      };

      if (isAuthenticated && isApiAvailable() && !currentProject.isLocal) {
        // Save to API for authenticated users (non-local projects)
        const savedProject = await projectsAPI.updateProject(currentProject.id, updatedProject);
        const normalized = normalizeProject(savedProject);
        setCurrentProject(normalized);
        setProjects(prev => prev.map(p => p.id === normalized.id ? normalized : p));
      } else {
        // Save to localStorage
        saveProjectToLocalStorage(updatedProject);
        setCurrentProject(updatedProject);
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      }

      showSuccess('Project saved');
    } catch (error) {
      console.error('Failed to save project:', error);
      showError('Failed to save project');
      throw error;
    }
  }, [currentProject, isAuthenticated, showError, showSuccess]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    if (!id) {
      showError('Cannot delete project: Project ID is missing');
      return;
    }

    try {
      const projectToDelete = projects.find(p => p.id === id);
      
      if (projectToDelete?.isLocal || !isAuthenticated || !isApiAvailable()) {
        // Delete from localStorage
        deleteLocalStorageProject(id);
      } else {
        // Delete from API
        await projectsAPI.deleteProject(id);
      }

      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
      
      showSuccess('Project deleted');
    } catch (error) {
      console.error('Failed to delete project:', error);
      showError('Failed to delete project');
      throw error;
    }
  }, [projects, currentProject, isAuthenticated, showError, showSuccess]);

  // Migrate local projects to cloud when user logs in
  const migrateLocalProjectsToCloud = useCallback(async (): Promise<number> => {
    if (!isAuthenticated || !isApiAvailable()) {
      return 0;
    }

    try {
      const localProjects = getAllLocalStorageProjects();
      let migratedCount = 0;

      for (const localProject of localProjects) {
        try {
          // Create project in API
          const cloudProject = await projectsAPI.createProject({
            ...localProject,
            userId: user?.id || user?.email,
            isLocal: undefined // Remove local flag
          });

          // Delete from localStorage after successful migration
          deleteLocalStorageProject(localProject.id);
          migratedCount++;
        } catch (error) {
          console.error(`Failed to migrate project ${localProject.name}:`, error);
        }
      }

      // Reload projects from API
      const apiProjects = await projectsAPI.getProjects();
      setProjects(apiProjects);

      if (migratedCount > 0) {
        showSuccess(`Migrated ${migratedCount} project${migratedCount > 1 ? 's' : ''} to cloud`);
      }

      return migratedCount;
    } catch (error) {
      console.error('Failed to migrate projects:', error);
      showError('Failed to migrate projects to cloud');
      return 0;
    }
  }, [isAuthenticated, user, showError, showSuccess]);

  // Implement remaining methods (saveProjectImage, storeTemporaryImage, etc.)
  // These remain largely the same as the original implementation
  
  const clearProject = useCallback(() => {
    setCurrentProject(null);
  }, []);

  const getCurrentOrientation = useCallback((): 'portrait' | 'landscape' => {
    return currentProject?.currentOrientation || 'portrait';
  }, [currentProject]);

  const setOrientation = useCallback((orientation: 'portrait' | 'landscape') => {
    if (!currentProject) return;

    const updatedProject = {
      ...currentProject,
      currentOrientation: orientation
    };

    setCurrentProject(updatedProject);
  }, [currentProject]);

  const getOrientationData = useCallback((orientation?: 'portrait' | 'landscape'): OrientationData | null => {
    if (!currentProject) return null;
    const targetOrientation = orientation || getCurrentOrientation();
    return currentProject.orientations?.[targetOrientation] || null;
  }, [currentProject, getCurrentOrientation]);

  const saveOrientationData = useCallback(async (data: Partial<OrientationData>, orientation?: 'portrait' | 'landscape'): Promise<void> => {
    if (!currentProject) return;

    const targetOrientation = orientation || getCurrentOrientation();
    const currentOrientationData = getOrientationData(targetOrientation) || defaultOrientationData;
    
    const updatedOrientationData = {
      ...currentOrientationData,
      ...data
    };

    await saveProject({
      orientations: {
        ...currentProject.orientations,
        [targetOrientation]: updatedOrientationData
      }
    });
  }, [currentProject, getCurrentOrientation, getOrientationData, saveProject]);

  const saveProjectWithOrientation = useCallback(async (
    projectUpdates: Partial<Project>, 
    orientationData?: Partial<OrientationData>, 
    orientation?: 'portrait' | 'landscape'
  ): Promise<void> => {
    if (!currentProject) return;

    const targetOrientation = orientation || getCurrentOrientation();
    let updates = { ...projectUpdates };

    if (orientationData) {
      const currentOrientationData = getOrientationData(targetOrientation) || defaultOrientationData;
      updates.orientations = {
        ...currentProject.orientations,
        [targetOrientation]: {
          ...currentOrientationData,
          ...orientationData
        }
      };
    }

    await saveProject(updates);
  }, [currentProject, getCurrentOrientation, getOrientationData, saveProject]);

  const saveProjectImage = useCallback(async (file: File, orientation?: 'portrait' | 'landscape'): Promise<void> => {
    // Implementation would handle both R2 upload for authenticated users
    // and IndexedDB storage for non-authenticated users
    // For now, this is a placeholder
    showWarning('Image upload implementation needed');
  }, [showWarning]);

  const storeTemporaryImage = useCallback(async (file: File, orientation?: 'portrait' | 'landscape'): Promise<string> => {
    // Create a temporary URL for the image
    return URL.createObjectURL(file);
  }, []);

  const value: ProjectContextType = {
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
    saveProjectWithOrientation,
    isLoading,
    migrateLocalProjectsToCloud
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};