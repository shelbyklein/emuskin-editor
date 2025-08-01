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

  const handleRemove = (orientation: 'portrait' | 'landscape') => {
    if (window.confirm(`Are you sure you want to remove ${orientation} orientation? This will delete all controls, screens, and images for this orientation.`)) {
      onRemoveOrientation(orientation);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Orientations
      </h3>
      
      <div className="space-y-2">
        {availableOrientations.map((orientation) => (
          <div
            key={orientation}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="orientation"
                value={orientation}
                checked={currentOrientation === orientation}
                onChange={() => onOrientationChange(orientation)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {orientation}
                </span>
                {orientationInfo[orientation]?.hasContent && (
                  <span className="w-2 h-2 bg-green-500 rounded-full" title="Has content" />
                )}
              </span>
            </label>
            
            {canRemove && (
              <button
                onClick={() => handleRemove(orientation)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
              >
                Remove
              </button>
            )}
          </div>
        ))}
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