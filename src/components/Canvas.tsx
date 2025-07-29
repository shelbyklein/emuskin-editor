// Canvas component with draggable and resizable controls and screens
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Device, ControlMapping, ScreenMapping } from '../types';
import DeviceInfo from './DeviceInfo';
import ControlPropertiesPanel from './ControlPropertiesPanel';
import ScreenPropertiesPanel from './ScreenPropertiesPanel';
import { useEditor } from '../contexts/EditorContext';
import { useTheme } from '../contexts/ThemeContext';

interface CanvasProps {
  device: Device | null;
  backgroundImage: string | null;
  controls: ControlMapping[];
  screens: ScreenMapping[];
  consoleType: string;
  menuInsetsEnabled?: boolean;
  menuInsetsBottom?: number;
  onControlUpdate: (controls: ControlMapping[]) => void;
  onScreenUpdate: (screens: ScreenMapping[]) => void;
  onInteractionChange?: (isInteracting: boolean) => void;
  thumbstickImages?: { [controlId: string]: string }; // URLs for thumbstick images
  onThumbstickImageUpload?: (file: File, controlIndex: number) => void;
}

interface DragState {
  isDragging: boolean;
  itemType: 'control' | 'screen' | null;
  itemIndex: number | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface ResizeState {
  isResizing: boolean;
  itemType: 'control' | 'screen' | null;
  itemIndex: number | null;
  handle: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
}

const Canvas: React.FC<CanvasProps> = ({ 
  device, 
  backgroundImage, 
  controls,
  screens,
  consoleType,
  menuInsetsEnabled = false,
  menuInsetsBottom = 0,
  onControlUpdate,
  onScreenUpdate,
  onInteractionChange,
  thumbstickImages = {},
  onThumbstickImageUpload
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [selectedControl, setSelectedControl] = useState<number | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<number | null>(null);
  const { settings } = useEditor();
  const { isDark } = useTheme();
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [showScreenPropertiesPanel, setShowScreenPropertiesPanel] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [hasResized, setHasResized] = useState(false);
  
  // Performance optimization refs
  const resizePositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const resizeThrottleRef = useRef<number | null>(null);
  const lastResizeUpdateRef = useRef<number>(0);
  
  // Refs to always have latest values in callbacks
  const controlsRef = useRef(controls);
  const screensRef = useRef(screens);
  
  // Update refs when props change
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);
  
  useEffect(() => {
    screensRef.current = screens;
  }, [screens]);

  // Helper function to snap value to grid
  const snapToGrid = (value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize;
  };

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    itemType: null,
    itemIndex: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    itemType: null,
    itemIndex: null,
    handle: '',
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0
  });

  // Set canvas dimensions to 1:1 pixel representation
  useEffect(() => {
    if (!device) return;

    const deviceWidth = device.logicalWidth || 390;
    const deviceHeight = device.logicalHeight || 844;
    
    // Always use scale of 1 for 1:1 pixel representation
    setScale(1);
    setCanvasSize({
      width: deviceWidth,
      height: deviceHeight
    });
  }, [device]);

  // Handle mouse down on item (control or screen)
  const handleMouseDown = useCallback((e: React.MouseEvent, index: number, itemType: 'control' | 'screen') => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Reset drag flag at start of new interaction
    setHasDragged(false);
    
    setDragState({
      isDragging: true,
      itemType,
      itemIndex: index,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    });
    
    if (itemType === 'control') {
      setSelectedControl(index);
      setSelectedScreen(null);
    } else {
      setSelectedScreen(index);
      setSelectedControl(null);
    }
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, index: number, handle: string, itemType: 'control' | 'screen') => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = itemType === 'control' ? controls[index] : screens[index];
    const frame = itemType === 'control' ? item.frame : (item as ScreenMapping).outputFrame;
    
    setHasResized(true); // Set flag when resize starts
    
    setResizeState({
      isResizing: true,
      itemType,
      itemIndex: index,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: frame?.width || 50,
      startHeight: frame?.height || 50,
      startLeft: frame?.x || 0,
      startTop: frame?.y || 0
    });
    
    if (itemType === 'control') {
      setSelectedControl(index);
      setSelectedScreen(null);
    } else {
      setSelectedScreen(index);
      setSelectedControl(null);
    }
  }, [controls, screens]);

  // Handle mouse move (dragging)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragState.isDragging && dragState.itemIndex !== null && dragState.itemType && !resizeState.isResizing) {
      // Mark that we've actually dragged (not just clicked)
      const dragDistance = Math.abs(e.clientX - dragState.startX) + Math.abs(e.clientY - dragState.startY);
      if (dragDistance > 5) { // Threshold to distinguish between click and drag
        setHasDragged(true);
      }

      const container = containerRef.current?.querySelector('.canvas-area');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      
      const newX = e.clientX - rect.left - dragState.offsetX;
      const newY = e.clientY - rect.top - dragState.offsetY;
      
      let width, height;
      if (dragState.itemType === 'control') {
        const control = controlsRef.current[dragState.itemIndex];
        width = control.frame?.width || 50;
        height = control.frame?.height || 50;
      } else {
        const screen = screensRef.current[dragState.itemIndex];
        width = screen.outputFrame?.width || 200;
        height = screen.outputFrame?.height || 150;
      }
      
      const maxX = (device?.logicalWidth || 390) - width;
      const maxY = (device?.logicalHeight || 844) - height;
      
      let clampedX = Math.max(0, Math.min(newX, maxX));
      let clampedY = Math.max(0, Math.min(newY, maxY));
      
      // Apply grid snapping if enabled
      if (settings.snapToGrid) {
        clampedX = snapToGrid(clampedX, settings.gridSize);
        clampedY = snapToGrid(clampedY, settings.gridSize);
      }
      
      // Round the values
      clampedX = Math.round(clampedX);
      clampedY = Math.round(clampedY);
      
      // Update the appropriate item
      if (dragState.itemType === 'control') {
        const control = controlsRef.current[dragState.itemIndex];
        if (clampedX !== control.frame?.x || clampedY !== control.frame?.y) {
          const updatedControls = [...controlsRef.current];
          updatedControls[dragState.itemIndex] = {
            ...control,
            frame: {
              ...control.frame,
              x: clampedX,
              y: clampedY
            }
          };
          onControlUpdate(updatedControls);
        }
      } else {
        const screen = screensRef.current[dragState.itemIndex];
        if (clampedX !== screen.outputFrame?.x || clampedY !== screen.outputFrame?.y) {
          const updatedScreens = [...screensRef.current];
          updatedScreens[dragState.itemIndex] = {
            ...screen,
            outputFrame: {
              ...screen.outputFrame,
              x: clampedX,
              y: clampedY
            }
          };
          onScreenUpdate(updatedScreens);
        }
      }
    }
  }, [dragState, controls, screens, device, onControlUpdate, onScreenUpdate, resizeState.isResizing, settings]);

  // Handle resize
  const handleResize = useCallback((e: MouseEvent) => {
    if (!resizeState.isResizing || resizeState.itemIndex === null || !resizeState.itemType) return;

    const deltaX = e.clientX - resizeState.startX;
    const deltaY = e.clientY - resizeState.startY;
    
    let newX = resizeState.startLeft;
    let newY = resizeState.startTop;
    let newWidth = resizeState.startWidth;
    let newHeight = resizeState.startHeight;

    // Check if we need to maintain aspect ratio for screens
    const shouldMaintainAspectRatio = resizeState.itemType === 'screen' && 
      screensRef.current[resizeState.itemIndex]?.maintainAspectRatio;
    
    let aspectRatio = 1;
    if (shouldMaintainAspectRatio) {
      const screen = screensRef.current[resizeState.itemIndex];
      if (screen.inputFrame) {
        aspectRatio = screen.inputFrame.width / screen.inputFrame.height;
      } else {
        // Default aspect ratios based on console type
        const aspectRatios: { [key: string]: number } = {
          'gbc': 160 / 144,
          'gba': 240 / 160,
          'nds': 256 / 192,
          'nes': 256 / 240,
          'snes': 256 / 224,
          'n64': 256 / 224,
          'sg': 4 / 3,
          'ps1': 4 / 3
        };
        aspectRatio = aspectRatios[consoleType] || 1.333;
      }
    }

    // Handle different resize handles
    if (shouldMaintainAspectRatio) {
      // For aspect ratio maintenance, we'll use the dominant axis of movement
      switch (resizeState.handle) {
        case 'nw':
          // Use the larger delta to determine primary resize direction
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newWidth = resizeState.startWidth - deltaX;
            newHeight = newWidth / aspectRatio;
            newX = resizeState.startLeft + deltaX;
            newY = resizeState.startTop - (newHeight - resizeState.startHeight);
          } else {
            newHeight = resizeState.startHeight - deltaY;
            newWidth = newHeight * aspectRatio;
            newY = resizeState.startTop + deltaY;
            newX = resizeState.startLeft - (newWidth - resizeState.startWidth);
          }
          break;
        case 'ne':
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newWidth = resizeState.startWidth + deltaX;
            newHeight = newWidth / aspectRatio;
            newY = resizeState.startTop - (newHeight - resizeState.startHeight);
          } else {
            newHeight = resizeState.startHeight - deltaY;
            newWidth = newHeight * aspectRatio;
            newY = resizeState.startTop + deltaY;
          }
          break;
        case 'sw':
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newWidth = resizeState.startWidth - deltaX;
            newHeight = newWidth / aspectRatio;
            newX = resizeState.startLeft + deltaX;
          } else {
            newHeight = resizeState.startHeight + deltaY;
            newWidth = newHeight * aspectRatio;
            newX = resizeState.startLeft - (newWidth - resizeState.startWidth);
          }
          break;
        case 'se':
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newWidth = resizeState.startWidth + deltaX;
            newHeight = newWidth / aspectRatio;
          } else {
            newHeight = resizeState.startHeight + deltaY;
            newWidth = newHeight * aspectRatio;
          }
          break;
        case 'n':
        case 's':
          // Vertical resize - adjust width to maintain ratio
          newHeight = resizeState.handle === 'n' 
            ? resizeState.startHeight - deltaY 
            : resizeState.startHeight + deltaY;
          newWidth = newHeight * aspectRatio;
          // Center horizontally
          newX = resizeState.startLeft - (newWidth - resizeState.startWidth) / 2;
          if (resizeState.handle === 'n') {
            newY = resizeState.startTop + deltaY;
          }
          break;
        case 'w':
        case 'e':
          // Horizontal resize - adjust height to maintain ratio
          newWidth = resizeState.handle === 'w'
            ? resizeState.startWidth - deltaX
            : resizeState.startWidth + deltaX;
          newHeight = newWidth / aspectRatio;
          // Center vertically
          newY = resizeState.startTop - (newHeight - resizeState.startHeight) / 2;
          if (resizeState.handle === 'w') {
            newX = resizeState.startLeft + deltaX;
          }
          break;
      }
    } else {
      // Normal resize without aspect ratio constraint
      switch (resizeState.handle) {
        case 'nw':
          newX = resizeState.startLeft + deltaX;
          newY = resizeState.startTop + deltaY;
          newWidth = resizeState.startWidth - deltaX;
          newHeight = resizeState.startHeight - deltaY;
          break;
        case 'ne':
          newY = resizeState.startTop + deltaY;
          newWidth = resizeState.startWidth + deltaX;
          newHeight = resizeState.startHeight - deltaY;
          break;
        case 'sw':
          newX = resizeState.startLeft + deltaX;
          newWidth = resizeState.startWidth - deltaX;
          newHeight = resizeState.startHeight + deltaY;
          break;
        case 'se':
          newWidth = resizeState.startWidth + deltaX;
          newHeight = resizeState.startHeight + deltaY;
          break;
        case 'n':
          newY = resizeState.startTop + deltaY;
          newHeight = resizeState.startHeight - deltaY;
          break;
        case 's':
          newHeight = resizeState.startHeight + deltaY;
          break;
        case 'w':
          newX = resizeState.startLeft + deltaX;
          newWidth = resizeState.startWidth - deltaX;
          break;
        case 'e':
          newWidth = resizeState.startWidth + deltaX;
          break;
      }
    }

    // Minimum size constraints
    const minSize = 20;
    if (newWidth < minSize) {
      if (resizeState.handle.includes('w')) {
        newX = resizeState.startLeft + resizeState.startWidth - minSize;
      }
      newWidth = minSize;
    }
    if (newHeight < minSize) {
      if (resizeState.handle.includes('n')) {
        newY = resizeState.startTop + resizeState.startHeight - minSize;
      }
      newHeight = minSize;
    }

    // Boundary constraints
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    const maxWidth = (device?.logicalWidth || 390) - newX;
    const maxHeight = (device?.logicalHeight || 844) - newY;
    newWidth = Math.min(newWidth, maxWidth);
    newHeight = Math.min(newHeight, maxHeight);

    // Apply grid snapping if enabled
    if (settings.snapToGrid) {
      newX = snapToGrid(newX, settings.gridSize);
      newY = snapToGrid(newY, settings.gridSize);
      newWidth = snapToGrid(newWidth, settings.gridSize);
      newHeight = snapToGrid(newHeight, settings.gridSize);
    }

    // Store position in ref for visual updates
    resizePositionRef.current = {
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };

    // Throttle state updates to 60fps (16ms)
    const now = Date.now();
    const timeSinceLastUpdate = now - lastResizeUpdateRef.current;
    
    if (timeSinceLastUpdate >= 16) {
      lastResizeUpdateRef.current = now;
      
      // Cancel any pending throttled update
      if (resizeThrottleRef.current) {
        cancelAnimationFrame(resizeThrottleRef.current);
        resizeThrottleRef.current = null;
      }
      
      // Update the appropriate item
      if (resizeState.itemType === 'control') {
        const updatedControls = [...controlsRef.current];
        updatedControls[resizeState.itemIndex] = {
          ...controlsRef.current[resizeState.itemIndex],
          frame: resizePositionRef.current
        };
        onControlUpdate(updatedControls);
      } else {
        const updatedScreens = [...screensRef.current];
        updatedScreens[resizeState.itemIndex] = {
          ...screensRef.current[resizeState.itemIndex],
          outputFrame: resizePositionRef.current
        };
        onScreenUpdate(updatedScreens);
      }
    } else if (!resizeThrottleRef.current) {
      // Schedule an update for the next frame if we haven't already
      resizeThrottleRef.current = requestAnimationFrame(() => {
        if (resizePositionRef.current && resizeState.itemIndex !== null) {
          if (resizeState.itemType === 'control') {
            const updatedControls = [...controlsRef.current];
            updatedControls[resizeState.itemIndex] = {
              ...controlsRef.current[resizeState.itemIndex],
              frame: resizePositionRef.current
            };
            onControlUpdate(updatedControls);
          } else {
            const updatedScreens = [...screensRef.current];
            updatedScreens[resizeState.itemIndex] = {
              ...screensRef.current[resizeState.itemIndex],
              outputFrame: resizePositionRef.current
            };
            onScreenUpdate(updatedScreens);
          }
        }
        resizeThrottleRef.current = null;
      });
    }
  }, [resizeState, controls, screens, device, onControlUpdate, onScreenUpdate, settings, consoleType]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Apply final resize position if we were resizing
    if (resizeState.isResizing && resizePositionRef.current && resizeState.itemIndex !== null && resizeState.itemType) {
      // Cancel any pending throttled update
      if (resizeThrottleRef.current) {
        cancelAnimationFrame(resizeThrottleRef.current);
        resizeThrottleRef.current = null;
      }
      
      // Apply final position
      if (resizeState.itemType === 'control') {
        const updatedControls = [...controlsRef.current];
        updatedControls[resizeState.itemIndex] = {
          ...controlsRef.current[resizeState.itemIndex],
          frame: resizePositionRef.current
        };
        onControlUpdate(updatedControls);
      } else {
        const updatedScreens = [...screensRef.current];
        updatedScreens[resizeState.itemIndex] = {
          ...screensRef.current[resizeState.itemIndex],
          outputFrame: resizePositionRef.current
        };
        onScreenUpdate(updatedScreens);
      }
    }
    
    // Reset resize position ref
    resizePositionRef.current = null;
    lastResizeUpdateRef.current = 0;
    
    // Don't reset hasDragged here - let the click handler deal with it
    setDragState({
      isDragging: false,
      itemType: null,
      itemIndex: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0
    });
    setResizeState({
      isResizing: false,
      itemType: null,
      itemIndex: null,
      handle: '',
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      startLeft: 0,
      startTop: 0
    });
    
    // Reset resize flag after a short delay
    setTimeout(() => {
      setHasResized(false);
    }, 100);
  }, [resizeState, controls, screens, onControlUpdate, onScreenUpdate]);

  // Add global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging || resizeState.isResizing) {
      // Notify parent that interaction has started
      onInteractionChange?.(true);
      
      const moveHandler = resizeState.isResizing ? handleResize : handleMouseMove;
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    } else {
      // Notify parent that interaction has ended
      onInteractionChange?.(false);
    }
  }, [dragState.isDragging, resizeState.isResizing, handleMouseMove, handleResize, handleMouseUp, onInteractionChange]);

  // Handle control deletion
  const handleDeleteControl = useCallback((index: number) => {
    const updatedControls = controlsRef.current.filter((_, i) => i !== index);
    onControlUpdate(updatedControls);
    setSelectedControl(null);
    setShowPropertiesPanel(false);
  }, [onControlUpdate]);

  // Handle screen deletion
  const handleDeleteScreen = useCallback((index: number) => {
    const updatedScreens = screensRef.current.filter((_, i) => i !== index);
    onScreenUpdate(updatedScreens);
    setSelectedScreen(null);
    setShowScreenPropertiesPanel(false);
  }, [onScreenUpdate]);

  // Handle control properties update
  const handleControlPropertiesUpdate = useCallback((index: number, updates: ControlMapping) => {
    const updatedControls = controlsRef.current.map((control, i) => {
      if (i === index) {
        return { ...updates };
      }
      return control;
    });
    
    onControlUpdate(updatedControls);
  }, [onControlUpdate]);

  // Handle screen properties update
  const handleScreenPropertiesUpdate = useCallback((index: number, updates: ScreenMapping) => {
    const updatedScreens = screensRef.current.map((screen, i) => {
      if (i === index) {
        return updates; // Use the updates directly, as they should already be complete
      }
      return screen;
    });
    
    onScreenUpdate(updatedScreens);
  }, [onScreenUpdate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedControl !== null && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        handleDeleteControl(selectedControl);
      } else if (selectedScreen !== null && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        handleDeleteScreen(selectedScreen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedControl, selectedScreen, handleDeleteControl, handleDeleteScreen]);

  return (
    <>
      <div 
        id="canvas-container"
        ref={containerRef}
        className="w-full bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex justify-center box-border"
        style={{ boxSizing: 'border-box' }}
      >
      {device ? (
        <div id="canvas-wrapper" className="inline-flex flex-col items-start">
          <div 
            id="canvas-drawing-area"
            className="canvas-area relative border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden mx-auto [&>*]:box-border"
            style={{
              boxSizing: 'content-box',
              width: canvasSize.width,
              height: canvasSize.height,
              cursor: resizeState.isResizing ? 'grabbing' : 'auto'
            }}
            onClick={() => {
              setSelectedControl(null);
              setSelectedScreen(null);
              setShowPropertiesPanel(false);
              setShowScreenPropertiesPanel(false);
            }}
          >
            {/* Background image */}
            {backgroundImage && (
              <img 
                id="canvas-background-image"
                src={backgroundImage} 
                alt="Skin background"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
            )}
            
            {/* Grid overlay */}
            {settings.gridEnabled && (
              <div 
                id="canvas-grid-overlay"
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, ${
                      isDark 
                        ? (backgroundImage ? 'rgba(75, 85, 99, 0.3)' : 'rgba(75, 85, 99, 0.4)')
                        : (backgroundImage ? 'rgba(229, 231, 235, 0.5)' : '#e5e7eb')
                    } 1px, transparent 1px),
                    linear-gradient(to bottom, ${
                      isDark 
                        ? (backgroundImage ? 'rgba(75, 85, 99, 0.3)' : 'rgba(75, 85, 99, 0.4)')
                        : (backgroundImage ? 'rgba(229, 231, 235, 0.5)' : '#e5e7eb')
                    } 1px, transparent 1px)
                  `,
                  backgroundSize: `${settings.gridSize}px ${settings.gridSize}px`
                }}
              />
            )}

            {/* Menu insets visual overlay */}
            {menuInsetsEnabled && menuInsetsBottom > 0 && device && (
              <div 
                id="menu-insets-overlay"
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: `${(1 - menuInsetsBottom / 100) * device.logicalHeight}px`,
                  height: `${(menuInsetsBottom / 100) * device.logicalHeight}px`,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.5)'
                }}
              >
                <div className="absolute top-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                  Menu Inset: {menuInsetsBottom}%
                </div>
              </div>
            )}

            {/* Render screens (behind controls) */}
            {screens.map((screen, index) => {
              const x = screen.outputFrame?.x || 0;
              const y = screen.outputFrame?.y || 0;
              const width = screen.outputFrame?.width || 200;
              const height = screen.outputFrame?.height || 150;
              const isSelected = selectedScreen === index;

              return (
                <div
                  id={`screen-${index}`}
                  key={`screen-${index}`}
                  className={`absolute border-2 rounded group ${
                    isSelected 
                      ? 'border-green-500 bg-green-500/20 ring-2 ring-green-500/50' 
                      : 'border-green-400 bg-green-400/10 hover:border-green-500 hover:bg-green-500/20'
                  } ${dragState.isDragging && dragState.itemIndex === index && dragState.itemType === 'screen' ? 'opacity-75' : ''}`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    cursor: dragState.isDragging ? 'grabbing' : 'move',
                    transition: (dragState.isDragging && dragState.itemIndex === index && dragState.itemType === 'screen') || 
                                (resizeState.isResizing && resizeState.itemIndex === index && resizeState.itemType === 'screen') 
                                ? 'none' : 'all 75ms'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, index, 'screen')}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Select the screen (don't open properties panel - use settings button for that)
                    if (!hasDragged && !hasResized) {
                      setSelectedScreen(index);
                      setSelectedControl(null);
                    }
                    setHasDragged(false);
                  }}
                >
                  {/* Screen label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-gray-800 dark:text-gray-200 font-medium text-sm select-none bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
                      {screen.label || 'Game Screen'}
                    </span>
                  </div>

                  {/* Settings cog icon - visible on hover */}
                  <button
                    id={`screen-settings-${index}`}
                    className="absolute w-6 h-6 bg-gray-700 hover:bg-gray-800 text-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                    style={{ bottom: '3px', left: '3px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedScreen(index);
                      setShowScreenPropertiesPanel(true);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    aria-label={`Settings for ${screen.label || 'screen'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  {/* Resize handles (visible when selected) */}
                  {isSelected && (
                    <>
                      {/* Corner handles */}
                      <div 
                        className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-nw-resize hover:bg-green-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'nw', 'screen')}
                      />
                      <div 
                        className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-ne-resize hover:bg-green-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'ne', 'screen')}
                      />
                      <div 
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-sw-resize hover:bg-green-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'sw', 'screen')}
                      />
                      <div 
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-se-resize hover:bg-green-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'se', 'screen')}
                      />
                      
                      {/* Edge handles */}
                      <div 
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-n-resize hover:bg-green-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'n', 'screen')}
                      />
                      <div 
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-s-resize hover:bg-green-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 's', 'screen')}
                      />
                      <div 
                        className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-w-resize hover:bg-green-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'w', 'screen')}
                      />
                      <div 
                        className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-e-resize hover:bg-green-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'e', 'screen')}
                      />
                      
                      {/* Delete button */}
                      <button
                        className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScreen(index);
                        }}
                        aria-label={`Delete ${screen.label || 'screen'}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            {/* Render controls */}
            {controls.map((control, index) => {
              const x = control.frame?.x || 0;
              const y = control.frame?.y || 0;
              const width = control.frame?.width || 50;
              const height = control.frame?.height || 50;
              const isSelected = selectedControl === index;
              const label = control.label || (Array.isArray(control.inputs) 
                ? control.inputs.join('+') || 'Control'
                : control.inputs || 'Control');
              
              // Check if this is a thumbstick control
              const isThumbstick = control.inputs && typeof control.inputs === 'object' && !Array.isArray(control.inputs) &&
                'up' in control.inputs && control.inputs.up === 'analogStickUp';
              const thumbstickImageUrl = control.id && thumbstickImages[control.id];

              return (
                <div
                  id={`control-${index}`}
                  key={index}
                  className={`control absolute border-2 rounded group ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500/40 ring-2 ring-blue-500/50' 
                      : 'border-blue-400 bg-blue-400/30 hover:border-blue-500 hover:bg-blue-500/40'
                  } ${dragState.isDragging && dragState.itemIndex === index && dragState.itemType === 'control' ? 'opacity-75' : ''}`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    cursor: dragState.isDragging ? 'grabbing' : 'move',
                    transition: (dragState.isDragging && dragState.itemIndex === index && dragState.itemType === 'control') || 
                                (resizeState.isResizing && resizeState.itemIndex === index && resizeState.itemType === 'control') 
                                ? 'none' : 'all 75ms'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, index, 'control')}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Select the control (don't open properties panel - use settings button for that)
                    if (!hasDragged && !hasResized) {
                      setSelectedControl(index);
                      setSelectedScreen(null);
                    }
                    setHasDragged(false); // Reset for next interaction
                  }}
                >
                  {/* Control label or thumbstick image */}
                  <div id={`control-label-${index}`} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {isThumbstick && thumbstickImageUrl && control.thumbstick ? (
                      <img 
                        src={thumbstickImageUrl} 
                        alt="Thumbstick"
                        className="object-contain"
                        style={{
                          width: `${control.thumbstick.width}px`,
                          height: `${control.thumbstick.height}px`,
                          maxWidth: '100%',
                          maxHeight: '100%'
                        }}
                      />
                    ) : (
                      <span id={`control-text-${index}`} className="text-gray-800 dark:text-gray-200 font-medium text-sm select-none">
                        {isThumbstick ? 'Thumbstick' : label}
                      </span>
                    )}
                  </div>

                  {/* Extended edges visualization (always visible) */}
                  {(control.extendedEdges?.top || control.extendedEdges?.bottom || 
                    control.extendedEdges?.left || control.extendedEdges?.right) ? (
                    <div 
                      className="absolute pointer-events-none border-2 border-dashed border-purple-400 opacity-30"
                      style={{
                        top: `${-(control.extendedEdges?.top || 0)}px`,
                        bottom: `${-(control.extendedEdges?.bottom || 0)}px`,
                        left: `${-(control.extendedEdges?.left || 0)}px`,
                        right: `${-(control.extendedEdges?.right || 0)}px`,
                      }}
                    />
                  ) : null}

                  {/* Settings cog icon - visible on hover */}
                  <button
                    id={`control-settings-${index}`}
                    className="absolute w-6 h-6 bg-gray-700 hover:bg-gray-800 text-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                    style={{ bottom: '3px', left: '3px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedControl(index);
                      setShowPropertiesPanel(true);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    aria-label={`Settings for ${label} control`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  {/* Resize handles (visible when selected) */}
                  {isSelected && (
                    <>
                      {/* Corner handles */}
                      <div 
                        id={`resize-handle-nw-${index}`}
                        className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'nw', 'control')}
                      />
                      <div 
                        id={`resize-handle-ne-${index}`}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'ne', 'control')}
                      />
                      <div 
                        id={`resize-handle-sw-${index}`}
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'sw', 'control')}
                      />
                      <div 
                        id={`resize-handle-se-${index}`}
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'se', 'control')}
                      />
                      
                      {/* Edge handles */}
                      <div 
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-n-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'n', 'control')}
                      />
                      <div 
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-s-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 's', 'control')}
                      />
                      <div 
                        className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-w-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'w', 'control')}
                      />
                      <div 
                        className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-e-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'e', 'control')}
                      />
                      
                      {/* Delete button */}
                      <button
                        id={`control-delete-${index}`}
                        className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteControl(index);
                        }}
                        aria-label={`Delete ${label} control`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Device info */}
          <div id="device-info-section" className="mt-4">
            <DeviceInfo device={device} scale={scale} />
          </div>
          
          {/* Info panel */}
          <div id="canvas-help-text" className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>• Click and drag controls/screens to reposition</p>
            <p>• Click the cog icon to open properties panel</p>
            <p>• Drag corner/edge handles to resize</p>
            <p>• Click an item to select, then press Delete to remove</p>
            <p>• Click empty space to deselect</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Select a device to begin
        </p>
      )}
      </div>
      
      {/* Control Properties Panel - Fixed Position */}
      {showPropertiesPanel && selectedControl !== null && device && (
        <div 
          id="properties-panel-overlay" 
          className="fixed inset-0 z-40 pointer-events-none"
        >
          <div 
            id="properties-panel-backdrop"
            className="absolute inset-0 bg-black/20 pointer-events-auto"
            onClick={() => setShowPropertiesPanel(false)}
          />
          <div 
            id="properties-panel-container" 
            className={`absolute bottom-0 left-0 right-0 pointer-events-auto transform transition-transform duration-300 ease-out ${
              showPropertiesPanel ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="flex justify-center pb-4">
              <ControlPropertiesPanel
                control={controls[selectedControl] || null}
                controlIndex={selectedControl}
                onUpdate={handleControlPropertiesUpdate}
                onClose={() => setShowPropertiesPanel(false)}
                onThumbstickImageUpload={onThumbstickImageUpload}
              />
            </div>
          </div>
        </div>
      )}

      {/* Screen Properties Panel - Fixed Position */}
      {showScreenPropertiesPanel && selectedScreen !== null && device && (
        <div 
          id="screen-properties-panel-overlay" 
          className="fixed inset-0 z-40 pointer-events-none"
        >
          <div 
            id="screen-properties-panel-backdrop"
            className="absolute inset-0 bg-black/20 pointer-events-auto"
            onClick={() => setShowScreenPropertiesPanel(false)}
          />
          <div 
            id="screen-properties-panel-container" 
            className={`absolute bottom-0 left-0 right-0 pointer-events-auto transform transition-transform duration-300 ease-out ${
              showScreenPropertiesPanel ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="flex justify-center pb-4">
              <ScreenPropertiesPanel
                screen={screens[selectedScreen] || null}
                screenIndex={selectedScreen}
                consoleType={consoleType}
                deviceWidth={device?.logicalWidth || 390}
                deviceHeight={device?.logicalHeight || 844}
                onUpdate={handleScreenPropertiesUpdate}
                onClose={() => setShowScreenPropertiesPanel(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Canvas;