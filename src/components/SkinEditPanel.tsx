// Panel for editing skin configuration properties
import React from 'react';
import { Console, Device } from '../types';

interface SkinEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  skinName: string;
  skinIdentifier: string;
  selectedConsole: string;
  selectedDevice: string;
  consoles: Console[];
  devices: Device[];
  onSkinNameChange: (name: string) => void;
  onSkinIdentifierChange: (identifier: string) => void;
  onConsoleChange: (console: string) => void;
  onDeviceChange: (device: string) => void;
}

const SkinEditPanel: React.FC<SkinEditPanelProps> = ({
  isOpen,
  onClose,
  skinName,
  skinIdentifier,
  selectedConsole,
  selectedDevice,
  consoles,
  devices,
  onSkinNameChange,
  onSkinIdentifierChange,
  onConsoleChange,
  onDeviceChange
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Skin Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Skin Name */}
            <div>
              <label htmlFor="edit-skinName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skin Name
              </label>
              <input
                type="text"
                id="edit-skinName"
                value={skinName}
                onChange={(e) => onSkinNameChange(e.target.value)}
                className="w-full input-field"
                placeholder="My Custom Skin"
              />
            </div>

            {/* Skin Identifier */}
            <div>
              <label htmlFor="edit-skinIdentifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skin Identifier
              </label>
              <input
                type="text"
                id="edit-skinIdentifier"
                value={skinIdentifier}
                onChange={(e) => onSkinIdentifierChange(e.target.value)}
                className="w-full input-field"
                placeholder="com.playcase.default.skin"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Use reverse domain notation (e.g., com.yourname.skinname)
              </p>
            </div>

            {/* Console Selection */}
            <div>
              <label htmlFor="edit-console" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Console System
              </label>
              <select
                id="edit-console"
                value={selectedConsole}
                onChange={(e) => onConsoleChange(e.target.value)}
                className="w-full input-field"
              >
                <option value="">Select a console...</option>
                {consoles.map((console) => (
                  <option key={console.shortName} value={console.shortName}>
                    {console.console}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Selection */}
            <div>
              <label htmlFor="edit-device" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                iPhone Model
              </label>
              <select
                id="edit-device"
                value={selectedDevice}
                onChange={(e) => onDeviceChange(e.target.value)}
                className="w-full input-field"
              >
                <option value="">Select an iPhone model...</option>
                {devices.map((device) => (
                  <option key={device.model} value={device.model}>
                    {device.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SkinEditPanel;