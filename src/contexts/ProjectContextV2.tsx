// Project context v2 - using minimal save format
import React, { createContext, useContext, ReactNode, useEffect, useCallback, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ControlMapping, Device, Console, ScreenMapping } from '../types';
import { MinimalProject } from '../types/SaveFormat';
import { toMinimalProject, fromMinimalProject } from '../utils/projectConverter';
import { userDatabase } from '../utils/userDatabase';
import { useAuth } from './AuthContext';

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
  // Store minimal projects in localStorage
  const [minimalProjects, setMinimalProjects] = useLocalStorage<MinimalProject[]>('emuskin-projects-v2', []);
  const [currentProjectId, setCurrentProjectId] = useLocalStorage<string | null>('emuskin-current-project-v2', null);
  
  // Keep full projects in memory
  const [projects, setProjects] = useState<Project[]>([]);
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  
  // Get current user from auth context
  const { user } = useAuth();

  // Load consoles/devices
  useEffect(() => {
    // Load consoles and devices
    const loadData = async () => {
      try {
        const [consolesRes, devicesRes] = await Promise.all([
          fetch('/assets/gameTypeIdentifiers.json'),
          fetch('/assets/iphone-sizes.json')
        ]);
        
        if (!consolesRes.ok || !devicesRes.ok) {
          throw new Error('Failed to load configuration files');
        }
        
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

  // Convert minimal projects to full projects when consoles/devices are available
  useEffect(() => {
    const loadProjects = async () => {
      if (consoles.length === 0 || devices.length === 0) {
        return;
      }
      
      const converted: Project[] = [];
      
      for (const minimal of minimalProjects) {
        const full = await fromMinimalProject(minimal, consoles, devices);
        if (full) {
          // R2 URLs are already stored in the project data
          converted.push(full);
        }
      }
      
      setProjects(converted);
    };
    
    loadProjects();
  }, [minimalProjects, consoles, devices]);

  const currentProject = projects.find(p => p.id === currentProjectId) || null;

  const createProject = (name: string, initialData?: Partial<Project>): string => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
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
      userId: user?.id,
      ...initialData
    };
    
    // Save to minimal format
    const minimal = toMinimalProject(newProject);
    if (minimal) {
      setMinimalProjects([...minimalProjects, minimal]);
      setCurrentProjectId(newProject.id);
      
      // Add project to user's database entry
      if (user?.email) {
        userDatabase.addProjectToUser(user.email, newProject.id);
        console.log(`Project ${newProject.id} added to user ${user.email} in database`);
      }
    }
    
    return newProject.id;
  };

  const loadProject = async (id: string) => {
    setCurrentProjectId(id);
  };

  const saveProject = (updates: Partial<Project>) => {
    if (!currentProject) {
      console.log('🚫 saveProject: No current project to save');
      return;
    }
    
    console.log('💾 saveProject called with updates:', Object.keys(updates));
    
    const updated = {
      ...currentProject,
      ...updates,
      lastModified: Date.now()
    };
    
    // Log orientation data if present
    if (updates.orientations) {
      const orientation = updated.currentOrientation || 'portrait';
      const orientationData = updates.orientations[orientation];
      if (orientationData) {
        console.log('📋 Orientation data being saved:', {
          orientation,
          controls: orientationData.controls?.length || 0,
          screens: orientationData.screens?.length || 0,
          hasBackgroundImage: !!orientationData.backgroundImage
        });
      }
    }
    
    // Convert to minimal and save
    const minimal = toMinimalProject(updated);
    if (minimal) {
      console.log('✅ Converted to minimal project:', minimal.id);
      setMinimalProjects(prev => {
        const index = prev.findIndex(p => p.id === minimal.id);
        if (index >= 0) {
          const newProjects = [...prev];
          newProjects[index] = minimal;
          console.log('✅ Updated existing project in storage');
          return newProjects;
        }
        console.log('❌ Project not found in storage - this should not happen!');
        return prev;
      });
    } else {
      console.log('❌ Failed to convert to minimal project');
    }
  };

  const saveProjectImage = async (_file: File, _orientation?: 'portrait' | 'landscape') => {
    if (!currentProjectId) {
      throw new Error('No current project to save image to');
    }
    
    // R2 is required - image upload is handled by Editor component
    console.log('saveProjectImage called - R2 upload should be handled by Editor component');
  };
  
  const storeTemporaryImage = async (file: File, _orientation?: 'portrait' | 'landscape') => {
    if (!currentProjectId) {
      throw new Error('No current project to store image for');
    }
    
    // Create a temporary URL for the file
    return URL.createObjectURL(file);
  };

  const deleteProject = async (id: string) => {
    // Remove project from storage
    setMinimalProjects(prev => prev.filter(p => p.id !== id));
    if (currentProjectId === id) {
      setCurrentProjectId(null);
    }
    
    // Remove project from user's database entry
    if (user?.email) {
      userDatabase.removeProjectFromUser(user.email, id);
      console.log(`Project ${id} removed from user ${user.email} in database`);
    }
  };

  const clearProject = () => {
    setCurrentProjectId(null);
  };

  const getCurrentOrientation = useCallback((): 'portrait' | 'landscape' => {
    return currentProject?.currentOrientation || 'portrait';
  }, [currentProject]);

  const setOrientation = useCallback((orientation: 'portrait' | 'landscape') => {
    if (currentProject) {
      saveProject({ currentOrientation: orientation });
    }
  }, [currentProject]);

  const getOrientationData = useCallback((orientation?: 'portrait' | 'landscape'): OrientationData | null => {
    if (!currentProject?.orientations) return null;
    const targetOrientation = orientation || getCurrentOrientation();
    return currentProject.orientations[targetOrientation] || null;
  }, [currentProject, getCurrentOrientation]);

  const saveOrientationData = useCallback((data: Partial<OrientationData>, orientation?: 'portrait' | 'landscape') => {
    if (!currentProject?.orientations) return;
    
    const targetOrientation = orientation || getCurrentOrientation();
    
    saveProject({
      orientations: {
        ...currentProject.orientations,
        [targetOrientation]: {
          ...currentProject.orientations[targetOrientation],
          ...data
        }
      }
    });
  }, [currentProject, getCurrentOrientation]);

  const saveProjectWithOrientation = useCallback((
    projectUpdates: Partial<Project>,
    orientationData?: Partial<OrientationData>,
    orientation?: 'portrait' | 'landscape'
  ) => {
    if (!currentProject) return;
    
    const targetOrientation = orientation || getCurrentOrientation();
    
    const updates: Partial<Project> = {
      ...projectUpdates
    };
    
    if (orientationData && currentProject.orientations) {
      updates.orientations = {
        ...currentProject.orientations,
        [targetOrientation]: {
          ...currentProject.orientations[targetOrientation],
          ...orientationData
        }
      };
    }
    
    saveProject(updates);
  }, [currentProject, getCurrentOrientation]);

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