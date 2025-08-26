# LocalStorage Excessive Data Storage Issue

## Issue Summary
The current localStorage implementation is storing significantly more data than necessary, leading to storage bloat and potential performance issues. According to the user's requirement, only **JSON configuration data** and **base64 image data** should be stored, but the current implementation stores much more.

## Current Storage Implementation

### What's Being Stored (Per Project)
Based on code analysis, each project stores:

#### Core Project Data
```typescript
interface Project {
  id: string;                    // ✅ NEEDED
  _id?: string;                 // ❌ UNNECESSARY - Duplicate of id
  name: string;                 // ✅ NEEDED - For JSON export
  identifier: string;           // ✅ NEEDED - For JSON export
  console: Console | null;      // ❌ EXCESSIVE - Full object stored
  device: Device | null;        // ❌ EXCESSIVE - Full object stored
  debug?: boolean;              // ✅ NEEDED - For JSON export
  orientations?: { ... };       // ✅ NEEDED - Core data
  availableOrientations?: [...]; // ❌ UNNECESSARY - Can be derived
  currentOrientation?: string;   // ❌ UNNECESSARY - UI state, not export data
  hasBeenConfigured?: boolean;   // ❌ UNNECESSARY - UI state
  lastModified: number;         // ❌ UNNECESSARY - Metadata only
  createdAt?: number;           // ❌ UNNECESSARY - Metadata only
  userId?: string;              // ❌ UNNECESSARY - Not needed for local storage
  isLocal?: boolean;            // ❌ UNNECESSARY - Storage implementation detail
}
```

#### Console Object Being Stored
```typescript
interface Console {
  console: string;           // ❌ UNNECESSARY - Can derive from gameTypeIdentifier
  gameTypeIdentifier: string; // ✅ NEEDED - For JSON export  
  shortName: string;         // ❌ UNNECESSARY - Can derive from lookup
}
```

#### Device Object Being Stored
```typescript
interface Device {
  model: string;          // ❌ UNNECESSARY - Can derive from dimensions
  logicalWidth: number;   // ✅ NEEDED - For mappingSize in JSON
  logicalHeight: number;  // ✅ NEEDED - For mappingSize in JSON
  physicalWidth: number;  // ❌ UNNECESSARY - Not used in JSON export
  physicalHeight: number; // ❌ UNNECESSARY - Not used in JSON export
  ppi: number;           // ❌ UNNECESSARY - Not used in JSON export
}
```

#### Background Image Data
```typescript
backgroundImage: {
  fileName?: string;      // ✅ NEEDED - For export
  url: string | null;     // ❌ UNNECESSARY - Blob URL expires anyway
  hasStoredImage?: boolean; // ❌ UNNECESSARY - Can derive from dataURL presence
  dataURL?: string;       // ✅ NEEDED - Base64 image data
}
```

## Problems Identified

### 1. **Storage Bloat** 
- Storing entire Console and Device objects instead of just identifiers
- Duplicate IDs (`id` and `_id`)
- UI state mixed with export data
- Metadata that serves no export purpose

### 2. **Performance Impact**
- Large localStorage entries (estimated 5-10x larger than necessary)
- JSON.stringify/parse overhead on large objects  
- Memory usage from redundant data

### 3. **Maintenance Complexity**
- Complex data structures with mixed concerns
- Restoration logic for blob URLs that expire anyway
- Multiple data normalization steps

### 4. **Storage Limit Risk**
- localStorage has 5-10MB limit across all domains
- Large base64 images + bloated metadata = faster storage exhaustion
- Current implementation estimates 90% threshold warning

## Recommended Minimal Storage Format

### Simplified Project Structure
```typescript
interface MinimalProject {
  // Core JSON Export Data Only
  id: string;
  name: string;
  identifier: string;
  gameTypeIdentifier: string;  // Instead of full Console object
  mappingSize: {               // Instead of full Device object
    width: number;
    height: number;
  };
  debug?: boolean;
  orientations: {
    portrait?: {
      controls: ControlMapping[];
      screens: ScreenMapping[];
      backgroundImage?: string;    // Base64 dataURL directly
      menuInsetsEnabled?: boolean;
      menuInsetsBottom?: number;
      menuInsetsLeft?: number;
      menuInsetsRight?: number;
    };
    landscape?: {
      // Same structure as portrait
    };
  };
}
```

### Storage Size Comparison
- **Current**: ~50-100KB per project (with image)
- **Proposed**: ~20-30KB per project (with same image)
- **Reduction**: 60-70% smaller storage footprint

## Implementation Requirements

### Phase 1: Data Structure Optimization
1. Remove duplicate and unnecessary fields
2. Store only gameTypeIdentifier (not full Console object)
3. Store only width/height dimensions (not full Device object)
4. Remove UI state and metadata from storage

### Phase 2: Image Storage Optimization  
1. Store base64 dataURL directly in backgroundImage field
2. Remove url, hasStoredImage, fileName fields
3. Generate blob URLs on-demand during loading

### ~~Phase 3: Migration Strategy~~ (Not Needed)
~~1. Create migration function for existing localStorage projects~~
~~2. Detect old format and convert to new format~~
~~3. Clean up old entries after successful migration~~

**Note**: Per user feedback, Phase 3 migration is not needed. When loading a project, the app should only need the JSON configuration and image data to reconstruct the skin. No backwards compatibility or migration required.

## Expected Benefits
1. **60-70% reduction** in storage size per project
2. **Faster loading/saving** due to smaller JSON operations  
3. **Simpler codebase** with clearer data separation
4. **Better storage capacity** - fit 2-3x more projects in localStorage
5. **Easier export generation** - data already in export-ready format

## Priority
**HIGH** - Storage efficiency is critical for localStorage-based projects, especially with base64 images consuming significant space.

## Files to Modify
- `src/utils/localStorageProjects.ts` - Storage format
- `src/contexts/ProjectContext.tsx` - Data handling
- `src/types/index.ts` - Interface definitions