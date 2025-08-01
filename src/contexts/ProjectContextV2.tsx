// Project context v2 - using minimal save format
import React, { createContext, useContext, ReactNode, useEffect, useCallback, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ControlMapping, Device, Console, ScreenMapping } from '../types';
import { indexedDBManager } from '../utils/indexedDB';
import { MinimalProject } from '../types/SaveFormat';
import { toMinimalProject, fromMinimalProject } from '../utils/projectConverter';

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
  currentOrientation?: 'portrait' | 'landscape';
  hasBeenConfigured?: boolean;
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

  // Initialize IndexedDB and load consoles/devices
  useEffect(() => {
    indexedDBManager.init().catch(console.error);
    indexedDBManager.clearOldImages(30).catch(console.error);
    
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
          // Load background images from IndexedDB
          if (full.orientations) {
            for (const orientation of ['portrait', 'landscape'] as const) {
              const orientationData = full.orientations[orientation];
              if (orientationData.backgroundImage?.hasStoredImage) {
                try {
                  const storedImage = await indexedDBManager.getImage(`${full.id}-${orientation}`, 'background');
                  if (storedImage) {
                    orientationData.backgroundImage.url = storedImage.url;
                    orientationData.backgroundImage.fileName = storedImage.fileName;
                  }
                } catch (error) {
                  console.error(`Failed to load ${orientation} image for project ${full.id}:`, error);
                }
              }
            }
          }
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
      currentOrientation: 'portrait',
      hasBeenConfigured: false,
      lastModified: Date.now(),
      ...initialData
    };
    
    // Save to minimal format
    const minimal = toMinimalProject(newProject);
    if (minimal) {
      setMinimalProjects([...minimalProjects, minimal]);
      setCurrentProjectId(newProject.id);
    }
    
    return newProject.id;
  };

  const loadProject = async (id: string) => {
    setCurrentProjectId(id);
  };

  const saveProject = (updates: Partial<Project>) => {
    if (!currentProject) return;
    
    const updated = {
      ...currentProject,
      ...updates,
      lastModified: Date.now()
    };
    
    // Convert to minimal and save
    const minimal = toMinimalProject(updated);
    if (minimal) {
      setMinimalProjects(prev => {
        const index = prev.findIndex(p => p.id === minimal.id);
        if (index >= 0) {
          const newProjects = [...prev];
          newProjects[index] = minimal;
          return newProjects;
        }
        return prev;
      });
    }
  };

  const saveProjectImage = async (file: File, orientation?: 'portrait' | 'landscape') => {
    if (!currentProjectId) {
      throw new Error('No current project to save image to');
    }
    
    const targetOrientation = orientation || getCurrentOrientation();
    
    // Store image in IndexedDB
    const url = await indexedDBManager.storeImage(`${currentProjectId}-${targetOrientation}`, file, 'background');
    
    // Update orientation data
    saveOrientationData({
      backgroundImage: {
        fileName: file.name,
        url,
        hasStoredImage: true
      }
    }, targetOrientation);
  };
  
  const storeTemporaryImage = async (file: File, orientation?: 'portrait' | 'landscape') => {
    if (!currentProjectId) {
      throw new Error('No current project to store image for');
    }
    
    const targetOrientation = orientation || getCurrentOrientation();
    
    // Store image in IndexedDB but don't update project state
    const url = await indexedDBManager.storeImage(`${currentProjectId}-${targetOrientation}`, file, 'background');
    return url;
  };

  const deleteProject = async (id: string) => {
    // Delete images from IndexedDB
    try {
      await indexedDBManager.deleteProjectImages(id);
    } catch (error) {
      console.error('Failed to delete project images:', error);
    }
    
    setMinimalProjects(prev => prev.filter(p => p.id !== id));
    if (currentProjectId === id) {
      setCurrentProjectId(null);
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