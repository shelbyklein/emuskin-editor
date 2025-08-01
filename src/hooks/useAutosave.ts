// Hook for autosaving project changes
import { useEffect, useRef } from 'react';
import { useProject } from '../contexts/ProjectContextV2';

interface AutosaveOptions {
  delay?: number; // Delay in milliseconds before saving (default: 2000)
  enabled?: boolean; // Whether autosave is enabled (default: true)
}

interface AutosaveData {
  controls?: any[];
  screens?: any[];
  menuInsetsEnabled?: boolean;
  menuInsetsBottom?: number;
  skinName?: string;
  skinIdentifier?: string;
}

export function useAutosave(
  data: AutosaveData,
  options: AutosaveOptions = {}
) {
  const { delay = 2000, enabled = true } = options;
  const { currentProject, saveProject, saveProjectWithOrientation } = useProject();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  
  useEffect(() => {
    if (!enabled || !currentProject) return;
    
    // Convert data to string for comparison
    const dataString = JSON.stringify(data);
    
    // Skip if data hasn't changed
    if (dataString === lastSavedDataRef.current) return;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for autosave
    timeoutRef.current = setTimeout(() => {
      console.log('Autosaving project...');
      
      // Save project and orientation data
      const projectData = {
        name: data.skinName || currentProject.name,
        identifier: data.skinIdentifier || currentProject.identifier
      };
      
      const orientationData = {
        controls: data.controls || [],
        screens: data.screens || [],
        menuInsetsEnabled: data.menuInsetsEnabled,
        menuInsetsBottom: data.menuInsetsBottom
      };
      
      saveProjectWithOrientation(projectData, orientationData);
      lastSavedDataRef.current = dataString;
    }, delay);
    
    // Cleanup on unmount or when data changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, currentProject, saveProjectWithOrientation]);
  
  // Save immediately on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        // Save immediately if there are pending changes
        const dataString = JSON.stringify(data);
        if (dataString !== lastSavedDataRef.current && currentProject) {
          console.log('Autosaving on unmount...');
          saveProject({});
        }
      }
    };
  }, []);
}