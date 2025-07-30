// Control list panel showing all controls on canvas
import React, { useState } from 'react';
import { ControlMapping } from '../types';

interface ControlListProps {
  controls: ControlMapping[];
  onControlDelete: (index: number) => void;
  onControlSelect?: (index: number) => void;
  selectedControl?: number | null;
}

const ControlList: React.FC<ControlListProps> = ({ 
  controls, 
  onControlDelete,
  onControlSelect,
  selectedControl 
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; name: string } | null>(null);

  const getControlLabel = (control: ControlMapping): string => {
    if (control.label) {
      return control.label;
    }
    
    if (typeof control.inputs === 'string') {
      return control.inputs.toUpperCase();
    } else if (Array.isArray(control.inputs)) {
      return control.inputs.map(i => i.toUpperCase()).join('+');
    } else if (typeof control.inputs === 'object') {
      // Handle thumbstick and touchscreen
      if ('up' in control.inputs && 'down' in control.inputs) {
        return 'Thumbstick';
      } else if ('x' in control.inputs && 'y' in control.inputs) {
        return 'Touchscreen';
      }
    }
    
    return 'Unknown';
  };

  const handleDeleteClick = (index: number, name: string) => {
    setDeleteConfirm({ index, name });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onControlDelete(deleteConfirm.index);
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (controls.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
        No controls added yet
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Controls on Canvas ({controls.length})
        </h4>
        
        <div className="flex flex-wrap gap-2">
          {controls.map((control, index) => {
            const label = getControlLabel(control);
            const isHovered = hoveredIndex === index;
            const isSelected = selectedControl === index;
            
            return (
              <div
                key={control.id || `control-${index}`}
                className={`
                  relative inline-flex items-center px-3 py-1.5 rounded-full text-sm
                  transition-all duration-200 cursor-pointer
                  ${isSelected 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }
                `}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onControlSelect?.(index)}
              >
                <span className="pr-1">{label}</span>
                
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
              Delete Control
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

export default ControlList;