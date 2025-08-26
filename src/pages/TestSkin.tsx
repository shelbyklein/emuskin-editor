// TestSkin component for interactive skin testing
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContextHybrid';
import { useToast } from '../contexts/ToastContext';
import { ControlMapping, ScreenMapping } from '../types';

interface ActiveButton {
  controlId: string;
  label: string;
  inputs: string[];
}

const TestSkin: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { loadProject, currentProject } = useProject();
  const { showError } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeButtons, setActiveButtons] = useState<ActiveButton[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [controls, setControls] = useState<ControlMapping[]>([]);
  const [screens, setScreens] = useState<ScreenMapping[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportDimensions, setViewportDimensions] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });
  const [showDebug, setShowDebug] = useState(false);
  
  // Track active touches
  const activeTouches = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        showError('No project ID provided');
        navigate('/');
        return;
      }

      try {
        await loadProject(projectId);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading project:', error);
        showError('Failed to load project');
        navigate('/');
      }
    };

    loadProjectData();
  }, [projectId, loadProject, navigate, showError]);

  useEffect(() => {
    if (currentProject) {
      const orientationData = currentProject.orientations?.[orientation];
      if (orientationData) {
        setBackgroundImage(orientationData.backgroundImage?.url || null);
        setControls(orientationData.controls || []);
        setScreens(orientationData.screens || []);
      }
    }
  }, [currentProject, orientation]);

  // Get accurate viewport dimensions
  const updateViewportDimensions = () => {
    // Use visualViewport API if available (more accurate for mobile browsers)
    if (window.visualViewport) {
      setViewportDimensions({
        width: window.visualViewport.width,
        height: window.visualViewport.height
      });
    } else {
      // Fallback to window dimensions
      setViewportDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
  };

  useEffect(() => {
    updateViewportDimensions();

    // Listen for viewport changes
    const handleResize = () => updateViewportDimensions();
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Listen to visualViewport resize if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

  // Handle fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error attempting to exit fullscreen:', err);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);


  // Handle control press/release
  const handleControlPress = (control: ControlMapping) => {
    const button: ActiveButton = {
      controlId: control.id,
      label: control.label || control.inputs.join('+'),
      inputs: control.inputs
    };
    
    setActiveButtons(prev => {
      const exists = prev.some(b => b.controlId === control.id);
      if (!exists) {
        return [...prev, button];
      }
      return prev;
    });
  };

  const handleControlRelease = (controlId: string) => {
    setActiveButtons(prev => prev.filter(b => b.controlId !== controlId));
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent, control: ControlMapping) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      activeTouches.current.set(touch.identifier, control.id);
      handleControlPress(control);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const controlId = activeTouches.current.get(touch.identifier);
      if (controlId) {
        handleControlRelease(controlId);
        activeTouches.current.delete(touch.identifier);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent, control: ControlMapping) => {
    e.preventDefault();
    e.stopPropagation();
    handleControlPress(control);
  };

  const handleMouseUp = (e: React.MouseEvent, control: ControlMapping) => {
    e.preventDefault();
    e.stopPropagation();
    handleControlRelease(control.id);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">Loading skin...</div>
      </div>
    );
  }

  if (!currentProject || !currentProject.device) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">Project not found or invalid</div>
      </div>
    );
  }

  const device = currentProject.device;
  const canvasWidth = orientation === 'portrait' ? device.logicalWidth : device.logicalHeight;
  const canvasHeight = orientation === 'portrait' ? device.logicalHeight : device.logicalWidth;

  // Detect if running on iOS Safari
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // Calculate the actual visible canvas area that fits in the viewport
  const viewportAspectRatio = viewportDimensions.width / viewportDimensions.height;
  const canvasAspectRatio = canvasWidth / canvasHeight;
  
  let visibleCanvasWidth: number;
  let visibleCanvasHeight: number;
  let scale: number;
  let offsetX = 0;
  let offsetY = 0;
  
  if (viewportAspectRatio > canvasAspectRatio) {
    // Viewport is wider than canvas aspect ratio - fit by height
    scale = viewportDimensions.height / canvasHeight;
    visibleCanvasHeight = canvasHeight;
    visibleCanvasWidth = viewportDimensions.width / scale;
    // Center the canvas horizontally
    offsetX = (visibleCanvasWidth - canvasWidth) / 2;
  } else {
    // Viewport is taller than canvas aspect ratio - fit by width
    scale = viewportDimensions.width / canvasWidth;
    visibleCanvasWidth = canvasWidth;
    visibleCanvasHeight = viewportDimensions.height / scale;
    // Crop the top/bottom to fit
    offsetY = (visibleCanvasHeight - canvasHeight) / 2;
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Canvas Container */}
      <div
        className="relative overflow-hidden"
        style={{
          width: viewportDimensions.width,
          height: viewportDimensions.height,
        }}
      >
        {/* Canvas */}
        <div
          className="relative bg-gray-800"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${scale}) translate(${-offsetX}px, ${-offsetY}px)`,
            transformOrigin: 'top left',
          }}
        >
        {/* Background Image */}
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="Skin background"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        )}

        {/* Screens */}
        {screens.filter(screen => screen.outputFrame).map((screen, index) => (
          <div
            key={screen.id || `screen-${index}`}
            className="absolute border-2 border-green-500/30 bg-green-500/10 pointer-events-none"
            style={{
              left: `${screen.outputFrame.x}px`,
              top: `${screen.outputFrame.y}px`,
              width: `${screen.outputFrame.width}px`,
              height: `${screen.outputFrame.height}px`,
            }}
          />
        ))}

        {/* Controls */}
        {controls.map((control, index) => {
          const isActive = activeButtons.some(b => b.controlId === control.id);
          
          return (
            <div
              key={control.id || `control-${index}`}
              className={`absolute border-2 transition-all duration-75 ${
                isActive 
                  ? 'border-blue-400 bg-blue-400/50 scale-95' 
                  : 'border-blue-500/30 bg-blue-500/10'
              }`}
              style={{
                left: `${control.frame.x}px`,
                top: `${control.frame.y}px`,
                width: `${control.frame.width}px`,
                height: `${control.frame.height}px`,
                touchAction: 'none',
                cursor: 'pointer',
              }}
              onTouchStart={(e) => handleTouchStart(e, control)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={(e) => handleMouseDown(e, control)}
              onMouseUp={(e) => handleMouseUp(e, control)}
              onMouseLeave={(e) => handleControlRelease(control.id)}
            >
              {/* Control label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-white/70'}`}>
                  {control.label || control.inputs.join('+')}
                </span>
              </div>
            </div>
          );
        })}

        {/* Button Press Display - Inside Game Screen */}
        {screens.length > 0 && screens[0].outputFrame && activeButtons.length > 0 && (
          <div 
            className="absolute flex flex-wrap gap-2 pointer-events-none z-10"
            style={{
              left: `${screens[0].outputFrame.x + 8}px`,
              top: `${screens[0].outputFrame.y + 8}px`,
              maxWidth: `${screens[0].outputFrame.width - 16}px`,
            }}
          >
            {activeButtons.map((button) => (
              <div
                key={button.controlId}
                className="px-2 py-1 bg-black/80 border border-white rounded text-white font-bold text-xs animate-pulse"
              >
                {button.label}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* UI Controls */}
      <div className="fixed top-4 right-4 flex flex-col space-y-2">
        {/* Exit Button */}
        <button
          onClick={() => navigate('/')}
          className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isFullscreen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            )}
          </svg>
        </button>

        {/* Orientation Toggle (if both orientations exist) */}
        {currentProject.orientations?.portrait && currentProject.orientations?.landscape && (
          <button
            onClick={() => setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
            className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Info Display */}
      <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg">
        <div className="text-sm">
          <div>{currentProject.name}</div>
          <div className="text-xs text-gray-400">{device.model} • {orientation}</div>
        </div>
      </div>

      {/* Debug Overlay */}
      <div className="fixed top-4 left-4">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-lg transition-colors text-xs"
        >
          Debug
        </button>
      </div>
      
      {showDebug && (
        <div className="fixed top-16 left-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono">
          <div>Window: {window.innerWidth} x {window.innerHeight}</div>
          <div>Viewport: {viewportDimensions.width} x {viewportDimensions.height}</div>
          {window.visualViewport && (
            <div>Visual: {window.visualViewport.width} x {window.visualViewport.height}</div>
          )}
          <div>Canvas: {canvasWidth} x {canvasHeight}</div>
          <div>Scale: {scale.toFixed(3)}</div>
          <div>iOS Safari: {isIOSSafari ? 'Yes' : 'No'}</div>
          <div>Offset X: {offsetX.toFixed(1)}px</div>
          <div>Offset Y: {offsetY.toFixed(1)}px</div>
          <div>Visible Area: {visibleCanvasWidth.toFixed(0)} x {visibleCanvasHeight.toFixed(0)}</div>
          <div>Fullscreen: {isFullscreen ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default TestSkin;