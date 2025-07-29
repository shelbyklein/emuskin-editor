// Main editor page for creating emulator skins
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Console, Device, ControlMapping, ScreenMapping } from '../types';
import ImageUploader from '../components/ImageUploader';
import Canvas from '../components/Canvas';
import ControlPalette from '../components/ControlPalette';
import ScreenPalette from '../components/ScreenPalette';
import JsonPreview from '../components/JsonPreview';
import GridControls from '../components/GridControls';
import ProjectManager from '../components/ProjectManager';
import ExportButton from '../components/ExportButton';
import ImportButton from '../components/ImportButton';
import MenuInsetsPanel from '../components/MenuInsetsPanel';
import { useEditor } from '../contexts/EditorContext';
import { useProject } from '../contexts/ProjectContext';

const Editor: React.FC = () => {
  const location = useLocation();
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedConsole, setSelectedConsole] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [skinName, setSkinName] = useState<string>('');
  const [skinIdentifier, setSkinIdentifier] = useState<string>('com.playcase.default.skin');
  const [uploadedImage, setUploadedImage] = useState<{ file: File; url: string } | null>(null);
  const [controls, setControls] = useState<ControlMapping[]>([]);
  const [screens, setScreens] = useState<ScreenMapping[]>([]);
  const [selectedDeviceData, setSelectedDeviceData] = useState<Device | null>(null);
  const [selectedConsoleData, setSelectedConsoleData] = useState<Console | null>(null);
  const [menuInsetsEnabled, setMenuInsetsEnabled] = useState<boolean>(false);
  const [menuInsetsBottom, setMenuInsetsBottom] = useState<number>(0);
  const { settings } = useEditor();
  const { currentProject, saveProject, saveProjectImage } = useProject();

  // Load project data when current project changes
  useEffect(() => {
    if (currentProject) {
      setSkinName(currentProject.name);
      setSkinIdentifier(currentProject.identifier);
      setControls(currentProject.controls);
      setScreens(currentProject.screens || []);
      setMenuInsetsEnabled(currentProject.menuInsetsEnabled || false);
      setMenuInsetsBottom(currentProject.menuInsetsBottom || 0);
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

  // Track if we're actively interacting
  const [isInteracting, setIsInteracting] = useState(false);

  // Auto-save when data changes (except image which is saved separately)
  useEffect(() => {
    if (currentProject && !isInteracting) {
      const timer = setTimeout(() => {
        saveProject({
          name: skinName,
          identifier: skinIdentifier,
          console: selectedConsoleData,
          device: selectedDeviceData,
          controls,
          screens,
          menuInsetsEnabled,
          menuInsetsBottom,
          // Don't save the blob URL, just mark that we have an image
          backgroundImage: currentProject.backgroundImage ? {
            fileName: currentProject.backgroundImage.fileName,
            url: null, // Don't save blob URLs to localStorage
            hasStoredImage: currentProject.backgroundImage.hasStoredImage
          } : null
        });
      }, 1000); // Debounce saves by 1 second

      return () => clearTimeout(timer);
    }
  }, [skinName, skinIdentifier, selectedConsoleData, selectedDeviceData, controls, screens, menuInsetsEnabled, menuInsetsBottom, currentProject, saveProject, isInteracting]);

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

  // Update selected console data when console changes and handle screens
  useEffect(() => {
    if (selectedConsole && consoles.length > 0) {
      const console = consoles.find(c => c.shortName === selectedConsole);
      setSelectedConsoleData(console || null);
      
      // Auto-initialize screens based on console type (unless already loaded from project)
      if (console && screens.length === 0 && !currentProject) {
        if (selectedConsole === 'nds') {
          // Nintendo DS needs two screens
          setScreens([
            {
              label: 'Top Screen',
              inputFrame: { x: 0, y: 0, width: 256, height: 192 },
              outputFrame: { x: 67, y: 50, width: 256, height: 192 },
              maintainAspectRatio: true
            },
            {
              label: 'Bottom Screen',
              inputFrame: { x: 0, y: 192, width: 256, height: 192 },
              outputFrame: { x: 67, y: 262, width: 256, height: 192 },
              maintainAspectRatio: true
            }
          ]);
        } else if (selectedConsole === 'sg') {
          // SEGA Genesis - no inputFrame
          setScreens([
            {
              label: 'Game Screen',
              outputFrame: { x: 50, y: 100, width: 290, height: 218 },
              maintainAspectRatio: true
            }
          ]);
        } else {
          // Other consoles - single screen with default position
          const defaultWidth = 290;
          const aspectRatios: { [key: string]: number } = {
            'gbc': 160 / 144,
            'gba': 240 / 160,
            'nes': 256 / 240,
            'snes': 256 / 224,
            'n64': 256 / 224,
            'ps1': 4 / 3
          };
          const aspectRatio = aspectRatios[selectedConsole] || 1.333;
          const defaultHeight = Math.round(defaultWidth / aspectRatio);
          
          setScreens([
            {
              label: 'Game Screen',
              inputFrame: {
                x: 0,
                y: 0,
                width: selectedConsole === 'gbc' ? 160 : 
                       selectedConsole === 'gba' ? 240 : 
                       selectedConsole === 'ps1' ? 320 : 256,
                height: selectedConsole === 'gbc' ? 144 : 
                        selectedConsole === 'gba' ? 160 : 
                        selectedConsole === 'nes' ? 240 :
                        selectedConsole === 'ps1' ? 240 : 224
              },
              outputFrame: { x: 50, y: 100, width: defaultWidth, height: defaultHeight },
              maintainAspectRatio: true
            }
          ]);
        }
      }
    } else {
      setSelectedConsoleData(null);
      // Clear screens when no console selected (unless loading from project)
      if (!currentProject) {
        setScreens([]);
      }
    }
  }, [selectedConsole, consoles, screens.length, currentProject]);

  const handleImageUpload = async (file: File, previewUrl: string) => {
    setUploadedImage({ file, url: previewUrl });
    
    // Save image to IndexedDB if we have a current project
    if (currentProject) {
      try {
        await saveProjectImage(file);
      } catch (error) {
        console.error('Failed to save image:', error);
        // Still allow the image to be used even if storage fails
      }
    }
  };

  const handleControlsUpdate = (newControls: ControlMapping[]) => {
    // Force a new array reference to ensure React detects the change
    setControls([...newControls]);
  };

  const handleScreensUpdate = (newScreens: ScreenMapping[]) => {
    // Force a new array reference to ensure React detects the change
    setScreens([...newScreens]);
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

  const handleScreenAdd = (screen: ScreenMapping) => {
    // Apply grid snapping to initial placement if enabled
    if (settings.snapToGrid && screen.outputFrame) {
      const snapToGrid = (value: number) => Math.round(value / settings.gridSize) * settings.gridSize;
      screen.outputFrame.x = snapToGrid(screen.outputFrame.x);
      screen.outputFrame.y = snapToGrid(screen.outputFrame.y);
      screen.outputFrame.width = snapToGrid(screen.outputFrame.width);
      screen.outputFrame.height = snapToGrid(screen.outputFrame.height);
    }
    // Add new screen to the list
    setScreens([...screens, screen]);
  };

  const handleImport = async (
    importedName: string,
    importedIdentifier: string,
    importedConsole: string,
    importedControls: ControlMapping[],
    importedScreens: ScreenMapping[],
    importedImage: { file: File; url: string } | null,
    deviceDimensions?: { width: number; height: number }
  ) => {
    // Set basic info
    setSkinName(importedName);
    setSkinIdentifier(importedIdentifier);
    setSelectedConsole(importedConsole);
    
    // Try to find matching device based on dimensions
    if (deviceDimensions && devices.length > 0) {
      const matchingDevice = devices.find(d => 
        d.logical.width === deviceDimensions.width && 
        d.logical.height === deviceDimensions.height
      );
      if (matchingDevice) {
        setSelectedDevice(matchingDevice.model);
      }
    }
    
    // Set controls and screens
    setControls(importedControls);
    setScreens(importedScreens);
    
    // Set background image
    if (importedImage) {
      setUploadedImage(importedImage);
      // Save to IndexedDB if we have a project
      if (currentProject) {
        try {
          await saveProjectImage(importedImage.file);
        } catch (error) {
          console.error('Failed to save imported image:', error);
        }
      }
    }
  };

  // Handle imported data from navigation state
  useEffect(() => {
    const importedData = location.state?.importedData;
    if (importedData && devices.length > 0) {
      handleImport(
        importedData.name,
        importedData.identifier,
        importedData.console,
        importedData.controls,
        importedData.screens,
        importedData.image,
        importedData.deviceDimensions
      );
      // Clear the state to prevent re-importing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, devices]);

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
                <select
                  id="console"
                  value={selectedConsole}
                  onChange={(e) => setSelectedConsole(e.target.value)}
                  className="mt-1 input-field"
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
              <div id="device-selection-container">
                <label htmlFor="device" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  iPhone Model
                </label>
                <select
                  id="device"
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="mt-1 input-field"
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

          {/* Screen Palette */}
          {selectedConsole && selectedDevice && (
            <div id="screen-palette-section" className="card animate-slide-up">
              <h3 id="screen-palette-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">Game Screens</h3>
              <ScreenPalette 
                consoleType={selectedConsole}
                existingScreens={screens}
                onScreenAdd={handleScreenAdd}
              />
            </div>
          )}

          {/* Menu Insets Panel */}
          {selectedConsole && selectedDevice && (
            <MenuInsetsPanel
              menuInsetsEnabled={menuInsetsEnabled}
              menuInsetsBottom={menuInsetsBottom}
              onToggle={setMenuInsetsEnabled}
              onBottomChange={setMenuInsetsBottom}
            />
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
                  <ImportButton onImport={handleImport} />
                  <ExportButton
                    skinName={skinName}
                    skinIdentifier={skinIdentifier}
                    selectedConsole={selectedConsoleData}
                    selectedDevice={selectedDeviceData}
                    controls={controls}
                    screens={screens}
                    backgroundImage={uploadedImage}
                    menuInsetsEnabled={menuInsetsEnabled}
                    menuInsetsBottom={menuInsetsBottom}
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
              screens={screens}
              consoleType={selectedConsole}
              menuInsetsEnabled={menuInsetsEnabled}
              menuInsetsBottom={menuInsetsBottom}
              onControlUpdate={handleControlsUpdate}
              onScreenUpdate={handleScreensUpdate}
              onInteractionChange={setIsInteracting}
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
                screens={screens}
                backgroundImageFile={uploadedImage?.file}
                menuInsetsEnabled={menuInsetsEnabled}
                menuInsetsBottom={menuInsetsBottom}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;