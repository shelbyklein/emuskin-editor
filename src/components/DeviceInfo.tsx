// Device info display component
import React from 'react';
import { Device } from '../types';

interface DeviceInfoProps {
  device: Device | null;
  scale: number;
}

const DeviceInfo: React.FC<DeviceInfoProps> = ({ device, scale }) => {
  if (!device) return null;

  return (
    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
      <div className="flex items-center space-x-4">
        <span>
          <strong>Device:</strong> {device.model}
        </span>
        <span>
          <strong>Logical:</strong> {device.logicalWidth} × {device.logicalHeight}
        </span>
        <span>
          <strong>Physical:</strong> {device.physicalWidth} × {device.physicalHeight}
        </span>
        <span className="text-green-600 dark:text-green-400">
          <strong>1:1 Pixel Perfect</strong>
        </span>
      </div>
    </div>
  );
};

export default DeviceInfo;