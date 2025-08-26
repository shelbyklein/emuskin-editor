// Left sidebar with configuration prompt, screen palette, control palette, image upload, and menu insets
import React from 'react';
import ScreenPalette from './ScreenPalette';
import ScreenList from './ScreenList';
import ControlPalette from './ControlPalette';
import ControlList from './ControlList';
import ImageUploader from './ImageUploader';
import MenuInsetsPanel from './MenuInsetsPanel';
import { Console, Device, ControlMapping, ScreenMapping } from '../types';

interface EditorSidebarProps {
  // Configuration state
  selectedConsole: Console | null;
  selectedDevice: Device | null;
  
  // Content arrays
  controls: ControlMapping[];
  screens: ScreenMapping[];
  
  // Selection state
  selectedControlIndex: number | null;
  selectedScreenIndex: number | null;
  
  // Image state
  uploadedImage: { file: File; url: string } | null;
  isUploadingImage: boolean;
  
  // Menu insets
  menuInsetsEnabled: boolean;
  menuInsetsBottom: number;
  menuInsetsLeft: number;
  menuInsetsRight: number;
  
  // Current orientation
  currentOrientation: 'portrait' | 'landscape';
  
  // Event handlers
  onConfigureClick: () => void;
  onScreenAdd: (screenData: any) => void;
  onScreenDelete: (index: number) => void;
  onScreenSelect: (index: number | null) => void;
  onControlSelect: (controlData: any) => void;
  onControlDelete: (index: number) => void;
  onControlSelectFromList: (index: number) => void;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  onMenuInsetsToggle: (enabled: boolean) => void;
  onMenuInsetsBottomChange: (value: number) => void;
  onMenuInsetsLeftChange: (value: number) => void;
  onMenuInsetsRightChange: (value: number) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  selectedConsole,
  selectedDevice,
  controls,
  screens,
  selectedControlIndex,
  selectedScreenIndex,
  uploadedImage,
  isUploadingImage,
  menuInsetsEnabled,
  menuInsetsBottom,
  menuInsetsLeft,
  menuInsetsRight,
  currentOrientation,
  onConfigureClick,
  onScreenAdd,
  onScreenDelete,
  onScreenSelect,
  onControlSelect,
  onControlDelete,
  onControlSelectFromList,
  onImageUpload,
  onImageRemove,
  onMenuInsetsToggle,
  onMenuInsetsBottomChange,
  onMenuInsetsLeftChange,
  onMenuInsetsRightChange
}) => {
  return (
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
              onClick={onConfigureClick}
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
              onScreenAdd={onScreenAdd}
            />
            {screens.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <ScreenList
                  screens={screens}
                  onScreenDelete={onScreenDelete}
                  onScreenSelect={onScreenSelect}
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
              onControlSelect={onControlSelect}
            />
          </div>
          
          {/* Control List */}
          {controls.length > 0 && (
            <div id="control-list-section" className="card animate-slide-up">
              <ControlList 
                controls={controls}
                onControlDelete={onControlDelete}
                onControlSelect={onControlSelectFromList}
                selectedControl={selectedControlIndex}
              />
            </div>
          )}

          {/* Image Upload Section */}
          <div id="image-upload-section" className="card animate-slide-up">
            <h3 id="image-upload-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Upload {currentOrientation === 'portrait' ? 'Portrait' : 'Landscape'} Skin Image
            </h3>
            {!uploadedImage ? (
              <ImageUploader 
                onImageUpload={onImageUpload} 
                currentOrientation={currentOrientation}
                isUploading={isUploadingImage}
              />
            ) : (
              <button
                id="remove-image-button"
                onClick={onImageRemove}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                Remove {currentOrientation === 'portrait' ? 'Portrait' : 'Landscape'} Image
              </button>
            )}
          </div>

          {/* Menu Insets Panel */}
          <MenuInsetsPanel
            menuInsetsEnabled={menuInsetsEnabled}
            menuInsetsBottom={menuInsetsBottom}
            menuInsetsLeft={menuInsetsLeft}
            menuInsetsRight={menuInsetsRight}
            orientation={currentOrientation}
            onToggle={onMenuInsetsToggle}
            onBottomChange={onMenuInsetsBottomChange}
            onLeftChange={onMenuInsetsLeftChange}
            onRightChange={onMenuInsetsRightChange}
          />
        </>
      )}
    </div>
  );
};

export default EditorSidebar;