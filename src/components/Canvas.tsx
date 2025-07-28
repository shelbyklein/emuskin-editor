// Canvas component with draggable and resizable controls
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Device, ControlMapping } from '../types';
import DeviceInfo from './DeviceInfo';
import ControlPropertiesPanel from './ControlPropertiesPanel';
import { useEditor } from '../contexts/EditorContext';
import { useTheme } from '../contexts/ThemeContext';

interface CanvasProps {
  device: Device | null;
  backgroundImage: string | null;
  controls: ControlMapping[];
  onControlUpdate: (controls: ControlMapping[]) => void;
}

interface DragState {
  isDragging: boolean;
  controlIndex: number | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface ResizeState {
  isResizing: boolean;
  controlIndex: number | null;
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
  onControlUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [selectedControl, setSelectedControl] = useState<number | null>(null);
  const { settings } = useEditor();
  const { isDark } = useTheme();
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  // Helper function to snap value to grid
  const snapToGrid = (value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize;
  };
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    controlIndex: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    controlIndex: null,
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

  // Handle mouse down on control
  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Reset drag flag at start of new interaction
    setHasDragged(false);
    
    setDragState({
      isDragging: true,
      controlIndex: index,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    });
    
    setSelectedControl(index);
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, index: number, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const control = controls[index];
    
    setResizeState({
      isResizing: true,
      controlIndex: index,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: control.frame?.width || 50,
      startHeight: control.frame?.height || 50,
      startLeft: control.frame?.x || 0,
      startTop: control.frame?.y || 0
    });
    
    setSelectedControl(index);
  }, [controls]);

  // Handle mouse move (dragging)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragState.isDragging && dragState.controlIndex !== null && !resizeState.isResizing) {
      // Mark that we've actually dragged (not just clicked)
      const dragDistance = Math.abs(e.clientX - dragState.startX) + Math.abs(e.clientY - dragState.startY);
      if (dragDistance > 5) { // Threshold to distinguish between click and drag
        setHasDragged(true);
      }

      const container = containerRef.current?.querySelector('.canvas-area');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const control = controls[dragState.controlIndex];
      
      const newX = e.clientX - rect.left - dragState.offsetX;
      const newY = e.clientY - rect.top - dragState.offsetY;
      
      const maxX = (device?.logicalWidth || 390) - (control.frame?.width || 50);
      const maxY = (device?.logicalHeight || 844) - (control.frame?.height || 50);
      
      let clampedX = Math.max(0, Math.min(newX, maxX));
      let clampedY = Math.max(0, Math.min(newY, maxY));
      
      // Apply grid snapping if enabled
      if (settings.snapToGrid) {
        clampedX = snapToGrid(clampedX, settings.gridSize);
        clampedY = snapToGrid(clampedY, settings.gridSize);
      }
      
      const updatedControls = [...controls];
      updatedControls[dragState.controlIndex] = {
        ...control,
        frame: {
          ...control.frame,
          x: Math.round(clampedX),
          y: Math.round(clampedY)
        }
      };
      
      onControlUpdate(updatedControls);
    }
  }, [dragState, controls, scale, device, onControlUpdate, resizeState.isResizing, settings]);

  // Handle resize
  const handleResize = useCallback((e: MouseEvent) => {
    if (!resizeState.isResizing || resizeState.controlIndex === null) return;

    const control = controls[resizeState.controlIndex];
    const deltaX = e.clientX - resizeState.startX;
    const deltaY = e.clientY - resizeState.startY;
    
    let newX = resizeState.startLeft;
    let newY = resizeState.startTop;
    let newWidth = resizeState.startWidth;
    let newHeight = resizeState.startHeight;

    // Handle different resize handles
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

    const updatedControls = [...controls];
    updatedControls[resizeState.controlIndex] = {
      ...control,
      frame: {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newWidth),
        height: Math.round(newHeight)
      }
    };
    
    onControlUpdate(updatedControls);
  }, [resizeState, controls, scale, device, onControlUpdate, settings]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Don't reset hasDragged here - let the click handler deal with it
    setDragState({
      isDragging: false,
      controlIndex: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0
    });
    setResizeState({
      isResizing: false,
      controlIndex: null,
      handle: '',
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      startLeft: 0,
      startTop: 0
    });
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging || resizeState.isResizing) {
      const moveHandler = resizeState.isResizing ? handleResize : handleMouseMove;
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, resizeState.isResizing, handleMouseMove, handleResize, handleMouseUp]);

  // Handle control deletion
  const handleDeleteControl = useCallback((index: number) => {
    const updatedControls = controls.filter((_, i) => i !== index);
    onControlUpdate(updatedControls);
    setSelectedControl(null);
    setShowPropertiesPanel(false);
  }, [controls, onControlUpdate]);

  // Handle control properties update
  const handleControlPropertiesUpdate = useCallback((index: number, updates: ControlMapping) => {
    // Create a new array with a new control object to ensure React detects the change
    const updatedControls = controls.map((control, i) => {
      if (i === index) {
        return { ...updates }; // Create a new object
      }
      return control;
    });
    
    onControlUpdate(updatedControls);
  }, [controls, onControlUpdate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedControl !== null && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        handleDeleteControl(selectedControl);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedControl, handleDeleteControl]);

  return (
    <div 
      id="canvas-container"
      ref={containerRef}
      className="w-full bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex justify-center"
    >
      {device ? (
        <div id="canvas-wrapper" className="inline-flex flex-col items-start">
          <div 
            id="canvas-drawing-area"
            className="canvas-area relative border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden mx-auto"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              cursor: resizeState.isResizing ? 'grabbing' : 'auto'
            }}
            onClick={() => {
              setSelectedControl(null);
              setShowPropertiesPanel(false);
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

            {/* Render controls */}
            {controls.map((control, index) => {
              const x = control.frame?.x || 0;
              const y = control.frame?.y || 0;
              const width = control.frame?.width || 50;
              const height = control.frame?.height || 50;
              const isSelected = selectedControl === index;
              const label = Array.isArray(control.inputs) 
                ? control.inputs[0] || 'Control'
                : control.inputs || 'Control';

              return (
                <div
                  id={`control-${index}`}
                  key={index}
                  className={`absolute border-2 rounded transition-all duration-75 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500/40 ring-2 ring-blue-500/50' 
                      : 'border-blue-400 bg-blue-400/30 hover:border-blue-500 hover:bg-blue-500/40'
                  } ${dragState.isDragging && dragState.controlIndex === index ? 'opacity-75' : ''}`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    cursor: dragState.isDragging ? 'grabbing' : 'move'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, index)}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Only show properties panel if we didn't just drag
                    if (!hasDragged) {
                      setSelectedControl(index);
                      setShowPropertiesPanel(true);
                    }
                    setHasDragged(false); // Reset for next interaction
                  }}
                >
                  {/* Control label */}
                  <div id={`control-label-${index}`} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span id={`control-text-${index}`} className="text-gray-800 dark:text-gray-200 font-medium text-sm select-none">
                      {label}
                    </span>
                  </div>

                  {/* Resize handles (visible when selected) */}
                  {isSelected && (
                    <>
                      {/* Corner handles */}
                      <div 
                        id={`resize-handle-nw-${index}`}
                        className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'nw')}
                      />
                      <div 
                        id={`resize-handle-ne-${index}`}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'ne')}
                      />
                      <div 
                        id={`resize-handle-sw-${index}`}
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'sw')}
                      />
                      <div 
                        id={`resize-handle-se-${index}`}
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'se')}
                      />
                      
                      {/* Edge handles */}
                      <div 
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-n-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'n')}
                      />
                      <div 
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-s-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 's')}
                      />
                      <div 
                        className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-w-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'w')}
                      />
                      <div 
                        className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-e-resize hover:bg-blue-100"
                        onMouseDown={(e) => handleResizeStart(e, index, 'e')}
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
                      
                      {/* Extended edges visualization */}
                      {(control.extendedEdges?.top || control.extendedEdges?.bottom || 
                        control.extendedEdges?.left || control.extendedEdges?.right) && (
                        <div 
                          className="absolute pointer-events-none border-2 border-dashed border-purple-400 opacity-50"
                          style={{
                            top: `${-(control.extendedEdges?.top || 0)}px`,
                            bottom: `${-(control.extendedEdges?.bottom || 0)}px`,
                            left: `${-(control.extendedEdges?.left || 0)}px`,
                            right: `${-(control.extendedEdges?.right || 0)}px`,
                          }}
                        />
                      )}
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
            <p>• Click and drag controls to reposition</p>
            <p>• Drag corner/edge handles to resize</p>
            <p>• Click a control to select, then press Delete to remove</p>
            <p>• Click empty space to deselect</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Select a device to begin
        </p>
      )}
      
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
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;