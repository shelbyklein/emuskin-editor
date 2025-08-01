// Custom hook for managing minimal project storage
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { MinimalProject } from '../types/SaveFormat';
import { Console, Device } from '../types';
import { toMinimalProject, fromMinimalProject } from '../utils/projectConverter';

interface Project {
  id: string;
  name: string;
  identifier: string;
  console: Console | null;
  device: Device | null;
  orientations?: any;
  currentOrientation?: 'portrait' | 'landscape';
  hasBeenConfigured?: boolean;
  lastModified: number;
}

export function useMinimalProjectStorage(
  consoles: Console[],
  devices: Device[]
) {
  // Store minimal projects in localStorage
  const [minimalProjects, setMinimalProjects] = useLocalStorage<MinimalProject[]>('emuskin-projects-v2', []);
  const [currentProjectId, setCurrentProjectId] = useLocalStorage<string | null>('emuskin-current-project-v2', null);
  
  // Keep full projects in memory only
  const [fullProjects, setFullProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Convert minimal projects to full projects on load
  useEffect(() => {
    const loadProjects = async () => {
      if (consoles.length === 0 || devices.length === 0) {
        return; // Wait for consoles and devices to load
      }
      
      setIsLoading(true);
      const converted: Project[] = [];
      
      for (const minimal of minimalProjects) {
        const full = await fromMinimalProject(minimal, consoles, devices);
        if (full) {
          converted.push(full);
        }
      }
      
      setFullProjects(converted);
      setIsLoading(false);
    };
    
    loadProjects();
  }, [minimalProjects, consoles, devices]);
  
  // Save a project (convert to minimal format)
  const saveProject = useCallback((project: Project) => {
    const minimal = toMinimalProject(project);
    if (!minimal) {
      console.error('Could not convert project to minimal format:', project);
      return;
    }
    
    setMinimalProjects(prev => {
      const index = prev.findIndex(p => p.id === minimal.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = minimal;
        return updated;
      } else {
        return [...prev, minimal];
      }
    });
  }, [setMinimalProjects]);
  
  // Delete a project
  const deleteProject = useCallback((id: string) => {
    setMinimalProjects(prev => prev.filter(p => p.id !== id));
    if (currentProjectId === id) {
      setCurrentProjectId(null);
    }
  }, [setMinimalProjects, currentProjectId, setCurrentProjectId]);
  
  // Get current project
  const currentProject = fullProjects.find(p => p.id === currentProjectId) || null;
  
  return {
    projects: fullProjects,
    currentProject,
    currentProjectId,
    setCurrentProjectId,
    saveProject,
    deleteProject,
    isLoading
  };
}