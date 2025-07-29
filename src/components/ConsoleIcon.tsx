// Console system icon component
import React from 'react';

interface ConsoleIconProps {
  console: string;
  className?: string;
}

const ConsoleIcon: React.FC<ConsoleIconProps> = ({ console, className = "w-5 h-5" }) => {
  // Map console shortnames to image filenames
  const getConsoleImage = () => {
    switch (console) {
      case 'gbc':
        return '/assets/consoles/gbc.png';
      case 'gba':
        return '/assets/consoles/gba.png';
      case 'nds':
        return '/assets/consoles/ds.png';
      case 'nes':
        return '/assets/consoles/nes.png';
      case 'snes':
        return '/assets/consoles/snes.png';
      case 'n64':
        return '/assets/consoles/n64.png';
      case 'sg':
        return '/assets/consoles/genesis.png';
      case 'ps1':
        return '/assets/consoles/ps1.png';
      default:
        return null;
    }
  };

  const imageSrc = getConsoleImage();
  
  if (!imageSrc) {
    return null;
  }

  return (
    <img 
      src={imageSrc} 
      alt={`${console} icon`}
      className={className}
    />
  );
};

export default ConsoleIcon;