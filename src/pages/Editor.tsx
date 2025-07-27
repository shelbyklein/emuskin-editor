// Main editor page for creating emulator skins
import React, { useState, useEffect } from 'react';
import { Console, Device, ControlMapping } from '../types';
import ImageUploader from '../components/ImageUploader';
import Canvas from '../components/Canvas';
import ControlPalette from '../components/ControlPalette';

const Editor: React.FC = () => {
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedConsole, setSelectedConsole] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [skinName, setSkinName] = useState<string>('');
  const [skinIdentifier, setSkinIdentifier] = useState<string>('com.playcase.default.skin');
  const [uploadedImage, setUploadedImage] = useState<{ file: File; url: string } | null>(null);
  const [controls, setControls] = useState<ControlMapping[]>([]);
  const [selectedDeviceData, setSelectedDeviceData] = useState<Device | null>(null);

  // Add debug logging to check data
  useEffect(() => {
    console.log('Consoles data:', consoles);
    console.log('Devices data:', devices);
    // Check for duplicate keys
    const consoleKeys = consoles.map(c => c.shortName);
    const deviceKeys = devices.map(d => d.model);
    console.log('Console keys:', consoleKeys);
    console.log('Device keys:', deviceKeys);
    console.log('Duplicate console keys:', consoleKeys.filter((item, index) => consoleKeys.indexOf(item) !== index));
    console.log('Duplicate device keys:', deviceKeys.filter((item, index) => deviceKeys.indexOf(item) !== index));
  }, [consoles, devices]);

  // Load console and device data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [consolesRes, devicesRes] = await Promise.all([
          fetch('/assets/gameTypeIdentifiers.json'),
          fetch('/assets/iphone-sizes.json')
        ]);
        
        if (!consolesRes.ok || !devicesRes.ok) {
          throw new Error('Failed to load configuration files');
        }
        
        const consolesData = await consolesRes.json();
        const devicesData = await devicesRes.json();
        
        // Check for duplicate models (debugging)
        const deviceModels = devicesData.map((d: Device) => d.model);
        const duplicates = deviceModels.filter((item: string, index: number) => deviceModels.indexOf(item) !== index);
        if (duplicates.length > 0) {
          console.warn('Duplicate device models found:', duplicates);
        }
        
        setConsoles(consolesData);
        setDevices(devicesData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Update selected device data when device changes
  useEffect(() => {
    if (selectedDevice && devices.length > 0) {
      const device = devices.find(d => d.model === selectedDevice);
      setSelectedDeviceData(device || null);
      
      // Log if device not found
      if (!device && selectedDevice) {
        console.warn(`Device model "${selectedDevice}" not found in device list`);
      }
    } else {
      setSelectedDeviceData(null);
    }
  }, [selectedDevice, devices]);

  const handleImageUpload = (file: File, previewUrl: string) => {
    setUploadedImage({ file, url: previewUrl });
  };

  const handleControlsUpdate = (newControls: ControlMapping[]) => {
    setControls(newControls);
  };

  const handleControlSelect = (control: ControlMapping) => {
    // Add new control to the list
    setControls([...controls, control]);
  };

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
            <input
              id="console"
              list="console-list"
              value={selectedConsole}
              onChange={(e) => setSelectedConsole(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Type to search consoles..."
            />
            <datalist id="console-list">
              {consoles.map((console) => (
                <option key={console.shortName} value={console.shortName}>
                  {console.console}
                </option>
              ))}
            </datalist>
          </div>

          {/* Device Selection */}
          <div>
            <label htmlFor="device" className="block text-sm font-medium text-gray-700">
              iPhone Model
            </label>
            <input
              id="device"
              list="device-list"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Type to search devices..."
            />
            <datalist id="device-list">
              {devices.map((device) => (
                <option key={device.model} value={device.model} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      {selectedConsole && selectedDevice && !uploadedImage && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Skin Image</h3>
          <ImageUploader onImageUpload={handleImageUpload} />
        </div>
      )}

      {/* Control Palette */}
      {selectedConsole && selectedDevice && uploadedImage && (
        <div className="bg-white shadow rounded-lg p-6">
          <ControlPalette 
            consoleType={selectedConsole}
            onControlSelect={handleControlSelect}
          />
        </div>
      )}

      {/* Canvas Area */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Design Canvas</h3>
          {uploadedImage && (
            <button
              onClick={() => setUploadedImage(null)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Change Image
            </button>
          )}
        </div>
        <div style={{ height: '600px' }}>
          <Canvas 
            device={selectedDeviceData}
            backgroundImage={uploadedImage?.url || null}
            controls={controls}
            onControlUpdate={handleControlsUpdate}
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;