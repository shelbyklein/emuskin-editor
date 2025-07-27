// About page
import React from 'react';

const About: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="card animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">About Emulator Skin Generator</h2>
        
        <div className="space-y-4 text-gray-600 dark:text-gray-400">
          <p>
            Emulator Skin Generator is a powerful web-based tool designed to create custom visual skins 
            for Delta and Gamma emulators. With an intuitive visual interface, you can design unique 
            control layouts without writing a single line of JSON.
          </p>
          
          <div className="border-t dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Features</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Visual drag-and-drop control placement</li>
              <li>Support for 8 console systems (Game Boy, NES, SNES, and more)</li>
              <li>iPhone-specific layouts with proper scaling</li>
              <li>Custom button creation and multi-action support</li>
              <li>Real-time preview of your skin design</li>
              <li>Export to .deltaskin and .gammaskin formats</li>
            </ul>
          </div>
          
          <div className="border-t dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Supported Systems</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Game Boy Color', 'Game Boy Advance', 'Nintendo DS', 'NES', 'SNES', 'Nintendo 64', 'Sega Genesis', 'PlayStation'].map(system => (
                <div key={system} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center text-sm">
                  {system}
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Select your target console system</li>
              <li>Choose the iPhone model for proper dimensions</li>
              <li>Upload your skin background image</li>
              <li>Place controls on the canvas</li>
              <li>Export your completed skin</li>
            </ol>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-500 text-center">
            Built with React, TypeScript, and Tailwind CSS. 
            Made with care for the emulation community.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;