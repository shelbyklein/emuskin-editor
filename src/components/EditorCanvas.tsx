// Canvas area with toolbar, controls, orientation manager, canvas rendering, and JSON preview
import React from 'react';
import Canvas from './Canvas';
import JsonPreview from './JsonPreview';
import GridControls from './GridControls';
import OrientationManager from './OrientationManager';
import { Console, Device, ControlMapping, ScreenMapping } from '../types';

interface EditorCanvasProps {
  // Configuration
  selectedConsole: Console | null;
  selectedDevice: Device | null;
  selectedConsoleData: any;
  selectedDeviceData: any;
  
  // Canvas data
  skinName: string;
  skinIdentifier: string;
  controls: ControlMapping[];
  screens: ScreenMapping[];
  uploadedImage: { file: File; url: string } | null;
  thumbstickImages: { [controlId: string]: string };
  
  // Menu insets
  menuInsetsEnabled: boolean;
  menuInsetsBottom: number;
  menuInsetsLeft: number;
  menuInsetsRight: number;
  
  // History
  history: any[];
  historyIndex: number;
  
  // Selection state
  selectedControlIndex: number | null;
  selectedScreenIndex: number | null;
  
  // Project and orientation
  currentProject: any;
  currentOrientation: 'portrait' | 'landscape';
  
  // Event handlers
  onUndo: () => void;
  onRedo: () => void;
  onOrientationChange: (orientation: 'portrait' | 'landscape') => void;
  onAddOrientation: (orientation: 'portrait' | 'landscape') => void;
  onRemoveOrientation: (orientation: 'portrait' | 'landscape') => void;
  onControlUpdate: (controls: ControlMapping[]) => void;
  onScreenUpdate: (screens: ScreenMapping[]) => void;
  onThumbstickImageUpload: (file: File, controlIndex: number, controlId: string) => void;
  onControlSelectionChange: (index: number | null) => void;
  onScreenSelectionChange: (index: number | null) => void;
  onCopyImageFromOtherOrientation: () => void;
  
  // Utility functions
  getOrientationData: (orientation?: 'portrait' | 'landscape') => any;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  selectedConsole,
  selectedDevice,
  selectedConsoleData,
  selectedDeviceData,
  skinName,
  skinIdentifier,
  controls,
  screens,
  uploadedImage,
  thumbstickImages,
  menuInsetsEnabled,
  menuInsetsBottom,
  menuInsetsLeft,
  menuInsetsRight,
  history,
  historyIndex,
  selectedControlIndex,
  selectedScreenIndex,
  currentProject,
  currentOrientation,
  onUndo,
  onRedo,
  onOrientationChange,
  onAddOrientation,
  onRemoveOrientation,
  onControlUpdate,
  onScreenUpdate,
  onThumbstickImageUpload,
  onControlSelectionChange,
  onScreenSelectionChange,
  onCopyImageFromOtherOrientation,
  getOrientationData
}) => {
  return (
    <div id="editor-right-column" className="space-y-6 flex-1 min-w-0">
      {/* Canvas Area */}
      <div id="canvas-section" className="card">
        <div id="canvas-header" className="flex flex-col space-y-4 mb-4">
          <div id="canvas-toolbar" className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h3 id="canvas-title" className="text-lg font-medium text-gray-900 dark:text-white">Design Canvas</h3>
              
              {/* Undo/Redo Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={onUndo}
                  disabled={historyIndex <= 0}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    historyIndex > 0 
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' 
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
                  title="Undo (Cmd/Ctrl+Z)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={onRedo}
                  disabled={historyIndex >= history.length - 1}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    historyIndex < history.length - 1 
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' 
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
                  title="Redo (Cmd/Ctrl+Shift+Z)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Grid Controls */}
            {selectedDeviceData && (
              <div className="flex-shrink-0">
                <GridControls />
              </div>
            )}
            
            {/* Orientation Manager */}
            {currentProject && (
              <div className="flex items-center">
                <OrientationManager
                  key={`orientation-manager-${currentProject.availableOrientations?.length || 0}-${currentProject.availableOrientations?.join(',') || 'portrait'}`}
                  availableOrientations={currentProject.availableOrientations || ['portrait']}
                  currentOrientation={currentOrientation}
                  onOrientationChange={onOrientationChange}
                  onAddOrientation={onAddOrientation}
                  onRemoveOrientation={onRemoveOrientation}
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
              orientation={currentOrientation}
              menuInsetsEnabled={menuInsetsEnabled}
              menuInsetsBottom={menuInsetsBottom}
              menuInsetsLeft={menuInsetsLeft}
              menuInsetsRight={menuInsetsRight}
              onControlUpdate={onControlUpdate}
              onScreenUpdate={onScreenUpdate}
              thumbstickImages={thumbstickImages}
              onThumbstickImageUpload={onThumbstickImageUpload}
              selectedControlIndex={selectedControlIndex}
              onControlSelectionChange={onControlSelectionChange}
              selectedScreenIndex={selectedScreenIndex}
              onScreenSelectionChange={onScreenSelectionChange}
            />
            
            {/* Orientation Image Status */}
            {currentProject && !uploadedImage && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No image for {currentOrientation} orientation
                  </p>
                  {(() => {
                    const otherOrientation = currentOrientation === 'portrait' ? 'landscape' : 'portrait';
                    const otherData = getOrientationData(otherOrientation);
                    if (otherData?.backgroundImage) {
                      return (
                        <button
                          onClick={onCopyImageFromOtherOrientation}
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
  );
};

export default EditorCanvas;