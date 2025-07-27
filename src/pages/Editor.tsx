// Main editor page for creating emulator skins
import React, { useState, useEffect } from 'react';
import { Console, Device } from '../types';

const Editor: React.FC = () => {
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedConsole, setSelectedConsole] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [skinName, setSkinName] = useState<string>('');
  const [skinIdentifier, setSkinIdentifier] = useState<string>('com.playcase.default.skin');

  // Load console and device data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [consolesRes, devicesRes] = await Promise.all([
          fetch('/assets/gameTypeIdentifiers.json'),
          fetch('/assets/iphone-sizes.json')
        ]);
        
        const consolesData = await consolesRes.json();
        const devicesData = await devicesRes.json();
        
        setConsoles(consolesData);
        setDevices(devicesData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Skin</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Skin Name Input */}
          <div>
            <label htmlFor="skinName" className="block text-sm font-medium text-gray-700">
              Skin Name
            </label>
            <input
              type="text"
              id="skinName"
              value={skinName}
              onChange={(e) => setSkinName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="My Custom Skin"
            />
          </div>

          {/* Skin Identifier Input */}
          <div>
            <label htmlFor="skinIdentifier" className="block text-sm font-medium text-gray-700">
              Skin Identifier
            </label>
            <input
              type="text"
              id="skinIdentifier"
              value={skinIdentifier}
              onChange={(e) => setSkinIdentifier(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="com.playcase.default.skin"
            />
          </div>

          {/* Console Selection */}
          <div>
            <label htmlFor="console" className="block text-sm font-medium text-gray-700">
              Console System
            </label>
            <select
              id="console"
              value={selectedConsole}
              onChange={(e) => setSelectedConsole(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a console</option>
              {consoles.map((console) => (
                <option key={console.identifier} value={console.identifier}>
                  {console.name}
                </option>
              ))}
            </select>
          </div>

          {/* Device Selection */}
          <div>
            <label htmlFor="device" className="block text-sm font-medium text-gray-700">
              iPhone Model
            </label>
            <select
              id="device"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a device</option>
              {devices.map((device) => (
                <option key={device.identifier} value={device.identifier}>
                  {device.identifier}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Design Canvas</h3>
        <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height: '600px' }}>
          <p className="text-gray-500">
            Select a console and device to begin designing your skin
          </p>
        </div>
      </div>
    </div>
  );
};

export default Editor;