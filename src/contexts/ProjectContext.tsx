// Project context for managing skin projects with local storage
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ControlMapping, Device, Console, ScreenMapping } from '../types';
import { indexedDBManager } from '../utils/indexedDB';

interface Project {
  id: string;
  name: string;
  identifier: string;
  console: Console | null;
  device: Device | null;
  controls: ControlMapping[];
  screens: ScreenMapping[];
  backgroundImage: {
    fileName?: string;
    url: string | null;
    hasStoredImage?: boolean; // Flag to indicate if image is in IndexedDB
  } | null;
  lastModified: number;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  createProject: (name: string) => string;
  loadProject: (id: string) => void;
  saveProject: (updates: Partial<Project>) => void;
  saveProjectImage: (file: File) => Promise<void>;
  deleteProject: (id: string) => void;
  clearProject: () => void;
}

const defaultProject: Project = {
  id: '',
  name: 'Untitled Skin',
  identifier: 'com.playcase.default.skin',
  console: null,
  device: null,
  controls: [],
  screens: [],
  backgroundImage: null,
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

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useLocalStorage<Project[]>('emuskin-projects', []);
  const [currentProjectId, setCurrentProjectId] = useLocalStorage<string | null>('emuskin-current-project', null);

  const currentProject = projects.find(p => p.id === currentProjectId) || null;

  // Initialize IndexedDB on mount
  useEffect(() => {
    indexedDBManager.init().catch(console.error);
    // Clean up old images periodically
    indexedDBManager.clearOldImages(30).catch(console.error);
  }, []);

  const createProject = (name: string): string => {
    const newProject: Project = {
      ...defaultProject,
      id: `project-${Date.now()}`,
      name,
      lastModified: Date.now()
    };
    
    setProjects(prev => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
    return newProject.id;
  };

  const loadProject = async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setCurrentProjectId(id);
      
      // Load image from IndexedDB if it exists
      if (project.backgroundImage?.hasStoredImage) {
        try {
          const storedImage = await indexedDBManager.getImage(id);
          if (storedImage) {
            // Update the project with the restored image URL
            setProjects(prev => prev.map(p => {
              if (p.id === id) {
                return {
                  ...p,
                  backgroundImage: {
                    ...p.backgroundImage!,
                    url: storedImage.url
                  }
                };
              }
              return p;
            }));
          }
        } catch (error) {
          console.error('Failed to load image from IndexedDB:', error);
        }
      }
    }
  };

  const saveProject = (updates: Partial<Project>) => {
    if (!currentProjectId) return;

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
  };

  const saveProjectImage = async (file: File) => {
    if (!currentProjectId) return;
    
    try {
      // Store image in IndexedDB
      const url = await indexedDBManager.storeImage(currentProjectId, file);
      
      // Update project with new image info
      setProjects(prev => prev.map(project => {
        if (project.id === currentProjectId) {
          return {
            ...project,
            backgroundImage: {
              fileName: file.name,
              url,
              hasStoredImage: true
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
  };

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

  return (
    <ProjectContext.Provider value={{
      currentProject,
      projects,
      createProject,
      loadProject,
      saveProject,
      saveProjectImage,
      deleteProject,
      clearProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
};