// Screen palette component for adding game screens to canvas
import React, { useState, useEffect } from 'react';
import { ScreenMapping } from '../types';

interface ScreenPaletteProps {
  consoleType: string;
  existingScreens: ScreenMapping[];
  onScreenAdd: (screen: ScreenMapping) => void;
}

interface ConsoleScreenData {
  screenCount: number;
  screens: Array<{
    label: string;
    inputFrame: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
    aspectRatio: string;
    aspectRatioValue: number;
    note?: string;
  }>;
  fullInputFrame?: {
    width: number;
    height: number;
  };
}

const ScreenPalette: React.FC<ScreenPaletteProps> = ({ 
  consoleType, 
  existingScreens,
  onScreenAdd 
}) => {
  const [consoleScreenData, setConsoleScreenData] = useState<ConsoleScreenData | null>(null);
  const [availableScreens, setAvailableScreens] = useState<Array<any>>([]);

  // Load console screen data
  useEffect(() => {
    const loadScreenData = async () => {
      try {
        const response = await fetch('/assets/console-screens.json');
        if (response.ok) {
          const data = await response.json();
          const screenData = data[consoleType];
          if (screenData) {
            setConsoleScreenData(screenData);
            
            // Determine which screens are still available to add
            const available = screenData.screens.filter((screen: any) => {
              // For DS, check if this specific screen (top/bottom) is already added
              if (consoleType === 'nds') {
                return !existingScreens.some(existing => existing.label === screen.label);
              }
              // For other consoles, only one screen allowed
              return existingScreens.length === 0;
            });
            
            setAvailableScreens(available);
          }
        }
      } catch (error) {
        console.error('Failed to load screen data:', error);
      }
    };

    loadScreenData();
  }, [consoleType, existingScreens]);

  const handleAddScreen = (screenData: any) => {
    // Calculate default position based on existing screens
    let defaultY = 50;
    let defaultX = 50;
    
    if (existingScreens.length > 0) {
      // For DS, place bottom screen below top screen
      if (consoleType === 'nds' && screenData.label === 'Bottom Screen') {
        const topScreen = existingScreens.find(s => s.label === 'Top Screen');
        if (topScreen) {
          defaultY = topScreen.outputFrame.y + topScreen.outputFrame.height + 20;
          defaultX = topScreen.outputFrame.x;
        }
      } else {
        // Place new screen to the right of existing ones
        const rightmostScreen = existingScreens.reduce((rightmost, screen) => {
          const screenRight = screen.outputFrame.x + screen.outputFrame.width;
          const rightmostRight = rightmost.outputFrame.x + rightmost.outputFrame.width;
          return screenRight > rightmostRight ? screen : rightmost;
        });
        defaultX = rightmostScreen.outputFrame.x + rightmostScreen.outputFrame.width + 20;
      }
    }

    // Calculate default size maintaining aspect ratio
    const aspectRatio = screenData.aspectRatioValue;
    const defaultWidth = 200;
    const defaultHeight = Math.round(defaultWidth / aspectRatio);

    const newScreen: ScreenMapping = {
      label: screenData.label,
      outputFrame: {
        x: defaultX,
        y: defaultY,
        width: defaultWidth,
        height: defaultHeight
      },
      maintainAspectRatio: true
    };

    // Add inputFrame if it exists (not for SEGA Genesis)
    if (screenData.inputFrame) {
      newScreen.inputFrame = { ...screenData.inputFrame };
    }

    onScreenAdd(newScreen);
  };

  if (!consoleScreenData || availableScreens.length === 0) {
    return (
      <div id="screen-palette-empty" className="text-sm text-gray-500 dark:text-gray-400 italic">
        {existingScreens.length > 0 
          ? `All ${consoleScreenData?.screenCount || 1} screen(s) have been added`
          : 'No screen data available for this console'
        }
      </div>
    );
  }

  return (
    <div id="screen-palette-container" className="space-y-4">
      <div id="screen-palette-header" className="flex items-center justify-between">
        <h4 id="screen-palette-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Available Screens
        </h4>
        <span id="screen-count-badge" className="text-xs text-gray-500 dark:text-gray-400">
          {existingScreens.length} / {consoleScreenData.screenCount} added
        </span>
      </div>

      <div id="available-screens-grid" className="grid grid-cols-1 gap-2">
        {availableScreens.map((screen, index) => (
          <button
            key={index}
            id={`add-screen-${screen.label.toLowerCase().replace(' ', '-')}`}
            onClick={() => handleAddScreen(screen)}
            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 dark:bg-green-600 rounded flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {screen.label}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {screen.aspectRatio} • {screen.inputFrame ? `${screen.inputFrame.width}×${screen.inputFrame.height}` : 'Variable size'}
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        ))}
      </div>

      {consoleType === 'nds' && existingScreens.length === 0 && (
        <div id="ds-dual-screen-tip" className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Nintendo DS uses two screens. Add both the top and bottom screens to properly display DS games.
          </p>
        </div>
      )}

      {consoleType === 'sg' && (
        <div id="genesis-screen-tip" className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            <strong>Note:</strong> SEGA Genesis has variable output sizes. The screen position is customizable but the input frame will be determined automatically.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScreenPalette;