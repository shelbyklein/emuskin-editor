// Grid controls component for toggling grid display and snap
import React from 'react';
import { useEditor } from '../contexts/EditorContext';

const GridControls: React.FC = () => {
  const { settings, updateSettings } = useEditor();

  return (
    <div className="flex items-center space-x-4 text-sm">
      {/* Grid Display Toggle */}
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.gridEnabled}
          onChange={(e) => updateSettings({ gridEnabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <span className="text-gray-700 dark:text-gray-300">Show Grid</span>
      </label>

      {/* Snap to Grid Toggle */}
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.snapToGrid}
          onChange={(e) => updateSettings({ snapToGrid: e.target.checked })}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <span className="text-gray-700 dark:text-gray-300">Snap to Grid</span>
      </label>

      {/* Grid Size Selector */}
      <div className="flex items-center space-x-2">
        <label htmlFor="gridSize" className="text-gray-700 dark:text-gray-300">
          Grid Size:
        </label>
        <select
          id="gridSize"
          value={settings.gridSize}
          onChange={(e) => updateSettings({ gridSize: parseInt(e.target.value) })}
          className="px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="5">5px</option>
          <option value="10">10px</option>
          <option value="15">15px</option>
          <option value="20">20px</option>
          <option value="25">25px</option>
        </select>
      </div>
    </div>
  );
};

export default GridControls;