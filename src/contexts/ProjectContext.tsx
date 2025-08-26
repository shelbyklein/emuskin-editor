// Project Context - Uses only localStorage for all project storage
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { ControlMapping, Device, Console, ScreenMapping } from '../types';
import { 
  saveProjectToLocalStorage, 
  loadProjectFromLocalStorage, 
  getAllLocalStorageProjects, 
  deleteLocalStorageProject,
  isLocalStorageAvailable 
} from '../utils/localStorageProjects';
import { fileToDataURL } from '../utils/imageUtils';
import { useToast } from './ToastContext';

interface OrientationData {
  controls: ControlMapping[];
  screens: ScreenMapping[];
  backgroundImage: {
    fileName?: string;
    url: string | null;
    hasStoredImage?: boolean;
    dataURL?: string; // For localStorage persistence
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
  debug?: boolean;
  orientations?: {
    portrait: OrientationData;
    landscape: OrientationData;
  };
  availableOrientations?: Array<'portrait' | 'landscape'>;
  currentOrientation?: 'portrait' | 'landscape';
  hasBeenConfigured?: boolean;
  lastModified: number;
  createdAt?: number;
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

  // Load projects from localStorage
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      try {
        if (isLocalStorageAvailable()) {
          const localProjects = getAllLocalStorageProjects();
          setProjects(localProjects);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        showError('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [showError]);

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
        debug: false,
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

      // Save to localStorage
      saveProjectToLocalStorage(newProject);
      setProjects(prev => [...prev, newProject]);
      setCurrentProject(newProject);
      
      return newProject.id;
    } catch (error) {
      console.error('Failed to create project:', error);
      showError('Failed to create project');
      throw error;
    }
  }, [showError]);

  const loadProject = useCallback(async (id: string): Promise<void> => {
    if (!id) {
      showError('Cannot load project: Project ID is missing');
      return;
    }

    setIsLoading(true);
    try {
      const project = loadProjectFromLocalStorage(id);

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
  }, [showError]);

  const saveProjectSilent = useCallback(async (updates: Partial<Project>): Promise<void> => {
    if (!currentProject) {
      throw new Error('No project to save');
    }

    try {
      const updatedProject = {
        ...currentProject,
        ...updates,
        lastModified: Date.now()
      };

      // Save to localStorage
      saveProjectToLocalStorage(updatedProject);
      setCurrentProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }, [currentProject]);

  const saveProject = useCallback(async (updates: Partial<Project>): Promise<void> => {
    try {
      await saveProjectSilent(updates);
      showSuccess('Project saved');
    } catch (error) {
      showError('Failed to save project');
      throw error;
    }
  }, [saveProjectSilent, showError, showSuccess]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    if (!id) {
      showError('Cannot delete project: Project ID is missing');
      return;
    }

    try {
      // Delete from localStorage
      deleteLocalStorageProject(id);
      
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
  }, [currentProject, showError, showSuccess]);


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

    await saveProjectSilent({
      orientations: {
        ...currentProject.orientations,
        [targetOrientation]: updatedOrientationData
      }
    });
  }, [currentProject, getCurrentOrientation, getOrientationData, saveProjectSilent]);

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
    if (!currentProject) return;
    
    try {
      // Convert file to data URL for localStorage storage
      const dataURL = await fileToDataURL(file);
      const targetOrientation = orientation || getCurrentOrientation();
      
      // Update the background image in orientation data
      const orientationData = getOrientationData(targetOrientation) || defaultOrientationData;
      const updatedOrientationData = {
        ...orientationData,
        backgroundImage: {
          fileName: file.name,
          url: URL.createObjectURL(file), // Blob URL for immediate display
          hasStoredImage: true,
          dataURL // Store the data URL for persistence
        }
      };
      
      await saveOrientationData(updatedOrientationData, targetOrientation);
      showSuccess('Image saved successfully');
    } catch (error) {
      console.error('Failed to save image:', error);
      showError('Failed to save image');
    }
  }, [currentProject, getCurrentOrientation, getOrientationData, saveOrientationData, showSuccess, showError]);

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
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};