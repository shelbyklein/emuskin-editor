// Project context for managing skin projects with local storage
import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ControlMapping, Device, Console } from '../types';

interface Project {
  id: string;
  name: string;
  identifier: string;
  console: Console | null;
  device: Device | null;
  controls: ControlMapping[];
  backgroundImage: {
    fileName?: string;
    url: string | null;
  } | null;
  lastModified: number;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  createProject: (name: string) => string;
  loadProject: (id: string) => void;
  saveProject: (updates: Partial<Project>) => void;
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

  const loadProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setCurrentProjectId(id);
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

  const deleteProject = (id: string) => {
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
      deleteProject,
      clearProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
};