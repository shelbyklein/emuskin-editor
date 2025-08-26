// Custom hook to handle project loading/saving logic and sync with ProjectContext
import { useCallback, useEffect, useRef } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { ControlMapping, ScreenMapping } from '../types';
import { useToast } from '../contexts/ToastContext';

interface ProjectSyncState {
  skinName: string;
  skinIdentifier: string;
  debug: boolean;
  controls: ControlMapping[];
  screens: ScreenMapping[];
  menuInsetsEnabled: boolean;
  menuInsetsBottom: number;
  menuInsetsLeft: number;
  menuInsetsRight: number;
}

interface UseProjectSyncProps {
  state: ProjectSyncState;
  onStateUpdate: (updates: Partial<ProjectSyncState>) => void;
}

export function useProjectSync({ state, onStateUpdate }: UseProjectSyncProps) {
  const {
    currentProject,
    saveProject,
    saveProjectWithOrientation,
    saveOrientationData,
    getOrientationData,
    getCurrentOrientation,
    createProject,
    loadProject,
    isLoading: isProjectsLoading
  } = useProject();
  
  const { showSuccess, showError } = useToast();
  
  // Refs to prevent unnecessary re-syncs
  const isSavingRef = useRef(false);
  const previouslySavingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Auto-create project if none exists (since we removed the Home screen)
  useEffect(() => {
    if (!currentProject && !isProjectsLoading && !hasInitializedRef.current) {
      console.log('📝 Auto-creating new project since none exists');
      createProject('New Skin');
      hasInitializedRef.current = true;
    }
  }, [currentProject, isProjectsLoading, createProject]);

  // Main project loading effect - consolidates the complex 300+ line useEffect
  useEffect(() => {
    if (!currentProject || hasInitializedRef.current) return;

    console.log('🔄 Loading project data:', currentProject.name);

    // Load basic project data
    onStateUpdate({
      skinName: currentProject.name || '',
      skinIdentifier: currentProject.identifier || 'com.playcase.default.skin',
      debug: currentProject.debug || false
    });

    // Load orientation-specific data
    const orientationData = getOrientationData();
    if (orientationData) {
      onStateUpdate({
        controls: orientationData.controls || [],
        screens: orientationData.screens || [],
        menuInsetsEnabled: orientationData.menuInsetsEnabled || false,
        menuInsetsBottom: orientationData.menuInsetsBottom || 0,
        menuInsetsLeft: orientationData.menuInsetsLeft || 0,
        menuInsetsRight: orientationData.menuInsetsRight || 0
      });
    }

    hasInitializedRef.current = true;
    console.log('✅ Project loaded successfully');
  }, [currentProject, getOrientationData, onStateUpdate]);

  // Sync project name and identifier changes back to project
  useEffect(() => {
    if (!currentProject || isSavingRef.current || !hasInitializedRef.current) return;

    const hasNameChanged = currentProject.name !== state.skinName;
    const hasIdentifierChanged = currentProject.identifier !== state.skinIdentifier;
    const hasDebugChanged = currentProject.debug !== state.debug;

    if (hasNameChanged || hasIdentifierChanged || hasDebugChanged) {
      console.log('📝 Syncing project metadata changes');
      saveProject({
        name: state.skinName,
        identifier: state.skinIdentifier,
        debug: state.debug
      });
    }
  }, [currentProject, state.skinName, state.skinIdentifier, state.debug, saveProject]);

  // Handle save completion sync
  useEffect(() => {
    const wasJustSaving = previouslySavingRef.current && !isSavingRef.current;
    if (wasJustSaving && currentProject) {
      console.log('💾 Save completed, syncing final state');
      onStateUpdate({
        skinName: currentProject.name || '',
        skinIdentifier: currentProject.identifier || ''
      });
    }
    previouslySavingRef.current = isSavingRef.current;
  }, [currentProject, onStateUpdate]);

  // Save orientation data to project
  const saveCurrentState = useCallback(async () => {
    if (!currentProject) return;

    isSavingRef.current = true;
    try {
      await saveOrientationData({
        controls: state.controls,
        screens: state.screens,
        menuInsetsEnabled: state.menuInsetsEnabled,
        menuInsetsBottom: state.menuInsetsBottom,
        menuInsetsLeft: state.menuInsetsLeft,
        menuInsetsRight: state.menuInsetsRight
      });
      
      await saveProject({
        name: state.skinName,
        identifier: state.skinIdentifier,
        debug: state.debug
      });

      showSuccess('Project saved successfully');
    } catch (error) {
      console.error('Failed to save project:', error);
      showError('Failed to save project');
    } finally {
      isSavingRef.current = false;
    }
  }, [
    currentProject,
    state,
    saveOrientationData,
    saveProject,
    showSuccess,
    showError
  ]);

  // Save with both project and orientation updates
  const saveProjectAndOrientation = useCallback(async (
    projectUpdates: any,
    orientationUpdates?: any
  ) => {
    if (!currentProject) return;

    isSavingRef.current = true;
    try {
      await saveProjectWithOrientation(projectUpdates, orientationUpdates);
      showSuccess('Project saved successfully');
    } catch (error) {
      console.error('Failed to save project and orientation:', error);
      showError('Failed to save project');
    } finally {
      isSavingRef.current = false;
    }
  }, [currentProject, saveProjectWithOrientation, showSuccess, showError]);

  // Quick save for frequent updates (controls, screens)
  const quickSave = useCallback(async (orientationUpdates: any) => {
    if (!currentProject) return;

    try {
      await saveOrientationData(orientationUpdates);
    } catch (error) {
      console.error('Failed to quick save:', error);
    }
  }, [currentProject, saveOrientationData]);

  return {
    currentProject,
    isProjectsLoading,
    saveCurrentState,
    saveProjectAndOrientation,
    quickSave,
    loadProject,
    createProject,
    getCurrentOrientation,
    getOrientationData,
    isSaving: isSavingRef.current
  };
}