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
  backgroundImage?: {
    fileName?: string;
    url: string | null;
    hasStoredImage?: boolean;
  } | null;
}

export function useAutosave(
  data: AutosaveData,
  options: AutosaveOptions = {}
) {
  const { delay = 2000, enabled = true } = options;
  const { currentProject, saveProjectWithOrientation } = useProject();
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
      console.log('=== AUTOSAVE TRIGGERED ===');
      
      // Save project and orientation data
      const projectData = {
        name: data.skinName || currentProject.name,
        identifier: data.skinIdentifier || currentProject.identifier
      };
      
      const orientationData = {
        controls: data.controls || [],
        screens: data.screens || [],
        menuInsetsEnabled: data.menuInsetsEnabled,
        menuInsetsBottom: data.menuInsetsBottom,
        backgroundImage: data.backgroundImage || null
      };
      
      console.log('Autosave - Project data:', projectData);
      console.log('Autosave - Orientation data:', {
        numControls: orientationData.controls.length,
        numScreens: orientationData.screens.length,
        menuInsetsEnabled: orientationData.menuInsetsEnabled,
        menuInsetsBottom: orientationData.menuInsetsBottom,
        hasBackgroundImage: !!orientationData.backgroundImage?.url
      });
      
      saveProjectWithOrientation(projectData, orientationData);
      lastSavedDataRef.current = dataString;
      console.log('Autosave complete');
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
          
          // Save project and orientation data
          const projectData = {
            name: data.skinName || currentProject.name,
            identifier: data.skinIdentifier || currentProject.identifier
          };
          
          const orientationData = {
            controls: data.controls || [],
            screens: data.screens || [],
            menuInsetsEnabled: data.menuInsetsEnabled,
            menuInsetsBottom: data.menuInsetsBottom,
            backgroundImage: data.backgroundImage || null
          };
          
          saveProjectWithOrientation(projectData, orientationData);
        }
      }
    };
  }, [data, currentProject, saveProjectWithOrientation]);
}