// Control palette component for displaying available buttons
import React, { useState, useEffect } from 'react';
import { ControlMapping } from '../types';

interface Button {
  name: string;
  identifier: string;
  type?: string;
}

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
          setAvailableButtons(data[consoleType]);
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
      inputs: [button.identifier],
      frame: {
        x: 50, // Default position
        y: 50,
        width: 50, // Default size
        height: 50
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
    const isDpad = button.identifier === 'dpad';
    const isThumbstick = button.type === 'thumbstick';
    
    return (
      <button
        key={button.identifier}
        onClick={() => handleButtonClick(button)}
        className="flex flex-col items-center justify-center p-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        title={`Add ${button.name}`}
      >
        <div className="w-8 h-8 flex items-center justify-center">
          {isDpad ? (
            // D-pad icon
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M9 5v4H5v6h4v4h6v-4h4V9h-4V5H9z" />
            </svg>
          ) : isThumbstick ? (
            // Thumbstick icon
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            // Regular button
            <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">
              {button.name.charAt(0)}
            </div>
          )}
        </div>
        <span className="text-xs mt-1">{button.name}</span>
      </button>
    );
  };

  if (!consoleType) {
    return (
      <div className="text-center text-gray-500 py-4">
        Select a console to see available controls
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-4">
        Loading controls...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Available Controls</h4>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {availableButtons.map(button => renderButton(button))}
      </div>
      
      <div className="border-t pt-4">
        <button
          onClick={() => {
            // Create custom button
            const customControl: ControlMapping = {
              inputs: ['custom'],
              frame: {
                x: 50,
                y: 50,
                width: 50,
                height: 50
              },
              extendedEdges: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
              }
            };
            onControlSelect(customControl);
          }}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          + Add Custom Button
        </button>
      </div>
    </div>
  );
};

export default ControlPalette;