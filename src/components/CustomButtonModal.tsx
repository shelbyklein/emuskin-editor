// Custom button creator modal
import React, { useState } from 'react';
import { Button, ControlMapping } from '../types';

interface CustomButtonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (control: ControlMapping) => void;
  availableButtons: Button[];
}

const CustomButtonModal: React.FC<CustomButtonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  availableButtons
}) => {
  const [buttonName, setButtonName] = useState('');
  const [selectedButtons, setSelectedButtons] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleButtonToggle = (buttonKey: string) => {
    setSelectedButtons(prev => {
      if (prev.includes(buttonKey)) {
        return prev.filter(b => b !== buttonKey);
      }
      return [...prev, buttonKey];
    });
  };

  const handleConfirm = () => {
    if (buttonName && selectedButtons.length > 0) {
      const customControl: ControlMapping = {
        id: `custom-${Date.now()}`,
        inputs: selectedButtons,
        frame: {
          x: 50,
          y: 50,
          width: 60,
          height: 60
        },
        extendedEdges: {
          top: 5,
          bottom: 5,
          left: 5,
          right: 5
        },
        label: buttonName
      };
      onConfirm(customControl);
      handleClose();
    }
  };

  const handleClose = () => {
    setButtonName('');
    setSelectedButtons([]);
    onClose();
  };

  return (
    <div id="custom-button-modal-overlay" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div id="custom-button-modal" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 id="custom-button-modal-title" className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Create Custom Button
        </h2>

        {/* Button Name */}
        <div id="button-name-section" className="mb-4">
          <label htmlFor="buttonName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Button Name
          </label>
          <input
            id="buttonName"
            type="text"
            value={buttonName}
            onChange={(e) => setButtonName(e.target.value)}
            placeholder="e.g., Turbo Fire"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Button Selection */}
        <div id="button-selection-section" className="mb-4">
          <label id="button-selection-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Buttons to Combine
          </label>
          <div id="button-selection-grid" className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {availableButtons.map((button) => (
              <label
                key={button.key}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <input
                  id={`custom-button-${button.key}`}
                  type="checkbox"
                  checked={selectedButtons.includes(button.key)}
                  onChange={() => handleButtonToggle(button.key)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {button.label}
                </span>
              </label>
            ))}
          </div>
        </div>


        {/* Selected Buttons Preview */}
        {selectedButtons.length > 0 && (
          <div id="button-preview" className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded">
            <p id="button-preview-text" className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Preview:</strong> {buttonName || 'Custom Button'} will trigger: {selectedButtons.map(b => b.toUpperCase()).join(' + ')}
            </p>
          </div>
        )}

        {/* Actions */}
        <div id="modal-actions" className="flex justify-end space-x-3">
          <button
            id="custom-button-cancel"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            id="custom-button-create"
            onClick={handleConfirm}
            disabled={!buttonName || selectedButtons.length === 0}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Create Custom Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomButtonModal;