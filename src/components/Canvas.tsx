// Canvas component with draggable and resizable controls and screens
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Device, ControlMapping, ScreenMapping } from '../types';
import DeviceInfo from './DeviceInfo';
import ControlPropertiesPanel from './ControlPropertiesPanel';
import ScreenPropertiesPanel from './ScreenPropertiesPanel';
import { useEditor } from '../contexts/EditorContext';
import { useTheme } from '../contexts/ThemeContext';
import { useKeyboardShortcuts, ShortcutConfig } from '../hooks/useKeyboardShortcuts';
import ArrowIcon from '../../assets/icons/arrow.svg';
import DpadIcon from '../../assets/icons/dpad.svg';
import MenuIcon from '../../assets/icons/menu.svg';
import FastForwardIcon from '../../assets/icons/fast-forward.svg';
import FastForwardToggleIcon from '../../assets/icons/fast-forward-toggle.svg';

interface CanvasProps {
  device: Device | null;
  backgroundImage: string | null;
  controls: ControlMapping[];
  screens: ScreenMapping[];
  consoleType: string;
  orientation?: 'portrait' | 'landscape';
  menuInsetsEnabled?: boolean;
  menuInsetsBottom?: number;
  menuInsetsLeft?: number;
  menuInsetsRight?: number;
  onControlUpdate: (controls: ControlMapping[]) => void;
  onScreenUpdate: (screens: ScreenMapping[]) => void;
  thumbstickImages?: { [controlId: string]: string }; // URLs for thumbstick images
  onThumbstickImageUpload?: (file: File, controlIndex: number) => void;
  selectedControlIndex?: number | null;
  onControlSelectionChange?: (index: number | null) => void;
  selectedScreenIndex?: number | null;
  onScreenSelectionChange?: (index: number | null, openProperties?: boolean) => void;
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
  orientation = 'portrait',
  menuInsetsEnabled = false,
  menuInsetsBottom = 0,
  menuInsetsLeft = 0,
  menuInsetsRight = 0,
  onControlUpdate,
  onScreenUpdate,
  thumbstickImages = {},
  onThumbstickImageUpload,
  selectedControlIndex,
  onControlSelectionChange,
  selectedScreenIndex,
  onScreenSelectionChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 390, height: 844 });
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [selectedControl, setSelectedControl] = useState<number | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<number | null>(null);
  const { settings } = useEditor();
  const { isDark } = useTheme();
  
  // Debug log for background image
  useEffect(() => {
    console.log('Canvas backgroundImage prop:', backgroundImage ? backgroundImage.substring(0, 50) + '...' : 'null');
  }, [backgroundImage]);

  // Sync external selection with internal state
  useEffect(() => {
    if (selectedControlIndex !== undefined && selectedControlIndex !== selectedControl) {
      setSelectedControl(selectedControlIndex);
      // Show properties panel when control is selected from list
      if (selectedControlIndex !== null) {
        setShowPropertiesPanel(true);
      }
    }
  }, [selectedControlIndex, selectedControl]);

  useEffect(() => {
    if (selectedScreenIndex !== undefined && selectedScreenIndex !== selectedScreen) {
      setSelectedScreen(selectedScreenIndex);
      // Show properties panel when screen is selected from list
      if (selectedScreenIndex !== null) {
        setShowScreenPropertiesPanel(true);
      }
    }
  }, [selectedScreenIndex, selectedScreen]);

  // Update control selection and notify parent
  const updateControlSelection = useCallback((index: number | null, showProperties: boolean = false) => {
    setSelectedControl(index);
    onControlSelectionChange?.(index);
    if (showProperties && index !== null) {
      setShowPropertiesPanel(true);
    }
  }, [onControlSelectionChange]);

  // Update screen selection and notify parent
  const updateScreenSelection = useCallback((index: number | null, showProperties: boolean = false) => {
    setSelectedScreen(index);
    onScreenSelectionChange?.(index, showProperties);
    if (showProperties && index !== null) {
      setShowScreenPropertiesPanel(true);
    }
  }, [onScreenSelectionChange]);

  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [showScreenPropertiesPanel, setShowScreenPropertiesPanel] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [hasResized, setHasResized] = useState(false);
  
  // Performance optimization refs
  const resizePositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const resizeThrottleRef = useRef<number | null>(null);
  const lastResizeUpdateRef = useRef<number>(0);
  

  // Function to update screens and sync mirrored touchscreen controls
  const updateScreensWithMirroredControls = useCallback((updatedScreens: ScreenMapping[]) => {
    // Update screens first
    onScreenUpdate(updatedScreens);
    
    // Find bottom screen
    const bottomScreen = updatedScreens.find(s => s.label === 'Bottom Screen');
    
    if (bottomScreen && bottomScreen.outputFrame) {
      // Check if any controls need to be updated
      const updatedControls = controls.map(control => {
        if (control.mirrorBottomScreen && control.inputs && 
            typeof control.inputs === 'object' && !Array.isArray(control.inputs) &&
            'x' in control.inputs && 'y' in control.inputs) {
          // Update touchscreen control to match bottom screen
          return {
            ...control,
            frame: {
              x: bottomScreen.outputFrame.x,
              y: bottomScreen.outputFrame.y,
              width: bottomScreen.outputFrame.width,
              height: bottomScreen.outputFrame.height
            }
          };
        }
        return control;
      });
      
      // Check if any controls were actually updated
      const controlsChanged = updatedControls.some((control, index) => 
        control.frame?.x !== controls[index].frame?.x ||
        control.frame?.y !== controls[index].frame?.y ||
        control.frame?.width !== controls[index].frame?.width ||
        control.frame?.height !== controls[index].frame?.height
      );
      
      if (controlsChanged) {
        onControlUpdate(updatedControls);
      }
    }
  }, [onControlUpdate, onScreenUpdate]);

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

  // Set canvas dimensions based on device
  useEffect(() => {
    if (!device) {
      // Set default size when no device is selected
      setCanvasSize({ width: 390, height: 844 });
      return;
    }

    const deviceWidth = device.logicalWidth || 390;
    const deviceHeight = device.logicalHeight || 844;
    
    // Swap dimensions for landscape orientation
    if (orientation === 'landscape') {
      setCanvasSize({
        width: deviceHeight,
        height: deviceWidth
      });
    } else {
      setCanvasSize({
        width: deviceWidth,
        height: deviceHeight
      });
    }
  }, [device, orientation]);

  // Track container size with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Account for padding (16px on each side from p-4)
        const padding = 32;
        setContainerSize({
          width: rect.width - padding,
          height: window.innerHeight - rect.top - 200 // Leave space for other UI elements
        });
      }
    };

    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerRef.current);
    
    // Initial size update
    updateContainerSize();

    // Also update on window resize
    window.addEventListener('resize', updateContainerSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateContainerSize);
    };
  }, []);

  // Calculate scale to fit canvas in container (only in landscape mode)
  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return;

    // Only scale in landscape mode
    if (orientation === 'landscape') {
      const scaleX = containerSize.width / canvasSize.width;
      const scaleY = containerSize.height / canvasSize.height;
      
      // Use the smaller scale to maintain aspect ratio, but don't scale up beyond 1
      const newScale = Math.min(scaleX, scaleY, 1);
      setScale(newScale);
    } else {
      // Keep 1:1 scale in portrait mode
      setScale(1);
    }
  }, [canvasSize, containerSize, orientation]);

  // Handle mouse down on item (control or screen)
  const handleMouseDown = useCallback((e: React.MouseEvent, index: number, itemType: 'control' | 'screen') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if item is locked
    const item = itemType === 'control' ? controls[index] : screens[index];
    if (item?.locked) {
      // If locked, only allow selection but not dragging
      if (itemType === 'control') {
        updateControlSelection(index, false);
      } else {
        updateScreenSelection(index, false);
      }
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Reset drag flag at start of new interaction
    setHasDragged(false);
    
    // Account for scale when calculating offset
    setDragState({
      isDragging: true,
      itemType,
      itemIndex: index,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: (e.clientX - rect.left) / scale,
      offsetY: (e.clientY - rect.top) / scale
    });
    
    if (itemType === 'control') {
      updateControlSelection(index);
      updateScreenSelection(null);
    } else {
      updateScreenSelection(index);
      updateControlSelection(null);
    }
  }, []);

  // Handle touch start (for touch devices)
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number, itemType: 'control' | 'screen') => {
    // Don't prevent default here - let the element handle it
    e.stopPropagation();
    
    // Check if item is locked
    const item = itemType === 'control' ? controls[index] : screens[index];
    if (item?.locked) {
      // If locked, only allow selection but not dragging
      if (itemType === 'control') {
        updateControlSelection(index, false);
      } else {
        updateScreenSelection(index, false);
      }
      return;
    }
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Reset drag flag at start of new interaction
    setHasDragged(false);
    
    // Account for scale when calculating offset
    setDragState({
      isDragging: true,
      itemType,
      itemIndex: index,
      startX: touch.clientX,
      startY: touch.clientY,
      offsetX: (touch.clientX - rect.left) / scale,
      offsetY: (touch.clientY - rect.top) / scale
    });
    
    if (itemType === 'control') {
      updateControlSelection(index);
      updateScreenSelection(null);
    } else {
      updateScreenSelection(index);
      updateControlSelection(null);
    }
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, index: number, handle: string, itemType: 'control' | 'screen') => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = itemType === 'control' ? controls[index] : screens[index];
    const frame = itemType === 'control' ? (item as ControlMapping).frame : (item as ScreenMapping).outputFrame;
    
    setHasResized(true); // Set flag when resize starts
    
    // Reset drag state when starting resize
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
      updateControlSelection(index);
      updateScreenSelection(null);
    } else {
      updateScreenSelection(index);
      updateControlSelection(null);
    }
  }, [controls, screens, scale]);

  // Handle resize touch start
  const handleResizeTouchStart = useCallback((e: React.TouchEvent, index: number, handle: string, itemType: 'control' | 'screen') => {
    // Don't prevent default here - let the element handle it
    e.stopPropagation();
    
    const touch = e.touches[0];
    const item = itemType === 'control' ? controls[index] : screens[index];
    const frame = itemType === 'control' ? (item as ControlMapping).frame : (item as ScreenMapping).outputFrame;
    
    setHasResized(true); // Set flag when resize starts
    
    // Reset drag state when starting resize
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
      isResizing: true,
      itemType,
      itemIndex: index,
      handle,
      startX: touch.clientX,
      startY: touch.clientY,
      startWidth: frame?.width || 50,
      startHeight: frame?.height || 50,
      startLeft: frame?.x || 0,
      startTop: frame?.y || 0
    });
    
    if (itemType === 'control') {
      updateControlSelection(index);
      updateScreenSelection(null);
    } else {
      updateScreenSelection(index);
      updateControlSelection(null);
    }
  }, [controls, screens, scale]);

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
      
      // Account for scale when calculating coordinates
      const newX = (e.clientX - rect.left) / scale - dragState.offsetX;
      const newY = (e.clientY - rect.top) / scale - dragState.offsetY;
      
      let width, height;
      if (dragState.itemType === 'control') {
        const control = controls[dragState.itemIndex];
        width = control.frame?.width || 50;
        height = control.frame?.height || 50;
      } else {
        const screen = screens[dragState.itemIndex];
        width = screen.outputFrame?.width || 200;
        height = screen.outputFrame?.height || 150;
      }
      
      const canvasWidth = orientation === 'landscape' ? (device?.logicalHeight || 844) : (device?.logicalWidth || 390);
      const canvasHeight = orientation === 'landscape' ? (device?.logicalWidth || 390) : (device?.logicalHeight || 844);
      const maxX = canvasWidth - width;
      const maxY = canvasHeight - height;
      
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
        const control = controls[dragState.itemIndex];
        if (clampedX !== control.frame?.x || clampedY !== control.frame?.y) {
          const updatedControls = [...controls];
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
        const screen = screens[dragState.itemIndex];
        if (clampedX !== screen.outputFrame?.x || clampedY !== screen.outputFrame?.y) {
          const updatedScreens = [...screens];
          updatedScreens[dragState.itemIndex] = {
            ...screen,
            outputFrame: {
              ...screen.outputFrame,
              x: clampedX,
              y: clampedY
            }
          };
          updateScreensWithMirroredControls(updatedScreens);
        }
      }
    }
  }, [dragState, controls, screens, device, onControlUpdate, updateScreensWithMirroredControls, resizeState.isResizing, settings, scale]);

  // Handle resize
  const handleResize = useCallback((e: MouseEvent) => {
    if (!resizeState.isResizing || resizeState.itemIndex === null || !resizeState.itemType) return;

    // Account for scale when calculating deltas
    const deltaX = (e.clientX - resizeState.startX) / scale;
    const deltaY = (e.clientY - resizeState.startY) / scale;
    
    let newX = resizeState.startLeft;
    let newY = resizeState.startTop;
    let newWidth = resizeState.startWidth;
    let newHeight = resizeState.startHeight;

    // Check if we need to maintain aspect ratio for screens
    const shouldMaintainAspectRatio = resizeState.itemType === 'screen' && 
      screens[resizeState.itemIndex]?.maintainAspectRatio;
    
    let aspectRatio = 1;
    if (shouldMaintainAspectRatio) {
      const screen = screens[resizeState.itemIndex];
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
    const canvasWidth = orientation === 'landscape' ? (device?.logicalHeight || 844) : (device?.logicalWidth || 390);
    const canvasHeight = orientation === 'landscape' ? (device?.logicalWidth || 390) : (device?.logicalHeight || 844);
    const maxWidth = canvasWidth - newX;
    const maxHeight = canvasHeight - newY;
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
        const updatedControls = [...controls];
        updatedControls[resizeState.itemIndex] = {
          ...controls[resizeState.itemIndex],
          frame: resizePositionRef.current
        };
        onControlUpdate(updatedControls);
      } else {
        const updatedScreens = [...screens];
        updatedScreens[resizeState.itemIndex] = {
          ...screens[resizeState.itemIndex],
          outputFrame: resizePositionRef.current
        };
        updateScreensWithMirroredControls(updatedScreens);
      }
    } else if (!resizeThrottleRef.current) {
      // Schedule an update for the next frame if we haven't already
      resizeThrottleRef.current = requestAnimationFrame(() => {
        if (resizePositionRef.current && resizeState.itemIndex !== null) {
          if (resizeState.itemType === 'control') {
            const updatedControls = [...controls];
            updatedControls[resizeState.itemIndex] = {
              ...controls[resizeState.itemIndex],
              frame: resizePositionRef.current
            };
            onControlUpdate(updatedControls);
          } else {
            const updatedScreens = [...screens];
            updatedScreens[resizeState.itemIndex] = {
              ...screens[resizeState.itemIndex],
              outputFrame: resizePositionRef.current
            };
            updateScreensWithMirroredControls(updatedScreens);
          }
        }
        resizeThrottleRef.current = null;
      });
    }
  }, [resizeState, controls, screens, device, onControlUpdate, updateScreensWithMirroredControls, settings, consoleType, scale]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Always reset both states on mouse up
    const wasResizing = resizeState.isResizing;
    
    // Apply final resize position if we were resizing
    if (wasResizing && resizePositionRef.current && resizeState.itemIndex !== null && resizeState.itemType) {
      // Cancel any pending throttled update
      if (resizeThrottleRef.current) {
        cancelAnimationFrame(resizeThrottleRef.current);
        resizeThrottleRef.current = null;
      }
      
      // Apply final position
      if (resizeState.itemType === 'control') {
        const updatedControls = [...controls];
        updatedControls[resizeState.itemIndex] = {
          ...controls[resizeState.itemIndex],
          frame: resizePositionRef.current
        };
        onControlUpdate(updatedControls);
      } else {
        const updatedScreens = [...screens];
        updatedScreens[resizeState.itemIndex] = {
          ...screens[resizeState.itemIndex],
          outputFrame: resizePositionRef.current
        };
        updateScreensWithMirroredControls(updatedScreens);
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
  }, [resizeState, controls, screens, onControlUpdate, updateScreensWithMirroredControls]);

  // Handle touch move (dragging)
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (dragState.isDragging && dragState.itemIndex !== null && dragState.itemType && !resizeState.isResizing) {
      const touch = e.touches[0];
      
      // Mark that we've actually dragged (not just clicked)
      const dragDistance = Math.abs(touch.clientX - dragState.startX) + Math.abs(touch.clientY - dragState.startY);
      if (dragDistance > 5) { // Threshold to distinguish between click and drag
        setHasDragged(true);
      }

      const container = containerRef.current?.querySelector('.canvas-area');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      
      // Account for scale when calculating coordinates
      const newX = (touch.clientX - rect.left) / scale - dragState.offsetX;
      const newY = (touch.clientY - rect.top) / scale - dragState.offsetY;
      
      let width, height;
      if (dragState.itemType === 'control') {
        const control = controls[dragState.itemIndex];
        width = control.frame?.width || 50;
        height = control.frame?.height || 50;
      } else {
        const screen = screens[dragState.itemIndex];
        width = screen.outputFrame?.width || 200;
        height = screen.outputFrame?.height || 150;
      }
      
      const canvasWidth = orientation === 'landscape' ? (device?.logicalHeight || 844) : (device?.logicalWidth || 390);
      const canvasHeight = orientation === 'landscape' ? (device?.logicalWidth || 390) : (device?.logicalHeight || 844);
      const maxX = canvasWidth - width;
      const maxY = canvasHeight - height;
      
      let clampedX = Math.max(0, Math.min(newX, maxX));
      let clampedY = Math.max(0, Math.min(newY, maxY));
      
      // Apply grid snapping if enabled
      if (settings.snapToGrid) {
        clampedX = snapToGrid(clampedX, settings.gridSize);
        clampedY = snapToGrid(clampedY, settings.gridSize);
      }
      
      const newPosition = {
        x: Math.round(clampedX),
        y: Math.round(clampedY),
        width: Math.round(width),
        height: Math.round(height)
      };
      
      if (dragState.itemType === 'control') {
        const updatedControls = [...controls];
        updatedControls[dragState.itemIndex] = {
          ...controls[dragState.itemIndex],
          frame: newPosition
        };
        onControlUpdate(updatedControls);
      } else {
        const updatedScreens = [...screens];
        updatedScreens[dragState.itemIndex] = {
          ...screens[dragState.itemIndex],
          outputFrame: newPosition
        };
        updateScreensWithMirroredControls(updatedScreens);
      }
    }
  }, [dragState, controls, screens, device, onControlUpdate, updateScreensWithMirroredControls, resizeState.isResizing, settings, scale]);

  // Handle touch resize
  const handleTouchResize = useCallback((e: TouchEvent) => {
    if (!resizeState.isResizing || resizeState.itemIndex === null || !resizeState.itemType) return;

    const touch = e.touches[0];
    // Account for scale when calculating deltas
    const deltaX = (touch.clientX - resizeState.startX) / scale;
    const deltaY = (touch.clientY - resizeState.startY) / scale;
    
    let newX = resizeState.startLeft;
    let newY = resizeState.startTop;
    let newWidth = resizeState.startWidth;
    let newHeight = resizeState.startHeight;

    // Check if we need to maintain aspect ratio for screens
    const shouldMaintainAspectRatio = resizeState.itemType === 'screen' && 
      screens[resizeState.itemIndex]?.maintainAspectRatio;
    
    let aspectRatio = 1;
    if (shouldMaintainAspectRatio) {
      const screen = screens[resizeState.itemIndex];
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

    // Handle different resize handles (same logic as mouse resize)
    if (shouldMaintainAspectRatio) {
      switch (resizeState.handle) {
        case 'nw':
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newWidth = resizeState.startWidth - deltaX;
            newHeight = newWidth / aspectRatio;
            newX = resizeState.startLeft + resizeState.startWidth - newWidth;
            newY = resizeState.startTop + resizeState.startHeight - newHeight;
          } else {
            newHeight = resizeState.startHeight - deltaY;
            newWidth = newHeight * aspectRatio;
            newX = resizeState.startLeft + resizeState.startWidth - newWidth;
            newY = resizeState.startTop + resizeState.startHeight - newHeight;
          }
          break;
        case 'ne':
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newWidth = resizeState.startWidth + deltaX;
            newHeight = newWidth / aspectRatio;
            newY = resizeState.startTop + resizeState.startHeight - newHeight;
          } else {
            newHeight = resizeState.startHeight - deltaY;
            newWidth = newHeight * aspectRatio;
            newY = resizeState.startTop + resizeState.startHeight - newHeight;
          }
          break;
        case 'sw':
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newWidth = resizeState.startWidth - deltaX;
            newHeight = newWidth / aspectRatio;
            newX = resizeState.startLeft + resizeState.startWidth - newWidth;
          } else {
            newHeight = resizeState.startHeight + deltaY;
            newWidth = newHeight * aspectRatio;
            newX = resizeState.startLeft + resizeState.startWidth - newWidth;
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
          newHeight = resizeState.startHeight - deltaY;
          newWidth = newHeight * aspectRatio;
          newX = resizeState.startLeft + (resizeState.startWidth - newWidth) / 2;
          newY = resizeState.startTop + resizeState.startHeight - newHeight;
          break;
        case 's':
          newHeight = resizeState.startHeight + deltaY;
          newWidth = newHeight * aspectRatio;
          newX = resizeState.startLeft + (resizeState.startWidth - newWidth) / 2;
          break;
        case 'w':
          newWidth = resizeState.startWidth - deltaX;
          newHeight = newWidth / aspectRatio;
          newX = resizeState.startLeft + resizeState.startWidth - newWidth;
          newY = resizeState.startTop + (resizeState.startHeight - newHeight) / 2;
          break;
        case 'e':
          newWidth = resizeState.startWidth + deltaX;
          newHeight = newWidth / aspectRatio;
          newY = resizeState.startTop + (resizeState.startHeight - newHeight) / 2;
          break;
      }
    } else {
      // Non-aspect ratio resize (same as mouse)
      switch (resizeState.handle) {
        case 'nw':
          newWidth = resizeState.startWidth - deltaX;
          newHeight = resizeState.startHeight - deltaY;
          newX = resizeState.startLeft + deltaX;
          newY = resizeState.startTop + deltaY;
          break;
        case 'ne':
          newWidth = resizeState.startWidth + deltaX;
          newHeight = resizeState.startHeight - deltaY;
          newY = resizeState.startTop + deltaY;
          break;
        case 'sw':
          newWidth = resizeState.startWidth - deltaX;
          newHeight = resizeState.startHeight + deltaY;
          newX = resizeState.startLeft + deltaX;
          break;
        case 'se':
          newWidth = resizeState.startWidth + deltaX;
          newHeight = resizeState.startHeight + deltaY;
          break;
        case 'n':
          newHeight = resizeState.startHeight - deltaY;
          newY = resizeState.startTop + deltaY;
          break;
        case 's':
          newHeight = resizeState.startHeight + deltaY;
          break;
        case 'w':
          newWidth = resizeState.startWidth - deltaX;
          newX = resizeState.startLeft + deltaX;
          break;
        case 'e':
          newWidth = resizeState.startWidth + deltaX;
          break;
      }
    }

    // Apply minimum size constraints
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
    const canvasWidth = orientation === 'landscape' ? (device?.logicalHeight || 844) : (device?.logicalWidth || 390);
    const canvasHeight = orientation === 'landscape' ? (device?.logicalWidth || 390) : (device?.logicalHeight || 844);
    const maxWidth = canvasWidth - newX;
    const maxHeight = canvasHeight - newY;
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
        const updatedControls = [...controls];
        updatedControls[resizeState.itemIndex] = {
          ...controls[resizeState.itemIndex],
          frame: resizePositionRef.current
        };
        onControlUpdate(updatedControls);
      } else {
        const updatedScreens = [...screens];
        updatedScreens[resizeState.itemIndex] = {
          ...screens[resizeState.itemIndex],
          outputFrame: resizePositionRef.current
        };
        updateScreensWithMirroredControls(updatedScreens);
      }
    } else {
      // Schedule a throttled update using requestAnimationFrame
      if (!resizeThrottleRef.current) {
        resizeThrottleRef.current = requestAnimationFrame(() => {
          if (resizePositionRef.current && resizeState.itemIndex !== null && resizeState.itemType) {
            if (resizeState.itemType === 'control') {
              const updatedControls = [...controls];
              updatedControls[resizeState.itemIndex] = {
                ...controls[resizeState.itemIndex],
                frame: resizePositionRef.current
              };
              onControlUpdate(updatedControls);
            } else {
              const updatedScreens = [...screens];
              updatedScreens[resizeState.itemIndex] = {
                ...screens[resizeState.itemIndex],
                outputFrame: resizePositionRef.current
              };
              updateScreensWithMirroredControls(updatedScreens);
            }
          }
          resizeThrottleRef.current = null;
        });
      }
    }
  }, [resizeState, controls, screens, device, onControlUpdate, updateScreensWithMirroredControls, settings, consoleType, scale]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    // Apply final resize position if we were resizing
    if (resizeState.isResizing && resizePositionRef.current && resizeState.itemIndex !== null && resizeState.itemType) {
      // Cancel any pending throttled update
      if (resizeThrottleRef.current) {
        cancelAnimationFrame(resizeThrottleRef.current);
        resizeThrottleRef.current = null;
      }
      
      // Apply final position
      if (resizeState.itemType === 'control') {
        const updatedControls = [...controls];
        updatedControls[resizeState.itemIndex] = {
          ...controls[resizeState.itemIndex],
          frame: resizePositionRef.current
        };
        onControlUpdate(updatedControls);
      } else {
        const updatedScreens = [...screens];
        updatedScreens[resizeState.itemIndex] = {
          ...screens[resizeState.itemIndex],
          outputFrame: resizePositionRef.current
        };
        updateScreensWithMirroredControls(updatedScreens);
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
  }, [resizeState, controls, screens, onControlUpdate, updateScreensWithMirroredControls]);

  // Add global mouse and touch event listeners
  useEffect(() => {
    if (dragState.isDragging || resizeState.isResizing) {
      const moveHandler = resizeState.isResizing ? handleResize : handleMouseMove;
      const touchMoveHandler = resizeState.isResizing ? handleTouchResize : handleTouchMove;
      
      // Mouse events
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', handleMouseUp);
      
      // Touch events
      window.addEventListener('touchmove', touchMoveHandler, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
      
      return () => {
        // Remove mouse events
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', handleMouseUp);
        
        // Remove touch events
        window.removeEventListener('touchmove', touchMoveHandler);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, [dragState.isDragging, resizeState.isResizing, handleMouseMove, handleResize, handleMouseUp, handleTouchMove, handleTouchResize, handleTouchEnd]);

  // Handle control deletion
  const handleDeleteControl = useCallback((index: number) => {
    const updatedControls = controls.filter((_, i) => i !== index);
    onControlUpdate(updatedControls);
    updateControlSelection(null);
    setShowPropertiesPanel(false);
  }, [controls, onControlUpdate, updateControlSelection]);

  // Handle screen deletion
  const handleDeleteScreen = useCallback((index: number) => {
    const updatedScreens = screens.filter((_, i) => i !== index);
    updateScreensWithMirroredControls(updatedScreens);
    updateScreenSelection(null);
    setShowScreenPropertiesPanel(false);
  }, [screens, updateScreensWithMirroredControls, updateScreenSelection]);

  // Handle control properties update
  const handleControlPropertiesUpdate = useCallback((index: number, updates: ControlMapping) => {
    const updatedControls = controls.map((control, i) => {
      if (i === index) {
        return { ...updates };
      }
      return control;
    });
    
    onControlUpdate(updatedControls);
  }, [controls, onControlUpdate]);

  // Handle screen properties update
  const handleScreenPropertiesUpdate = useCallback((index: number, updates: ScreenMapping) => {
    const updatedScreens = screens.map((screen, i) => {
      if (i === index) {
        return updates; // Use the updates directly, as they should already be complete
      }
      return screen;
    });
    
    updateScreensWithMirroredControls(updatedScreens);
  }, [screens, updateScreensWithMirroredControls]);

  // Handle nudging for selected items
  const handleNudge = useCallback((dx: number, dy: number) => {
    if (selectedControl !== null && controls[selectedControl]) {
      const control = controls[selectedControl];
      if (control.locked) return; // Don't nudge locked controls
      
      const updatedControls = [...controls];
      updatedControls[selectedControl] = {
        ...control,
        frame: {
          ...control.frame,
          x: Math.max(0, Math.min(canvasSize.width - control.frame.width, control.frame.x + dx)),
          y: Math.max(0, Math.min(canvasSize.height - control.frame.height, control.frame.y + dy))
        }
      };
      onControlUpdate(updatedControls);
    } else if (selectedScreen !== null && screens[selectedScreen]) {
      const screen = screens[selectedScreen];
      if (screen.locked) return; // Don't nudge locked screens
      
      const updatedScreens = [...screens];
      updatedScreens[selectedScreen] = {
        ...screen,
        outputFrame: {
          ...screen.outputFrame,
          x: Math.max(0, Math.min(canvasSize.width - screen.outputFrame.width, screen.outputFrame.x + dx)),
          y: Math.max(0, Math.min(canvasSize.height - screen.outputFrame.height, screen.outputFrame.y + dy))
        }
      };
      onScreenUpdate(updatedScreens);
    }
  }, [selectedControl, selectedScreen, controls, screens, canvasSize, onControlUpdate, onScreenUpdate]);

  // Handle tab navigation
  const handleTabNavigation = useCallback((forward: boolean) => {
    const totalControls = controls.length;
    if (totalControls === 0) return;

    let nextIndex: number;
    if (selectedControl === null) {
      // No selection, start at beginning or end
      nextIndex = forward ? 0 : totalControls - 1;
    } else {
      // Calculate next index with wrapping
      if (forward) {
        nextIndex = (selectedControl + 1) % totalControls;
      } else {
        nextIndex = selectedControl === 0 ? totalControls - 1 : selectedControl - 1;
      }
    }

    updateControlSelection(nextIndex);
    updateScreenSelection(null);
    setShowPropertiesPanel(false);
    setShowScreenPropertiesPanel(false);
  }, [selectedControl, controls.length, updateControlSelection, updateScreenSelection]);

  // Keyboard shortcuts configuration
  const shortcuts: ShortcutConfig[] = [
    // Delete/Backspace - Delete selected item
    {
      key: 'Delete',
      handler: () => {
        if (selectedControl !== null) {
          handleDeleteControl(selectedControl);
        } else if (selectedScreen !== null) {
          handleDeleteScreen(selectedScreen);
        }
      }
    },
    {
      key: 'Backspace',
      handler: () => {
        if (selectedControl !== null) {
          handleDeleteControl(selectedControl);
        } else if (selectedScreen !== null) {
          handleDeleteScreen(selectedScreen);
        }
      }
    },
    // Arrow keys - Nudge selected item
    {
      key: 'ArrowUp',
      handler: () => handleNudge(0, -1)
    },
    {
      key: 'ArrowUp',
      modifiers: { shift: true },
      handler: () => handleNudge(0, -10)
    },
    {
      key: 'ArrowDown',
      handler: () => handleNudge(0, 1)
    },
    {
      key: 'ArrowDown',
      modifiers: { shift: true },
      handler: () => handleNudge(0, 10)
    },
    {
      key: 'ArrowLeft',
      handler: () => handleNudge(-1, 0)
    },
    {
      key: 'ArrowLeft',
      modifiers: { shift: true },
      handler: () => handleNudge(-10, 0)
    },
    {
      key: 'ArrowRight',
      handler: () => handleNudge(1, 0)
    },
    {
      key: 'ArrowRight',
      modifiers: { shift: true },
      handler: () => handleNudge(10, 0)
    },
    // Escape - Deselect
    {
      key: 'Escape',
      handler: () => {
        updateControlSelection(null);
        updateScreenSelection(null);
        setShowPropertiesPanel(false);
        setShowScreenPropertiesPanel(false);
      }
    },
    // Tab - Navigate controls
    {
      key: 'Tab',
      handler: () => handleTabNavigation(true)
    },
    {
      key: 'Tab',
      modifiers: { shift: true },
      handler: () => handleTabNavigation(false)
    }
  ];

  // Use the keyboard shortcuts hook
  useKeyboardShortcuts(shortcuts, [
    selectedControl, 
    selectedScreen, 
    handleDeleteControl, 
    handleDeleteScreen,
    handleNudge,
    handleTabNavigation,
    controls,
    screens
  ]);

  return (
    <>
      <div 
        id="canvas-container"
        ref={containerRef}
        className="w-full bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex justify-center box-border"
        style={{ 
          boxSizing: 'border-box'
        }}
      >
      {device ? (
        <div 
          id="canvas-wrapper" 
          ref={canvasWrapperRef}
          className="inline-flex flex-col items-start" 
          style={{ 
            minWidth: 'min-content',
            transform: `scale(${scale})`,
            transformOrigin: 'top center'
          }}>
          <div 
            id="canvas-drawing-area"
            className="canvas-area relative border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden mx-auto [&>*]:box-border touch-interactive"
            style={{
              boxSizing: 'content-box',
              width: canvasSize.width,
              height: canvasSize.height,
              cursor: resizeState.isResizing ? 'grabbing' : 'auto'
            }}
            onClick={() => {
              updateControlSelection(null);
              updateScreenSelection(null);
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
            {menuInsetsEnabled && device && (
              <>
                {/* Portrait: Bottom inset */}
                {orientation === 'portrait' && menuInsetsBottom > 0 && (
                  <div 
                    id="menu-insets-overlay-bottom"
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                      top: `${(1 - menuInsetsBottom / 100) * canvasSize.height}px`,
                      height: `${(menuInsetsBottom / 100) * canvasSize.height}px`,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderTop: '1px dashed rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    <div className="absolute top-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                      Bottom: {menuInsetsBottom}%
                    </div>
                  </div>
                )}
                
                {/* Landscape: Left inset */}
                {orientation === 'landscape' && menuInsetsLeft > 0 && (
                  <div 
                    id="menu-insets-overlay-left"
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{
                      left: 0,
                      width: `${(menuInsetsLeft / 100) * canvasSize.width}px`,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRight: '1px dashed rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    <div className="absolute top-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                      Left: {menuInsetsLeft}%
                    </div>
                  </div>
                )}
                
                {/* Landscape: Right inset */}
                {orientation === 'landscape' && menuInsetsRight > 0 && (
                  <div 
                    id="menu-insets-overlay-right"
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{
                      right: 0,
                      width: `${(menuInsetsRight / 100) * canvasSize.width}px`,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderLeft: '1px dashed rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    <div className="absolute top-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                      Right: {menuInsetsRight}%
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Render screens (lower in DOM but higher z-index than controls) */}
            {screens.map((screen, index) => {
              const x = screen.outputFrame?.x || 0;
              const y = screen.outputFrame?.y || 0;
              const width = screen.outputFrame?.width || 200;
              const height = screen.outputFrame?.height || 150;
              const isSelected = selectedScreen === index;
              
              // Check if this is the bottom screen and if any touchscreen is mirroring it
              const isBottomScreen = screen.label === 'Bottom Screen';
              const hasMirroredTouchscreen = isBottomScreen && controls.some(control => {
                const isTouchscreen = control.inputs && typeof control.inputs === 'object' && !Array.isArray(control.inputs) &&
                  'x' in control.inputs && 'y' in control.inputs && 
                  control.inputs.x === 'touchScreenX' && control.inputs.y === 'touchScreenY';
                return isTouchscreen && control.mirrorBottomScreen === true;
              });

              return (
                <div
                  id={`screen-${index}`}
                  key={screen.id || `screen-${index}`}
                  className={`absolute border-2 rounded group touch-interactive ${
                    isSelected 
                      ? (screen.locked ? 'border-gray-500 bg-gray-500/20 ring-2 ring-gray-500/50' : 'border-green-500 bg-green-500/20 ring-2 ring-green-500/50')
                      : (screen.locked ? 'border-gray-400 bg-gray-400/10' : 'border-green-400 bg-green-400/10 hover:border-green-500 hover:bg-green-500/20')
                  } ${dragState.isDragging && dragState.itemIndex === index && dragState.itemType === 'screen' ? 'opacity-75' : ''}`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    zIndex: isSelected ? 40 : 30, // Screens have higher z-index than controls
                    cursor: screen.locked ? 'default' : (dragState.isDragging ? 'grabbing' : 'move'),
                    transition: (dragState.isDragging && dragState.itemIndex === index && dragState.itemType === 'screen') || 
                                (resizeState.isResizing && resizeState.itemIndex === index && resizeState.itemType === 'screen') 
                                ? 'none' : 'all 75ms'
                  }}
                  onMouseDown={(e) => !screen.locked && handleMouseDown(e, index, 'screen')}
                  onTouchStart={(e) => !screen.locked && handleTouchStart(e, index, 'screen')}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Select the screen (don't open properties panel - use settings button for that)
                    if (!hasDragged && !hasResized) {
                      updateScreenSelection(index);
                      updateControlSelection(null);
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

                  {/* Touchscreen indicator - shows when touchscreen is mirroring this screen */}
                  {hasMirroredTouchscreen && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-purple-500/90 rounded-full flex items-center justify-center shadow-md" title="Touchscreen mirroring active">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Control buttons above element like macOS stoplight */}
                  <div 
                    className="absolute -top-6 left-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      gap: screen.outputFrame.width < 65 ? Math.max((screen.outputFrame.width - 50) * 0.4, 0) + 'px' : '6px'
                    }}
                  >
                    {/* Settings button - green */}
                    <button
                      id={`screen-settings-${index}`}
                      className="w-4 h-4 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateScreenSelection(index, true);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`Settings for ${screen.label || 'screen'}`}
                    >
                      <svg className="w-2.5 h-2.5 text-white opacity-0 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    
                    {/* Lock button - yellow */}
                    <button
                      id={`screen-lock-${index}`}
                      className="w-4 h-4 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center shadow-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedScreens = [...screens];
                        updatedScreens[index] = { ...screen, locked: !screen.locked };
                        onScreenUpdate(updatedScreens);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`${screen.locked ? 'Unlock' : 'Lock'} ${screen.label || 'screen'}`}
                    >
                      <svg className="w-2.5 h-2.5 text-white opacity-0 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {screen.locked ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        )}
                      </svg>
                    </button>
                    
                    {/* Delete button - red */}
                    <button
                      id={`screen-delete-${index}`}
                      className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScreen(index);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`Delete ${screen.label || 'screen'} (Delete/Backspace)`}
                      title="Delete (Delete/Backspace)"
                    >
                      <svg className="w-2.5 h-2.5 text-white opacity-0 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Resize handles (visible when selected and not locked) */}
                  {isSelected && !screen.locked && (
                    <>
                      {/* Corner handles */}
                      <div 
                        className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-nw-resize hover:bg-green-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'nw', 'screen')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'nw', 'screen')}
                      />
                      <div 
                        className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-ne-resize hover:bg-green-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'ne', 'screen')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'ne', 'screen')}
                      />
                      <div 
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-sw-resize hover:bg-green-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'sw', 'screen')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'sw', 'screen')}
                      />
                      <div 
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-se-resize hover:bg-green-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'se', 'screen')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'se', 'screen')}
                      />
                      
                      {/* Edge handles */}
                      <div 
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-n-resize hover:bg-green-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'n', 'screen')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'n', 'screen')}
                      />
                      <div 
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-s-resize hover:bg-green-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 's', 'screen')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 's', 'screen')}
                      />
                      <div 
                        className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-w-resize hover:bg-green-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'w', 'screen')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'w', 'screen')}
                      />
                      <div 
                        className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-e-resize hover:bg-green-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'e', 'screen')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'e', 'screen')}
                      />
                      
                    </>
                  )}
                </div>
              );
            })}

            {/* Render controls */}
            {controls.map((control, index) => {
              // Check if this is a touchscreen control
              const isTouchscreen = control.inputs && typeof control.inputs === 'object' && !Array.isArray(control.inputs) &&
                'x' in control.inputs && 'y' in control.inputs && 
                control.inputs.x === 'touchScreenX' && control.inputs.y === 'touchScreenY';
                
              // Skip rendering if this is a locked touchscreen
              if (isTouchscreen && control.mirrorBottomScreen === true) {
                return null;
              }
              const x = control.frame?.x || 0;
              const y = control.frame?.y || 0;
              const width = control.frame?.width || 50;
              const height = control.frame?.height || 50;
              const isSelected = selectedControl === index;
              const label = control.label || (() => {
                if (Array.isArray(control.inputs)) {
                  return control.inputs.map(i => i.toUpperCase()).join('+') || 'Control';
                } else if (typeof control.inputs === 'object') {
                  // Handle object inputs (thumbstick, touchscreen)
                  if ('up' in control.inputs && 'down' in control.inputs) {
                    return 'Thumbstick';
                  } else if ('x' in control.inputs && 'y' in control.inputs) {
                    return 'Touchscreen';
                  }
                  return 'Control';
                } else if (typeof control.inputs === 'string') {
                  return control.inputs.toUpperCase() || 'Control';
                } else {
                  return 'Control';
                }
              })();
              
              // Check if this is a thumbstick control
              const isThumbstick = control.inputs && typeof control.inputs === 'object' && !Array.isArray(control.inputs) &&
                'up' in control.inputs && control.inputs.up === 'analogStickUp';
                
              // Check if this touchscreen is locked (mirroring bottom screen)
              const isLocked = isTouchscreen && control.mirrorBottomScreen === true;
              const thumbstickImageUrl = control.id && thumbstickImages[control.id];
              
              // Determine which controls should use icons
              const controlKey = Array.isArray(control.inputs) ? control.inputs[0] : 
                               typeof control.inputs === 'string' ? control.inputs : '';
              const isDpad = controlKey === 'dpad';
              const isDirectional = ['up', 'down', 'left', 'right'].includes(controlKey);
              const isMenu = controlKey === 'menu';
              const isFastForward = controlKey === 'fastForward';
              const isToggleFastForward = controlKey === 'toggleFastForward';
              
              // Function to get rotation for directional buttons
              const getDirectionalRotation = () => {
                switch (controlKey) {
                  case 'up': return 'rotate(0deg)';
                  case 'down': return 'rotate(180deg)';
                  case 'left': return 'rotate(-90deg)';
                  case 'right': return 'rotate(90deg)';
                  default: return 'rotate(0deg)';
                }
              };

              return (
                <div
                  id={`control-${index}`}
                  key={index}
                  className={`control absolute border-2 rounded group touch-interactive ${
                    isSelected 
                      ? (control.locked ? 'border-purple-500 bg-purple-500/40 ring-2 ring-purple-500/50' : 'border-blue-500 bg-blue-500/40 ring-2 ring-blue-500/50')
                      : (control.locked ? 'border-purple-400 bg-purple-400/30' : 'border-blue-400 bg-blue-400/30 hover:border-blue-500 hover:bg-blue-500/40')
                  } ${dragState.isDragging && dragState.itemIndex === index && dragState.itemType === 'control' ? 'opacity-75' : ''}`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    zIndex: isSelected ? 20 : 10, // Controls have lower z-index than screens
                    cursor: control.locked ? 'default' : (dragState.isDragging ? 'grabbing' : 'move'),
                    transition: (dragState.isDragging && dragState.itemIndex === index && dragState.itemType === 'control') || 
                                (resizeState.isResizing && resizeState.itemIndex === index && resizeState.itemType === 'control') 
                                ? 'none' : 'all 75ms'
                  }}
                  onMouseDown={(e) => !control.locked && handleMouseDown(e, index, 'control')}
                  onTouchStart={(e) => !control.locked && handleTouchStart(e, index, 'control')}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Select the control (don't open properties panel - use settings button for that)
                    if (!hasDragged && !hasResized) {
                      updateControlSelection(index);
                      updateScreenSelection(null);
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
                    ) : isDpad ? (
                      // D-pad icon
                      <div className="w-10 h-10 rounded-full bg-gray-400/50 dark:bg-gray-600/50 flex items-center justify-center">
                        <img 
                          src={DpadIcon}
                          alt="D-pad"
                          className="w-6 h-6 filter invert"
                        />
                      </div>
                    ) : isDirectional ? (
                      // Directional arrow icon
                      <div className="w-10 h-10 rounded-full bg-gray-400/50 dark:bg-gray-600/50 flex items-center justify-center">
                        <img 
                          src={ArrowIcon}
                          alt={`${label} arrow`}
                          className="w-5 h-5 filter invert"
                          style={{
                            transform: getDirectionalRotation()
                          }}
                        />
                      </div>
                    ) : isMenu ? (
                      // Menu icon
                      <div className="w-10 h-10 rounded-full bg-gray-400/50 dark:bg-gray-600/50 flex items-center justify-center">
                        <img 
                          src={MenuIcon}
                          alt="Menu"
                          className="w-5 h-5 filter invert"
                        />
                      </div>
                    ) : isFastForward ? (
                      // Fast Forward icon
                      <div className="w-10 h-10 rounded-full bg-gray-400/50 dark:bg-gray-600/50 flex items-center justify-center">
                        <img 
                          src={FastForwardIcon}
                          alt="Fast Forward"
                          className="w-5 h-5 filter invert"
                        />
                      </div>
                    ) : isToggleFastForward ? (
                      // Toggle Fast Forward icon
                      <div className="w-10 h-10 rounded-full bg-gray-400/50 dark:bg-gray-600/50 flex items-center justify-center">
                        <img 
                          src={FastForwardToggleIcon}
                          alt="Toggle Fast Forward"
                          className="w-5 h-5 filter invert"
                        />
                      </div>
                    ) : (
                      // Default text label with gray circle background
                      <div className="w-10 h-10 rounded-full bg-gray-400/50 dark:bg-gray-600/50 flex items-center justify-center">
                        <span id={`control-text-${index}`} className="text-white font-bold text-sm select-none flex items-center gap-1">
                          {isThumbstick ? 'TS' : 
                           controlKey === 'start' ? 'ST' :
                           controlKey === 'select' ? 'SE' :
                           controlKey === 'quickSave' ? 'QS' :
                           controlKey === 'quickLoad' ? 'QL' :
                           label.length > 2 ? label.substring(0, 2) : label}
                          {isLocked && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </span>
                      </div>
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

                  {/* Control buttons above element like macOS stoplight */}
                  <div 
                    className="absolute -top-6 left-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      gap: control.frame.width < 65 ? Math.max((control.frame.width - 50) * 0.4, 0) + 'px' : '6px'
                    }}
                  >
                    {/* Settings button - green */}
                    <button
                      id={`control-settings-${index}`}
                      className="w-4 h-4 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateControlSelection(index, true);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`Settings for ${label} control`}
                    >
                      <svg className="w-2.5 h-2.5 text-white opacity-0 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    
                    {/* Lock button - yellow */}
                    <button
                      id={`control-lock-${index}`}
                      className="w-4 h-4 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center shadow-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedControls = [...controls];
                        updatedControls[index] = { ...control, locked: !control.locked };
                        onControlUpdate(updatedControls);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`${control.locked ? 'Unlock' : 'Lock'} ${label} control`}
                    >
                      <svg className="w-2.5 h-2.5 text-white opacity-0 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {control.locked ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        )}
                      </svg>
                    </button>
                    
                    {/* Delete button - red */}
                    <button
                      id={`control-delete-${index}`}
                      className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteControl(index);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`Delete ${label} control (Delete/Backspace)`}
                      title="Delete (Delete/Backspace)"
                    >
                      <svg className="w-2.5 h-2.5 text-white opacity-0 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Resize handles (visible when selected and not locked) */}
                  {isSelected && !control.locked && (
                    <>
                      {/* Corner handles */}
                      <div 
                        id={`resize-handle-nw-${index}`}
                        className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:bg-blue-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'nw', 'control')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'nw', 'control')}
                      />
                      <div 
                        id={`resize-handle-ne-${index}`}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:bg-blue-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'ne', 'control')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'ne', 'control')}
                      />
                      <div 
                        id={`resize-handle-sw-${index}`}
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:bg-blue-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'sw', 'control')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'sw', 'control')}
                      />
                      <div 
                        id={`resize-handle-se-${index}`}
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:bg-blue-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'se', 'control')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'se', 'control')}
                      />
                      
                      {/* Edge handles */}
                      <div 
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-n-resize hover:bg-blue-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'n', 'control')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'n', 'control')}
                      />
                      <div 
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-s-resize hover:bg-blue-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 's', 'control')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 's', 'control')}
                      />
                      <div 
                        className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-w-resize hover:bg-blue-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'w', 'control')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'w', 'control')}
                      />
                      <div 
                        className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-e-resize hover:bg-blue-100 touch-interactive"
                        onMouseDown={(e) => handleResizeStart(e, index, 'e', 'control')}
                        onTouchStart={(e) => handleResizeTouchStart(e, index, 'e', 'control')}
                      />
                      
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Device info */}
          <div id="device-info-section" className="mt-4">
            <DeviceInfo device={device} scale={scale} orientation={orientation} />
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
                screens={screens}
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
                deviceWidth={canvasSize.width}
                deviceHeight={canvasSize.height}
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