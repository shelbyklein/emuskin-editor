// Panel for editing skin configuration properties
import React, { useState, useEffect } from 'react';
import { Console, Device, ControlMapping } from '../types';

interface SkinEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  skinName: string;
  skinIdentifier: string;
  selectedConsole: string;
  selectedDevice: string;
  consoles: Console[];
  devices: Device[];
  controls: ControlMapping[];
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
  controls,
  onSkinNameChange,
  onSkinIdentifierChange,
  onConsoleChange,
  onDeviceChange
}) => {
  // Local state for form values
  const [localSkinName, setLocalSkinName] = useState(skinName);
  const [localSkinIdentifier, setLocalSkinIdentifier] = useState(skinIdentifier);
  const [localSelectedConsole, setLocalSelectedConsole] = useState(selectedConsole);
  const [localSelectedDevice, setLocalSelectedDevice] = useState(selectedDevice);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; identifier?: string; console?: string; device?: string }>({});
  
  // Update local state when props change
  useEffect(() => {
    setLocalSkinName(skinName);
    setLocalSkinIdentifier(skinIdentifier);
    setLocalSelectedConsole(selectedConsole);
    setLocalSelectedDevice(selectedDevice);
    setHasChanges(false);
    setErrors({});
  }, [isOpen, skinName, skinIdentifier, selectedConsole, selectedDevice]);
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);
  
  // Check if changes have been made
  useEffect(() => {
    // For new projects (no console/device selected), always allow save
    const isNewProject = !selectedConsole && !selectedDevice;
    const changed = isNewProject || (
      localSkinName !== skinName ||
      localSkinIdentifier !== skinIdentifier ||
      localSelectedConsole !== selectedConsole ||
      localSelectedDevice !== selectedDevice
    );
    setHasChanges(changed);
  }, [localSkinName, localSkinIdentifier, localSelectedConsole, localSelectedDevice, skinName, skinIdentifier, selectedConsole, selectedDevice]);
  
  // Validate inputs
  const validateInputs = () => {
    const newErrors: { name?: string; identifier?: string; console?: string; device?: string } = {};
    
    if (!localSkinName.trim()) {
      newErrors.name = 'Skin name is required';
    }
    
    if (!localSkinIdentifier.trim()) {
      newErrors.identifier = 'Skin identifier is required';
    } else if (!/^[a-zA-Z0-9.]+$/.test(localSkinIdentifier)) {
      newErrors.identifier = 'Identifier must use reverse domain notation (e.g., com.example.skin)';
    }
    
    if (!localSelectedConsole) {
      newErrors.console = 'Please select a console';
    }
    
    if (!localSelectedDevice) {
      newErrors.device = 'Please select an iPhone model';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = () => {
    if (!validateInputs()) return;
    
    // Check if console or device change would affect existing controls
    if (controls.length > 0 && (localSelectedConsole !== selectedConsole || localSelectedDevice !== selectedDevice)) {
      const confirmed = window.confirm(
        'Changing the console or device will reset all placed controls. Are you sure you want to continue?'
      );
      if (!confirmed) return;
    }
    
    // Apply changes
    onSkinNameChange(localSkinName);
    onSkinIdentifierChange(localSkinIdentifier);
    onConsoleChange(localSelectedConsole);
    onDeviceChange(localSelectedDevice);
    onClose();
  };
  
  const handleCancel = () => {
    // For new projects, don't allow canceling without selecting console/device
    const isNewProject = !selectedConsole && !selectedDevice;
    if (isNewProject) {
      if (!localSelectedConsole || !localSelectedDevice) {
        alert('Please select a console and device for your new skin before continuing.');
        return;
      }
    }
    
    // Reset to original values
    setLocalSkinName(skinName);
    setLocalSkinIdentifier(skinIdentifier);
    setLocalSelectedConsole(selectedConsole);
    setLocalSelectedDevice(selectedDevice);
    setErrors({});
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {!selectedConsole && !selectedDevice ? 'Configure New Skin' : 'Edit Skin Settings'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Close (Esc)"
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
                value={localSkinName}
                onChange={(e) => setLocalSkinName(e.target.value)}
                className={`w-full input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder="My Custom Skin"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Skin Identifier */}
            <div>
              <label htmlFor="edit-skinIdentifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skin Identifier
              </label>
              <input
                type="text"
                id="edit-skinIdentifier"
                value={localSkinIdentifier}
                onChange={(e) => setLocalSkinIdentifier(e.target.value)}
                className={`w-full input-field ${errors.identifier ? 'border-red-500' : ''}`}
                placeholder="com.playcase.default.skin"
              />
              {errors.identifier ? (
                <p className="mt-1 text-sm text-red-500">{errors.identifier}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Use reverse domain notation (e.g., com.yourname.skinname)
                </p>
              )}
            </div>

            {/* Console Selection */}
            <div>
              <label htmlFor="edit-console" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Console System
              </label>
              <select
                id="edit-console"
                value={localSelectedConsole}
                onChange={(e) => setLocalSelectedConsole(e.target.value)}
                className={`w-full input-field ${errors.console ? 'border-red-500' : ''}`}
              >
                <option value="">Select a console...</option>
                {consoles.map((console) => (
                  <option key={console.shortName} value={console.shortName}>
                    {console.console}
                  </option>
                ))}
              </select>
              {errors.console && (
                <p className="mt-1 text-sm text-red-500">{errors.console}</p>
              )}
            </div>

            {/* Device Selection */}
            <div>
              <label htmlFor="edit-device" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                iPhone Model
              </label>
              <select
                id="edit-device"
                value={localSelectedDevice}
                onChange={(e) => setLocalSelectedDevice(e.target.value)}
                className={`w-full input-field ${errors.device ? 'border-red-500' : ''}`}
              >
                <option value="">Select an iPhone model...</option>
                {devices.map((device) => (
                  <option key={device.model} value={device.model}>
                    {device.model}
                  </option>
                ))}
              </select>
              {errors.device && (
                <p className="mt-1 text-sm text-red-500">{errors.device}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Settings
            </button>
            <button
              onClick={handleCancel}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default SkinEditPanel;