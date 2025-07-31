// Device info display component
import React from 'react';
import { Device } from '../types';

interface DeviceInfoProps {
  device: Device | null;
  scale: number;
  orientation?: 'portrait' | 'landscape';
}

const DeviceInfo: React.FC<DeviceInfoProps> = ({ device, scale, orientation = 'portrait' }) => {
  if (!device) return null;

  // Swap dimensions for landscape
  const logicalWidth = orientation === 'landscape' ? device.logicalHeight : device.logicalWidth;
  const logicalHeight = orientation === 'landscape' ? device.logicalWidth : device.logicalHeight;
  const physicalWidth = orientation === 'landscape' ? device.physicalHeight : device.physicalWidth;
  const physicalHeight = orientation === 'landscape' ? device.physicalWidth : device.physicalHeight;

  return (
    <div className="text-xs">
      <div className="flex items-center flex-wrap gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <strong className="mr-1">Device:</strong> {device.model}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <strong className="mr-1">Logical:</strong> {logicalWidth} × {logicalHeight}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <strong className="mr-1">Physical:</strong> {physicalWidth} × {physicalHeight}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <strong className="mr-1">Scale:</strong> {Math.round(scale * 100)}%
        </span>
      </div>
    </div>
  );
};

export default DeviceInfo;