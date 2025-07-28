// Control properties panel for editing control position, size, and extended edges
import React, { useState, useEffect } from 'react';
import { ControlMapping } from '../types';
import { useEditor } from '../contexts/EditorContext';

interface ControlPropertiesPanelProps {
  control: ControlMapping | null;
  controlIndex: number | null;
  onUpdate: (index: number, updates: Partial<ControlMapping>) => void;
  onClose: () => void;
}

const ControlPropertiesPanel: React.FC<ControlPropertiesPanelProps> = ({
  control,
  controlIndex,
  onUpdate,
  onClose
}) => {
  const { settings } = useEditor();
  
  // Local state for form inputs
  const [formData, setFormData] = useState({
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    extendedTop: 0,
    extendedBottom: 0,
    extendedLeft: 0,
    extendedRight: 0
  });

  // Update form when control changes
  useEffect(() => {
    if (control) {
      setFormData({
        x: control.frame?.x || 0,
        y: control.frame?.y || 0,
        width: control.frame?.width || 50,
        height: control.frame?.height || 50,
        extendedTop: control.extendedEdges?.top || 0,
        extendedBottom: control.extendedEdges?.bottom || 0,
        extendedLeft: control.extendedEdges?.left || 0,
        extendedRight: control.extendedEdges?.right || 0
      });
    }
  }, [control]);

  if (!control || controlIndex === null) {
    return null;
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleApply = () => {
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

    onUpdate(controlIndex, {
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
      }
    });
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

  const label = Array.isArray(control.inputs) 
    ? control.inputs.join(' + ')
    : control.inputs || 'Control';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-72">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Control Properties
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        <strong>{label}</strong>
      </div>

      {/* Position Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">X</label>
            <input
              type="number"
              value={formData.x}
              onChange={(e) => handleInputChange('x', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'x')}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Y</label>
            <input
              type="number"
              value={formData.y}
              onChange={(e) => handleInputChange('y', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'y')}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Size Section */}
      <div className="space-y-3 mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
            <input
              type="number"
              value={formData.width}
              onChange={(e) => handleInputChange('width', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'width')}
              min="20"
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'height')}
              min="20"
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Extended Edges Section */}
      <div className="space-y-3 mt-4">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Extended Edges</h4>
          <div className="group relative">
            <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Extended edges increase the touch area beyond the visible button boundaries
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Top</label>
            <input
              type="number"
              value={formData.extendedTop}
              onChange={(e) => handleInputChange('extendedTop', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'extendedTop')}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Bottom</label>
            <input
              type="number"
              value={formData.extendedBottom}
              onChange={(e) => handleInputChange('extendedBottom', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'extendedBottom')}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Left</label>
            <input
              type="number"
              value={formData.extendedLeft}
              onChange={(e) => handleInputChange('extendedLeft', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'extendedLeft')}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Right</label>
            <input
              type="number"
              value={formData.extendedRight}
              onChange={(e) => handleInputChange('extendedRight', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'extendedRight')}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2 mt-6">
        <button
          onClick={handleApply}
          className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
        >
          Apply
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        <p>• Use arrow keys to adjust values</p>
        <p>• Hold Shift for ±10 increments</p>
        <p>• Press Enter to apply changes</p>
      </div>
    </div>
  );
};

export default ControlPropertiesPanel;