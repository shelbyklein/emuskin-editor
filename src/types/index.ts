// Type definitions for the emulator skin generator

export interface Console {
  console: string;
  gameTypeIdentifier: string;
  shortName: string;
}

export interface Device {
  model: string;
  logicalWidth: number;
  logicalHeight: number;
  physicalWidth: number;
  physicalHeight: number;
  ppi: number;
}

export interface Button {
  key: string;
  label: string;
  type?: string;
  composite?: boolean;
  identifier?: string;
  name?: string;
}

export interface ControlMapping {
  id?: string;
  inputs: string | string[] | { [key: string]: string };
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
  label?: string; // For custom buttons
  thumbstick?: {
    name: string;
    width: number;
    height: number;
    url?: string;
    dataURL?: string; // For localStorage persistence
  };
  mirrorBottomScreen?: boolean; // For touchscreen controls
  locked?: boolean; // Prevents moving/resizing when true
}

export interface SkinConfig {
  name: string;
  identifier: string;
  gameTypeIdentifier: string;
  representations: {
    iphone: {
      edgeToEdge: {
        portrait?: SkinOrientation;
        landscape?: SkinOrientation;
      };
    };
  };
}

export interface ScreenMapping {
  id?: string;
  inputFrame?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  outputFrame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label?: string; // For DS: "Top Screen" or "Bottom Screen"
  maintainAspectRatio?: boolean; // Lock aspect ratio during resize
  locked?: boolean; // Prevents moving/resizing when true
  resizable?: boolean; // Whether the screen can be resized
}

export interface SkinOrientation {
  assets: string[];
  items: ControlMapping[];
  screens?: ScreenMapping[];
  mappingSize: {
    width: number;
    height: number;
  };
  extendedEdges: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}