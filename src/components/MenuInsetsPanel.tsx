// Menu insets panel for configuring bottom menu insets
import React from 'react';

interface MenuInsetsPanelProps {
  menuInsetsEnabled: boolean;
  menuInsetsBottom: number; // 0-100 representing percentage
  onToggle: (enabled: boolean) => void;
  onBottomChange: (value: number) => void;
}

const MenuInsetsPanel: React.FC<MenuInsetsPanelProps> = ({
  menuInsetsEnabled,
  menuInsetsBottom,
  onToggle,
  onBottomChange
}) => {
  return (
    <div id="menu-insets-panel" className="card animate-slide-up">
      <h3 id="menu-insets-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Menu Insets
      </h3>
      
      <div className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="menu-insets-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Menu Insets
          </label>
          <button
            id="menu-insets-toggle"
            onClick={() => onToggle(!menuInsetsEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              menuInsetsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            role="switch"
            aria-checked={menuInsetsEnabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                menuInsetsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Bottom Inset Slider */}
        {menuInsetsEnabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="menu-insets-bottom" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bottom Inset
              </label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {menuInsetsBottom}%
              </span>
            </div>
            
            <div className="relative">
              <input
                id="menu-insets-bottom"
                type="range"
                min="0"
                max="100"
                value={menuInsetsBottom}
                onChange={(e) => onBottomChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${menuInsetsBottom}%, #E5E7EB ${menuInsetsBottom}%, #E5E7EB 100%)`
                }}
              />
              
              {/* Tick marks */}
              <div className="absolute w-full flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 pointer-events-none">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Menu insets define the area reserved for system UI elements. The bottom inset is typically used for the iPhone home indicator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuInsetsPanel;