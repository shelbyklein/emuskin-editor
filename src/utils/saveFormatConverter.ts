// Utility functions to convert between full and minimal save formats
import { ControlMapping, ScreenMapping } from '../types';
import { MinimalControl, MinimalScreen, MinimalOrientationData } from '../types/SaveFormat';

// Convert full control to minimal format (strip UI state)
export function toMinimalControl(control: ControlMapping): MinimalControl {
  return {
    inputs: control.inputs,
    frame: {
      x: control.frame?.x || 0,
      y: control.frame?.y || 0,
      width: control.frame?.width || 50,
      height: control.frame?.height || 50
    },
    extendedEdges: control.extendedEdges || {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  };
}

// Convert full screen to minimal format
export function toMinimalScreen(screen: ScreenMapping): MinimalScreen {
  const minimal: MinimalScreen = {
    frame: {
      x: screen.outputFrame?.x || 0,
      y: screen.outputFrame?.y || 0,
      width: screen.outputFrame?.width || 200,
      height: screen.outputFrame?.height || 150
    }
  };
  
  if (screen.inputFrame) {
    minimal.inputFrame = {
      x: screen.inputFrame.x,
      y: screen.inputFrame.y,
      width: screen.inputFrame.width,
      height: screen.inputFrame.height
    };
  }
  
  if (screen.resizable !== undefined) {
    minimal.resizable = screen.resizable;
  }
  
  return minimal;
}

// Convert minimal control to full format (add UI state with defaults)
export function fromMinimalControl(minimal: MinimalControl, index: number): ControlMapping {
  const control: ControlMapping = {
    id: `control-${Date.now()}-${index}`,
    inputs: minimal.inputs,
    frame: minimal.frame,
    extendedEdges: minimal.extendedEdges || {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  };
  
  // Determine label based on inputs
  if (Array.isArray(control.inputs)) {
    control.label = control.inputs.map(i => i.toUpperCase()).join('+');
  } else if (typeof control.inputs === 'object') {
    if ('up' in control.inputs && 'down' in control.inputs) {
      control.label = 'Thumbstick';
    } else if ('x' in control.inputs && 'y' in control.inputs) {
      control.label = 'Touchscreen';
    }
  }
  
  return control;
}

// Convert minimal screen to full format
export function fromMinimalScreen(minimal: MinimalScreen, index: number): ScreenMapping {
  const screen: ScreenMapping = {
    id: `screen-${Date.now()}-${index}`,
    label: index === 0 ? 'Main Screen' : `Screen ${index + 1}`,
    outputFrame: minimal.frame,
    inputFrame: minimal.inputFrame,
    resizable: minimal.resizable
  };
  
  // Special handling for DS bottom screen
  if (minimal.inputFrame && index === 1) {
    screen.label = 'Bottom Screen';
  }
  
  return screen;
}

// Convert orientation data
export function toMinimalOrientationData(
  controls: ControlMapping[],
  screens: ScreenMapping[],
  menuInsetsEnabled?: boolean,
  menuInsetsBottom?: number,
  backgroundImageRef?: string
): MinimalOrientationData {
  return {
    controls: controls.map(toMinimalControl),
    screens: screens.map(toMinimalScreen),
    menuInsetsEnabled,
    menuInsetsBottom,
    backgroundImageRef
  };
}

// Convert from minimal orientation data
export function fromMinimalOrientationData(minimal: MinimalOrientationData): {
  controls: ControlMapping[];
  screens: ScreenMapping[];
  menuInsetsEnabled?: boolean;
  menuInsetsBottom?: number;
} {
  return {
    controls: minimal.controls.map((c, i) => fromMinimalControl(c, i)),
    screens: minimal.screens.map((s, i) => fromMinimalScreen(s, i)),
    menuInsetsEnabled: minimal.menuInsetsEnabled,
    menuInsetsBottom: minimal.menuInsetsBottom
  };
}