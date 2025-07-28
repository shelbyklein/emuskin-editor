// Main editor page for creating emulator skins
import React, { useState, useEffect } from 'react';
import { Console, Device, ControlMapping } from '../types';
import ImageUploader from '../components/ImageUploader';
import Canvas from '../components/Canvas';
import ControlPalette from '../components/ControlPalette';
import JsonPreview from '../components/JsonPreview';
import GridControls from '../components/GridControls';
import ProjectManager from '../components/ProjectManager';
import ExportButton from '../components/ExportButton';
import { useEditor } from '../contexts/EditorContext';
import { useProject } from '../contexts/ProjectContext';

const Editor: React.FC = () => {
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedConsole, setSelectedConsole] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [skinName, setSkinName] = useState<string>('');
  const [skinIdentifier, setSkinIdentifier] = useState<string>('com.playcase.default.skin');
  const [uploadedImage, setUploadedImage] = useState<{ file: File; url: string } | null>(null);
  const [controls, setControls] = useState<ControlMapping[]>([]);
  const [selectedDeviceData, setSelectedDeviceData] = useState<Device | null>(null);
  const [selectedConsoleData, setSelectedConsoleData] = useState<Console | null>(null);
  const { settings } = useEditor();
  const { currentProject, saveProject } = useProject();

  // Load project data when current project changes
  useEffect(() => {
    if (currentProject) {
      setSkinName(currentProject.name);
      setSkinIdentifier(currentProject.identifier);
      setControls(currentProject.controls);
      if (currentProject.console) {
        setSelectedConsole(currentProject.console.shortName);
      }
      if (currentProject.device) {
        setSelectedDevice(currentProject.device.model);
      }
      if (currentProject.backgroundImage && currentProject.backgroundImage.url) {
        // Note: We can't restore the File object from localStorage, only the URL
        // The user will need to re-upload if they want to change the image
        setUploadedImage({
          file: new File([], currentProject.backgroundImage.fileName || 'image'),
          url: currentProject.backgroundImage.url
        });
      }
    }
  }, [currentProject]);

  // Auto-save when data changes
  useEffect(() => {
    if (currentProject) {
      const timer = setTimeout(() => {
        saveProject({
          name: skinName,
          identifier: skinIdentifier,
          console: selectedConsoleData,
          device: selectedDeviceData,
          controls,
          backgroundImage: uploadedImage ? {
            fileName: uploadedImage.file.name,
            url: uploadedImage.url
          } : null
        });
      }, 1000); // Debounce saves by 1 second

      return () => clearTimeout(timer);
    }
  }, [skinName, skinIdentifier, selectedConsoleData, selectedDeviceData, controls, uploadedImage, currentProject, saveProject]);

  // Add debug logging to check data
  useEffect(() => {
    console.log('Consoles data:', consoles);
    console.log('Devices data:', devices);
    // Check for duplicate keys
    const consoleKeys = consoles.map(c => c.shortName);
    const deviceKeys = devices.map(d => d.model);
    console.log('Console keys:', consoleKeys);
    console.log('Device keys:', deviceKeys);
    console.log('Duplicate console keys:', consoleKeys.filter((item, index) => consoleKeys.indexOf(item) !== index));
    console.log('Duplicate device keys:', deviceKeys.filter((item, index) => deviceKeys.indexOf(item) !== index));
  }, [consoles, devices]);

  // Load console and device data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [consolesRes, devicesRes] = await Promise.all([
          fetch('/assets/gameTypeIdentifiers.json'),
          fetch('/assets/iphone-sizes.json')
        ]);
        
        if (!consolesRes.ok || !devicesRes.ok) {
          throw new Error('Failed to load configuration files');
        }
        
        const consolesData = await consolesRes.json();
        const devicesData = await devicesRes.json();
        
        // Check for duplicate models (debugging)
        const deviceModels = devicesData.map((d: Device) => d.model);
        const duplicates = deviceModels.filter((item: string, index: number) => deviceModels.indexOf(item) !== index);
        if (duplicates.length > 0) {
          console.warn('Duplicate device models found:', duplicates);
        }
        
        setConsoles(consolesData);
        setDevices(devicesData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Update selected device data when device changes
  useEffect(() => {
    if (selectedDevice && devices.length > 0) {
      const device = devices.find(d => d.model === selectedDevice);
      setSelectedDeviceData(device || null);
      
      // Log if device not found
      if (!device && selectedDevice) {
        console.warn(`Device model "${selectedDevice}" not found in device list`);
      }
    } else {
      setSelectedDeviceData(null);
    }
  }, [selectedDevice, devices]);

  // Update selected console data when console changes
  useEffect(() => {
    if (selectedConsole && consoles.length > 0) {
      const console = consoles.find(c => c.shortName === selectedConsole);
      setSelectedConsoleData(console || null);
    } else {
      setSelectedConsoleData(null);
    }
  }, [selectedConsole, consoles]);

  const handleImageUpload = (file: File, previewUrl: string) => {
    setUploadedImage({ file, url: previewUrl });
  };

  const handleControlsUpdate = (newControls: ControlMapping[]) => {
    setControls(newControls);
  };

  const handleControlSelect = (control: ControlMapping) => {
    // Apply grid snapping to initial placement if enabled
    if (settings.snapToGrid && control.frame) {
      const snapToGrid = (value: number) => Math.round(value / settings.gridSize) * settings.gridSize;
      control.frame.x = snapToGrid(control.frame.x);
      control.frame.y = snapToGrid(control.frame.y);
      control.frame.width = snapToGrid(control.frame.width);
      control.frame.height = snapToGrid(control.frame.height);
    }
    // Add new control to the list
    setControls([...controls, control]);
  };

  return (
    <div id="editor-container">
      {/* Project Manager - Top Right */}
      <div className="flex justify-end mb-4">
        <ProjectManager />
      </div>

      {/* Two Column Layout */}
      <div id="editor-layout" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form, Controls and Image Upload */}
        <div id="editor-left-column" className="space-y-6">
          {/* Header Section */}
          <div id="editor-header" className="card animate-fade-in">
            <h2 id="editor-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create New Skin</h2>
            
            <div id="editor-form-grid" className="grid grid-cols-1 gap-4">
              {/* Skin Name Input */}
              <div id="skin-name-container">
                <label htmlFor="skinName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Skin Name
                </label>
                <input
                  type="text"
                  id="skinName"
                  value={skinName}
                  onChange={(e) => setSkinName(e.target.value)}
                  className="mt-1 input-field"
                  placeholder="My Custom Skin"
                />
              </div>

              {/* Skin Identifier Input */}
              <div id="skin-identifier-container">
                <label htmlFor="skinIdentifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Skin Identifier
                </label>
                <input
                  type="text"
                  id="skinIdentifier"
                  value={skinIdentifier}
                  onChange={(e) => setSkinIdentifier(e.target.value)}
                  className="mt-1 input-field"
                  placeholder="com.playcase.default.skin"
                />
              </div>

              {/* Console Selection */}
              <div id="console-selection-container">
                <label htmlFor="console" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Console System
                </label>
                <input
                  id="console"
                  list="console-list"
                  value={selectedConsole}
                  onChange={(e) => setSelectedConsole(e.target.value)}
                  className="mt-1 input-field"
                  placeholder="Type to search consoles..."
                />
                <datalist id="console-list">
                  {consoles.map((console) => (
                    <option key={console.shortName} value={console.shortName}>
                      {console.console}
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Device Selection */}
              <div id="device-selection-container">
                <label htmlFor="device" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  iPhone Model
                </label>
                <input
                  id="device"
                  list="device-list"
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="mt-1 input-field"
                  placeholder="Type to search devices..."
                />
                <datalist id="device-list">
                  {devices.map((device) => (
                    <option key={device.model} value={device.model} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
          {/* Image Upload Section */}
          {selectedConsole && selectedDevice && !uploadedImage && (
            <div id="image-upload-section" className="card animate-slide-up">
              <h3 id="image-upload-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upload Skin Image</h3>
              <ImageUploader onImageUpload={handleImageUpload} />
            </div>
          )}

          {/* Control Palette */}
          {selectedConsole && selectedDevice && (
            <div id="control-palette-section" className="card animate-slide-up">
              <ControlPalette 
                consoleType={selectedConsole}
                onControlSelect={handleControlSelect}
              />
            </div>
          )}
        </div>

        {/* Right Column - Canvas and JSON Preview */}
        <div id="editor-right-column" className="space-y-6">
          {/* Canvas Area */}
          <div id="canvas-section" className="card">
            <div id="canvas-header" className="flex flex-col space-y-4 mb-4">
              <div id="canvas-toolbar" className="flex justify-between items-center">
                <h3 id="canvas-title" className="text-lg font-medium text-gray-900 dark:text-white">Design Canvas</h3>
                <div id="canvas-actions" className="flex items-center space-x-3">
                  {uploadedImage && (
                    <button
                      id="change-image-button"
                      onClick={() => setUploadedImage(null)}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      Change Image
                    </button>
                  )}
                  <ExportButton
                    skinName={skinName}
                    skinIdentifier={skinIdentifier}
                    selectedConsole={selectedConsoleData}
                    selectedDevice={selectedDeviceData}
                    controls={controls}
                    backgroundImage={uploadedImage}
                  />
                </div>
              </div>
              {/* Grid Controls */}
              {selectedDeviceData && (
                <GridControls />
              )}
            </div>
            <Canvas 
              device={selectedDeviceData}
              backgroundImage={uploadedImage?.url || null}
              controls={controls}
              onControlUpdate={handleControlsUpdate}
            />
          </div>

          {/* JSON Preview */}
          {selectedConsoleData && selectedDeviceData && (
            <div id="json-preview-section" className="card animate-slide-up">
              <JsonPreview
                skinName={skinName}
                skinIdentifier={skinIdentifier}
                selectedConsole={selectedConsoleData}
                selectedDevice={selectedDeviceData}
                controls={controls}
                backgroundImageFile={uploadedImage?.file}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;