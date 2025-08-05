// Simplified Project Context - Database Only (No Local Storage)
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { ControlMapping, Device, Console, ScreenMapping } from '../types';
import { useAuth } from './AuthContext';
import { projectsAPI, isApiAvailable } from '../utils/api';
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
  _id?: string; // MongoDB ID from API
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
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToast();

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
        
        setConsoles(consolesData);
        setDevices(devicesData);
      } catch (error) {
        console.error('Error loading console/device data:', error);
      }
    };
    
    loadData();
  }, []);

  // Load projects from API when user logs in
  useEffect(() => {
    const loadProjects = async () => {
      if (!isAuthenticated || !user?.email) {
        setProjects([]);
        setCurrentProject(null);
        return;
      }

      setIsLoading(true);
      try {
        const cloudProjects = await projectsAPI.getProjects();
        // Normalize MongoDB _id to id for consistency
        const normalizedProjects = cloudProjects.map(project => ({
          ...project,
          id: project.id || project._id,
          _id: project._id || project.id
        }));
        setProjects(normalizedProjects);
        console.log(`Loaded ${normalizedProjects.length} projects from database`);
      } catch (error) {
        console.error('Failed to load projects:', error);
        // Check if this is a development environment without MongoDB
        if (!import.meta.env.PROD) {
          console.log('Running in development mode without MongoDB configured');
          showError('Database not configured. Please set up MongoDB to save projects.');
        } else {
          showError('Failed to load projects. Please check your connection.');
        }
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [isAuthenticated, user?.email, showError]);

  const createProject = useCallback(async (name: string, initialData?: Partial<Project>): Promise<string> => {
    if (!isAuthenticated) {
      throw new Error('Must be logged in to create projects');
    }

    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newProject: Project = {
      id: projectId,
      name: name || 'Untitled Project',
      identifier: 'com.default.skin',
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
      userId: user?.id,
      ...initialData
    };

    try {
      const cloudProject = await projectsAPI.createProject({
        _id: newProject.id,
        ...newProject
      });
      
      // Normalize the project ID to ensure consistency
      const normalizedProject = {
        ...cloudProject,
        id: cloudProject.id || cloudProject._id,
        _id: cloudProject._id || cloudProject.id
      };
      
      setProjects(prev => [...prev, normalizedProject]);
      setCurrentProject(normalizedProject);
      showSuccess('Project created');
      return normalizedProject.id;
    } catch (error) {
      console.error('Failed to create project:', error);
      if (!import.meta.env.PROD) {
        showError('Cannot create project: Database not configured');
      } else {
        showError('Failed to create project. Please check your connection.');
      }
      throw error;
    }
  }, [isAuthenticated, user, showError, showSuccess]);

  const loadProject = useCallback(async (id: string) => {
    const project = projects.find(p => p.id === id || p._id === id);
    if (project) {
      // Ensure the project has both id and _id normalized
      const normalizedProject = {
        ...project,
        id: project.id || project._id,
        _id: project._id || project.id
      };
      setCurrentProject(normalizedProject);
    } else {
      // Try to load from API
      try {
        const cloudProject = await projectsAPI.getProject(id);
        // Normalize the project ID
        const normalizedProject = {
          ...cloudProject,
          id: cloudProject.id || cloudProject._id,
          _id: cloudProject._id || cloudProject.id
        };
        setCurrentProject(normalizedProject);
        setProjects(prev => [...prev.filter(p => p.id !== id && p._id !== id), normalizedProject]);
      } catch (error) {
        console.error('Failed to load project:', error);
        showError('Failed to load project');
      }
    }
  }, [projects, showError]);

  const saveProject = useCallback(async (updates: Partial<Project>) => {
    if (!currentProject) {
      console.error('No current project to save');
      return;
    }

    const updated = {
      ...currentProject,
      ...updates,
      lastModified: Date.now()
    };

    // Ensure we have a valid ID to use for the API call
    const projectId = updated.id || updated._id;
    if (!projectId) {
      console.error('No project ID found in current project:', currentProject);
      showError('Cannot save project: No project ID');
      return;
    }

    try {
      const cloudProject = await projectsAPI.updateProject(projectId, updated);
      
      // Normalize the response to ensure both id and _id exist
      const normalizedProject = {
        ...cloudProject,
        id: cloudProject.id || cloudProject._id,
        _id: cloudProject._id || cloudProject.id
      };
      
      setCurrentProject(normalizedProject);
      setProjects(prev => prev.map(p => 
        (p.id === normalizedProject.id || p._id === normalizedProject.id) ? normalizedProject : p
      ));
      console.log('Project saved to database');
    } catch (error) {
      console.error('Failed to save project:', error);
      if (!import.meta.env.PROD) {
        showError('Cannot save project: Database not configured');
      } else {
        showError('Failed to save project. Please check your connection.');
      }
      throw error;
    }
  }, [currentProject, showError]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await projectsAPI.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id && p._id !== id));
      if (currentProject?.id === id || currentProject?._id === id) {
        setCurrentProject(null);
      }
      showSuccess('Project deleted');
    } catch (error) {
      console.error('Failed to delete project:', error);
      if (!import.meta.env.PROD) {
        showError('Cannot delete project: Database not configured');
      } else {
        showError('Failed to delete project. Please check your connection.');
      }
      throw error;
    }
  }, [currentProject, showError, showSuccess]);

  const clearProject = useCallback(() => {
    setCurrentProject(null);
  }, []);

  const getCurrentOrientation = useCallback((): 'portrait' | 'landscape' => {
    return currentProject?.currentOrientation || 'portrait';
  }, [currentProject]);

  const setOrientation = useCallback((orientation: 'portrait' | 'landscape') => {
    if (!currentProject) return;
    
    saveProject({ currentOrientation: orientation });
  }, [currentProject, saveProject]);

  const getOrientationData = useCallback((orientation?: 'portrait' | 'landscape'): OrientationData | null => {
    if (!currentProject) return null;
    
    const targetOrientation = orientation || getCurrentOrientation();
    return currentProject.orientations?.[targetOrientation] || null;
  }, [currentProject, getCurrentOrientation]);

  const saveOrientationData = useCallback(async (data: Partial<OrientationData>, orientation?: 'portrait' | 'landscape') => {
    if (!currentProject) return;
    
    const targetOrientation = orientation || getCurrentOrientation();
    const currentOrientations = currentProject.orientations || {
      portrait: { ...defaultOrientationData },
      landscape: { ...defaultOrientationData }
    };
    
    await saveProject({
      orientations: {
        ...currentOrientations,
        [targetOrientation]: {
          ...currentOrientations[targetOrientation],
          ...data
        }
      }
    });
  }, [currentProject, getCurrentOrientation, saveProject]);

  const saveProjectWithOrientation = useCallback(async (
    projectUpdates: Partial<Project>,
    orientationData?: Partial<OrientationData>,
    orientation?: 'portrait' | 'landscape'
  ) => {
    if (!currentProject) return;
    
    const targetOrientation = orientation || getCurrentOrientation();
    const currentOrientations = currentProject.orientations || {
      portrait: { ...defaultOrientationData },
      landscape: { ...defaultOrientationData }
    };
    
    const updates: Partial<Project> = {
      ...projectUpdates
    };
    
    if (orientationData) {
      updates.orientations = {
        ...currentOrientations,
        [targetOrientation]: {
          ...currentOrientations[targetOrientation],
          ...orientationData
        }
      };
    }
    
    await saveProject(updates);
  }, [currentProject, getCurrentOrientation, saveProject]);

  const saveProjectImage = useCallback(async (_file: File, _orientation?: 'portrait' | 'landscape') => {
    // Images are handled by the Editor component with R2 storage
    console.log('saveProjectImage called - R2 upload should be handled by Editor component');
  }, []);

  const storeTemporaryImage = useCallback(async (file: File, _orientation?: 'portrait' | 'landscape') => {
    // Create a temporary URL for the file
    return URL.createObjectURL(file);
  }, []);

  const value: ProjectContextType = {
    currentProject,
    projects,
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    clearProject,
    getCurrentOrientation,
    setOrientation,
    getOrientationData,
    saveOrientationData,
    saveProjectWithOrientation,
    saveProjectImage,
    storeTemporaryImage,
    isLoading
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};