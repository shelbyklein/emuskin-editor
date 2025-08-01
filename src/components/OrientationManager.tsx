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
    <div id="orientation-manager-container" className="flex items-center space-x-2">
      <div id="orientation-selector-container">
        {/* Pill-style orientation selector - horizontal layout */}
        <div id="orientation-pill-selector" className="flex flex-row gap-3">
          {availableOrientations.map((orientation) => (
            <div key={orientation} className="relative group">
              <button
                id={`orientation-button-${orientation}`}
                onClick={() => onOrientationChange(orientation)}
                className={`relative h-16 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 border-2 flex flex-col items-center justify-center ${
                  currentOrientation === orientation
                    ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-600 dark:border-primary-500'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                aria-label={`Switch to ${orientation} orientation`}
                aria-pressed={currentOrientation === orientation}
              >
                {/* Visual representation of orientation - 16:9 or 9:16 */}
                <div className="flex flex-col items-center">
                  <div className={`relative ${orientation === 'portrait' ? 'w-[10.125px] h-[18px]' : 'w-[18px] h-[10.125px]'} bg-gray-400 dark:bg-gray-600 rounded`}>
                    {/* Green dot indicator on the icon */}
                    {orientationInfo[orientation]?.hasContent && (
                      <span 
                        id={`orientation-content-indicator-${orientation}`}
                        className="absolute -top-1 -right-1 block w-2 h-2 bg-green-500 rounded-full"
                        title="Has content" 
                      />
                    )}
                  </div>
                  {/* Label */}
                  <span id={`orientation-label-${orientation}`} className={`text-xs mt-1.5 capitalize ${
                    currentOrientation === orientation 
                      ? 'text-primary-700 dark:text-primary-400 font-medium' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {orientation}
                  </span>
                </div>
              </button>
              {/* Remove button at top-right of pill */}
              {canRemove && (
                <button
                  id={`orientation-remove-button-${orientation}`}
                  onClick={(e) => handleRemove(e, orientation)}
                  className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full transition-opacity opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600"
                  aria-label={`Remove ${orientation} orientation`}
                >
                  <svg 
                    className="w-2.5 h-2.5 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {(canAddPortrait || canAddLandscape) && (
        <div id="orientation-add-buttons-container" className="flex items-center space-x-2">
          {canAddPortrait && (
            <button
              id="add-portrait-button"
              onClick={() => onAddOrientation('portrait')}
              className="h-16 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border-2 border-purple-700 dark:border-purple-500 flex flex-col items-center justify-center"
              title="Add Portrait orientation"
            >
              <div className="flex flex-col items-center">
                <div className="relative w-[10.125px] h-[18px] border-2 border-white/50 rounded flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-xs mt-1.5">Add Portrait</span>
              </div>
            </button>
          )}
          
          {canAddLandscape && (
            <button
              id="add-landscape-button"
              onClick={() => onAddOrientation('landscape')}
              className="h-16 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border-2 border-purple-700 dark:border-purple-500 flex flex-col items-center justify-center"
              title="Add Landscape orientation"
            >
              <div className="flex flex-col items-center">
                <div className="relative w-[18px] h-[10.125px] border-2 border-white/50 rounded flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-xs mt-1.5">Add Landscape</span>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrientationManager;