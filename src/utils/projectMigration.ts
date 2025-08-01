// Migrate projects from v1 (full format) to v2 (minimal format)
import { MinimalProject } from '../types/SaveFormat';
import { toMinimalProject } from './projectConverter';

export function migrateProjectsToV2(): boolean {
  try {
    // Check if v1 projects exist
    const v1ProjectsStr = localStorage.getItem('emuskin-projects');
    if (!v1ProjectsStr) {
      return false; // No migration needed
    }
    
    // Check if already migrated
    const v2ProjectsStr = localStorage.getItem('emuskin-projects-v2');
    if (v2ProjectsStr) {
      return false; // Already migrated
    }
    
    // Parse v1 projects
    const v1Projects = JSON.parse(v1ProjectsStr);
    if (!Array.isArray(v1Projects)) {
      return false;
    }
    
    // Convert to minimal format
    const v2Projects: MinimalProject[] = [];
    
    for (const v1Project of v1Projects) {
      // Skip if missing required data
      if (!v1Project.console || !v1Project.device) {
        continue;
      }
      
      // Ensure orientations exist
      if (!v1Project.orientations) {
        v1Project.orientations = {
          portrait: {
            controls: v1Project.controls || [],
            screens: v1Project.screens || [],
            backgroundImage: v1Project.backgroundImage || null,
            menuInsetsEnabled: v1Project.menuInsetsEnabled || false,
            menuInsetsBottom: v1Project.menuInsetsBottom || 0
          },
          landscape: {
            controls: [],
            screens: [],
            backgroundImage: null,
            menuInsetsEnabled: false,
            menuInsetsBottom: 0
          }
        };
      }
      
      const minimal = toMinimalProject(v1Project);
      if (minimal) {
        v2Projects.push(minimal);
      }
    }
    
    // Save v2 projects
    localStorage.setItem('emuskin-projects-v2', JSON.stringify(v2Projects));
    
    // Migrate current project ID if exists
    const currentProjectId = localStorage.getItem('emuskin-current-project');
    if (currentProjectId) {
      localStorage.setItem('emuskin-current-project-v2', currentProjectId);
    }
    
    // Keep v1 data as backup (don't delete)
    console.log(`Migrated ${v2Projects.length} projects to v2 format`);
    
    return true;
  } catch (error) {
    console.error('Failed to migrate projects:', error);
    return false;
  }
}

// Check if migration is needed
export function needsMigration(): boolean {
  const v1Exists = localStorage.getItem('emuskin-projects') !== null;
  const v2Exists = localStorage.getItem('emuskin-projects-v2') !== null;
  return v1Exists && !v2Exists;
}