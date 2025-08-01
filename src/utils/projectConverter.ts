// Convert between full Project and MinimalProject formats
import { MinimalProject } from '../types/SaveFormat';
import { Console, Device } from '../types';
import { toMinimalOrientationData, fromMinimalOrientationData } from './saveFormatConverter';

// Import the Project interface from ProjectContext
interface Project {
  id: string;
  name: string;
  identifier: string;
  console: Console | null;
  device: Device | null;
  userId?: string;
  isPublic?: boolean;
  createdAt?: number;
  orientations?: {
    portrait: {
      controls: any[];
      screens: any[];
      backgroundImage: any;
      menuInsetsEnabled?: boolean;
      menuInsetsBottom?: number;
    };
    landscape: {
      controls: any[];
      screens: any[];
      backgroundImage: any;
      menuInsetsEnabled?: boolean;
      menuInsetsBottom?: number;
    };
  };
  currentOrientation?: 'portrait' | 'landscape';
  hasBeenConfigured?: boolean;
  lastModified: number;
}

// Convert full Project to MinimalProject (for saving)
export function toMinimalProject(project: Project): MinimalProject | null {
  if (!project.console || !project.device || !project.orientations) {
    return null;
  }
  
  return {
    id: project.id,
    name: project.name,
    identifier: project.identifier,
    gameTypeIdentifier: project.console.gameTypeIdentifier,
    deviceModel: project.device.model,
    orientations: {
      portrait: toMinimalOrientationData(
        project.orientations.portrait.controls,
        project.orientations.portrait.screens,
        project.orientations.portrait.menuInsetsEnabled,
        project.orientations.portrait.menuInsetsBottom,
        project.orientations.portrait.backgroundImage?.hasStoredImage ? 
          `${project.id}-portrait` : undefined,
        project.orientations.portrait.backgroundImage?.url || undefined,
        project.orientations.portrait.backgroundImage?.fileName || undefined
      ),
      landscape: toMinimalOrientationData(
        project.orientations.landscape.controls,
        project.orientations.landscape.screens,
        project.orientations.landscape.menuInsetsEnabled,
        project.orientations.landscape.menuInsetsBottom,
        project.orientations.landscape.backgroundImage?.hasStoredImage ? 
          `${project.id}-landscape` : undefined,
        project.orientations.landscape.backgroundImage?.url || undefined,
        project.orientations.landscape.backgroundImage?.fileName || undefined
      )
    },
    currentOrientation: project.currentOrientation || 'portrait',
    lastModified: project.lastModified
  };
}

// Convert MinimalProject to full Project (for loading)
export async function fromMinimalProject(
  minimal: MinimalProject,
  consoles: Console[],
  devices: Device[]
): Promise<Project | null> {
  // Find the console and device by their identifiers
  const foundConsole = consoles.find(c => c.gameTypeIdentifier === minimal.gameTypeIdentifier);
  const device = devices.find(d => d.model === minimal.deviceModel);
  
  if (!foundConsole || !device) {
    console.error('Could not find console or device for project:', minimal);
    return null;
  }
  
  // Convert orientation data
  const portraitData = fromMinimalOrientationData(minimal.orientations.portrait);
  const landscapeData = fromMinimalOrientationData(minimal.orientations.landscape);
  
  return {
    id: minimal.id,
    name: minimal.name,
    identifier: minimal.identifier,
    console: foundConsole,
    device,
    orientations: {
      portrait: {
        ...portraitData,
        backgroundImage: (minimal.orientations.portrait.backgroundImageUrl || minimal.orientations.portrait.backgroundImageRef) ? {
          hasStoredImage: true,
          url: minimal.orientations.portrait.backgroundImageUrl || null,
          fileName: minimal.orientations.portrait.backgroundImageFileName || 'background.png'
        } : null
      },
      landscape: {
        ...landscapeData,
        backgroundImage: (minimal.orientations.landscape.backgroundImageUrl || minimal.orientations.landscape.backgroundImageRef) ? {
          hasStoredImage: true,
          url: minimal.orientations.landscape.backgroundImageUrl || null,
          fileName: minimal.orientations.landscape.backgroundImageFileName || 'background.png'
        } : null
      }
    },
    currentOrientation: minimal.currentOrientation,
    hasBeenConfigured: true,
    lastModified: minimal.lastModified
  };
}