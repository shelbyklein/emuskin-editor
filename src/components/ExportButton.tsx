// Export button component for generating skin files
import React, { useState } from 'react';
import JSZip from 'jszip';
import { Console, Device, ControlMapping, ScreenMapping } from '../types';
import { useProject } from '../contexts/ProjectContext';
import { indexedDBManager } from '../utils/indexedDB';

interface ExportButtonProps {
  skinName: string;
  skinIdentifier: string;
  selectedConsole: Console | null;
  selectedDevice: Device | null;
  controls: ControlMapping[];
  screens: ScreenMapping[];
  backgroundImage: { file: File; url: string } | null;
  menuInsetsEnabled?: boolean;
  menuInsetsBottom?: number;
  thumbstickFiles?: { [controlId: string]: File };
}

const ExportButton: React.FC<ExportButtonProps> = ({
  skinName,
  skinIdentifier,
  selectedConsole,
  selectedDevice,
  controls
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'deltaskin' | 'gammaskin'>('deltaskin');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const { currentProject } = useProject();

  const generateSkinJson = () => {
    if (!selectedConsole || !selectedDevice) {
      throw new Error('Console and device must be selected');
    }

    // Get data for both orientations from current project
    const portraitData = currentProject?.orientations?.portrait;
    const landscapeData = currentProject?.orientations?.landscape;

    const skinConfig: any = {
      name: skinName || 'Untitled Skin',
      identifier: skinIdentifier || 'com.playcase.default.skin',
      gameTypeIdentifier: selectedConsole.gameTypeIdentifier,
      representations: {
        iphone: {
          edgeToEdge: {}
        }
      }
    };

    // Add portrait orientation if it has data
    if (portraitData) {
      skinConfig.representations.iphone.edgeToEdge.portrait = {
        assets: portraitData.backgroundImage ? { medium: portraitData.backgroundImage.fileName || 'background.png' } : {},
        items: (portraitData.controls || []).map(control => {
                  const item: any = {};
                  
                  // Add thumbstick if present (must come before inputs)
                  if (control.thumbstick) {
                    item.thumbstick = {
                      name: control.thumbstick.name,
                      width: control.thumbstick.width,
                      height: control.thumbstick.height
                    };
                  }
                  
                  // Add inputs
                  item.inputs = control.inputs;
                  
                  // Add frame
                  item.frame = {
                    x: control.frame?.x || 0,
                    y: control.frame?.y || 0,
                    width: control.frame?.width || 50,
                    height: control.frame?.height || 50
                  };
                  
                  // Add extended edges
                  item.extendedEdges = control.extendedEdges || {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0
                  };
                  
                  return item;
                }),
        screens: (portraitData.screens || []).map(screen => {
          const screenObj: any = {
            outputFrame: {
              x: screen.outputFrame?.x || 0,
              y: screen.outputFrame?.y || 0,
              width: screen.outputFrame?.width || 200,
              height: screen.outputFrame?.height || 150
            }
          };
          
          // Only include inputFrame if it exists (not for SEGA Genesis)
          if (screen.inputFrame) {
            screenObj.inputFrame = {
              x: screen.inputFrame.x,
              y: screen.inputFrame.y,
              width: screen.inputFrame.width,
              height: screen.inputFrame.height
            };
          }
          
          return screenObj;
        }),
        mappingSize: {
          width: selectedDevice.logicalWidth,
          height: selectedDevice.logicalHeight
        },
        extendedEdges: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        },
        menuInsets: portraitData.menuInsetsEnabled ? {
          bottom: (portraitData.menuInsetsBottom || 0) / 100
        } : {}
      };
    }
    
    // Add landscape orientation if it has data
    if (landscapeData && (landscapeData.controls?.length > 0 || landscapeData.screens?.length > 0)) {
      skinConfig.representations.iphone.edgeToEdge.landscape = {
        assets: landscapeData.backgroundImage ? { medium: landscapeData.backgroundImage.fileName || 'background.png' } : {},
        items: (landscapeData.controls || []).map(control => {
          const item: any = {};
          
          // Add thumbstick if present (must come before inputs)
          if (control.thumbstick) {
            item.thumbstick = {
              name: control.thumbstick.name,
              width: control.thumbstick.width,
              height: control.thumbstick.height
            };
          }
          
          // Add inputs
          item.inputs = control.inputs;
          
          // Add frame
          item.frame = {
            x: control.frame?.x || 0,
            y: control.frame?.y || 0,
            width: control.frame?.width || 50,
            height: control.frame?.height || 50
          };
          
          // Add extended edges
          item.extendedEdges = control.extendedEdges || {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          };
          
          return item;
        }),
        screens: (landscapeData.screens || []).map(screen => {
          const screenObj: any = {
            outputFrame: {
              x: screen.outputFrame?.x || 0,
              y: screen.outputFrame?.y || 0,
              width: screen.outputFrame?.width || 200,
              height: screen.outputFrame?.height || 150
            }
          };
          
          // Only include inputFrame if it exists (not for SEGA Genesis)
          if (screen.inputFrame) {
            screenObj.inputFrame = {
              x: screen.inputFrame.x,
              y: screen.inputFrame.y,
              width: screen.inputFrame.width,
              height: screen.inputFrame.height
            };
          }
          
          return screenObj;
        }),
        mappingSize: {
          width: selectedDevice.logicalHeight,  // Swapped for landscape
          height: selectedDevice.logicalWidth   // Swapped for landscape
        },
        extendedEdges: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        },
        menuInsets: landscapeData.menuInsetsEnabled ? {
          bottom: (landscapeData.menuInsetsBottom || 0) / 100
        } : {}
      };
    }

    return JSON.stringify(skinConfig, null, 2);
  };

  const validateExport = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!skinName || skinName.trim() === '') {
      errors.push('Skin name is required');
    }
    
    if (!skinIdentifier || skinIdentifier.trim() === '') {
      errors.push('Skin identifier is required');
    } else if (!/^[a-z0-9.]+$/i.test(skinIdentifier)) {
      errors.push('Skin identifier must use reverse domain notation (e.g., com.example.skin)');
    }
    
    if (!selectedConsole) {
      errors.push('Console system must be selected');
    }
    
    if (!selectedDevice) {
      errors.push('iPhone model must be selected');
    }
    
    // Check if at least one orientation has data
    const portraitData = currentProject?.orientations?.portrait;
    const landscapeData = currentProject?.orientations?.landscape;
    
    const hasPortraitControls = portraitData?.controls && portraitData.controls.length > 0;
    const hasLandscapeControls = landscapeData?.controls && landscapeData.controls.length > 0;
    const hasPortraitScreens = portraitData?.screens && portraitData.screens.length > 0;
    const hasLandscapeScreens = landscapeData?.screens && landscapeData.screens.length > 0;
    
    if (!hasPortraitControls && !hasLandscapeControls) {
      errors.push('At least one control must be added in either portrait or landscape');
    }
    
    if (!hasPortraitScreens && !hasLandscapeScreens) {
      errors.push('At least one screen must be added in either portrait or landscape');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };

  const handleExport = async (format: 'deltaskin' | 'gammaskin' = exportFormat) => {
    // Validate before export
    const validation = validateExport();
    if (!validation.valid) {
      alert('Cannot export:\n\n' + validation.errors.join('\n'));
      return;
    }

    setIsExporting(true);

    try {
      const zip = new JSZip();
      
      // Add the JSON configuration
      const jsonContent = generateSkinJson();
      zip.file('info.json', jsonContent);

      // Add background images for both orientations
      const portraitData = currentProject?.orientations?.portrait;
      const landscapeData = currentProject?.orientations?.landscape;
      
      // Add portrait background image
      if (portraitData?.backgroundImage?.hasStoredImage && currentProject?.id) {
        try {
          const storedImage = await indexedDBManager.getImage(`${currentProject.id}-portrait`);
          if (storedImage) {
            const imageFile = new File([storedImage.data], storedImage.fileName, { type: storedImage.data.type });
            zip.file(imageFile.name, imageFile);
          }
        } catch (error) {
          console.error('Failed to retrieve portrait background image:', error);
        }
      }
      
      // Add landscape background image
      if (landscapeData?.backgroundImage?.hasStoredImage && currentProject?.id) {
        try {
          const storedImage = await indexedDBManager.getImage(`${currentProject.id}-landscape`);
          if (storedImage) {
            const imageFile = new File([storedImage.data], storedImage.fileName, { type: storedImage.data.type });
            zip.file(imageFile.name, imageFile);
          }
        } catch (error) {
          console.error('Failed to retrieve landscape background image:', error);
        }
      }
      
      // Add thumbstick images for both orientations
      const allControls = [
        ...(portraitData?.controls || []).map(c => ({ ...c, orientation: 'portrait' })),
        ...(landscapeData?.controls || []).map(c => ({ ...c, orientation: 'landscape' }))
      ];
      
      for (const control of allControls) {
        if (control.thumbstick && control.id && currentProject?.id) {
          try {
            const storedImage = await indexedDBManager.getImage(
              currentProject.id, 
              'thumbstick', 
              control.id
            );
            if (storedImage) {
              const thumbstickFile = new File([storedImage.data], storedImage.fileName, { type: storedImage.data.type });
              zip.file(control.thumbstick.name, thumbstickFile);
            }
          } catch (error) {
            console.error(`Failed to retrieve thumbstick image for control ${control.id}:`, error);
          }
        }
      }

      // Generate the ZIP file
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `${skinName || 'untitled'}.${format}`;
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Success feedback
      alert(`Successfully exported ${fileName}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export skin file. Please check the console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-1">
        <button
          id="export-button"
          onClick={() => handleExport()}
          disabled={isExporting || !selectedConsole || !selectedDevice || controls.length === 0}
          className={`
            px-4 py-2 rounded-l-lg font-medium transition-all duration-200
            ${isExporting || !selectedConsole || !selectedDevice || controls.length === 0
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
            }
          `}
        >
          {isExporting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export .{exportFormat}
            </span>
          )}
        </button>
        <button
          id="export-format-toggle"
          onClick={() => setShowFormatMenu(!showFormatMenu)}
          disabled={isExporting || !selectedConsole || !selectedDevice || controls.length === 0}
          className={`
            px-2 py-2 rounded-r-lg font-medium transition-all duration-200 border-l border-green-600
            ${isExporting || !selectedConsole || !selectedDevice || controls.length === 0
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Format Selection Menu */}
      {showFormatMenu && (
        <div className="absolute top-full mt-1 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10">
          <button
            onClick={() => {
              setExportFormat('deltaskin');
              handleExport('deltaskin');
              setShowFormatMenu(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Export as .deltaskin
          </button>
          <button
            onClick={() => {
              setExportFormat('gammaskin');
              handleExport('gammaskin');
              setShowFormatMenu(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Export as .gammaskin
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton;