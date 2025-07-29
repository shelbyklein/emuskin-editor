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
  inputs: string | string[];
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