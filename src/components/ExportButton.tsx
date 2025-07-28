// Export button component for generating skin files
import React, { useState } from 'react';
import JSZip from 'jszip';
import { Console, Device, ControlMapping } from '../types';

interface ExportButtonProps {
  skinName: string;
  skinIdentifier: string;
  selectedConsole: Console | null;
  selectedDevice: Device | null;
  controls: ControlMapping[];
  backgroundImage: { file: File; url: string } | null;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  skinName,
  skinIdentifier,
  selectedConsole,
  selectedDevice,
  controls,
  backgroundImage
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const generateSkinJson = () => {
    if (!selectedConsole || !selectedDevice) {
      throw new Error('Console and device must be selected');
    }

    const skinConfig = {
      name: skinName || 'Untitled Skin',
      identifier: skinIdentifier || 'com.playcase.default.skin',
      gameTypeIdentifier: selectedConsole.gameTypeIdentifier,
      representations: {
        iphone: {
          edgeToEdge: {
            portrait: {
              assets: backgroundImage ? [backgroundImage.file.name] : [],
              items: controls.map(control => ({
                inputs: control.inputs,
                frame: {
                  x: control.frame?.x || 0,
                  y: control.frame?.y || 0,
                  width: control.frame?.width || 50,
                  height: control.frame?.height || 50
                },
                extendedEdges: control.extendedEdges || {
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0
                }
              })),
              mappingSize: {
                width: selectedDevice.logicalWidth,
                height: selectedDevice.logicalHeight
              },
              extendedEdges: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
              }
            }
          }
        }
      }
    };

    return JSON.stringify(skinConfig, null, 2);
  };

  const handleExport = async () => {
    if (!selectedConsole || !selectedDevice || controls.length === 0) {
      alert('Please select a console, device, and add at least one control before exporting.');
      return;
    }

    setIsExporting(true);

    try {
      const zip = new JSZip();
      
      // Add the JSON configuration
      const jsonContent = generateSkinJson();
      zip.file('info.json', jsonContent);

      // Add the background image if present
      if (backgroundImage) {
        zip.file(backgroundImage.file.name, backgroundImage.file);
      }

      // Generate the ZIP file
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `${skinName || 'untitled'}.deltaskin`;
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
    <button
      id="export-deltaskin-button"
      onClick={handleExport}
      disabled={isExporting || !selectedConsole || !selectedDevice || controls.length === 0}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
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
          Export .deltaskin
        </span>
      )}
    </button>
  );
};

export default ExportButton;