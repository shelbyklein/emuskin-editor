// LocalStorage utilities for non-authenticated users - Minimal storage format
import { ControlMapping, Device, Console, ScreenMapping } from '../types';

const STORAGE_PREFIX = 'emuskin_local_project_';
const PROJECTS_INDEX_KEY = 'emuskin_local_projects_index';

// Minimal storage format - stores only what's needed for export
interface MinimalOrientationData {
  controls: ControlMapping[];
  screens: ScreenMapping[];
  backgroundImageDataURL?: string; // Direct base64 storage
  menuInsetsEnabled?: boolean;
  menuInsetsBottom?: number;
  menuInsetsLeft?: number;
  menuInsetsRight?: number;
}

// Minimal project format for localStorage - no UI state or metadata
interface MinimalStoredProject {
  id: string;
  name: string;
  identifier: string;
  gameTypeIdentifier: string; // Instead of full Console object
  debug?: boolean;
  mappingSize: { width: number; height: number }; // Instead of full Device object
  orientations?: {
    portrait?: MinimalOrientationData;
    landscape?: MinimalOrientationData;
  };
}

// Full project interface for app usage (includes reconstructed objects)
interface LocalProject {
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
  debug?: boolean;
}

interface OrientationData {
  controls: ControlMapping[];
  screens: ScreenMapping[];
  backgroundImage: {
    fileName?: string;
    url: string | null;
    hasStoredImage?: boolean;
    dataURL?: string;
  } | null;
  menuInsetsEnabled?: boolean;
  menuInsetsBottom?: number;
  menuInsetsLeft?: number;
  menuInsetsRight?: number;
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

// Convert full project to minimal storage format
const convertToMinimalProject = (project: LocalProject): MinimalStoredProject => {
  const minimal: MinimalStoredProject = {
    id: project.id,
    name: project.name,
    identifier: project.identifier,
    gameTypeIdentifier: project.console?.gameTypeIdentifier || '',
    debug: project.debug,
    mappingSize: {
      width: project.device?.logicalWidth || 0,
      height: project.device?.logicalHeight || 0
    }
  };

  // Convert orientations to minimal format
  if (project.orientations) {
    minimal.orientations = {};
    
    if (project.orientations.portrait) {
      const portrait = project.orientations.portrait;
      minimal.orientations.portrait = {
        controls: portrait.controls,
        screens: portrait.screens,
        backgroundImageDataURL: portrait.backgroundImage?.dataURL,
        menuInsetsEnabled: portrait.menuInsetsEnabled,
        menuInsetsBottom: portrait.menuInsetsBottom,
        menuInsetsLeft: portrait.menuInsetsLeft,
        menuInsetsRight: portrait.menuInsetsRight
      };
    }
    
    if (project.orientations.landscape) {
      const landscape = project.orientations.landscape;
      minimal.orientations.landscape = {
        controls: landscape.controls,
        screens: landscape.screens,
        backgroundImageDataURL: landscape.backgroundImage?.dataURL,
        menuInsetsEnabled: landscape.menuInsetsEnabled,
        menuInsetsBottom: landscape.menuInsetsBottom,
        menuInsetsLeft: landscape.menuInsetsLeft,
        menuInsetsRight: landscape.menuInsetsRight
      };
    }
  }

  return minimal;
};

// Save a project to localStorage using minimal format
export const saveProjectToLocalStorage = (project: LocalProject): void => {
  try {
    const projectKey = `${STORAGE_PREFIX}${project.id}`;
    const minimalProject = convertToMinimalProject(project);
    localStorage.setItem(projectKey, JSON.stringify(minimalProject));
    
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

// Convert minimal stored project back to full project format
const convertFromMinimalProject = async (minimal: MinimalStoredProject): Promise<LocalProject> => {
  // We'll need to reconstruct Console and Device objects from the stored identifiers
  // This will be handled by the ProjectContext which has access to the lookup data
  
  const project: LocalProject = {
    id: minimal.id,
    name: minimal.name,
    identifier: minimal.identifier,
    console: null, // Will be reconstructed by ProjectContext
    device: null, // Will be reconstructed by ProjectContext  
    debug: minimal.debug,
    lastModified: Date.now(),
    availableOrientations: [],
    currentOrientation: 'portrait',
    hasBeenConfigured: true
  };

  // Convert orientations back to full format
  if (minimal.orientations) {
    project.orientations = {};
    project.availableOrientations = [];
    
    if (minimal.orientations.portrait) {
      const minPortrait = minimal.orientations.portrait;
      project.orientations.portrait = {
        controls: minPortrait.controls,
        screens: minPortrait.screens,
        backgroundImage: minPortrait.backgroundImageDataURL ? {
          fileName: 'background.png',
          url: null, // Will be generated on-demand if needed
          hasStoredImage: true,
          dataURL: minPortrait.backgroundImageDataURL
        } : null,
        menuInsetsEnabled: minPortrait.menuInsetsEnabled,
        menuInsetsBottom: minPortrait.menuInsetsBottom,
        menuInsetsLeft: minPortrait.menuInsetsLeft,
        menuInsetsRight: minPortrait.menuInsetsRight
      };
      project.availableOrientations.push('portrait');
    }
    
    if (minimal.orientations.landscape) {
      const minLandscape = minimal.orientations.landscape;
      project.orientations.landscape = {
        controls: minLandscape.controls,
        screens: minLandscape.screens,
        backgroundImage: minLandscape.backgroundImageDataURL ? {
          fileName: 'background.png',
          url: null, // Will be generated on-demand if needed
          hasStoredImage: true,
          dataURL: minLandscape.backgroundImageDataURL
        } : null,
        menuInsetsEnabled: minLandscape.menuInsetsEnabled,
        menuInsetsBottom: minLandscape.menuInsetsBottom,
        menuInsetsLeft: minLandscape.menuInsetsLeft,
        menuInsetsRight: minLandscape.menuInsetsRight
      };
      project.availableOrientations.push('landscape');
    }
  }
  
  return project;
};

// Export the stored project data for reconstruction by ProjectContext
export const getStoredProjectData = (id: string): MinimalStoredProject | null => {
  try {
    const projectKey = `${STORAGE_PREFIX}${id}`;
    const projectJson = localStorage.getItem(projectKey);
    if (!projectJson) return null;
    
    return JSON.parse(projectJson);
  } catch (error) {
    console.error('Failed to get stored project data:', error);
    return null;
  }
};

// Load a specific project from localStorage (returns minimal format)
export const loadProjectFromLocalStorage = (id: string): LocalProject | null => {
  const storedData = getStoredProjectData(id);
  if (!storedData) return null;
  
  try {
    // Convert from minimal format - Console/Device reconstruction will be handled by ProjectContext
    return convertFromMinimalProject(storedData).then(project => project).catch(() => null);
  } catch (error) {
    console.error('Failed to load project from localStorage:', error);
    return null;
  }
};

// Async version for proper conversion
export const loadProjectFromLocalStorageAsync = async (id: string): Promise<LocalProject | null> => {
  const storedData = getStoredProjectData(id);
  if (!storedData) return null;
  
  try {
    return await convertFromMinimalProject(storedData);
  } catch (error) {
    console.error('Failed to load project from localStorage:', error);
    return null;
  }
};

// Get all projects from localStorage (returns stored data for reconstruction)
export const getAllLocalStorageProjectsData = (): MinimalStoredProject[] => {
  try {
    const ids = getProjectIds();
    const projects: MinimalStoredProject[] = [];
    
    for (const id of ids) {
      const storedData = getStoredProjectData(id);
      if (storedData) {
        projects.push(storedData);
      }
    }
    
    return projects;
  } catch (error) {
    console.error('Failed to get all projects from localStorage:', error);
    return [];
  }
};

// Legacy function for backward compatibility - will be updated by ProjectContext
export const getAllLocalStorageProjects = (): LocalProject[] => {
  // This will be handled by ProjectContext with proper async reconstruction
  return [];
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