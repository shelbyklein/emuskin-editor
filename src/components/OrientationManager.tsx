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
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Orientations
      </h3>
      
      <div className="space-y-3">
        {/* Pill-style orientation selector - vertical layout */}
        <div className="inline-flex flex-col bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
          {availableOrientations.map((orientation) => (
            <button
              key={orientation}
              onClick={() => onOrientationChange(orientation)}
              className={`relative group px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                currentOrientation === orientation
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
              aria-label={`Switch to ${orientation} orientation`}
              aria-pressed={currentOrientation === orientation}
            >
              <span className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="capitalize">{orientation}</span>
                  {orientationInfo[orientation]?.hasContent && (
                    <span 
                      className={`w-2 h-2 rounded-full ${
                        currentOrientation === orientation ? 'bg-white' : 'bg-green-500'
                      }`} 
                      title="Has content" 
                    />
                  )}
                </span>
                {canRemove && (
                  <button
                    onClick={(e) => handleRemove(e, orientation)}
                    className={`ml-3 p-0.5 rounded transition-opacity ${
                      currentOrientation === orientation
                        ? 'opacity-0 group-hover:opacity-100 hover:bg-primary-700'
                        : 'opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30'
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
            </button>
          ))}
        </div>
      </div>

      {(canAddPortrait || canAddLandscape) && (
        <div className="pt-2 space-y-2">
          {canAddPortrait && (
            <button
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