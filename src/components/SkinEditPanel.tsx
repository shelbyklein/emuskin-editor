// Panel for editing skin configuration properties
import React, { useState, useEffect } from 'react';
import { Console, Device, ControlMapping } from '../types';
import { useToast } from '../contexts/ToastContext';

interface SkinEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  skinName: string;
  skinIdentifier: string;
  selectedConsole: string;
  selectedDevice: string;
  debug: boolean;
  consoles: Console[];
  devices: Device[];
  controls: ControlMapping[];
  onSkinNameChange: (name: string) => void;
  onSkinIdentifierChange: (identifier: string) => void;
  onConsoleChange: (console: string) => void;
  onDeviceChange: (device: string) => void;
  onDebugChange: (debug: boolean) => void;
}

const SkinEditPanel: React.FC<SkinEditPanelProps> = ({
  isOpen,
  onClose,
  skinName,
  skinIdentifier,
  selectedConsole,
  selectedDevice,
  debug,
  consoles,
  devices,
  controls,
  onSkinNameChange,
  onSkinIdentifierChange,
  onConsoleChange,
  onDeviceChange,
  onDebugChange
}) => {
  const { showWarning } = useToast();
  
  // Local state for form values
  const [localSkinName, setLocalSkinName] = useState(skinName);
  const [localSkinIdentifier, setLocalSkinIdentifier] = useState(skinIdentifier);
  const [localSelectedConsole, setLocalSelectedConsole] = useState(selectedConsole);
  const [localSelectedDevice, setLocalSelectedDevice] = useState(selectedDevice);
  const [localDebug, setLocalDebug] = useState(debug);
  const [errors, setErrors] = useState<{ name?: string; identifier?: string; console?: string; device?: string }>({});
  
  // Update local state when props change
  useEffect(() => {
    console.log('🔵 SkinEditPanel: useEffect updating local state from props:', {
      skinName,
      skinIdentifier,
      selectedConsole,
      selectedDevice,
      debug,
      isOpen
    });
    setLocalSkinName(skinName);
    setLocalSkinIdentifier(skinIdentifier);
    setLocalSelectedConsole(selectedConsole);
    setLocalSelectedDevice(selectedDevice);
    setLocalDebug(debug);
    setErrors({});
    console.log('🔵 SkinEditPanel: Local state updated to:', {
      localSkinName: skinName,
      localSkinIdentifier: skinIdentifier,
      localSelectedConsole: selectedConsole,
      localSelectedDevice: selectedDevice,
      localDebug: debug
    });
  }, [isOpen, skinName, skinIdentifier, selectedConsole, selectedDevice, debug]);
  
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
    console.log('🔵 SkinEditPanel: handleSave called', {
      localSkinName,
      localSkinIdentifier,
      localSelectedConsole,
      localSelectedDevice,
      localDebug
    });
    
    if (!validateInputs()) {
      console.log('❌ SkinEditPanel: Validation failed');
      return;
    }
    
    // Check if console or device change would affect existing controls
    if (controls.length > 0 && (localSelectedConsole !== selectedConsole || localSelectedDevice !== selectedDevice)) {
      const confirmed = window.confirm(
        'Changing the console or device will reset all placed controls. Are you sure you want to continue?'
      );
      if (!confirmed) {
        console.log('❌ SkinEditPanel: User cancelled confirmation dialog');
        return;
      }
    }
    
    console.log('🟢 SkinEditPanel: About to call callbacks...');
    
    // Apply changes - call all callbacks to ensure state updates
    console.log('📞 Calling onSkinNameChange with:', localSkinName);
    onSkinNameChange(localSkinName);
    
    console.log('📞 Calling onSkinIdentifierChange with:', localSkinIdentifier);
    onSkinIdentifierChange(localSkinIdentifier);
    
    console.log('📞 Calling onConsoleChange with:', localSelectedConsole);
    onConsoleChange(localSelectedConsole);
    
    console.log('📞 Calling onDeviceChange with:', localSelectedDevice);
    onDeviceChange(localSelectedDevice);
    
    console.log('📞 Calling onDebugChange with:', localDebug);
    onDebugChange(localDebug);
    
    console.log('🟢 SkinEditPanel: All callbacks completed, closing modal');
    onClose();
  };
  
  const handleCancel = () => {
    // For new projects, don't allow canceling without selecting console/device
    const isNewProject = !selectedConsole && !selectedDevice;
    if (isNewProject) {
      if (!localSelectedConsole || !localSelectedDevice) {
        showWarning('Please select a console and device for your new skin before continuing.');
        return;
      }
    }
    
    // Reset to original values
    setLocalSkinName(skinName);
    setLocalSkinIdentifier(skinIdentifier);
    setLocalSelectedConsole(selectedConsole);
    setLocalSelectedDevice(selectedDevice);
    setLocalDebug(debug);
    setErrors({});
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        id="skin-edit-panel-backdrop"
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div id="skin-edit-panel-container" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div id="skin-edit-panel-modal" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div id="skin-edit-panel-content" className="p-6">
          {/* Header */}
          <div id="skin-edit-panel-header" className="flex justify-between items-center mb-6">
            <h2 id="skin-edit-panel-title" className="text-xl font-bold text-gray-900 dark:text-white">
              {!selectedConsole && !selectedDevice ? 'Configure New Skin' : 'Edit Skin Settings'}
            </h2>
            <button
              id="skin-edit-panel-close-button"
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
          <div id="skin-edit-panel-form" className="space-y-6">
            {/* Skin Name */}
            <div id="skin-edit-panel-name-section">
              <label htmlFor="edit-skinName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skin Name
              </label>
              <input
                type="text"
                id="edit-skinName"
                value={localSkinName}
                onChange={(e) => {
                  console.log('🔵 SkinEditPanel: edit-skinName input changed to:', e.target.value);
                  setLocalSkinName(e.target.value);
                  console.log('🔵 SkinEditPanel: setLocalSkinName called with:', e.target.value);
                }}
                className={`w-full input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder="My Custom Skin"
              />
              {errors.name && (
                <p id="skin-edit-panel-name-error" className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Skin Identifier */}
            <div id="skin-edit-panel-identifier-section">
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
                <p id="skin-edit-panel-identifier-error" className="mt-1 text-sm text-red-500">{errors.identifier}</p>
              ) : (
                <p id="skin-edit-panel-identifier-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Use reverse domain notation (e.g., com.yourname.skinname)
                </p>
              )}
            </div>

            {/* Console Selection */}
            <div id="skin-edit-panel-console-section">
              <label id="skin-edit-panel-console-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Console System
              </label>
              <div id="skin-edit-panel-console-grid" className="grid grid-cols-4 gap-2">
                {consoles.map((console) => {
                  // Map console names to icon filenames
                  const iconMap: Record<string, string> = {
                    'gbc': 'gbc.png',
                    'gba': 'gba.png',
                    'nds': 'ds.png',
                    'nes': 'nes.png',
                    'snes': 'snes.png',
                    'n64': 'n64.png',
                    'sg': 'genesis.png',
                    'ps1': 'ps1.png'
                  };
                  
                  const iconPath = iconMap[console.shortName] ? `/assets/consoles/${iconMap[console.shortName]}` : null;
                  const isSelected = localSelectedConsole === console.shortName;
                  
                  return (
                    <button
                      key={console.shortName}
                      id={`skin-edit-panel-console-${console.shortName}`}
                      type="button"
                      onClick={() => setLocalSelectedConsole(console.shortName)}
                      className={`
                        flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                      title={console.console}
                    >
                      {iconPath && (
                        <img 
                          src={iconPath} 
                          alt={console.console}
                          className="w-8 h-8 mb-1 object-contain"
                        />
                      )}
                      <span className={`text-xs font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {console.shortName.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.console && (
                <p id="skin-edit-panel-console-error" className="mt-1 text-sm text-red-500">{errors.console}</p>
              )}
            </div>

            {/* Device Selection */}
            <div id="skin-edit-panel-device-section">
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
                <p id="skin-edit-panel-device-error" className="mt-1 text-sm text-red-500">{errors.device}</p>
              )}
            </div>

            {/* Debug Toggle */}
            <div id="skin-edit-panel-debug-section">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label htmlFor="edit-debug" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Debug Mode
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enable debug information in the exported skin file
                  </p>
                </div>
                <button
                  type="button"
                  id="edit-debug"
                  onClick={() => setLocalDebug(!localDebug)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
                    ${localDebug ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                  `}
                  role="switch"
                  aria-checked={localDebug}
                  aria-labelledby="edit-debug-label"
                >
                  <span
                    className={`
                      pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${localDebug ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  >
                    <span
                      className={`
                        absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200 ease-in-out
                        ${localDebug ? 'opacity-0' : 'opacity-100'}
                      `}
                      aria-hidden="true"
                    >
                      <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                        <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span
                      className={`
                        absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200 ease-in-out
                        ${localDebug ? 'opacity-100' : 'opacity-0'}
                      `}
                      aria-hidden="true"
                    >
                      <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                      </svg>
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div id="skin-edit-panel-actions" className="mt-8 space-y-3">
            <button
              id="skin-edit-panel-save-button"
              onClick={handleSave}
              className="w-full px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Settings
            </button>
            <button
              id="skin-edit-panel-cancel-button"
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