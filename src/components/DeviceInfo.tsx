// Device info display component
import React from 'react';
import { Device } from '../types';

interface DeviceInfoProps {
  device: Device | null;
  scale: number;
}

const DeviceInfo: React.FC<DeviceInfoProps> = ({ device }) => {
  if (!device) return null;

  return (
    <div className="text-xs">
      <div className="flex items-center flex-wrap gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <strong className="mr-1">Device:</strong> {device.model}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <strong className="mr-1">Logical:</strong> {device.logicalWidth} × {device.logicalHeight}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <strong className="mr-1">Physical:</strong> {device.physicalWidth} × {device.physicalHeight}
        </span>
      </div>
    </div>
  );
};

export default DeviceInfo;