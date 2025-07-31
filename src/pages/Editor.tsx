// Main editor page for creating emulator skins
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Console, Device, ControlMapping, ScreenMapping } from '../types';
import ImageUploader from '../components/ImageUploader';
import Canvas from '../components/Canvas';
import ControlPalette from '../components/ControlPalette';
import ControlList from '../components/ControlList';
import ScreenPalette from '../components/ScreenPalette';
import ScreenList from '../components/ScreenList';
import JsonPreview from '../components/JsonPreview';
import GridControls from '../components/GridControls';
import ProjectManager from '../components/ProjectManager';
import ExportButton from '../components/ExportButton';
import ImportButton from '../components/ImportButton';
import MenuInsetsPanel from '../components/MenuInsetsPanel';
import ConsoleIcon from '../components/ConsoleIcon';
import SkinEditPanel from '../components/SkinEditPanel';
import { useEditor } from '../contexts/EditorContext';
import { useProject } from '../contexts/ProjectContext';
import { indexedDBManager } from '../utils/indexedDB';

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
  const [thumbstickImages, setThumbstickImages] = useState<{ [controlId: string]: string }>({});
  const [thumbstickFiles, setThumbstickFiles] = useState<{ [controlId: string]: File }>({});
  const [isEditPanelOpen, setIsEditPanelOpen] = useState<boolean>(false);
  const [selectedControlIndex, setSelectedControlIndex] = useState<number | null>(null);
  const [selectedScreenIndex, setSelectedScreenIndex] = useState<number | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clean up thumbstick URLs
      Object.values(thumbstickImages).forEach(url => {
        URL.revokeObjectURL(url);
      });
      // Reset edit panel tracking
      hasShownEditPanelRef.current = null;
    };
  }, []);
  const { settings } = useEditor();
  const { 
    currentProject, 
    saveProject, 
    saveProjectImage, 
    getCurrentOrientation, 
    setOrientation, 
    getOrientationData, 
    saveOrientationData
  } = useProject();

  // Load project data when current project changes or orientation changes
  useEffect(() => {
    if (currentProject) {
      setSkinName(currentProject.name);
      setSkinIdentifier(currentProject.identifier);
      
      // Check if this is a new project (no console or device selected)
      const isNewProject = !currentProject.console && !currentProject.device;
      
      // Load orientation-specific data
      const orientationData = getOrientationData();
      
      if (orientationData) {
        setControls(orientationData.controls || []);
        setScreens(orientationData.screens || []);
        setMenuInsetsEnabled(orientationData.menuInsetsEnabled || false);
        setMenuInsetsBottom(orientationData.menuInsetsBottom || 0);
        
        // Handle background image
        if (orientationData.backgroundImage && orientationData.backgroundImage.url) {
          setUploadedImage({
            file: new File([], orientationData.backgroundImage.fileName || 'image'),
            url: orientationData.backgroundImage.url
          });
        } else if (!orientationData.backgroundImage || !orientationData.backgroundImage.hasStoredImage) {
          // Only clear if there's truly no image for this orientation
          setUploadedImage(null);
        }
        // If hasStoredImage is true but URL is null, keep the current uploadedImage
        // This happens when we don't save blob URLs
      }
      
      if (currentProject.console) {
        setSelectedConsole(currentProject.console.shortName);
      }
      if (currentProject.device) {
        setSelectedDevice(currentProject.device.model);
      }
      
      // Load thumbstick images from IndexedDB
      loadThumbstickImages(currentProject.id);
      
      // Mark as saved when loading a project
      setHasUnsavedChanges(false);
      // Reset the mounted flag to prevent marking as unsaved during load
      hasMountedRef.current = false;
      
      // Show edit panel for new projects (only once per project)
      if (isNewProject && hasShownEditPanelRef.current !== currentProject.id) {
        setIsEditPanelOpen(true);
        hasShownEditPanelRef.current = currentProject.id;
      }
    }
  }, [currentProject, currentProject?.currentOrientation, getOrientationData]);
  
  // Load thumbstick images for a project
  const loadThumbstickImages = async (projectId: string) => {
    try {
      const thumbstickImages = await indexedDBManager.getAllThumbstickImages(projectId);
      const imageMap: { [controlId: string]: string } = {};
      const fileMap: { [controlId: string]: File } = {};
      
      for (const image of thumbstickImages) {
        if (image.controlId) {
          imageMap[image.controlId] = image.url;
          fileMap[image.controlId] = new File([image.data], image.fileName, { type: image.data.type });
        }
      }
      
      setThumbstickImages(imageMap);
      setThumbstickFiles(fileMap);
    } catch (error) {
      console.error('Failed to load thumbstick images:', error);
    }
  };

  // State to track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  // Manual save function
  const handleSave = useCallback(() => {
    if (!currentProject) return;
    
    // Save project-level data
    saveProject({
      name: skinName,
      identifier: skinIdentifier,
      console: selectedConsoleData,
      device: selectedDeviceData
    });
    
    // Save orientation-specific data
    saveOrientationData({
      controls,
      screens,
      menuInsetsEnabled,
      menuInsetsBottom,
      // Don't save the blob URL, just mark that we have an image
      backgroundImage: uploadedImage ? {
        fileName: uploadedImage.file.name,
        url: null, // Don't save blob URLs to localStorage
        hasStoredImage: true
      } : null
    });
    
    setHasUnsavedChanges(false);
    setShowSavedMessage(true);
    
    // Hide saved message after 2 seconds
    setTimeout(() => {
      setShowSavedMessage(false);
    }, 2000);
  }, [currentProject, skinName, skinIdentifier, selectedConsoleData, selectedDeviceData, controls, screens, menuInsetsEnabled, menuInsetsBottom, uploadedImage, saveProject, saveOrientationData]);

  // Track if component has mounted
  const hasMountedRef = useRef(false);
  // Track if we've shown the edit panel for this project
  const hasShownEditPanelRef = useRef<string | null>(null);
  
  // Track changes to mark as unsaved (but not on initial load)
  useEffect(() => {
    if (hasMountedRef.current && currentProject) {
      setHasUnsavedChanges(true);
    } else {
      hasMountedRef.current = true;
    }
  }, [skinName, skinIdentifier, selectedConsoleData, selectedDeviceData, controls, screens, menuInsetsEnabled, menuInsetsBottom, uploadedImage]);


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
        
        // Set default device if none selected
        if (!selectedDevice && devicesData.length > 0) {
          setSelectedDevice(devicesData[0].model);
        }
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
      if (console && !currentProject) {
        if (selectedConsole === 'nds') {
          // Nintendo DS needs exactly two screens
          const hasTopScreen = screens.some(s => s.label === 'Top Screen');
          const hasBottomScreen = screens.some(s => s.label === 'Bottom Screen');
          
          if (!hasTopScreen && !hasBottomScreen && screens.length === 0) {
            // Initialize both screens
            const newScreens = [
              {
                id: `screen-top-${Date.now()}`,
                label: 'Top Screen',
                inputFrame: { x: 0, y: 0, width: 256, height: 192 },
                outputFrame: { x: 100, y: 100, width: 200, height: 150 },
                maintainAspectRatio: true
              },
              {
                id: `screen-bottom-${Date.now() + 1}`,
                label: 'Bottom Screen',
                inputFrame: { x: 0, y: 192, width: 256, height: 192 },
                outputFrame: { x: 100, y: 270, width: 200, height: 150 },
                maintainAspectRatio: true
              }
            ];
            setScreens(newScreens);
          }
        } else if (selectedConsole === 'sg' && screens.length === 0) {
          // SEGA Genesis - no inputFrame
          setScreens([
            {
              id: `screen-${Date.now()}`,
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
              id: `screen-${Date.now()}`,
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
  }, [selectedConsole, consoles, currentProject]);

  const handleImageUpload = async (file: File, previewUrl: string) => {
    setUploadedImage({ file, url: previewUrl });
    
    // Save image to IndexedDB if we have a current project
    if (currentProject) {
      try {
        await saveProjectImage(file, getCurrentOrientation());
      } catch (error) {
        console.error('Failed to save image:', error);
        // Still allow the image to be used even if storage fails
      }
    }
  };

  const handleOrientationToggle = () => {
    if (!currentProject) return;
    
    // Save current orientation data before switching
    const orientationData = getOrientationData();
    if (orientationData) {
      const imageData = uploadedImage ? {
        fileName: uploadedImage.file.name,
        url: null,
        hasStoredImage: true
      } : orientationData.backgroundImage;
      
      saveOrientationData({
        controls,
        screens,
        menuInsetsEnabled,
        menuInsetsBottom,
        backgroundImage: imageData
      });
    }
    
    // Toggle orientation
    const newOrientation = getCurrentOrientation() === 'portrait' ? 'landscape' : 'portrait';
    setOrientation(newOrientation);
  };

  const handleCopyOrientationLayout = () => {
    if (!currentProject) return;
    
    const currentOrientation = getCurrentOrientation();
    const sourceOrientation = currentOrientation === 'portrait' ? 'landscape' : 'portrait';
    
    // Get the source orientation data
    const sourceData = getOrientationData(sourceOrientation);
    
    if (!sourceData || (!sourceData.controls?.length && !sourceData.screens?.length)) {
      alert(`No layout found in ${sourceOrientation} orientation to copy from.`);
      return;
    }
    
    // Ask for confirmation
    if (!confirm(`Copy layout from ${sourceOrientation} to ${currentOrientation}? This will replace the current ${currentOrientation} layout.`)) {
      return;
    }
    
    // Copy controls with adjusted positions if needed
    const copiedControls = sourceData.controls?.map((control: ControlMapping) => ({
      ...control,
      id: control.id, // Keep the same IDs to maintain thumbstick image associations
    })) || [];
    
    // Copy screens
    const copiedScreens = sourceData.screens?.map((screen: ScreenMapping) => ({
      ...screen,
      id: screen.id, // Keep the same IDs
    })) || [];
    
    // Update current orientation with copied data
    setControls(copiedControls);
    setScreens(copiedScreens);
    setMenuInsetsEnabled(sourceData.menuInsetsEnabled || false);
    setMenuInsetsBottom(sourceData.menuInsetsBottom || 0);
    
    // Copy background image if it exists
    if (sourceData.backgroundImage && sourceData.backgroundImage.hasStoredImage) {
      // The image is already in IndexedDB, just update the reference
      setUploadedImage({
        file: new File([], sourceData.backgroundImage.fileName || 'image'),
        url: sourceData.backgroundImage.url || ''
      });
    }
    
    alert(`Layout copied from ${sourceOrientation} to ${currentOrientation} successfully!`);
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

  const handleControlDelete = (index: number) => {
    const newControls = controls.filter((_, i) => i !== index);
    setControls(newControls);
    // Clear selection if deleted control was selected
    if (selectedControlIndex === index) {
      setSelectedControlIndex(null);
    } else if (selectedControlIndex !== null && selectedControlIndex > index) {
      // Adjust selection index if needed
      setSelectedControlIndex(selectedControlIndex - 1);
    }
  };

  const handleDeleteScreen = (index: number) => {
    // Prevent deletion of Nintendo DS screens
    if (selectedConsole === 'nds') {
      alert('Nintendo DS screens cannot be deleted. The system requires both top and bottom screens.');
      return;
    }
    
    const newScreens = screens.filter((_, i) => i !== index);
    setScreens(newScreens);
    // Clear selection if deleted screen was selected
    if (selectedScreenIndex === index) {
      setSelectedScreenIndex(null);
    } else if (selectedScreenIndex !== null && selectedScreenIndex > index) {
      // Adjust selection index if needed
      setSelectedScreenIndex(selectedScreenIndex - 1);
    }
  };

  const handleControlSelectFromList = (index: number) => {
    setSelectedControlIndex(index);
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
  
  const handleThumbstickImageUpload = async (file: File, controlIndex: number) => {
    const control = controls[controlIndex];
    if (control && control.id && currentProject) {
      try {
        // Store in IndexedDB
        const url = await indexedDBManager.storeImage(
          currentProject.id, 
          file, 
          'thumbstick', 
          control.id
        );
        
        // Update thumbstick images state
        setThumbstickImages(prev => ({
          ...prev,
          [control.id!]: url
        }));
        
        // Store the file for export
        setThumbstickFiles(prev => ({
          ...prev,
          [control.id!]: file
        }));
        
        // Update the control with thumbstick info
        const updatedControls = [...controls];
        updatedControls[controlIndex] = {
          ...control,
          thumbstick: {
            name: file.name,
            width: control.thumbstick?.width || 85,
            height: control.thumbstick?.height || 87
          }
        };
        setControls(updatedControls);
      } catch (error) {
        console.error('Failed to store thumbstick image:', error);
        // Still allow the image to be used even if storage fails
        const url = URL.createObjectURL(file);
        setThumbstickImages(prev => ({
          ...prev,
          [control.id!]: url
        }));
        setThumbstickFiles(prev => ({
          ...prev,
          [control.id!]: file
        }));
      }
    }
  };

  const handleImport = async (
    importedName: string,
    importedIdentifier: string,
    importedConsole: string,
    importedControls: ControlMapping[],
    importedScreens: ScreenMapping[],
    importedImage: { file: File; url: string } | null,
    deviceDimensions?: { width: number; height: number },
    importedThumbstickImages?: { controlId: string; file: File; url: string }[]
  ) => {
    // Set basic info
    setSkinName(importedName);
    setSkinIdentifier(importedIdentifier);
    setSelectedConsole(importedConsole);
    
    // Try to find matching device based on dimensions
    if (deviceDimensions && devices.length > 0) {
      const matchingDevice = devices.find(d => 
        d.logicalWidth === deviceDimensions.width && 
        d.logicalHeight === deviceDimensions.height
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
          await saveProjectImage(importedImage.file, getCurrentOrientation());
        } catch (error) {
          console.error('Failed to save imported image:', error);
        }
      }
    }
    
    // Set thumbstick images
    if (importedThumbstickImages && currentProject) {
      const imageMap: { [controlId: string]: string } = {};
      const fileMap: { [controlId: string]: File } = {};
      
      for (const thumbstickData of importedThumbstickImages) {
        imageMap[thumbstickData.controlId] = thumbstickData.url;
        fileMap[thumbstickData.controlId] = thumbstickData.file;
        
        // Save to IndexedDB
        try {
          await indexedDBManager.storeImage(
            currentProject.id,
            thumbstickData.file,
            'thumbstick',
            thumbstickData.controlId
          );
        } catch (error) {
          console.error(`Failed to save thumbstick image for control ${thumbstickData.controlId}:`, error);
        }
      }
      
      setThumbstickImages(imageMap);
      setThumbstickFiles(fileMap);
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

  // Add keyboard shortcut for save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return (
    <div id="editor-container">
      {/* Header with Title and Project Manager */}
      <div id="editor-header" className="flex justify-between items-center mb-4">
        {/* Left side - Title and Edit button */}
        <div className="flex items-center space-x-3">
          {/* Console Icon or Placeholder */}
          {selectedConsole ? (
            <ConsoleIcon console={selectedConsole} className="w-8 h-8" />
          ) : (
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-xs">?</span>
            </div>
          )}
          
          {/* Skin Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {skinName || 'Untitled Skin'}
            </h1>
            {skinIdentifier && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {skinIdentifier}
              </p>
            )}
          </div>
          
          {/* Edit Button */}
          <button
            onClick={() => setIsEditPanelOpen(true)}
            className={`p-2 transition-all duration-200 rounded-lg ${
              isEditPanelOpen 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Edit skin settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        
        {/* Orientation Toggle and Copy */}
        {currentProject && (
          <div className="flex items-center space-x-2">
            {/* Orientation Toggle */}
            <button
              onClick={handleOrientationToggle}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              title={`Switch to ${getCurrentOrientation() === 'portrait' ? 'landscape' : 'portrait'} orientation`}
            >
              <svg 
                className={`w-5 h-5 transition-transform duration-300 ${
                  getCurrentOrientation() === 'landscape' ? 'rotate-90' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <rect x="7" y="4" width="10" height="16" rx="2" strokeWidth={2} />
                <line x1="12" y1="17" x2="12" y2="17.01" strokeWidth={3} strokeLinecap="round" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getCurrentOrientation() === 'portrait' ? 'Portrait' : 'Landscape'}
              </span>
            </button>
            
            {/* Copy Layout Button */}
            <button
              onClick={handleCopyOrientationLayout}
              className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200"
              title={`Copy layout from ${getCurrentOrientation() === 'portrait' ? 'landscape' : 'portrait'} to ${getCurrentOrientation()}`}
            >
              <svg 
                className="w-5 h-5 text-blue-600 dark:text-blue-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Right side - Project Manager */}
        <ProjectManager 
          onSave={handleSave}
          hasUnsavedChanges={hasUnsavedChanges}
          showSavedMessage={showSavedMessage}
        />
      </div>

      {/* Two Column Layout */}
      <div id="editor-layout" className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Form, Controls and Image Upload */}
        <div id="editor-left-column" className="space-y-6 w-full lg:w-[280px] lg:flex-shrink-0">
          {/* Show configuration prompt if console/device not selected */}
          {!selectedConsole || !selectedDevice ? (
            <div id="configuration-prompt" className="card animate-slide-up">
              <div className="text-center p-8">
                <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Get Started</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Configure your skin settings to begin designing</p>
                <button
                  onClick={() => setIsEditPanelOpen(true)}
                  className="btn-primary"
                >
                  Configure Skin Settings
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Image Upload Section */}
              {!uploadedImage && (
                <div id="image-upload-section" className="card animate-slide-up">
                  <h3 id="image-upload-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upload Skin Image</h3>
                  <ImageUploader onImageUpload={handleImageUpload} />
                </div>
              )}

              {/* Control Palette */}
              <div id="control-palette-section" className="card animate-slide-up">
                <ControlPalette 
                  consoleType={selectedConsole}
                  onControlSelect={handleControlSelect}
                />
              </div>
              
              {/* Control List */}
              {controls.length > 0 && (
                <div id="control-list-section" className="card animate-slide-up">
                  <ControlList 
                    controls={controls}
                    onControlDelete={handleControlDelete}
                    onControlSelect={handleControlSelectFromList}
                    selectedControl={selectedControlIndex}
                  />
                </div>
              )}

              {/* Screen Palette */}
              <div id="screen-palette-section" className="card animate-slide-up">
                <h3 id="screen-palette-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">Game Screens</h3>
                <ScreenPalette 
                  consoleType={selectedConsole}
                  existingScreens={screens}
                  onScreenAdd={handleScreenAdd}
                />
                {screens.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <ScreenList
                      screens={screens}
                      onScreenDelete={handleDeleteScreen}
                      onScreenSelect={setSelectedScreenIndex}
                      selectedScreen={selectedScreenIndex}
                      consoleType={selectedConsole}
                    />
                  </div>
                )}
              </div>

              {/* Menu Insets Panel */}
              <MenuInsetsPanel
                menuInsetsEnabled={menuInsetsEnabled}
                menuInsetsBottom={menuInsetsBottom}
                onToggle={setMenuInsetsEnabled}
                onBottomChange={setMenuInsetsBottom}
              />
            </>
          )}
        </div>

        {/* Right Column - Canvas and JSON Preview */}
        <div id="editor-right-column" className="space-y-6 flex-1 min-w-0">
          {/* Canvas Area */}
          <div id="canvas-section" className="card">
            <div id="canvas-header" className="flex flex-col space-y-4 mb-4">
              <div id="canvas-toolbar" className="flex justify-between items-center">
                <h3 id="canvas-title" className="text-lg font-medium text-gray-900 dark:text-white">Design Canvas</h3>
              </div>
              {/* Grid Controls */}
              {selectedDeviceData && (
                <GridControls />
              )}
            </div>
            {/* Show canvas only when console and device are selected */}
            {selectedConsole && selectedDevice ? (
              <Canvas 
                device={selectedDeviceData}
                backgroundImage={uploadedImage?.url || null}
                controls={controls}
                screens={screens}
                consoleType={selectedConsole}
                orientation={getCurrentOrientation()}
                menuInsetsEnabled={menuInsetsEnabled}
                menuInsetsBottom={menuInsetsBottom}
                onControlUpdate={handleControlsUpdate}
                onScreenUpdate={handleScreensUpdate}
                thumbstickImages={thumbstickImages}
                onThumbstickImageUpload={handleThumbstickImageUpload}
                selectedControlIndex={selectedControlIndex}
                onControlSelectionChange={setSelectedControlIndex}
                selectedScreenIndex={selectedScreenIndex}
                onScreenSelectionChange={setSelectedScreenIndex}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium mb-2">Configure Your Skin First</p>
                  <p className="text-sm">Please select a console and device to begin designing</p>
                </div>
              </div>
            )}
            {/* Canvas Actions - Moved to bottom */}
            {selectedConsole && selectedDevice && (
              <div id="canvas-actions" className="flex items-center justify-end space-x-3 mt-4">
                {uploadedImage && (
                  <button
                    id="remove-image-button"
                    onClick={() => setUploadedImage(null)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Remove Image
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
                  thumbstickFiles={thumbstickFiles}
                />
              </div>
            )}
          </div>

          {/* JSON Preview */}
          {selectedConsole && selectedDevice && selectedConsoleData && selectedDeviceData && (
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
      
      {/* Edit Panel */}
      <SkinEditPanel
        isOpen={isEditPanelOpen}
        onClose={() => setIsEditPanelOpen(false)}
        skinName={skinName}
        skinIdentifier={skinIdentifier}
        selectedConsole={selectedConsole}
        selectedDevice={selectedDevice}
        consoles={consoles}
        devices={devices}
        controls={controls}
        onSkinNameChange={setSkinName}
        onSkinIdentifierChange={setSkinIdentifier}
        onConsoleChange={(newConsole) => {
          setSelectedConsole(newConsole);
          // Clear controls when console changes
          if (newConsole !== selectedConsole) {
            setControls([]);
          }
        }}
        onDeviceChange={(newDevice) => {
          setSelectedDevice(newDevice);
          // Clear controls when device changes
          if (newDevice !== selectedDevice) {
            setControls([]);
          }
        }}
      />
    </div>
  );
};

export default Editor;