// About page
import React from 'react';

const About: React.FC = () => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
      <div className="prose prose-gray">
        <p className="text-gray-600 mb-4">
          Emulator Skin Generator is a tool for creating custom visual skins for Delta and Gamma emulators.
        </p>
        <p className="text-gray-600">
          Design your own control layouts and export them as .deltaskin or .gammaskin files.
        </p>
      </div>
    </div>
  );
};

export default About;