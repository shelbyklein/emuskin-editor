// Canvas component for visual skin editing
import React, { useRef, useEffect, useState } from 'react';
import { Device } from '../types';

interface CanvasProps {
  device: Device | null;
  backgroundImage: string | null;
  controls: any[]; // Will be typed properly when we implement controls
  onControlUpdate: (controls: any[]) => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  device, 
  backgroundImage, 
  controls, 
  onControlUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  
  // TODO: Will be used for drag and drop
  void onControlUpdate;

  // Calculate canvas dimensions based on device
  useEffect(() => {
    if (!device || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Use device logical dimensions
    const deviceWidth = device.logicalResolution.width;
    const deviceHeight = device.logicalResolution.height;
    
    // Calculate scale to fit container while maintaining aspect ratio
    const scaleX = containerWidth / deviceWidth;
    const scaleY = containerHeight / deviceHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1:1

    setScale(newScale);
    setCanvasSize({
      width: deviceWidth * newScale,
      height: deviceHeight * newScale
    });
  }, [device]);

  // Render canvas content
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image if available
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        // Scale and center the image to fit the canvas
        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
          // Image is wider
          drawWidth = canvas.width;
          drawHeight = canvas.width / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        } else {
          // Image is taller
          drawHeight = canvas.height;
          drawWidth = canvas.height * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        }
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Draw control overlays
        drawControls(ctx);
      };
      img.src = backgroundImage;
    } else {
      // Draw placeholder grid
      drawGrid(ctx);
    }
  }, [backgroundImage, canvasSize, controls]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    const gridSize = 20 * scale;
    
    // Draw vertical lines
    for (let x = 0; x <= ctx.canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= ctx.canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();
    }
  };

  const drawControls = (ctx: CanvasRenderingContext2D) => {
    // Draw control zones
    controls.forEach(control => {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Blue with transparency
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      
      const x = control.frame.x * scale;
      const y = control.frame.y * scale;
      const width = control.frame.width * scale;
      const height = control.frame.height * scale;
      
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      
      // Draw control label
      ctx.fillStyle = '#1f2937';
      ctx.font = `${12 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        control.inputs?.[0] || 'Control', 
        x + width / 2, 
        y + height / 2
      );
    });
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-100"
    >
      {device ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="border border-gray-300 bg-white shadow-lg"
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
          {/* Control panel will be added here later */}
        </div>
      ) : (
        <p className="text-gray-500">
          Select a device to begin
        </p>
      )}
    </div>
  );
};

export default Canvas;