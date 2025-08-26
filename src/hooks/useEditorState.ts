// Custom hook to consolidate Editor state management using useReducer
import { useReducer, useCallback } from 'react';
import { ControlMapping, ScreenMapping, Device, Console } from '../types';

interface EditorState {
  // Device/console selection
  selectedDevice: Device | null;
  selectedConsole: Console | null;

  // Skin metadata
  skinName: string;
  skinIdentifier: string;
  debug: boolean;

  // Controls/screens arrays
  controls: ControlMapping[];
  screens: ScreenMapping[];

  // UI panel states
  selectedControlIndex: number | null;
  selectedScreenIndex: number | null;
  isConfigPromptVisible: boolean;
  showProjectManager: boolean;
  showJsonPreview: boolean;

  // Menu insets configuration
  menuInsetsEnabled: boolean;
  menuInsetsBottom: number;
  menuInsetsLeft: number;
  menuInsetsRight: number;

  // Image handling
  uploadedImage: { file: File; url: string } | null;
  thumbstickImages: { [controlId: string]: string };
  thumbstickFiles: { [controlId: string]: File };

  // History tracking for undo/redo
  history: any[];
  historyIndex: number;

  // Grid and canvas settings
  showGrid: boolean;
  gridSize: number;
}

type EditorAction =
  | { type: 'SET_DEVICE'; payload: Device | null }
  | { type: 'SET_CONSOLE'; payload: Console | null }
  | { type: 'SET_SKIN_NAME'; payload: string }
  | { type: 'SET_SKIN_IDENTIFIER'; payload: string }
  | { type: 'SET_DEBUG'; payload: boolean }
  | { type: 'SET_CONTROLS'; payload: ControlMapping[] }
  | { type: 'SET_SCREENS'; payload: ScreenMapping[] }
  | { type: 'SET_SELECTED_CONTROL'; payload: number | null }
  | { type: 'SET_SELECTED_SCREEN'; payload: number | null }
  | { type: 'SET_CONFIG_PROMPT_VISIBLE'; payload: boolean }
  | { type: 'SET_SHOW_PROJECT_MANAGER'; payload: boolean }
  | { type: 'SET_SHOW_JSON_PREVIEW'; payload: boolean }
  | { type: 'SET_MENU_INSETS'; payload: { enabled?: boolean; bottom?: number; left?: number; right?: number } }
  | { type: 'SET_UPLOADED_IMAGE'; payload: { file: File; url: string } | null }
  | { type: 'SET_THUMBSTICK_IMAGES'; payload: { [controlId: string]: string } }
  | { type: 'SET_THUMBSTICK_FILES'; payload: { [controlId: string]: File } }
  | { type: 'SET_HISTORY'; payload: { history: any[]; index: number } }
  | { type: 'SET_GRID_SETTINGS'; payload: { showGrid?: boolean; gridSize?: number } }
  | { type: 'RESET_STATE' };

const initialState: EditorState = {
  selectedDevice: null,
  selectedConsole: null,
  skinName: '',
  skinIdentifier: 'com.playcase.default.skin',
  debug: false,
  controls: [],
  screens: [],
  selectedControlIndex: null,
  selectedScreenIndex: null,
  isConfigPromptVisible: false,
  showProjectManager: false,
  showJsonPreview: false,
  menuInsetsEnabled: false,
  menuInsetsBottom: 0,
  menuInsetsLeft: 0,
  menuInsetsRight: 0,
  uploadedImage: null,
  thumbstickImages: {},
  thumbstickFiles: {},
  history: [],
  historyIndex: -1,
  showGrid: true,
  gridSize: 10
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_DEVICE':
      return { ...state, selectedDevice: action.payload };
    case 'SET_CONSOLE':
      return { ...state, selectedConsole: action.payload };
    case 'SET_SKIN_NAME':
      return { ...state, skinName: action.payload };
    case 'SET_SKIN_IDENTIFIER':
      return { ...state, skinIdentifier: action.payload };
    case 'SET_DEBUG':
      return { ...state, debug: action.payload };
    case 'SET_CONTROLS':
      return { ...state, controls: action.payload };
    case 'SET_SCREENS':
      return { ...state, screens: action.payload };
    case 'SET_SELECTED_CONTROL':
      return { ...state, selectedControlIndex: action.payload };
    case 'SET_SELECTED_SCREEN':
      return { ...state, selectedScreenIndex: action.payload };
    case 'SET_CONFIG_PROMPT_VISIBLE':
      return { ...state, isConfigPromptVisible: action.payload };
    case 'SET_SHOW_PROJECT_MANAGER':
      return { ...state, showProjectManager: action.payload };
    case 'SET_SHOW_JSON_PREVIEW':
      return { ...state, showJsonPreview: action.payload };
    case 'SET_MENU_INSETS':
      return {
        ...state,
        menuInsetsEnabled: action.payload.enabled ?? state.menuInsetsEnabled,
        menuInsetsBottom: action.payload.bottom ?? state.menuInsetsBottom,
        menuInsetsLeft: action.payload.left ?? state.menuInsetsLeft,
        menuInsetsRight: action.payload.right ?? state.menuInsetsRight
      };
    case 'SET_UPLOADED_IMAGE':
      return { ...state, uploadedImage: action.payload };
    case 'SET_THUMBSTICK_IMAGES':
      return { ...state, thumbstickImages: action.payload };
    case 'SET_THUMBSTICK_FILES':
      return { ...state, thumbstickFiles: action.payload };
    case 'SET_HISTORY':
      return { 
        ...state, 
        history: action.payload.history, 
        historyIndex: action.payload.index 
      };
    case 'SET_GRID_SETTINGS':
      return {
        ...state,
        showGrid: action.payload.showGrid ?? state.showGrid,
        gridSize: action.payload.gridSize ?? state.gridSize
      };
    case 'RESET_STATE':
      return { ...initialState };
    default:
      return state;
  }
}

export function useEditorState() {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  // Action creators
  const setDevice = useCallback((device: Device | null) => {
    dispatch({ type: 'SET_DEVICE', payload: device });
  }, []);

  const setConsole = useCallback((console: Console | null) => {
    dispatch({ type: 'SET_CONSOLE', payload: console });
  }, []);

  const setSkinName = useCallback((name: string) => {
    dispatch({ type: 'SET_SKIN_NAME', payload: name });
  }, []);

  const setSkinIdentifier = useCallback((identifier: string) => {
    dispatch({ type: 'SET_SKIN_IDENTIFIER', payload: identifier });
  }, []);

  const setDebug = useCallback((debug: boolean) => {
    dispatch({ type: 'SET_DEBUG', payload: debug });
  }, []);

  const setControls = useCallback((controls: ControlMapping[]) => {
    dispatch({ type: 'SET_CONTROLS', payload: controls });
  }, []);

  const setScreens = useCallback((screens: ScreenMapping[]) => {
    dispatch({ type: 'SET_SCREENS', payload: screens });
  }, []);

  const setSelectedControl = useCallback((index: number | null) => {
    dispatch({ type: 'SET_SELECTED_CONTROL', payload: index });
  }, []);

  const setSelectedScreen = useCallback((index: number | null) => {
    dispatch({ type: 'SET_SELECTED_SCREEN', payload: index });
  }, []);

  const setConfigPromptVisible = useCallback((visible: boolean) => {
    dispatch({ type: 'SET_CONFIG_PROMPT_VISIBLE', payload: visible });
  }, []);

  const setShowProjectManager = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_PROJECT_MANAGER', payload: show });
  }, []);

  const setShowJsonPreview = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_JSON_PREVIEW', payload: show });
  }, []);

  const setMenuInsets = useCallback((insets: { enabled?: boolean; bottom?: number; left?: number; right?: number }) => {
    dispatch({ type: 'SET_MENU_INSETS', payload: insets });
  }, []);

  const setUploadedImage = useCallback((image: { file: File; url: string } | null) => {
    dispatch({ type: 'SET_UPLOADED_IMAGE', payload: image });
  }, []);

  const setThumbstickImages = useCallback((images: { [controlId: string]: string }) => {
    dispatch({ type: 'SET_THUMBSTICK_IMAGES', payload: images });
  }, []);

  const setThumbstickFiles = useCallback((files: { [controlId: string]: File }) => {
    dispatch({ type: 'SET_THUMBSTICK_FILES', payload: files });
  }, []);

  const setHistory = useCallback((history: any[], index: number) => {
    dispatch({ type: 'SET_HISTORY', payload: { history, index } });
  }, []);

  const setGridSettings = useCallback((settings: { showGrid?: boolean; gridSize?: number }) => {
    dispatch({ type: 'SET_GRID_SETTINGS', payload: settings });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    setDevice,
    setConsole,
    setSkinName,
    setSkinIdentifier,
    setDebug,
    setControls,
    setScreens,
    setSelectedControl,
    setSelectedScreen,
    setConfigPromptVisible,
    setShowProjectManager,
    setShowJsonPreview,
    setMenuInsets,
    setUploadedImage,
    setThumbstickImages,
    setThumbstickFiles,
    setHistory,
    setGridSettings,
    resetState
  };
}