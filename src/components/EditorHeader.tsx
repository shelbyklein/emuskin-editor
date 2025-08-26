// Header section with title, edit button, project manager, and import/export
import React from 'react';
import ImportButton from './ImportButton';
import ExportButton from './ExportButton';
import SkinEditPanel from './SkinEditPanel';
import ProjectManager from './ProjectManager';
import { Console, Device, ControlMapping, ScreenMapping } from '../types';

interface EditorHeaderProps {
  // Project data
  skinName: string;
  skinIdentifier: string;
  selectedConsole: Console | null;
  selectedDevice: Device | null;
  controls: ControlMapping[];
  screens: ScreenMapping[];
  uploadedImage: { file: File; url: string } | null;
  thumbstickFiles: { [controlId: string]: File };
  
  // Menu insets
  menuInsetsEnabled: boolean;
  menuInsetsBottom: number;
  
  // UI state
  isEditPanelOpen: boolean;
  showProjectManager: boolean;
  
  // Event handlers
  onEditPanelToggle: (isOpen: boolean) => void;
  onProjectManagerToggle: (show: boolean) => void;
  onImport: (data: any) => void;
  onSave: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  skinName,
  skinIdentifier,
  selectedConsole,
  selectedDevice,
  controls,
  screens,
  uploadedImage,
  thumbstickFiles,
  menuInsetsEnabled,
  menuInsetsBottom,
  isEditPanelOpen,
  showProjectManager,
  onEditPanelToggle,
  onProjectManagerToggle,
  onImport,
  onSave
}) => {
  return (
    <>
      {/* Header with title and buttons */}
      <div id="editor-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div id="editor-title-section" className="flex items-center">
          <div className="mr-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {skinName || 'New Skin'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {skinIdentifier}
            </p>
          </div>
          <button
            id="edit-skin-button"
            onClick={() => onEditPanelToggle(true)}
            className="btn-secondary h-fit"
            aria-label="Edit skin settings"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>

        <div id="editor-header-buttons" className="flex items-center gap-2 flex-wrap">
          <button
            id="project-manager-button"
            onClick={() => onProjectManagerToggle(!showProjectManager)}
            className="btn-secondary"
            aria-label="Toggle project manager"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
            </svg>
            Projects
          </button>
          <div className="border-l border-gray-300 dark:border-gray-600 h-5 mx-2" />
          <ImportButton onImport={onImport} />
          <ExportButton
            skinName={skinName}
            skinIdentifier={skinIdentifier}
            selectedConsole={selectedConsole}
            selectedDevice={selectedDevice}
            controls={controls}
            screens={screens}
            backgroundImage={uploadedImage}
            menuInsetsEnabled={menuInsetsEnabled}
            menuInsetsBottom={menuInsetsBottom}
            thumbstickFiles={thumbstickFiles}
          />
        </div>
      </div>

      {/* Edit Panel Modal */}
      <SkinEditPanel
        isOpen={isEditPanelOpen}
        onClose={() => onEditPanelToggle(false)}
        onSave={onSave}
      />

      {/* Project Manager Panel */}
      {showProjectManager && (
        <ProjectManager onClose={() => onProjectManagerToggle(false)} />
      )}
    </>
  );
};

export default EditorHeader;