// Screen properties panel for editing screen position and size
import React, { useState, useEffect } from 'react';
import { ScreenMapping } from '../types';
import { useEditor } from '../contexts/EditorContext';

interface ScreenPropertiesPanelProps {
  screen: ScreenMapping | null;
  screenIndex: number | null;
  consoleType: string;
  deviceWidth?: number;
  deviceHeight?: number;
  onUpdate: (index: number, updates: ScreenMapping) => void;
  onClose: () => void;
}

const ScreenPropertiesPanel: React.FC<ScreenPropertiesPanelProps> = ({
  screen,
  screenIndex,
  consoleType,
  deviceWidth = 390,
  deviceHeight = 844,
  onUpdate,
  onClose
}) => {
  const { settings } = useEditor();
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(screen?.maintainAspectRatio ?? true);
  
  // Local state for form inputs
  const [formData, setFormData] = useState({
    x: 0,
    y: 0,
    width: 200,
    height: 150
  });

  // Get aspect ratio for the screen
  const getAspectRatio = () => {
    if (screen?.inputFrame) {
      return screen.inputFrame.width / screen.inputFrame.height;
    }
    // Default aspect ratios based on console type
    const aspectRatios: { [key: string]: number } = {
      'gbc': 160 / 144,  // 10:9
      'gba': 240 / 160,  // 3:2
      'nds': 256 / 192,  // 4:3
      'nes': 256 / 240,  // 16:15
      'snes': 256 / 224, // 8:7
      'n64': 256 / 224,  // 8:7
      'sg': 4 / 3,       // 4:3 (default)
      'ps1': 4 / 3       // 4:3
    };
    return aspectRatios[consoleType] || 1.333;
  };

  // Update form when screen changes
  useEffect(() => {
    if (screen) {
      setFormData({
        x: screen.outputFrame?.x || 0,
        y: screen.outputFrame?.y || 0,
        width: screen.outputFrame?.width || 200,
        height: screen.outputFrame?.height || 150
      });
      setMaintainAspectRatio(screen.maintainAspectRatio ?? true);
    }
  }, [screen?.outputFrame?.x, screen?.outputFrame?.y, screen?.outputFrame?.width, screen?.outputFrame?.height, screen?.maintainAspectRatio]);

  if (!screen || screenIndex === null) {
    return null;
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseInt(value) || 0;
    
    if (maintainAspectRatio && (field === 'width' || field === 'height')) {
      const aspectRatio = getAspectRatio();
      
      if (field === 'width') {
        setFormData(prev => ({
          ...prev,
          width: numValue,
          height: Math.round(numValue / aspectRatio)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          height: numValue,
          width: Math.round(numValue * aspectRatio)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const handleApply = () => {
    if (!screen || screenIndex === null) {
      return;
    }
    
    // Apply grid snapping if enabled
    let finalX = formData.x;
    let finalY = formData.y;
    let finalWidth = formData.width;
    let finalHeight = formData.height;

    if (settings.snapToGrid) {
      const snap = (val: number) => Math.round(val / settings.gridSize) * settings.gridSize;
      finalX = snap(finalX);
      finalY = snap(finalY);
      finalWidth = snap(finalWidth);
      finalHeight = snap(finalHeight);
    }

    // Create updated screen object
    const updatedScreen: ScreenMapping = {
      ...screen,
      outputFrame: {
        x: Math.max(0, finalX),
        y: Math.max(0, finalY),
        width: Math.max(20, finalWidth),
        height: Math.max(20, finalHeight)
      },
      maintainAspectRatio
    };

    onUpdate(screenIndex, updatedScreen);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: keyof typeof formData) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const increment = e.shiftKey ? 10 : 1;
      handleInputChange(field, String(formData[field] + increment));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const decrement = e.shiftKey ? 10 : 1;
      handleInputChange(field, String(formData[field] - decrement));
    } else if (e.key === 'Enter') {
      handleApply();
    }
  };

  // Check if current aspect ratio matches recommended
  const currentAspectRatio = formData.width / formData.height;
  const recommendedAspectRatio = getAspectRatio();
  const aspectRatioMatch = Math.abs(currentAspectRatio - recommendedAspectRatio) < 0.01;

  return (
    <div id="screen-properties-panel" className="bg-white dark:bg-gray-800 rounded-t-xl shadow-2xl p-6 w-full max-w-2xl">
      <div id="properties-panel-header" className="flex justify-between items-center mb-4">
        <h3 id="properties-panel-title" className="text-lg font-medium text-gray-900 dark:text-white">
          Screen Properties
        </h3>
        <button
          id="screen-properties-close"
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          aria-label="Close properties panel"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div id="screen-label-display" className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        <strong>Editing: {screen.label || 'Game Screen'}</strong>
      </div>

      {/* Aspect Ratio Toggle */}
      <div id="aspect-ratio-section" className="mb-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center space-x-2">
          <label htmlFor="maintain-aspect-ratio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Maintain Aspect Ratio
          </label>
          <div className="group relative">
            <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Locks width/height ratio to match the console's native display
            </div>
          </div>
        </div>
        <input
          id="maintain-aspect-ratio"
          type="checkbox"
          checked={maintainAspectRatio}
          onChange={(e) => setMaintainAspectRatio(e.target.checked)}
          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      {/* Aspect Ratio Warning */}
      {!aspectRatioMatch && (
        <div id="aspect-ratio-warning" className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            <strong>Warning:</strong> Current aspect ratio ({currentAspectRatio.toFixed(2)}) doesn't match the recommended ratio ({recommendedAspectRatio.toFixed(2)}). This may cause the game display to appear stretched or squished.
          </p>
        </div>
      )}

      {/* Alignment Buttons */}
      <div id="alignment-buttons" className="mb-4 grid grid-cols-4 gap-2">
        <button
          onClick={() => {
            if (!screen || screenIndex === null) return;
            
            // Scale
            const aspectRatio = getAspectRatio();
            
            let newWidth = deviceWidth;
            let newHeight = newWidth / aspectRatio;
            
            if (newHeight > deviceHeight) {
              newHeight = deviceHeight;
              newWidth = newHeight * aspectRatio;
            }
            
            if (settings.snapToGrid) {
              newWidth = Math.round(newWidth / settings.gridSize) * settings.gridSize;
              newHeight = Math.round(newHeight / settings.gridSize) * settings.gridSize;
            }
            
            // Update immediately
            const updatedScreen: ScreenMapping = {
              ...screen,
              outputFrame: {
                ...screen.outputFrame,
                width: Math.round(newWidth),
                height: Math.round(newHeight)
              }
            };
            
            onUpdate(screenIndex, updatedScreen);
            
            // Update form to reflect changes
            setFormData(prev => ({
              ...prev,
              width: Math.round(newWidth),
              height: Math.round(newHeight)
            }));
          }}
          className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
        >
          Scale
        </button>
        
        <button
          onClick={() => {
            if (!screen || screenIndex === null) return;
            
            // Align Left
            let newX = 20;
            if (settings.snapToGrid) {
              newX = Math.round(newX / settings.gridSize) * settings.gridSize;
            }
            
            // Update immediately
            const updatedScreen: ScreenMapping = {
              ...screen,
              outputFrame: {
                ...screen.outputFrame,
                x: newX
              }
            };
            
            onUpdate(screenIndex, updatedScreen);
            
            // Update form to reflect changes
            setFormData(prev => ({ ...prev, x: newX }));
          }}
          className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Align Left
        </button>
        
        <button
          onClick={() => {
            if (!screen || screenIndex === null) return;
            
            // Center Horizontally
            let newX = (deviceWidth - screen.outputFrame.width) / 2;
            if (settings.snapToGrid) {
              newX = Math.round(newX / settings.gridSize) * settings.gridSize;
            }
            
            // Update immediately
            const updatedScreen: ScreenMapping = {
              ...screen,
              outputFrame: {
                ...screen.outputFrame,
                x: Math.round(newX)
              }
            };
            
            onUpdate(screenIndex, updatedScreen);
            
            // Update form to reflect changes
            setFormData(prev => ({ ...prev, x: Math.round(newX) }));
          }}
          className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Center H
        </button>
        
        <button
          onClick={() => {
            if (!screen || screenIndex === null) return;
            
            // Align Right
            let newX = deviceWidth - screen.outputFrame.width - 20;
            if (settings.snapToGrid) {
              newX = Math.round(newX / settings.gridSize) * settings.gridSize;
            }
            
            // Update immediately
            const updatedScreen: ScreenMapping = {
              ...screen,
              outputFrame: {
                ...screen.outputFrame,
                x: Math.max(0, newX)
              }
            };
            
            onUpdate(screenIndex, updatedScreen);
            
            // Update form to reflect changes
            setFormData(prev => ({ ...prev, x: Math.max(0, newX) }));
          }}
          className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Align Right
        </button>
        
        <button
          onClick={() => {
            if (!screen || screenIndex === null) return;
            
            // Align Top
            let newY = 20;
            if (settings.snapToGrid) {
              newY = Math.round(newY / settings.gridSize) * settings.gridSize;
            }
            
            // Update immediately
            const updatedScreen: ScreenMapping = {
              ...screen,
              outputFrame: {
                ...screen.outputFrame,
                y: newY
              }
            };
            
            onUpdate(screenIndex, updatedScreen);
            
            // Update form to reflect changes
            setFormData(prev => ({ ...prev, y: newY }));
          }}
          className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Align Top
        </button>
        
        <button
          onClick={() => {
            if (!screen || screenIndex === null) return;
            
            // Center Vertically
            let newY = (deviceHeight - screen.outputFrame.height) / 2;
            if (settings.snapToGrid) {
              newY = Math.round(newY / settings.gridSize) * settings.gridSize;
            }
            
            // Update immediately
            const updatedScreen: ScreenMapping = {
              ...screen,
              outputFrame: {
                ...screen.outputFrame,
                y: Math.round(newY)
              }
            };
            
            onUpdate(screenIndex, updatedScreen);
            
            // Update form to reflect changes
            setFormData(prev => ({ ...prev, y: Math.round(newY) }));
          }}
          className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Center V
        </button>
        
        <button
          onClick={() => {
            if (!screen || screenIndex === null) return;
            
            // Align Bottom
            let newY = deviceHeight - screen.outputFrame.height - 20;
            if (settings.snapToGrid) {
              newY = Math.round(newY / settings.gridSize) * settings.gridSize;
            }
            
            // Update immediately
            const updatedScreen: ScreenMapping = {
              ...screen,
              outputFrame: {
                ...screen.outputFrame,
                y: Math.max(0, newY)
              }
            };
            
            onUpdate(screenIndex, updatedScreen);
            
            // Update form to reflect changes
            setFormData(prev => ({ ...prev, y: Math.max(0, newY) }));
          }}
          className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Align Bottom
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Position Section */}
        <div id="position-section" className="space-y-3">
          <h4 id="position-section-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</h4>
          <div id="position-inputs" className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="screen-x-position" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">X</label>
              <input
                id="screen-x-position"
                type="number"
                value={formData.x}
                onChange={(e) => handleInputChange('x', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'x')}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="screen-y-position" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Y</label>
              <input
                id="screen-y-position"
                type="number"
                value={formData.y}
                onChange={(e) => handleInputChange('y', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'y')}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Size Section */}
        <div id="size-section" className="space-y-3">
          <h4 id="size-section-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</h4>
          <div id="size-inputs" className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="screen-width" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
              <input
                id="screen-width"
                type="number"
                value={formData.width}
                onChange={(e) => handleInputChange('width', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'width')}
                min="20"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="screen-height" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
              <input
                id="screen-height"
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'height')}
                min="20"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Input Frame Info (read-only) */}
      {screen.inputFrame && (
        <div id="input-frame-info" className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input Frame (Read-only)</h4>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-gray-600 dark:text-gray-400">X:</span> {screen.inputFrame.x}
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Y:</span> {screen.inputFrame.y}
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">W:</span> {screen.inputFrame.width}
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">H:</span> {screen.inputFrame.height}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div id="properties-panel-actions" className="flex justify-between items-center mt-6">
        <div id="properties-panel-help" className="text-xs text-gray-500 dark:text-gray-400 flex gap-4">
          <span>• Use arrow keys to adjust values</span>
          <span>• Hold Shift for ±10 increments</span>
          <span>• Press Enter to apply</span>
        </div>
        <div className="flex space-x-2">
          <button
            id="screen-properties-apply"
            onClick={handleApply}
            className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreenPropertiesPanel;