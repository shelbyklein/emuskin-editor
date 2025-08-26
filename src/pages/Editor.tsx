// Main editor page for creating emulator skins
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Console, Device, ControlMapping, ScreenMapping } from '../types';
import { fileToDataURL } from '../utils/imageUtils';
import ImageUploader from '../components/ImageUploader';
import Canvas from '../components/Canvas';
import ControlPalette from '../components/ControlPalette';
import ControlList from '../components/ControlList';
import ScreenPalette from '../components/ScreenPalette';
import ScreenList from '../components/ScreenList';
import OrientationManager from '../components/OrientationManager';
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
import { useToast } from '../contexts/ToastContext';
// import { useAutosave } from '../hooks/useAutosave'; // Autosave disabled - using explicit saves

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
  const [menuInsetsLeft, setMenuInsetsLeft] = useState<number>(0);
  const [menuInsetsRight, setMenuInsetsRight] = useState<number>(0);
  const [debug, setDebug] = useState<boolean>(false);
  const [thumbstickImages, setThumbstickImages] = useState<{ [controlId: string]: string }>({});
  const [thumbstickFiles, setThumbstickFiles] = useState<{ [controlId: string]: File }>({});
  const [isEditPanelOpen, setIsEditPanelOpen] = useState<boolean>(false);
  const [selectedControlIndex, setSelectedControlIndex] = useState<number | null>(null);
  const [selectedScreenIndex, setSelectedScreenIndex] = useState<number | null>(null);
  
  const { settings } = useEditor();
  const { 
    currentProject, 
    createProject,
    saveProject, 
    saveProjectImage,
    getCurrentOrientation, 
    setOrientation, 
    getOrientationData, 
    saveOrientationData,
    saveProjectWithOrientation,
    isLoading: isProjectsLoading
  } = useProject();
  const { showError, showWarning, showInfo } = useToast();
  
  // Wrapper to handle async saves without blocking UI
  const saveOrientationDataAsync = useCallback((data: any, orientation?: 'portrait' | 'landscape') => {
    // Save in background without blocking UI
    saveOrientationData(data, orientation).catch(error => {
      console.error('Failed to save orientation data:', error);
      showError('Failed to save changes');
    });
  }, [saveOrientationData, showError]);
  
  // Helper function to find device by dimensions
  const findDeviceByDimensions = (width: number, height: number, orientation: 'portrait' | 'landscape') => {
    return devices.find(device => {
      if (orientation === 'portrait') {
        return device.logicalWidth === width && device.logicalHeight === height;
      } else {
        // In landscape, width and height are swapped
        return device.logicalWidth === height && device.logicalHeight === width;
      }
    });
  };
  
  // Debug log current project changes
  useEffect(() => {
    // Current project changed
  }, [currentProject]);

  // Track if we're saving to prevent state reset
  const isSavingRef = useRef(false);
  const previouslySavingRef = useRef(false);
  
  // Track the latest values from SkinEditPanel callbacks to avoid stale state issues
  const latestSkinData = useRef({
    name: '',
    identifier: '',
    console: '',
    device: ''
  });


  // Auto-create project if none exists (since we removed the Home screen)
  useEffect(() => {
    if (!currentProject && !isProjectsLoading && consoles.length > 0 && devices.length > 0) {
      console.log('📝 Auto-creating new project since none exists');
      createProject('New Skin');
    }
  }, [currentProject, isProjectsLoading, createProject, consoles.length, devices.length]);
  



  // Load project data when current project changes or orientation changes
  useEffect(() => {
    // Skip loading if we're in the middle of saving to prevent overwriting user input
    if (!currentProject || isSavingRef.current) {
      if (isSavingRef.current) {
        console.log('⚠️ Skipping project load - save in progress to prevent race condition');
      }
      return;
    }

    // Skip unnecessary processing if project is already configured and data hasn't meaningfully changed
    if (currentProject.hasBeenConfigured && 
        currentProject.console && 
        currentProject.device && 
        devices.length > 0 && 
        consoles.length > 0) {
      // Only process if there's a real change in project data
      const currentOrientation = getCurrentOrientation();
      const previousOrientation = previousOrientationRef.current;
      const orientationChanged = previousOrientation !== currentOrientation;
      
      if (!orientationChanged) {
        console.log('⚡ Skipping project load - already configured and no orientation change');
        return;
      }
    }
    
    // Skip if this is just a lastModified update (not actual data change)
    // Compare everything except lastModified to determine if data actually changed
    const currentOrientation = currentProject.currentOrientation || 'portrait';
    const orientationChanged = previousOrientationRef.current !== currentOrientation;
    
    // Check if this is just a timestamp update by comparing current values
    // Also check latestSkinData to account for changes that might be in progress
    const currentOrientationData = getOrientationData(currentOrientation);
    const currentControlsMatch = currentOrientationData && 
      currentOrientationData.controls.length === controls.length &&
      JSON.stringify(currentOrientationData.controls) === JSON.stringify(controls);
    const currentScreensMatch = currentOrientationData && 
      currentOrientationData.screens.length === screens.length &&
      JSON.stringify(currentOrientationData.screens) === JSON.stringify(screens);
    
    const isJustTimestampUpdate = 
      skinName === currentProject.name && 
      skinIdentifier === currentProject.identifier &&
      selectedConsole === currentProject.console?.shortName &&
      selectedDevice === currentProject.device?.model &&
      !orientationChanged &&
      currentControlsMatch &&
      currentScreensMatch &&
      // Also check if latestSkinData matches (handles mid-update scenarios)
      (!latestSkinData.current.device || latestSkinData.current.device === currentProject.device?.model);
      
    if (isJustTimestampUpdate) {
      console.log('Skipping project load - only timestamp changed, controls and screens unchanged');
      return;
    }
    
    // console.log('Project loading needed - changes detected:', {
    //   nameChanged: skinName !== currentProject.name,
    //   identifierChanged: skinIdentifier !== currentProject.identifier,
    //   consoleChanged: selectedConsole !== currentProject.console?.shortName,
    //   deviceChanged: selectedDevice !== currentProject.device?.model,
    //   orientationChanged,
    //   controlsChanged: !currentControlsMatch,
    //   screensChanged: !currentScreensMatch,
    //   currentControlsCount: controls.length,
    //   storedControlsCount: currentOrientationData?.controls.length || 0,
    //   currentScreensCount: screens.length,
    //   storedScreensCount: currentOrientationData?.screens.length || 0
    // });
    
    // console.log('Orientation check:', {
    //   previous: previousOrientationRef.current,
    //   current: currentOrientation,
    //   changed: orientationChanged
    // });
    
    // Update the previous orientation ref after logging
    previousOrientationRef.current = currentOrientation;
    
    // Loading project data
    
    // Always update skin name/identifier from the current project to ensure UI consistency
    setSkinName(currentProject.name);
    setSkinIdentifier(currentProject.identifier);
    setDebug(currentProject.debug || false);
    
    // Reset the latest data ref when loading a project
    latestSkinData.current = {
      name: currentProject.name,
      identifier: currentProject.identifier,
      console: currentProject.console?.shortName || '',
      device: currentProject.device?.model || ''
    };
    
    // Update console data first
    if (currentProject.console) {
      setSelectedConsoleData(currentProject.console);
    }
    
    // Check if this is a project that hasn't been configured yet
    const isUnconfiguredProject = !currentProject.hasBeenConfigured;
    // Loading project data
    
    // Load orientation-specific data
    const orientationData = getOrientationData();
    
    // Loading orientation data
    
    if (orientationData) {
      setControls(orientationData.controls || []);
      setScreens(orientationData.screens || []);
      setMenuInsetsEnabled(orientationData.menuInsetsEnabled || false);
      setMenuInsetsBottom(orientationData.menuInsetsBottom || 0);
      setMenuInsetsLeft(orientationData.menuInsetsLeft || 0);
      setMenuInsetsRight(orientationData.menuInsetsRight || 0);
      
      // Initialize history with loaded state
      setHistory([{
        controls: orientationData.controls || [],
        screens: orientationData.screens || [],
        timestamp: Date.now(),
        description: 'Load project'
      }]);
      setHistoryIndex(0);
      
     
      if (orientationData.backgroundImage) {
        const { url, dataURL, fileName } = orientationData.backgroundImage;
        
        // Handle image loading with async fallback logic
        const loadImage = async () => {
          let imageUrl = url;
          
          if (url && url.startsWith('blob:')) {
            // Check if blob URL is still valid by trying to fetch it
            try {
              const response = await fetch(url);
              if (!response.ok) {
                // Blob URL expired, use dataURL instead
                imageUrl = dataURL || null;
                console.log('⚠️ Blob URL expired, using dataURL fallback');
              }
            } catch (error) {
              // Blob URL is invalid, use dataURL
              imageUrl = dataURL || null;
              console.log('⚠️ Blob URL invalid, using dataURL fallback');
            }
          } else if (dataURL && !url) {
            // Only dataURL available
            imageUrl = dataURL;
          }
          
          if (imageUrl) {
            console.log('✅ Loading image:', imageUrl.startsWith('data:') ? 'from dataURL' : 'from URL');
            setUploadedImage({
              file: new File([], fileName || 'image.png'),
              url: imageUrl
            });
          } else {
            console.log('❌ No valid image URL or dataURL found');
            setUploadedImage(null);
          }
        };
        
        loadImage();
      } else {
        // No image stored
        console.log('❌ No background image found for', getCurrentOrientation());
        setUploadedImage(null);
      }
    } else {
      // No orientation data - clear everything
      console.log('No orientation data found, clearing controls and screens');
      setControls([]);
      setScreens([]);
      setMenuInsetsEnabled(false);
      setMenuInsetsBottom(0);
      setMenuInsetsLeft(0);
      setMenuInsetsRight(0);
      setUploadedImage(null);
    }
    
    // Check if we should auto-detect device based on skin dimensions
    // This helps when a skin was created with one device but the project was saved with another
    if (devices.length > 0 && currentProject.device) {
      // Don't overwrite device if we have a newer value in latestSkinData (prevents race conditions)
      const deviceToUse = latestSkinData.current.device || currentProject.device.model;
      const deviceData = devices.find(d => d.model === deviceToUse) || currentProject.device;
      
      // First, set the device (using latest value if available)
      setSelectedDevice(deviceToUse);
      setSelectedDeviceData(deviceData);
      
      // Then check if we have orientation data with controls/screens
      if (orientationData && (orientationData.controls?.length > 0 || orientationData.screens?.length > 0)) {
        const currentOrientation = getCurrentOrientation();
        
        // Analyze the control and screen positions to determine intended canvas size
        let maxX = 0;
        let maxY = 0;
        
        // Check controls
        orientationData.controls?.forEach(control => {
          const rightEdge = (control.frame.x || 0) + (control.frame.width || 0);
          const bottomEdge = (control.frame.y || 0) + (control.frame.height || 0);
          maxX = Math.max(maxX, rightEdge);
          maxY = Math.max(maxY, bottomEdge);
        });
        
        // Check screens
        orientationData.screens?.forEach(screen => {
          if (screen.outputFrame) {
            const rightEdge = screen.outputFrame.x + screen.outputFrame.width;
            const bottomEdge = screen.outputFrame.y + screen.outputFrame.height;
            maxX = Math.max(maxX, rightEdge);
            maxY = Math.max(maxY, bottomEdge);
          }
        });
        
        // If we found elements, try to match to a device
        if (maxX > 0 && maxY > 0) {
          // Add some padding to account for elements near the edge
          const threshold = 50;
          
          // Find device that best fits the content
          const matchingDevice = devices.find(device => {
            if (currentOrientation === 'portrait') {
              return maxX <= device.logicalWidth && maxY <= device.logicalHeight &&
                     maxX > (device.logicalWidth - threshold) && maxY > (device.logicalHeight - threshold);
            } else {
              return maxX <= device.logicalHeight && maxY <= device.logicalWidth &&
                     maxX > (device.logicalHeight - threshold) && maxY > (device.logicalWidth - threshold);
            }
          });
          
          // If we found a better match, use it
          if (matchingDevice && matchingDevice.model !== currentProject.device.model) {
            console.log('Better device match found based on content bounds:', {
              stored: currentProject.device.model,
              detected: matchingDevice.model,
              orientation: currentOrientation,
              contentBounds: { maxX, maxY }
            });
            
            setSelectedDevice(matchingDevice.model);
            setSelectedDeviceData(matchingDevice);
            showInfo(`Device adjusted to ${matchingDevice.model} to better fit skin content`);
          }
        }
      }
    } else if (currentProject.device && devices.length === 0) {
      // Devices not loaded yet - this useEffect will run again once devices load
      console.log('Waiting for devices to load before setting device selection');
      return;
    } else if (currentProject.device) {
      // Device stored but devices loaded - set the stored device  
      setSelectedDevice(currentProject.device.model);
      setSelectedDeviceData(currentProject.device);
    }
    
    if (currentProject.console && consoles.length > 0) {
      const consoleData = consoles.find(c => c.shortName === currentProject.console?.shortName) || currentProject.console;
      setSelectedConsole(currentProject.console.shortName);
      setSelectedConsoleData(consoleData);
    }
    
    // Load thumbstick images
    loadThumbstickImages();
    
    // Mark as saved when loading a project
    setHasUnsavedChanges(false);
    // Reset the mounted flag to prevent marking as unsaved during load
    hasMountedRef.current = false;
    
    // Show edit panel for unconfigured projects (only once per project)
    // Only show for projects that truly need configuration (no console OR no device)
    const needsConfiguration = !currentProject.console || !currentProject.device;
    console.log('Edit panel check:', {
      projectId: currentProject.id,
      isUnconfiguredProject,
      needsConfiguration,
      hasShownEditPanelRef: hasShownEditPanelRef.current,
      willShowPanel: isUnconfiguredProject && needsConfiguration && hasShownEditPanelRef.current !== currentProject.id
    });
    
    if (isUnconfiguredProject && needsConfiguration && hasShownEditPanelRef.current !== currentProject.id) {
      console.log('Opening edit panel for unconfigured project:', currentProject.id);
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        setIsEditPanelOpen(true);
        hasShownEditPanelRef.current = currentProject.id;
      }, 100);
    } else if (!needsConfiguration && !currentProject.hasBeenConfigured) {
      // Mark project as configured if it has both console and device but wasn't marked yet
      console.log('Marking project as configured:', currentProject.id);
      saveProject({ hasBeenConfigured: true });
    }
  }, [currentProject, currentProject?.currentOrientation, devices, consoles]);
  
  // Watch for project name and identifier changes to update UI immediately
  useEffect(() => {
    if (currentProject) {
      console.log('🐛 Editor: Updating skinName from project:', {
        oldSkinName: skinName,
        newSkinName: currentProject.name,
        projectLastModified: currentProject.lastModified,
        isSaving: isSavingRef.current,
        timestamp: Date.now()
      });
      setSkinName(currentProject.name);
      setSkinIdentifier(currentProject.identifier);
    }
  }, [currentProject?.name, currentProject?.identifier, currentProject?.lastModified]);

  // Additional sync when save completes - runs on every render to check saving state
  useEffect(() => {
    if (previouslySavingRef.current && !isSavingRef.current && currentProject) {
      console.log('🐛 Editor: Save completed, syncing state with project:', {
        projectName: currentProject.name,
        currentSkinName: skinName,
        timestamp: Date.now()
      });
      setSkinName(currentProject.name);
      setSkinIdentifier(currentProject.identifier);
    }
    
    previouslySavingRef.current = isSavingRef.current;
  });
  
  // Handle pending image save after project creation
  useEffect(() => {
    if (currentProject && pendingImageSaveRef.current) {
      const pendingImage = pendingImageSaveRef.current;
      console.log('Processing pending image save for new project...');
      
      saveProjectImage(pendingImage.file, pendingImage.orientation)
        .then(() => {
          console.log('Pending image saved successfully');
          pendingImageSaveRef.current = null;
          
          // Update orientation data with the saved image reference
          // Don't save automatically - user must click save button
          // The image is already set in the state for display
        })
        .catch(error => {
          console.error('Failed to save pending image:', error);
          pendingImageSaveRef.current = null;
        });
    }
  }, [currentProject?.id, saveProjectImage, getOrientationData, saveOrientationData]);
  
  // Load thumbstick images for a project
  const loadThumbstickImages = useCallback(async () => {
    try {
      const imageMap: { [controlId: string]: string } = {};
      const fileMap: { [controlId: string]: File } = {};
      
      // Check controls for thumbstick images with fallback handling
      const orientationData = getOrientationData();
      if (orientationData?.controls) {
        for (const control of orientationData.controls) {
          if (control.thumbstick && control.id) {
            const { url, dataURL, name } = control.thumbstick;
            
            // For thumbstick images, we'll use a simpler approach to avoid async/await issues
            // If we have a blob URL, we'll assume it might be invalid and prefer dataURL if available
            let imageUrl = url;
            
            // If we have both URL and dataURL, and URL is a blob, prefer dataURL for persistence
            if (dataURL && url && url.startsWith('blob:')) {
              imageUrl = dataURL;
              console.log(`Using dataURL for thumbstick ${control.id} (blob URL may expire)`);
            } else if (dataURL && !url) {
              // Only dataURL available
              imageUrl = dataURL;
            } else if (url) {
              // Use the URL (could be R2 or other persistent URL)
              imageUrl = url;
            }
            
            if (imageUrl) {
              imageMap[control.id] = imageUrl;
              fileMap[control.id] = new File([], name || 'thumbstick.png');
            }
          }
        }
      }
      
      setThumbstickImages(imageMap);
      setThumbstickFiles(fileMap);
    } catch (error) {
      console.error('Failed to load thumbstick images:', error);
    }
  }, [getOrientationData]);

  // State to track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  // Manual save function
  const handleSave = useCallback(async () => {
    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('Current state:', {
      hasCurrentProject: !!currentProject,
      projectId: currentProject?.id,
      skinName,
      skinIdentifier,
      hasUploadedImage: !!uploadedImage,
      uploadedImageUrl: uploadedImage?.url?.substring(0, 50) + '...',
      uploadedImageFileName: uploadedImage?.file.name,
      orientation: getCurrentOrientation()
    });
    
    // Set saving flag to prevent state reset
    isSavingRef.current = true;
    console.log('🔒 Setting save flag to prevent race condition');
    
    // If no current project, create one with all the current data
    if (!currentProject) {
      // Create project with current form data AND current orientation data to prevent loss
      const currentOrientationData = {
        controls,
        screens,
        menuInsetsEnabled,
        menuInsetsBottom,
        menuInsetsLeft,
        menuInsetsRight,
        backgroundImage: uploadedImage ? {
          fileName: uploadedImage.file.name,
          url: null, // URL will be set when saveProjectImage completes
          hasStoredImage: true
        } : null
      };
      
      console.log('Creating project with current orientation data:', {
        numControls: currentOrientationData.controls.length,
        numScreens: currentOrientationData.screens.length
      });
      
      createProject(skinName || 'Untitled Skin', {
        identifier: skinIdentifier || 'com.playcase.default.skin',
        console: selectedConsoleData,
        device: selectedDeviceData,
        hasBeenConfigured: !!(selectedConsoleData && selectedDeviceData),
        orientations: {
          portrait: getCurrentOrientation() === 'portrait' ? currentOrientationData : { controls: [], screens: [], backgroundImage: null, menuInsetsEnabled: false, menuInsetsBottom: 0, menuInsetsLeft: 0, menuInsetsRight: 0 },
          landscape: getCurrentOrientation() === 'landscape' ? currentOrientationData : { controls: [], screens: [], backgroundImage: null, menuInsetsEnabled: false, menuInsetsBottom: 0, menuInsetsLeft: 0, menuInsetsRight: 0 }
        }
      });
      
      // Mark that we need to save the image after project creation
      if (uploadedImage) {
        console.log('Marking image for save after project creation...');
        pendingImageSaveRef.current = {
          file: uploadedImage.file,
          orientation: getCurrentOrientation()
        };
      }
    } else {
      // Save project and orientation data together atomically
      const projectData = {
        name: skinName || 'Untitled Skin',
        identifier: skinIdentifier || 'com.playcase.default.skin',
        console: selectedConsoleData,
        device: selectedDeviceData,
        hasBeenConfigured: !!(selectedConsoleData && selectedDeviceData)
      };
      
      // Don't include backgroundImage in orientation data - it will be handled separately
      const orientationData = {
        controls,
        screens,
        menuInsetsEnabled,
        menuInsetsBottom,
        menuInsetsLeft,
        menuInsetsRight
      };
      
      console.log('Saving project and orientation data:', {
        project: {
          name: projectData.name,
          identifier: projectData.identifier,
          consoleShortName: projectData.console?.shortName,
          deviceModel: projectData.device?.model,
          hasBeenConfigured: projectData.hasBeenConfigured
        },
        orientation: {
          orientation: getCurrentOrientation(),
          numControls: orientationData.controls.length,
          numScreens: orientationData.screens.length,
          menuInsetsEnabled: orientationData.menuInsetsEnabled,
          menuInsetsBottom: orientationData.menuInsetsBottom
        }
      });
      
      // Log the actual data being saved
      console.log('=== SAVE DETAILS ===');
      console.log('Project Data:', projectData);
      console.log('Orientation Data:', orientationData);
      console.log('Controls being saved (count):', orientationData.controls.length);
      console.log('Screens being saved (count):', orientationData.screens.length);
      console.log('Controls sample (first 2):', orientationData.controls.slice(0, 2));
      console.log('Screens sample (first 2):', orientationData.screens.slice(0, 2));
      
      // Save project and orientation data first
      await saveProjectWithOrientation(projectData, orientationData);
      
      // Then save the image if one was uploaded
      if (uploadedImage) {
        console.log('Saving image for existing project...');
        try {
          console.log('Calling saveProjectImage');
          await saveProjectImage(uploadedImage.file, getCurrentOrientation());
          console.log('Image saved successfully');
        } catch (error) {
          console.error('Failed to save image to project:', error);
        }
      }
    }
    
    // Update UI state
    console.log('Save complete - updating UI state');
    setHasUnsavedChanges(false);
    setShowSavedMessage(true);
    
    // Reset saving flag immediately after save completes
    isSavingRef.current = false;
    console.log('🔓 Reset save flag - save complete');
    
    // Log what's currently in the database vs UI state
    console.log('=== DATABASE STATE AFTER SAVE ===');
    const currentOrientationData = getOrientationData();
    console.log('Current orientation data in DB:', currentOrientationData);
    console.log('Background image URL:', currentOrientationData?.backgroundImage?.url);
    console.log('Total controls in DB:', currentOrientationData?.controls?.length || 0);
    console.log('Total screens in DB:', currentOrientationData?.screens?.length || 0);
    
    // Also log the UI state for comparison
    console.log('=== UI STATE FOR COMPARISON ===');
    console.log('Total controls in UI state:', controls.length);
    console.log('Total screens in UI state:', screens.length);
    console.log('Controls in UI state:', controls);
    console.log('Screens in UI state:', screens);
    
    // Hide saved message after 3 seconds
    setTimeout(() => {
      setShowSavedMessage(false);
      console.log('Save message hidden - Project "' + (currentProject?.name || 'Unknown') + '" successfully saved');
    }, 3000);
  }, [currentProject, createProject, skinName, skinIdentifier, selectedConsoleData, selectedDeviceData, controls, screens, menuInsetsEnabled, menuInsetsBottom, uploadedImage, saveProjectImage, saveProjectWithOrientation, saveOrientationData, getCurrentOrientation]);

  // Track if component has mounted
  const hasMountedRef = useRef(false);
  // Track if we've shown the edit panel for this project
  const hasShownEditPanelRef = useRef<string | null>(null);
  // Track the previous orientation to detect changes
  const previousOrientationRef = useRef<string | null>(null);
  
  // Reset the edit panel tracking when currentProject changes
  useEffect(() => {
    if (currentProject && hasShownEditPanelRef.current !== currentProject.id) {
      // Reset the ref when we switch to a different project
      hasShownEditPanelRef.current = null;
    }
  }, [currentProject?.id]);
  // Track if we need to save an image after project creation
  const pendingImageSaveRef = useRef<{ file: File; orientation: 'portrait' | 'landscape' } | null>(null);
  
  // Track changes to mark as unsaved (but not on initial load or during saves)
  useEffect(() => {
    // Don't track changes if we're in the middle of saving or haven't mounted yet
    if (isSavingRef.current) {
      return;
    }
    
    if (hasMountedRef.current) {
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

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!currentProject) {
      console.error('No current project to upload image to');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      // Use local blob URL for display
      console.log('Using local blob URL for image storage');
      const imageUrl = URL.createObjectURL(file);
      console.log('Image stored as blob URL:', imageUrl);
      
      // Set the uploaded image for display
      setUploadedImage({ file, url: imageUrl });
      
      // Don't save automatically - user must click save button
      // The image is already stored and ready to be saved when user clicks save
      
      console.log('Image upload completed successfully');
    } catch (error) {
      console.error('Failed to upload image:', error);
      showError('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };


  const handleAddOrientation = useCallback((orientation: 'portrait' | 'landscape') => {
    if (!currentProject) return;
    
    const updatedOrientations = [...(currentProject.availableOrientations || ['portrait']), orientation];
    
    // Check if we need to initialize orientation data
    const needsInitialization = !currentProject.orientations?.[orientation];
    
    // Prepare orientation data if needed
    const defaultOrientationData = needsInitialization ? {
      controls: [],
      screens: [],
      backgroundImage: null,
      menuInsetsEnabled: false,
      menuInsetsBottom: 0
    } : undefined;
    
    // Save both project updates and orientation data in a single call
    saveProjectWithOrientation(
      {
        availableOrientations: updatedOrientations
      },
      defaultOrientationData,
      orientation
    );
    
    // After state updates are processed, offer to copy layout and switch orientation
    setTimeout(() => {
      const otherOrientation = orientation === 'portrait' ? 'landscape' : 'portrait';
      const sourceData = getOrientationData(otherOrientation);
      
      // Check if other orientation has data to copy
      if (sourceData && (sourceData.controls?.length > 0 || sourceData.screens?.length > 0)) {
        if (window.confirm(`Would you like to copy the layout from ${otherOrientation} to ${orientation}?`)) {
          // Copy the data to current state
          setControls(sourceData.controls || []);
          setScreens(sourceData.screens || []);
          setMenuInsetsEnabled(sourceData.menuInsetsEnabled || false);
          setMenuInsetsBottom(sourceData.menuInsetsBottom || 0);
          setMenuInsetsLeft(sourceData.menuInsetsLeft || 0);
          setMenuInsetsRight(sourceData.menuInsetsRight || 0);
          // Don't copy image - backgroundImage stays null
          // Don't save automatically - user must click save button
        }
      }
    }, 100); // Small delay to ensure state updates have propagated
  }, [currentProject, saveProjectWithOrientation, getOrientationData, saveOrientationData, setOrientation]);
  
  const handleRemoveOrientation = useCallback((orientation: 'portrait' | 'landscape') => {
    if (!currentProject) return;
    
    const currentOrientations = currentProject.availableOrientations || ['portrait'];
    if (currentOrientations.length <= 1) return; // Can't remove last orientation
    
    const updatedOrientations = currentOrientations.filter(o => o !== orientation);
    
    // If removing current orientation, switch to the other one first
    if (getCurrentOrientation() === orientation) {
      const newOrientation = updatedOrientations[0];
      setOrientation(newOrientation);
    }
    
    // Clear the orientation data and update available orientations in a single call
    saveProjectWithOrientation(
      {
        availableOrientations: updatedOrientations
      },
      {
        controls: [],
        screens: [],
        backgroundImage: null,
        menuInsetsEnabled: false,
        menuInsetsBottom: 0
      },
      orientation
    );
  }, [currentProject, getCurrentOrientation, setOrientation, saveProjectWithOrientation]);

  // Initialize history tracking state
  const [history, setHistory] = useState<Array<{ controls: ControlMapping[]; screens: ScreenMapping[]; timestamp: number; description: string }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryUpdate = useRef(false);
  const lastPushTime = useRef(0);

  // Push state to history
  const pushToHistory = useCallback((description: string) => {
    // Debounce history pushes to avoid too many entries
    const now = Date.now();
    if (now - lastPushTime.current < 100) return;
    lastPushTime.current = now;

    if (isHistoryUpdate.current) return;
    
    setHistory(prev => {
      const newHistory = historyIndex < prev.length - 1 
        ? prev.slice(0, historyIndex + 1)
        : [...prev];
      
      const newEntry = {
        controls: [...controls],
        screens: [...screens],
        timestamp: now,
        description
      };
      
      newHistory.push(newEntry);
      
      // Limit history to 50 entries
      if (newHistory.length > 50) {
        return newHistory.slice(newHistory.length - 50);
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [controls, screens, historyIndex]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    const state = history[newIndex];
    
    if (state) {
      isHistoryUpdate.current = true;
      setControls(state.controls);
      setScreens(state.screens);
      setHistoryIndex(newIndex);
      setTimeout(() => {
        isHistoryUpdate.current = false;
      }, 0);
    }
  }, [historyIndex, history]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    const state = history[newIndex];
    
    if (state) {
      isHistoryUpdate.current = true;
      setControls(state.controls);
      setScreens(state.screens);
      setHistoryIndex(newIndex);
      setTimeout(() => {
        isHistoryUpdate.current = false;
      }, 0);
    }
  }, [historyIndex, history]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Cmd/Ctrl + Shift + Z
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleControlsUpdate = (newControls: ControlMapping[]) => {
    // Force a new array reference to ensure React detects the change
    setControls([...newControls]);
    if (!isHistoryUpdate.current) {
      pushToHistory('Update controls');
    }
    
    // Don't save during drag operations - let drag end handle it
  };

  const handleScreensUpdate = (newScreens: ScreenMapping[]) => {
    // Force a new array reference to ensure React detects the change
    setScreens([...newScreens]);
    if (!isHistoryUpdate.current) {
      pushToHistory('Update screens');
    }
    
    // Don't save during drag operations - let drag end handle it
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
    const newControls = [...controls, control];
    setControls(newControls);
    pushToHistory('Add control');
    
    // Don't save automatically - user must click save button
  };

  const handleControlDelete = (index: number) => {
    const newControls = controls.filter((_, i) => i !== index);
    setControls(newControls);
    pushToHistory('Delete control');
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
      showWarning('Nintendo DS screens cannot be deleted. The system requires both top and bottom screens.');
      return;
    }
    
    const newScreens = screens.filter((_, i) => i !== index);
    setScreens(newScreens);
    pushToHistory('Delete screen');
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
    const newScreens = [...screens, screen];
    setScreens(newScreens);
    pushToHistory('Add screen');
    
    // Don't save automatically - user must click save button
  };
  
  const handleThumbstickImageUpload = async (file: File, controlIndex: number) => {
    const control = controls[controlIndex];
    if (control && control.id && currentProject) {
      try {
        // Use blob URL for display
        const url = URL.createObjectURL(file);
        console.log('Using blob URL for thumbstick image:', url);
        
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
        
        // Convert to dataURL for localStorage storage
        const dataURL = await fileToDataURL(file);
        
        // Update the control with thumbstick info
        const updatedControls = [...controls];
        updatedControls[controlIndex] = {
          ...control,
          thumbstick: {
            name: file.name,
            width: control.thumbstick?.width || 85,
            height: control.thumbstick?.height || 87,
            url: url, // Store blob URL for display
            dataURL: dataURL // Store dataURL for persistence
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
      // Save image to project using local storage
      if (currentProject) {
        try {
          saveProjectImage(importedImage.file);
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
        
        // Note: Thumbstick images are stored locally via imageMap and fileMap
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
        <div id="editor-title-section" className="flex items-center space-x-3">
          {/* Console Icon or Placeholder */}
          {selectedConsole ? (
            <ConsoleIcon console={selectedConsole} className="w-8 h-8" />
          ) : (
            <div id="console-icon-placeholder" className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span id="console-icon-placeholder-text" className="text-gray-500 dark:text-gray-400 text-xs">?</span>
            </div>
          )}
          
          {/* Skin Title */}
          <div id="skin-title-container">
            <h1 id="editor-skin-title" className="text-2xl font-bold text-gray-900 dark:text-white">
              {skinName || 'Untitled Skin'}
            </h1>
            {skinIdentifier && (
              <p id="editor-skin-identifier" className="text-sm text-gray-500 dark:text-gray-400">
                {skinIdentifier}
              </p>
            )}
          </div>
          
          {/* Edit Button */}
          <button
            id="edit-skin-button"
            onClick={() => setIsEditPanelOpen(true)}
            className={`p-2 transition-all duration-200 rounded-lg ${
              isEditPanelOpen 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Edit skin settings"
          >
            <svg id="edit-skin-icon" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        
        {/* Right side - Project Manager and Import/Export */}
        <div id="editor-header-buttons" className="flex items-center space-x-3">
          <ProjectManager 
            onSave={handleSave}
            hasUnsavedChanges={hasUnsavedChanges}
            showSavedMessage={showSavedMessage}
          />
          <div id="header-divider" className="border-l border-gray-300 dark:border-gray-600 h-5 mx-2" />
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
      </div>

      {/* Two Column Layout */}
      <div id="editor-layout" className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Form, Controls and Image Upload */}
        <div id="editor-left-column" className="space-y-6 w-full lg:w-[280px] lg:flex-shrink-0">
          {/* Show configuration prompt if console/device not selected */}
          {!selectedConsole || !selectedDevice ? (
            <div id="configuration-prompt" className="card animate-slide-up">
              <div id="configuration-prompt-content" className="text-center p-8">
                <svg id="configuration-prompt-icon" className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <h3 id="configuration-prompt-title" className="text-lg font-medium text-gray-900 dark:text-white mb-2">Get Started</h3>
                <p id="configuration-prompt-text" className="text-gray-600 dark:text-gray-400 mb-4">Configure your skin settings to begin designing</p>
                <button
                  id="configure-skin-button"
                  onClick={() => setIsEditPanelOpen(true)}
                  className="btn-primary"
                >
                  Configure Skin Settings
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Screen Palette */}
              <div id="screen-palette-section" className="card animate-slide-up">
                <h3 id="screen-palette-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">Game Screens</h3>
                <ScreenPalette 
                  consoleType={selectedConsole}
                  existingScreens={screens}
                  onScreenAdd={handleScreenAdd}
                />
                {screens.length > 0 && (
                  <div id="screen-list-section" className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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

              {/* Image Upload Section */}
              <div id="image-upload-section" className="card animate-slide-up">
                <h3 id="image-upload-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Upload {getCurrentOrientation() === 'portrait' ? 'Portrait' : 'Landscape'} Skin Image
                </h3>
                {!uploadedImage ? (
                  <ImageUploader 
                    onImageUpload={handleImageUpload} 
                    currentOrientation={getCurrentOrientation()}
                    isUploading={isUploadingImage}
                  />
                ) : (
                  <button
                    id="remove-image-button"
                    onClick={() => {
                      // Note: Blob URL cleanup is now handled by the tracking effect
                      
                      // Clear UI first
                      setUploadedImage(null);
                      
                      // Don't save automatically - user must click save button
                      // The image removal will be saved when user clicks save
                    }}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Remove {getCurrentOrientation() === 'portrait' ? 'Portrait' : 'Landscape'} Image
                  </button>
                )}
              </div>

              {/* Menu Insets Panel */}
              <MenuInsetsPanel
                menuInsetsEnabled={menuInsetsEnabled}
                menuInsetsBottom={menuInsetsBottom}
                menuInsetsLeft={menuInsetsLeft}
                menuInsetsRight={menuInsetsRight}
                orientation={getCurrentOrientation()}
                onToggle={(enabled) => {
                  setMenuInsetsEnabled(enabled);
                  // Don't save automatically - user must click save button
                }}
                onBottomChange={(value) => {
                  setMenuInsetsBottom(value);
                  // Don't save automatically - user must click save button
                }}
                onLeftChange={(value) => {
                  setMenuInsetsLeft(value);
                  // Don't save automatically - user must click save button
                }}
                onRightChange={(value) => {
                  setMenuInsetsRight(value);
                  // Don't save automatically - user must click save button
                }}
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
                <div id="canvas-title-and-history" className="flex items-center space-x-4">
                  <h3 id="canvas-title" className="text-lg font-medium text-gray-900 dark:text-white">Design Canvas</h3>
                  
                  {/* Undo/Redo Buttons */}
                  <div id="history-buttons" className="flex items-center space-x-1">
                    <button
                      id="undo-button"
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className={`p-1.5 rounded-lg transition-all duration-200 ${
                        historyIndex > 0 
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' 
                          : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                      title="Undo (Cmd/Ctrl+Z)"
                    >
                      <svg id="undo-icon" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    <button
                      id="redo-button"
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className={`p-1.5 rounded-lg transition-all duration-200 ${
                        historyIndex < history.length - 1 
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' 
                          : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                      title="Redo (Cmd/Ctrl+Shift+Z)"
                    >
                      <svg id="redo-icon" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Grid Controls - moved into toolbar */}
                {selectedDeviceData && (
                  <div id="grid-controls-container" className="flex-shrink-0">
                    <GridControls />
                  </div>
                )}
                
                {/* Orientation Manager - moved from left column */}
                {currentProject && (
                  <div id="orientation-manager-container" className="flex items-center">
                    <OrientationManager
                      key={`orientation-manager-${currentProject.availableOrientations?.length || 0}-${currentProject.availableOrientations?.join(',') || 'portrait'}`}
                      availableOrientations={currentProject.availableOrientations || ['portrait']}
                      currentOrientation={getCurrentOrientation()}
                      onOrientationChange={setOrientation}
                      onAddOrientation={handleAddOrientation}
                      onRemoveOrientation={handleRemoveOrientation}
                      orientationInfo={{
                        portrait: {
                          hasContent: !!(currentProject.orientations?.portrait?.controls?.length || 
                                       currentProject.orientations?.portrait?.screens?.length ||
                                       currentProject.orientations?.portrait?.backgroundImage)
                        },
                        landscape: {
                          hasContent: !!(currentProject.orientations?.landscape?.controls?.length || 
                                        currentProject.orientations?.landscape?.screens?.length ||
                                        currentProject.orientations?.landscape?.backgroundImage)
                        }
                      }}
                    />
                  </div>
                )}
                
              </div>
            </div>
            {/* Show canvas only when console and device are selected */}
            {selectedConsole && selectedDevice ? (
              <>
                <Canvas 
                  device={selectedDeviceData}
                  backgroundImage={uploadedImage?.url || null}
                  controls={controls}
                  screens={screens}
                  consoleType={selectedConsole}
                  orientation={getCurrentOrientation()}
                  menuInsetsEnabled={menuInsetsEnabled}
                  menuInsetsBottom={menuInsetsBottom}
                  menuInsetsLeft={menuInsetsLeft}
                  menuInsetsRight={menuInsetsRight}
                  onControlUpdate={handleControlsUpdate}
                  onScreenUpdate={handleScreensUpdate}
                  thumbstickImages={thumbstickImages}
                  onThumbstickImageUpload={handleThumbstickImageUpload}
                  selectedControlIndex={selectedControlIndex}
                  onControlSelectionChange={setSelectedControlIndex}
                  selectedScreenIndex={selectedScreenIndex}
                  onScreenSelectionChange={setSelectedScreenIndex}
                />
                
                {/* Orientation Image Status */}
                {currentProject && !uploadedImage && (
                  <div id="orientation-image-status" className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div id="orientation-image-status-content" className="flex items-center justify-between">
                      <p id="no-image-message" className="text-sm text-gray-600 dark:text-gray-400">
                        No image for {getCurrentOrientation()} orientation
                      </p>
                      {(() => {
                        const otherOrientation = getCurrentOrientation() === 'portrait' ? 'landscape' : 'portrait';
                        const otherData = getOrientationData(otherOrientation);
                        if (otherData?.backgroundImage) {
                          return (
                            <button
                              id="copy-from-other-orientation-button"
                              onClick={async () => {
                                try {
                                  if (otherData.backgroundImage?.url) {
                                    // R2 URL - fetch the image
                                    const response = await fetch(otherData.backgroundImage.url);
                                    const blob = await response.blob();
                                    const file = new File([blob], otherData.backgroundImage.fileName || 'image.png', { type: blob.type });
                                    handleImageUpload(file);
                                  }
                                } catch (error) {
                                  console.error('Failed to copy image:', error);
                                  showError('Failed to copy image from other orientation');
                                }
                              }}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Copy from {otherOrientation}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div id="empty-canvas-state" className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <div id="empty-canvas-content" className="text-center">
                  <svg id="empty-canvas-icon" className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p id="empty-canvas-title" className="text-lg font-medium mb-2">Configure Your Skin First</p>
                  <p id="empty-canvas-subtitle" className="text-sm">Please select a console and device to begin designing</p>
                </div>
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
        debug={debug}
        consoles={consoles}
        devices={devices}
        controls={controls}
        onSkinNameChange={(newName) => {
          console.log('🐛 Editor: onSkinNameChange called with:', newName);
          console.log('🐛 Editor: currentProject exists?', !!currentProject);
          console.log('🐛 Editor: current skinName state before update:', skinName);
          
          // Track the latest value to avoid stale state issues
          latestSkinData.current.name = newName;
          
          // Update local state immediately for responsive UI
          setSkinName(newName);
          console.log('🐛 Editor: setSkinName called with:', newName);
          
          // Don't save here - wait for all data to be collected
          if (currentProject) {
            console.log('🐛 Editor: Project exists, will save all data in device callback');
          } else {
            console.log('🐛 Editor: No current project, waiting for device callback');
          }
          // Don't create project here - wait for all data to be set
        }}
        onSkinIdentifierChange={(newIdentifier) => {
          // Track the latest value to avoid stale state issues
          latestSkinData.current.identifier = newIdentifier;
          
          // Update local state immediately for responsive UI  
          setSkinIdentifier(newIdentifier);
          
          // Don't save here - wait for all data to be collected
          if (currentProject) {
            console.log('🔵 Editor: Project exists, will save all data in device callback');
          }
          // Don't create project here - wait for all data to be set
        }}
        onConsoleChange={(newConsole) => {
          // Track the latest value to avoid stale state issues
          latestSkinData.current.console = newConsole;
          
          setSelectedConsole(newConsole);
          // Clear controls and screens when console changes
          if (newConsole !== selectedConsole) {
            setControls([]);
            
            // Clear screens but prepare to re-initialize for specific consoles
            if (newConsole === 'nds') {
              // Nintendo DS needs exactly two screens
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
            } else {
              // For other consoles, just clear screens
              setScreens([]);
            }
            
            pushToHistory('Change console');
          }
          
          // Don't save here - wait for all data to be collected
          if (currentProject) {
            console.log('🔵 Editor: Project exists, will save all data in device callback');
          }
          // Don't create project here - wait for device change which is called last
        }}
        onDeviceChange={(newDevice) => {
          console.log('🔵 Editor: onDeviceChange called with:', newDevice);
          console.log('🔵 Editor: Current state at device change:', {
            skinName,
            skinIdentifier,
            selectedConsole,
            currentProject: !!currentProject
          });
          console.log('🔵 Editor: Latest tracked values:', latestSkinData.current);
          
          // Track the latest device value
          latestSkinData.current.device = newDevice;
          
          setSelectedDevice(newDevice);
          // Clear controls when device changes
          if (newDevice !== selectedDevice) {
            setControls([]);
          }
          
          // Find the device data object
          const deviceData = devices.find(d => d.model === newDevice) || null;
          
          if (currentProject) {
            console.log('🔵 Editor: Updating existing project with ALL data');
            
            // Get the console data object
            const consoleData = consoles.find(c => c.shortName === latestSkinData.current.console) || null;
            
            // Save ALL data in one comprehensive call
            const isFullyConfigured = !!(latestSkinData.current.console && newDevice);
            
            console.log('🔵 Editor: Saving comprehensive update:', {
              name: latestSkinData.current.name || currentProject.name,
              identifier: latestSkinData.current.identifier || currentProject.identifier,
              console: consoleData,
              device: deviceData,
              hasBeenConfigured: isFullyConfigured
            });
            
            saveProject({ 
              name: latestSkinData.current.name || currentProject.name,
              identifier: latestSkinData.current.identifier || currentProject.identifier,
              console: consoleData,
              device: deviceData,
              hasBeenConfigured: isFullyConfigured 
            });
          } else {
            // Use the latest tracked values instead of potentially stale state
            const finalName = latestSkinData.current.name || 'Untitled Skin';
            const finalIdentifier = latestSkinData.current.identifier || 'com.playcase.default.skin';
            const finalConsole = latestSkinData.current.console;
            
            console.log('🔵 Editor: Creating new project with LATEST tracked data:', {
              name: finalName,
              identifier: finalIdentifier,
              console: finalConsole,
              device: newDevice
            });
            
            // Create project with all current form data (since this is called last)
            const projectId = createProject(finalName, {
              identifier: finalIdentifier,
              console: consoles.find(c => c.shortName === finalConsole) || null,
              device: deviceData,
              hasBeenConfigured: true
            });
            console.log('🔵 Editor: Created project with ID:', projectId);
          }
        }}
        onDebugChange={(newDebug) => {
          console.log('🔵 Editor: onDebugChange called with:', newDebug);
          setDebug(newDebug);
          
          // Save debug setting to project if it exists
          if (currentProject) {
            saveProject({ debug: newDebug });
          }
        }}
      />
    </div>
  );
};

export default Editor;