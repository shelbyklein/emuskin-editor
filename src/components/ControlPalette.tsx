// Control palette component for displaying available buttons
import React, { useState, useEffect } from 'react';
import { ControlMapping, Button } from '../types';
import CustomButtonModal from './CustomButtonModal';


interface ControlPaletteProps {
  consoleType: string;
  onControlSelect: (control: ControlMapping) => void;
}

const ControlPalette: React.FC<ControlPaletteProps> = ({ 
  consoleType, 
  onControlSelect 
}) => {
  const [availableButtons, setAvailableButtons] = useState<Button[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  useEffect(() => {
    if (!consoleType) {
      setAvailableButtons([]);
      return;
    }

    const loadButtons = async () => {
      setLoading(true);
      try {
        const response = await fetch('/assets/available_buttons.json');
        const data = await response.json();
        
        if (data[consoleType]) {
          // Map the button data to match our Button type
          const buttons = data[consoleType].map((btnId: string) => ({
            key: btnId,
            label: btnId.charAt(0).toUpperCase() + btnId.slice(1), // Capitalize first letter
            type: btnId === 'dpad' ? 'dpad' : btnId === 'thumbstick' ? 'thumbstick' : undefined
          }));
          setAvailableButtons(buttons);
        } else {
          setAvailableButtons([]);
        }
      } catch (error) {
        console.error('Error loading buttons:', error);
        setAvailableButtons([]);
      } finally {
        setLoading(false);
      }
    };

    loadButtons();
  }, [consoleType]);

  const handleButtonClick = (button: Button) => {
    // Create a control object with default properties
    const control: ControlMapping = {
      id: `control-${button.key}-${Date.now()}`,
      inputs: button.key === 'thumbstick' 
        ? {
            up: 'analogStickUp',
            down: 'analogStickDown',
            left: 'analogStickLeft',
            right: 'analogStickRight'
          }
        : [button.key],
      frame: {
        x: 50, // Default position
        y: 50,
        width: button.key === 'thumbstick' ? 100 : 50, // Larger size for thumbstick
        height: button.key === 'thumbstick' ? 100 : 50
      },
      extendedEdges: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    };
    
    onControlSelect(control);
  };

  const renderButton = (button: Button) => {
    const isDpad = button.key === 'dpad';
    const isThumbstick = button.key === 'thumbstick';
    
    return (
      <button
        id={`control-button-${button.key}`}
        key={button.key}
        onClick={() => handleButtonClick(button)}
        className="flex flex-col items-center justify-center p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 bg-white dark:bg-gray-800 transition-all duration-200"
        title={`Add ${button.label}`}
        aria-label={`Add ${button.label} control`}
      >
        <div className="w-8 h-8 flex items-center justify-center">
          {isDpad ? (
            // D-pad icon
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-700 dark:text-gray-300">
              <path d="M9 5v4H5v6h4v4h6v-4h4V9h-4V5H9z" />
            </svg>
          ) : isThumbstick ? (
            // Thumbstick icon
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-700 dark:text-gray-300">
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            // Regular button
            <div className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
              {button.label.charAt(0)}
            </div>
          )}
        </div>
        <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">{button.label}</span>
      </button>
    );
  };

  if (!consoleType) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        Select a console to see available controls
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        Loading controls...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700 dark:text-gray-300">Available Controls</h4>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {availableButtons.map(button => renderButton(button))}
      </div>
      
      <div className="border-t dark:border-gray-700 pt-4">
        <button
          id="add-custom-button"
          onClick={() => setShowCustomModal(true)}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200"
          aria-label="Add custom button"
        >
          + Add Custom Button
        </button>
      </div>
      
      <CustomButtonModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onConfirm={(control) => {
          onControlSelect(control);
          setShowCustomModal(false);
        }}
        availableButtons={availableButtons}
      />
    </div>
  );
};

export default ControlPalette;