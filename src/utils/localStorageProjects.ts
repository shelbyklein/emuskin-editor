// LocalStorage utilities for non-authenticated users
import { ControlMapping, Device, Console, ScreenMapping } from '../types';

const STORAGE_PREFIX = 'emuskin_local_project_';
const PROJECTS_INDEX_KEY = 'emuskin_local_projects_index';

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

interface LocalProject {
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
  isLocal?: boolean; // Flag to indicate this is a local project
}

// Get all localStorage project IDs
const getProjectIds = (): string[] => {
  try {
    const indexJson = localStorage.getItem(PROJECTS_INDEX_KEY);
    return indexJson ? JSON.parse(indexJson) : [];
  } catch (error) {
    console.error('Failed to get project IDs from localStorage:', error);
    return [];
  }
};

// Update the project IDs index
const updateProjectIds = (ids: string[]): void => {
  try {
    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Failed to update project IDs in localStorage:', error);
  }
};

// Save a project to localStorage
export const saveProjectToLocalStorage = (project: LocalProject): void => {
  try {
    const projectKey = `${STORAGE_PREFIX}${project.id}`;
    const projectData = { ...project, isLocal: true };
    localStorage.setItem(projectKey, JSON.stringify(projectData));
    
    // Update the index
    const ids = getProjectIds();
    if (!ids.includes(project.id)) {
      ids.push(project.id);
      updateProjectIds(ids);
    }
  } catch (error) {
    console.error('Failed to save project to localStorage:', error);
    throw new Error('Failed to save project locally. Storage may be full.');
  }
};

// Load a specific project from localStorage
export const loadProjectFromLocalStorage = (id: string): LocalProject | null => {
  try {
    const projectKey = `${STORAGE_PREFIX}${id}`;
    const projectJson = localStorage.getItem(projectKey);
    if (!projectJson) return null;
    
    const project = JSON.parse(projectJson);
    return { ...project, isLocal: true };
  } catch (error) {
    console.error('Failed to load project from localStorage:', error);
    return null;
  }
};

// Get all projects from localStorage
export const getAllLocalStorageProjects = (): LocalProject[] => {
  try {
    const ids = getProjectIds();
    const projects: LocalProject[] = [];
    
    for (const id of ids) {
      const project = loadProjectFromLocalStorage(id);
      if (project) {
        projects.push(project);
      }
    }
    
    // Sort by lastModified, newest first
    return projects.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
  } catch (error) {
    console.error('Failed to get all projects from localStorage:', error);
    return [];
  }
};

// Delete a project from localStorage
export const deleteLocalStorageProject = (id: string): void => {
  try {
    const projectKey = `${STORAGE_PREFIX}${id}`;
    localStorage.removeItem(projectKey);
    
    // Update the index
    const ids = getProjectIds().filter(projectId => projectId !== id);
    updateProjectIds(ids);
  } catch (error) {
    console.error('Failed to delete project from localStorage:', error);
    throw new Error('Failed to delete project');
  }
};

// Clear all localStorage projects
export const clearAllLocalStorageProjects = (): void => {
  try {
    const ids = getProjectIds();
    
    // Remove all project data
    for (const id of ids) {
      const projectKey = `${STORAGE_PREFIX}${id}`;
      localStorage.removeItem(projectKey);
    }
    
    // Clear the index
    localStorage.removeItem(PROJECTS_INDEX_KEY);
  } catch (error) {
    console.error('Failed to clear all projects from localStorage:', error);
  }
};

// Check if localStorage is available and has space
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = 'emuskin_test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

// Estimate remaining localStorage space (rough estimate)
export const estimateLocalStorageSpace = (): { used: number; available: boolean } => {
  try {
    let totalSize = 0;
    
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    // localStorage typically has 5-10MB limit
    // We'll assume 5MB (5,242,880 bytes) as a conservative estimate
    const limit = 5 * 1024 * 1024;
    const percentUsed = (totalSize / limit) * 100;
    
    return {
      used: percentUsed,
      available: percentUsed < 90 // Consider it available if less than 90% used
    };
  } catch (error) {
    return { used: 0, available: true };
  }
};