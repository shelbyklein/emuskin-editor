// Minimal save format types - only essential data for skin generation

// Minimal control data - only what's needed for export
export interface MinimalControl {
  inputs: string | string[] | { [key: string]: string };  // Button inputs or thumbstick/touchscreen mappings
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  extendedEdges?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// Minimal screen data
export interface MinimalScreen {
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  inputFrame?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  resizable?: boolean;
}

// Minimal orientation data
export interface MinimalOrientationData {
  controls: MinimalControl[];
  screens: MinimalScreen[];
  menuInsetsEnabled?: boolean;
  menuInsetsBottom?: number;
  menuInsetsLeft?: number;
  menuInsetsRight?: number;
  backgroundImageRef?: string;  // Reference to IndexedDB key (deprecated)
  backgroundImageUrl?: string;  // R2 URL for background image
  backgroundImageFileName?: string;  // Original filename for the image
}

// Minimal project save format
export interface MinimalProject {
  id: string;
  name: string;
  identifier: string;
  gameTypeIdentifier: string;  // Just the ID, not the whole console object
  deviceModel: string;  // Just the model name to lookup dimensions
  orientations: {
    portrait: MinimalOrientationData;
    landscape: MinimalOrientationData;
  };
  availableOrientations?: Array<'portrait' | 'landscape'>;
  currentOrientation: 'portrait' | 'landscape';
  lastModified: number;
}