// OrientationManager component for managing skin orientations
import React from 'react';

interface OrientationManagerProps {
  availableOrientations: Array<'portrait' | 'landscape'>;
  currentOrientation: 'portrait' | 'landscape';
  onOrientationChange: (orientation: 'portrait' | 'landscape') => void;
  onAddOrientation: (orientation: 'portrait' | 'landscape') => void;
  onRemoveOrientation: (orientation: 'portrait' | 'landscape') => void;
  orientationInfo?: {
    portrait?: { hasContent: boolean };
    landscape?: { hasContent: boolean };
  };
}

const OrientationManager: React.FC<OrientationManagerProps> = ({
  availableOrientations,
  currentOrientation,
  onOrientationChange,
  onAddOrientation,
  onRemoveOrientation,
  orientationInfo = {}
}) => {
  const canAddPortrait = !availableOrientations.includes('portrait');
  const canAddLandscape = !availableOrientations.includes('landscape');
  const canRemove = availableOrientations.length > 1;

  const handleRemove = (e: React.MouseEvent, orientation: 'portrait' | 'landscape') => {
    e.stopPropagation(); // Prevent triggering orientation change
    if (window.confirm(`Are you sure you want to remove ${orientation} orientation? This will delete all controls, screens, and images for this orientation.`)) {
      onRemoveOrientation(orientation);
    }
  };

  return (
    <div id="orientation-manager-container" className="space-y-3">
      <h3 id="orientation-manager-title" className="text-lg font-medium text-gray-900 dark:text-white">
        Orientations
      </h3>
      
      <div id="orientation-selector-container" className="space-y-3">
        {/* Pill-style orientation selector - vertical layout */}
        <div id="orientation-pill-selector" className="flex flex-col bg-gray-100 dark:bg-gray-800 rounded-lg p-2 gap-2">
          {availableOrientations.map((orientation) => (
            <button
              key={orientation}
              id={`orientation-button-${orientation}`}
              onClick={() => onOrientationChange(orientation)}
              className={`relative group w-full px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 border ${
                currentOrientation === orientation
                  ? 'bg-primary-600 text-white shadow-sm border-primary-700 dark:border-primary-500'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              aria-label={`Switch to ${orientation} orientation`}
              aria-pressed={currentOrientation === orientation}
            >
              <span className="flex items-center justify-between w-full">
                <span id={`orientation-label-${orientation}`} className="capitalize">{orientation}</span>
                <span className="relative flex items-center justify-center w-4 h-4">
                  {orientationInfo[orientation]?.hasContent && (
                    <span 
                      id={`orientation-content-indicator-${orientation}`}
                      className={`w-2 h-2 rounded-full transition-opacity ${
                        canRemove ? 'group-hover:opacity-0' : ''
                      } ${
                        currentOrientation === orientation ? 'bg-white' : 'bg-green-500'
                      }`} 
                      title="Has content" 
                    />
                  )}
                  {canRemove && (
                    <button
                      id={`orientation-remove-button-${orientation}`}
                      onClick={(e) => handleRemove(e, orientation)}
                      className={`absolute inset-0 flex items-center justify-center rounded transition-opacity opacity-0 group-hover:opacity-100 ${
                        currentOrientation === orientation
                          ? 'hover:bg-primary-700'
                          : 'hover:bg-red-100 dark:hover:bg-red-900/30'
                      }`}
                      aria-label={`Remove ${orientation} orientation`}
                    >
                      <svg 
                        className={`w-3.5 h-3.5 ${
                          currentOrientation === orientation
                            ? 'text-white'
                            : 'text-red-600 dark:text-red-400'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {(canAddPortrait || canAddLandscape) && (
        <div id="orientation-add-buttons-container" className="pt-2 space-y-2">
          {canAddPortrait && (
            <button
              id="add-portrait-button"
              onClick={() => onAddOrientation('portrait')}
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Portrait</span>
            </button>
          )}
          
          {canAddLandscape && (
            <button
              id="add-landscape-button"
              onClick={() => onAddOrientation('landscape')}
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Landscape</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrientationManager;