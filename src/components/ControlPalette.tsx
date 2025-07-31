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
        : button.key === 'touchscreen'
        ? {
            x: 'touchScreenX',
            y: 'touchScreenY'
          }
        : [button.key],
      frame: {
        x: 50, // Default position
        y: 50,
        width: button.key === 'thumbstick' ? 100 : button.key === 'touchscreen' ? 256 : 50, // Touchscreen matches DS screen width
        height: button.key === 'thumbstick' ? 100 : button.key === 'touchscreen' ? 192 : 50 // Touchscreen matches DS screen height
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
    const isTouchscreen = button.key === 'touchscreen';
    const isQuicksave = button.key === 'quickSave';
    const isQuickload = button.key === 'quickLoad';
    
    return (
      <button
        id={`control-button-${button.key}`}
        key={button.key}
        onClick={() => handleButtonClick(button)}
        className="group relative flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 bg-white dark:bg-gray-800 transition-all duration-200"
        style={{ width: '65px', height: '65px' }}
        aria-label={`Add ${button.label} control`}
      >
        <div id={`control-button-icon-${button.key}`} className="w-10 h-10 flex items-center justify-center">
          {isDpad ? (
            // D-pad icon
            <svg id={`control-button-svg-${button.key}`} viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-gray-700 dark:text-gray-300">
              <path d="M9 5v4H5v6h4v4h6v-4h4V9h-4V5H9z" />
            </svg>
          ) : isThumbstick ? (
            // Thumbstick icon
            <svg id={`control-button-svg-${button.key}`} viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-gray-700 dark:text-gray-300">
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : isTouchscreen ? (
            // Touchscreen icon - finger touching screen
            <svg id={`control-button-svg-${button.key}`} viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-gray-700 dark:text-gray-300">
              <rect x="5" y="3" width="14" height="18" fill="none" stroke="currentColor" strokeWidth="2" rx="1" />
              <circle cx="12" cy="15" r="2" />
              <path d="M12 13v-3" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : (
            // Regular button
            <div id={`control-button-circle-${button.key}`} className="w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white font-bold text-sm">
              {isQuicksave ? 'QS' : isQuickload ? 'QL' : button.label.charAt(0)}
            </div>
          )}
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
          <span id={`control-button-label-${button.key}`}>{button.label}</span>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      </button>
    );
  };

  if (!consoleType) {
    return (
      <div id="control-palette-empty-state" className="text-center text-gray-500 dark:text-gray-400 py-4">
        Select a console to see available controls
      </div>
    );
  }

  if (loading) {
    return (
      <div id="control-palette-loading" className="text-center text-gray-500 dark:text-gray-400 py-4">
        Loading controls...
      </div>
    );
  }

  return (
    <div id="control-palette-container" className="space-y-4">
      <h4 id="control-palette-title" className="font-medium text-gray-700 dark:text-gray-300">Available Controls</h4>
      
      <div id="control-palette-buttons-grid" className="flex flex-wrap gap-2">
        {availableButtons.map(button => renderButton(button))}
      </div>
      
      <div id="control-palette-custom-section" className="border-t dark:border-gray-700 pt-4">
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