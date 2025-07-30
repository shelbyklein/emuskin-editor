// Screen list panel showing all screens on canvas
import React, { useState } from 'react';
import { ScreenMapping } from '../types';

interface ScreenListProps {
  screens: ScreenMapping[];
  onScreenDelete: (index: number) => void;
  onScreenSelect?: (index: number) => void;
  selectedScreen?: number | null;
}

const ScreenList: React.FC<ScreenListProps> = ({ 
  screens, 
  onScreenDelete,
  onScreenSelect,
  selectedScreen 
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; name: string } | null>(null);

  const handleDeleteClick = (index: number, name: string) => {
    setDeleteConfirm({ index, name });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onScreenDelete(deleteConfirm.index);
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (screens.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
        No screens added yet
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Screens on Canvas ({screens.length})
        </h4>
        
        <div className="flex flex-wrap gap-2">
          {screens.map((screen, index) => {
            const label = screen.label || 'Screen';
            const isHovered = hoveredIndex === index;
            const isSelected = selectedScreen === index;
            
            return (
              <div
                key={screen.id || `screen-${index}`}
                className={`
                  relative inline-flex items-center px-3 py-1.5 rounded-full text-sm
                  transition-all duration-200 cursor-pointer
                  ${isSelected 
                    ? 'bg-green-500 text-white' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40'
                  }
                `}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onScreenSelect?.(index)}
              >
                <span className="pr-1 flex items-center gap-1">
                  {label}
                  {screen.locked && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </span>
                
                {isHovered && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(index, label);
                    }}
                    className="ml-1 p-0.5 rounded-full hover:bg-red-500 hover:bg-opacity-20 transition-colors"
                    aria-label={`Delete ${label}`}
                  >
                    <svg 
                      className="w-4 h-4 text-red-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Delete Screen
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{deleteConfirm.name}"?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScreenList;