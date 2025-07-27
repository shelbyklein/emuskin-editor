// Settings page
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="space-y-6">
      <div className="card animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
        
        <div className="space-y-6">
          {/* Theme Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</label>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Switch between light and dark themes</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDark ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDark ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Editor Settings */}
          <div className="border-t dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Editor</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Grid</label>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Display grid overlay on canvas</p>
                </div>
                <button
                  onClick={() => setGridEnabled(!gridEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    gridEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      gridEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Snap to Grid</label>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Align controls to grid when placing</p>
                </div>
                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    snapToGrid ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      snapToGrid ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Storage Settings */}
          <div className="border-t dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Storage</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-save</label>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Automatically save projects to browser storage</p>
                </div>
                <button
                  onClick={() => setAutoSave(!autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoSave ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2">
                <button className="btn-secondary text-sm">
                  Clear Local Storage
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Remove all saved projects and settings
                </p>
              </div>
            </div>
          </div>

          {/* Export Settings */}
          <div className="border-t dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Export Format</span>
                <select className="mt-1 input-field">
                  <option value="deltaskin">.deltaskin (Delta)</option>
                  <option value="gammaskin">.gammaskin (Gamma)</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;