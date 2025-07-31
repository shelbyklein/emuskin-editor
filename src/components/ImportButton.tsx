// Import button component for loading existing .deltaskin/.gammaskin files
import React, { useRef } from 'react';
import JSZip from 'jszip';
import { ControlMapping, ScreenMapping } from '../types';

interface ImportedSkinData {
  name: string;
  identifier: string;
  gameTypeIdentifier: string;
  representations: {
    iphone: {
      edgeToEdge?: {
        portrait?: {
          assets?: { [key: string]: string };
          items?: any[];
          screens?: any[];
          mappingSize?: { width: number; height: number };
        };
        landscape?: {
          assets?: { [key: string]: string };
          items?: any[];
          screens?: any[];
          mappingSize?: { width: number; height: number };
        };
      };
      standard?: {
        portrait?: {
          assets?: { [key: string]: string };
          items?: any[];
          screens?: any[];
          mappingSize?: { width: number; height: number };
        };
        landscape?: {
          assets?: { [key: string]: string };
          items?: any[];
          screens?: any[];
          mappingSize?: { width: number; height: number };
        };
      };
    };
  };
}

interface ImportButtonProps {
  onImport: (
    skinName: string,
    identifier: string,
    console: string,
    controls: ControlMapping[],
    screens: ScreenMapping[],
    backgroundImage: { file: File; url: string } | null,
    deviceDimensions?: { width: number; height: number },
    thumbstickImages?: { controlId: string; file: File; url: string }[]
  ) => void;
}

const ImportButton: React.FC<ImportButtonProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    const extension = file.name.toLowerCase();
    if (!extension.endsWith('.deltaskin') && !extension.endsWith('.gammaskin')) {
      alert('Please select a .deltaskin or .gammaskin file');
      return;
    }

    try {
      // Read and parse ZIP file
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      // Find and parse info.json
      const infoJsonFile = contents.file('info.json');
      if (!infoJsonFile) {
        throw new Error('No info.json file found in the skin file');
      }

      const infoJsonText = await infoJsonFile.async('text');
      const skinData: ImportedSkinData = JSON.parse(infoJsonText);

      // Extract basic info
      const skinName = skinData.name || 'Imported Skin';
      const identifier = skinData.identifier || 'com.imported.skin';
      const gameTypeIdentifier = skinData.gameTypeIdentifier || '';

      // Find the first available orientation and representation
      const representation = skinData.representations?.iphone?.edgeToEdge || 
                           skinData.representations?.iphone?.standard;
      
      if (!representation) {
        throw new Error('No valid representation found in skin file');
      }

      // Use portrait orientation (we'll add landscape support later)
      const orientation = representation.portrait || representation.landscape;
      if (!orientation) {
        throw new Error('No orientation data found in skin file');
      }

      // Extract device dimensions from mappingSize
      const deviceDimensions = orientation.mappingSize;

      // Convert items to ControlMapping format
      const controls: ControlMapping[] = (orientation.items || []).map((item: any, index: number) => {
        // Handle different input formats
        let inputs: string[] = [];
        if (typeof item.inputs === 'string') {
          inputs = [item.inputs];
        } else if (Array.isArray(item.inputs)) {
          inputs = item.inputs;
        } else if (item.inputs && typeof item.inputs === 'object') {
          // Handle object format like { "x": 1 }
          inputs = Object.keys(item.inputs);
        }

        const control: ControlMapping = {
          id: `control-${Date.now()}-${index}`,
          inputs: inputs.length === 1 ? inputs[0] : inputs,
          frame: {
            x: item.frame?.x || 0,
            y: item.frame?.y || 0,
            width: item.frame?.width || 50,
            height: item.frame?.height || 50
          },
          extendedEdges: {
            top: item.extendedEdges?.top || 0,
            bottom: item.extendedEdges?.bottom || 0,
            left: item.extendedEdges?.left || 0,
            right: item.extendedEdges?.right || 0
          }
        };
        
        // Add thumbstick data if present
        if (item.thumbstick) {
          control.thumbstick = {
            name: item.thumbstick.name,
            width: item.thumbstick.width || 85,
            height: item.thumbstick.height || 87
          };
        }
        
        // Handle thumbstick inputs object format
        if (item.inputs && typeof item.inputs === 'object' && !Array.isArray(item.inputs) &&
            'up' in item.inputs && 'down' in item.inputs && 'left' in item.inputs && 'right' in item.inputs) {
          control.inputs = item.inputs;
        }
        
        return control;
      });

      // Convert screens to ScreenMapping format
      const screens: ScreenMapping[] = (orientation.screens || []).map((screen: any, index: number) => {
        return {
          id: `screen-${Date.now()}-${index}`,
          inputFrame: {
            x: screen.inputFrame?.x || 0,
            y: screen.inputFrame?.y || 0,
            width: screen.inputFrame?.width || 100,
            height: screen.inputFrame?.height || 100
          },
          outputFrame: {
            x: screen.outputFrame?.x || 0,
            y: screen.outputFrame?.y || 0,
            width: screen.outputFrame?.width || 100,
            height: screen.outputFrame?.height || 100
          }
        };
      });

      // Extract background image
      let backgroundImage: { file: File; url: string } | null = null;
      
      if (orientation.assets) {
        // Find the first image asset
        const assetKey = Object.keys(orientation.assets)[0];
        const assetFileName = orientation.assets[assetKey];
        
        if (assetFileName) {
          const imageFile = contents.file(assetFileName);
          if (imageFile) {
            const imageBlob = await imageFile.async('blob');
            const imageFileObj = new File([imageBlob], assetFileName, { 
              type: imageBlob.type || 'image/png' 
            });
            const imageUrl = URL.createObjectURL(imageBlob);
            backgroundImage = { file: imageFileObj, url: imageUrl };
          }
        }
      }
      
      // Extract thumbstick images
      const thumbstickImages: { controlId: string; file: File; url: string }[] = [];
      
      for (const control of controls) {
        if (control.thumbstick && control.id) {
          const thumbstickFile = contents.file(control.thumbstick.name);
          if (thumbstickFile) {
            const thumbstickBlob = await thumbstickFile.async('blob');
            const thumbstickFileObj = new File([thumbstickBlob], control.thumbstick.name, {
              type: thumbstickBlob.type || 'image/png'
            });
            const thumbstickUrl = URL.createObjectURL(thumbstickBlob);
            thumbstickImages.push({
              controlId: control.id,
              file: thumbstickFileObj,
              url: thumbstickUrl
            });
          }
        }
      }

      // Map console shortname
      const consoleMap: { [key: string]: string } = {
        'com.delta.game.gbc': 'gbc',
        'com.delta.game.gba': 'gba',
        'com.delta.game.nds': 'nds',
        'com.delta.game.nes': 'nes',
        'com.delta.game.snes': 'snes',
        'com.delta.game.n64': 'n64',
        'com.delta.game.genesis': 'sg',
        'com.delta.game.ps1': 'ps1'
      };

      const consoleShortName = consoleMap[gameTypeIdentifier] || 'gbc';

      // Call onImport with extracted data
      onImport(
        skinName,
        identifier,
        consoleShortName,
        controls,
        screens,
        backgroundImage,
        deviceDimensions,
        thumbstickImages
      );

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert(`Successfully imported "${skinName}"!`);

    } catch (error) {
      console.error('Error importing skin file:', error);
      alert(`Failed to import skin file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".deltaskin,.gammaskin"
        onChange={handleFileSelect}
        className="hidden"
        id="import-file-input"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        id="import-button"
      >
        Import Skin
      </button>
    </>
  );
};

export default ImportButton;