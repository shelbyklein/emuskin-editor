// Control properties panel for editing control position, size, and extended edges
import React, { useState, useEffect } from 'react';
import { ControlMapping, ScreenMapping } from '../types';
import { useEditor } from '../contexts/EditorContext';

interface ControlPropertiesPanelProps {
  control: ControlMapping | null;
  controlIndex: number | null;
  onUpdate: (index: number, updates: ControlMapping) => void;
  onClose: () => void;
  onThumbstickImageUpload?: (file: File, controlIndex: number) => void;
  screens?: ScreenMapping[];
}

const ControlPropertiesPanel: React.FC<ControlPropertiesPanelProps> = ({
  control,
  controlIndex,
  onUpdate,
  onClose,
  onThumbstickImageUpload,
  screens = []
}) => {
  const { settings } = useEditor();
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for form inputs
  const [formData, setFormData] = useState({
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    extendedTop: 0,
    extendedBottom: 0,
    extendedLeft: 0,
    extendedRight: 0,
    label: '',
    thumbstickWidth: 85,
    thumbstickHeight: 87
  });
  
  const [mirrorBottomScreen, setMirrorBottomScreen] = useState(false);
  
  const [thumbstickImage, setThumbstickImage] = useState<File | null>(null);
  const [thumbstickImageUrl, setThumbstickImageUrl] = useState<string | null>(null);
  
  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (thumbstickImageUrl) {
        URL.revokeObjectURL(thumbstickImageUrl);
      }
    };
  }, [thumbstickImageUrl]);

  // Update form when control changes (but not when we're actively editing)
  useEffect(() => {
    if (control && !isEditing) {
      setFormData({
        x: control.frame?.x || 0,
        y: control.frame?.y || 0,
        width: control.frame?.width || 50,
        height: control.frame?.height || 50,
        extendedTop: control.extendedEdges?.top || 0,
        extendedBottom: control.extendedEdges?.bottom || 0,
        extendedLeft: control.extendedEdges?.left || 0,
        extendedRight: control.extendedEdges?.right || 0,
        label: control.label || '',
        thumbstickWidth: control.thumbstick?.width || 85,
        thumbstickHeight: control.thumbstick?.height || 87
      });
      // Set mirror state from control
      if (control.mirrorBottomScreen !== undefined) {
        setMirrorBottomScreen(control.mirrorBottomScreen);
      }
    }
  }, [control, isEditing]);

  if (!control || controlIndex === null) {
    return null;
  }
  
  // Check if this is a touchscreen control (moved here to be available earlier)
  const isTouchscreen = control.inputs && typeof control.inputs === 'object' && !Array.isArray(control.inputs) &&
    'x' in control.inputs && 'y' in control.inputs;

  // Mirror bottom screen dimensions for touchscreen
  useEffect(() => {
    if (mirrorBottomScreen && isTouchscreen) {
      const bottomScreen = screens.find(s => s.label === 'Bottom Screen');
      if (bottomScreen && bottomScreen.outputFrame) {
        setFormData(prev => ({
          ...prev,
          x: bottomScreen.outputFrame.x,
          y: bottomScreen.outputFrame.y,
          width: bottomScreen.outputFrame.width,
          height: bottomScreen.outputFrame.height
        }));
        setIsEditing(true);
      }
    }
  }, [mirrorBottomScreen, screens, isTouchscreen]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setIsEditing(true);
    if (field === 'label') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      const numValue = parseInt(value) || 0;
      setFormData(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const handleApply = () => {
    if (!control || controlIndex === null) {
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

    // Create complete updated control object
    const updatedControl: ControlMapping = {
      ...control,
      frame: {
        x: Math.max(0, finalX),
        y: Math.max(0, finalY),
        width: Math.max(20, finalWidth),
        height: Math.max(20, finalHeight)
      },
      extendedEdges: {
        top: formData.extendedTop,
        bottom: formData.extendedBottom,
        left: formData.extendedLeft,
        right: formData.extendedRight
      },
      label: formData.label || undefined,
      mirrorBottomScreen: isTouchscreen ? mirrorBottomScreen : undefined
    };
    
    // Add thumbstick data if this is a thumbstick control with an image
    if (isThumbstick && thumbstickImage) {
      updatedControl.thumbstick = {
        name: thumbstickImage.name,
        width: formData.thumbstickWidth,
        height: formData.thumbstickHeight
      };
    }

    onUpdate(controlIndex, updatedControl);
    setIsEditing(false); // Reset editing flag
    // Close the panel after applying changes
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: keyof typeof formData) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const increment = e.shiftKey ? 10 : 1;
      const currentValue = Number(formData[field]);
      handleInputChange(field, String(currentValue + increment));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const decrement = e.shiftKey ? 10 : 1;
      const currentValue = Number(formData[field]);
      handleInputChange(field, String(currentValue - decrement));
    } else if (e.key === 'Enter') {
      handleApply();
    }
  };

  const label = Array.isArray(control.inputs) 
    ? control.inputs.join(' + ')
    : typeof control.inputs === 'object' && !Array.isArray(control.inputs)
    ? ('x' in control.inputs && 'y' in control.inputs ? 'Touchscreen' : 'Thumbstick')
    : control.inputs || 'Control';
    
  // Check if this is a thumbstick control
  const isThumbstick = control.inputs && typeof control.inputs === 'object' && !Array.isArray(control.inputs) &&
    'up' in control.inputs && control.inputs.up === 'analogStickUp';
    
  const handleThumbstickImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/') && onThumbstickImageUpload && controlIndex !== null) {
      setThumbstickImage(file);
      const url = URL.createObjectURL(file);
      setThumbstickImageUrl(url);
      onThumbstickImageUpload(file, controlIndex);
    }
  };

  return (
    <div id="control-properties-panel" className="bg-white dark:bg-gray-800 rounded-t-xl shadow-2xl p-6 w-full max-w-2xl">
      <div id="properties-panel-header" className="flex justify-between items-center mb-4">
        <h3 id="properties-panel-title" className="text-lg font-medium text-gray-900 dark:text-white">
          Control Properties
        </h3>
        <button
          id="control-properties-close"
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          aria-label="Close properties panel"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div id="control-label-display" className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        <strong>Editing: {label}</strong>
      </div>

      {/* Custom Button Label (only show for custom buttons) */}
      {control.label && (
        <div id="custom-label-section" className="mb-4">
          <label htmlFor="control-custom-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Button Label
          </label>
          <input
            id="control-custom-label"
            type="text"
            value={formData.label}
            onChange={(e) => handleInputChange('label', e.target.value)}
            placeholder="e.g., Turbo Fire"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      )}
      
      {/* Thumbstick Properties (only show for thumbstick controls) */}
      {isThumbstick && (
        <div id="thumbstick-section" className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Thumbstick Properties</h4>
          
          {/* Thumbstick Image Upload */}
          <div className="mb-3">
            <label htmlFor="thumbstick-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Thumbstick Image
            </label>
            <input
              id="thumbstick-image"
              type="file"
              accept="image/*"
              onChange={handleThumbstickImageUpload}
              className="w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
            />
            {thumbstickImageUrl && (
              <div className="mt-2">
                <img src={thumbstickImageUrl} alt="Thumbstick preview" className="w-16 h-16 object-contain bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            )}
          </div>
          
          {/* Thumbstick Size */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="thumbstick-width" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Thumbstick Width
              </label>
              <input
                id="thumbstick-width"
                type="number"
                value={formData.thumbstickWidth}
                onChange={(e) => handleInputChange('thumbstickWidth', e.target.value)}
                min="20"
                max="200"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="thumbstick-height" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Thumbstick Height
              </label>
              <input
                id="thumbstick-height"
                type="number"
                value={formData.thumbstickHeight}
                onChange={(e) => handleInputChange('thumbstickHeight', e.target.value)}
                min="20"
                max="200"
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            The thumbstick image will be centered within the control area.
          </p>
        </div>
      )}
      
      {/* Touchscreen Properties (only show for touchscreen controls) */}
      {isTouchscreen && (
        <div id="touchscreen-section" className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Touchscreen Properties</h4>
          
          {/* Mirror Bottom Screen Toggle */}
          <div className="flex items-center justify-between">
            <label htmlFor="mirror-bottom-screen" className="text-sm text-gray-700 dark:text-gray-300">
              Mirror Bottom Screen Dimensions
            </label>
            <button
              id="mirror-bottom-screen"
              type="button"
              onClick={() => setMirrorBottomScreen(!mirrorBottomScreen)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                mirrorBottomScreen ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              aria-pressed={mirrorBottomScreen}
            >
              <span className="sr-only">Mirror bottom screen dimensions</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  mirrorBottomScreen ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            When enabled, the touchscreen will automatically match the position and size of the bottom DS screen.
          </p>
          
          {mirrorBottomScreen && !screens.find(s => s.label === 'Bottom Screen') && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ No bottom screen found. Add a bottom screen to use this feature.
            </p>
          )}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Position Section */}
        <div id="position-section" className="space-y-3">
          <h4 id="position-section-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</h4>
          <div id="position-inputs" className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="control-x-position" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">X</label>
            <input
              id="control-x-position"
              type="number"
              value={formData.x}
              onChange={(e) => handleInputChange('x', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'x')}
              disabled={!!(isTouchscreen && mirrorBottomScreen)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="control-y-position" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Y</label>
            <input
              id="control-y-position"
              type="number"
              value={formData.y}
              onChange={(e) => handleInputChange('y', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'y')}
              disabled={!!(isTouchscreen && mirrorBottomScreen)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            />
          </div>
          </div>
        </div>

        {/* Size Section */}
        <div id="size-section" className="space-y-3">
          <h4 id="size-section-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</h4>
          <div id="size-inputs" className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="control-width" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
            <input
              id="control-width"
              type="number"
              value={formData.width}
              onChange={(e) => handleInputChange('width', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'width')}
              min="20"
              disabled={!!(isTouchscreen && mirrorBottomScreen)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="control-height" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
            <input
              id="control-height"
              type="number"
              value={formData.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'height')}
              min="20"
              disabled={!!(isTouchscreen && mirrorBottomScreen)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            />
          </div>
          </div>
        </div>

        {/* Extended Edges Section */}
        <div id="extended-edges-section" className="space-y-3">
          <div id="extended-edges-header" className="flex items-center space-x-2">
            <h4 id="extended-edges-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Extended Edges</h4>
            <div id="extended-edges-tooltip" className="group relative">
            <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div id="extended-edges-tooltip-content" className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Extended edges increase the touch area beyond the visible button boundaries
            </div>
          </div>
        </div>
        <div id="extended-edges-inputs" className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="control-extended-top" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Top</label>
            <input
              id="control-extended-top"
              type="number"
              value={formData.extendedTop}
              onChange={(e) => handleInputChange('extendedTop', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'extendedTop')}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="control-extended-bottom" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Bottom</label>
            <input
              id="control-extended-bottom"
              type="number"
              value={formData.extendedBottom}
              onChange={(e) => handleInputChange('extendedBottom', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'extendedBottom')}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="control-extended-left" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Left</label>
            <input
              id="control-extended-left"
              type="number"
              value={formData.extendedLeft}
              onChange={(e) => handleInputChange('extendedLeft', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'extendedLeft')}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="control-extended-right" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Right</label>
            <input
              id="control-extended-right"
              type="number"
              value={formData.extendedRight}
              onChange={(e) => handleInputChange('extendedRight', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'extendedRight')}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>
      </div>

      {/* Actions */}
      <div id="properties-panel-actions" className="flex justify-between items-center mt-6">
        <div id="properties-panel-help" className="text-xs text-gray-500 dark:text-gray-400 flex gap-4">
          <span>• Use arrow keys to adjust values</span>
          <span>• Hold Shift for ±10 increments</span>
          <span>• Press Enter to apply changes</span>
        </div>
        <div className="flex space-x-2">
        <button
          id="control-properties-apply"
          onClick={handleApply}
          className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
        >
          Apply
        </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPropertiesPanel;