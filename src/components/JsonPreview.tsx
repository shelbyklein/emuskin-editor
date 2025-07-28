// JSON Preview component for displaying generated skin configuration
import React, { useState, useMemo } from 'react';
import { Console, Device, ControlMapping, ScreenMapping } from '../types';

interface JsonPreviewProps {
  skinName: string;
  skinIdentifier: string;
  selectedConsole: Console | null;
  selectedDevice: Device | null;
  controls: ControlMapping[];
  screens: ScreenMapping[];
  backgroundImageFile?: File | null;
}

const JsonPreview: React.FC<JsonPreviewProps> = ({
  skinName,
  skinIdentifier,
  selectedConsole,
  selectedDevice,
  controls,
  screens,
  backgroundImageFile
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate the JSON configuration
  const jsonConfig = useMemo(() => {
    if (!selectedConsole || !selectedDevice) {
      return null;
    }

    const config = {
      name: skinName || 'Untitled Skin',
      identifier: skinIdentifier || 'com.playcase.default.skin',
      gameTypeIdentifier: selectedConsole.gameTypeIdentifier,
      representations: {
        iphone: {
          edgeToEdge: {
            portrait: {
              assets: backgroundImageFile ? [backgroundImageFile.name] : [],
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
              screens: screens.map(screen => {
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
              }
            }
          }
        }
      }
    };

    return config;
  }, [skinName, skinIdentifier, selectedConsole, selectedDevice, controls, backgroundImageFile]);

  // Format JSON with indentation
  const formattedJson = jsonConfig ? JSON.stringify(jsonConfig, null, 2) : '';

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!jsonConfig) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <button
          id="json-preview-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          aria-expanded={isExpanded}
          aria-label="Toggle JSON preview"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>JSON Preview</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            ({controls.length} controls, {screens.length} screens)
          </span>
        </button>

        <div className="flex items-center space-x-2">
          {copySuccess && (
            <span className="text-xs text-green-600 dark:text-green-400">Copied!</span>
          )}
          <button
            id="copy-json-button"
            onClick={handleCopy}
            className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            aria-label="Copy JSON to clipboard"
          >
            Copy JSON
          </button>
        </div>
      </div>

      {/* JSON Content */}
      {isExpanded && (
        <div className="relative">
          <pre className="p-4 overflow-auto max-h-96 text-xs">
            <code className="language-json text-gray-800 dark:text-gray-200">
              {formattedJson}
            </code>
          </pre>
          
          {/* Line numbers */}
          <div className="absolute top-0 left-0 p-4 select-none pointer-events-none">
            <div className="text-xs text-gray-400 dark:text-gray-600">
              {formattedJson.split('\n').map((_, index) => (
                <div key={index} className="leading-[1.5]">
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonPreview;