# Editor.tsx Refactoring Proposal

## Problem Statement

The current `Editor.tsx` file has grown to 1860+ lines and is exhibiting several maintainability issues:

### Current Issues:
1. **Excessive State Management** - 20+ useState hooks creating complex dependencies
2. **Redundant Data Synchronization** - Multiple useEffects trying to keep state in sync
3. **Complex Project Loading Logic** - 300+ line useEffect with multiple early returns
4. **Mixed Concerns** - Business logic, UI state, and data operations all in one component
5. **Race Conditions** - Requires complex flags like `isSavingRef`, `previouslySavingRef`
6. **R2 Cloud Storage Complexity** - Unnecessary cloud storage logic that complicates image handling

## Analysis of Current Structure

### State Variables (20+):
- Device/console selection
- Skin metadata (name, identifier, debug)
- Controls/screens arrays
- Menu insets configuration
- Image handling (background, thumbstick)
- History tracking for undo/redo
- UI flags (panel states, selection indices)

### Major useEffects:
- **Lines 134-446**: Main project loading (300+ lines!)
- **Lines 447-465**: Name/identifier sync
- **Lines 466-474**: Save completion sync
- **Lines 475-485**: Pending image save handler
- **Lines 122-128**: Auto-project creation

## Proposed Solution

### Phase 1: Extract Custom Hooks

#### 1.1 `useEditorState` Hook
Consolidate all state management into a single reducer-based hook:
- Controls/screens state
- Selection indices
- UI panel states
- Form data (name, identifier, etc.)

#### 1.2 `useProjectSync` Hook  
Handle project loading/saving logic:
- Auto-project creation
- Loading project data
- Syncing changes to ProjectContext
- Remove complex flags and race conditions

#### 1.3 `useImageManagement` Hook
Manage image operations:
- Background image upload/removal
- Thumbstick image handling
- Local storage with dataURL/blob URL handling
- Blob URL cleanup and lifecycle management

### Phase 2: Component Extraction

#### 2.1 `EditorHeader` Component (lines 1330-1393)
- Title display
- Edit button
- Project manager
- Import/Export buttons

#### 2.2 `EditorSidebar` Component (lines 1398-1514)
- Configuration prompt
- Screen palette & list
- Control palette & list  
- Image upload section
- Menu insets panel

#### 2.3 `EditorCanvas` Component (lines 1519-1667)
- Canvas toolbar
- Undo/redo buttons
- Grid controls
- Orientation manager
- Canvas rendering
- JSON preview

### Phase 3: Service Layer

#### 3.1 `services/imageService.ts`
- Handle local image storage (blob URLs, dataURLs)
- Image conversion utilities
- Clean blob URL lifecycle management
- Remove R2 cloud storage complexity

#### 3.2 `services/deviceDetection.ts`
- Device matching algorithms
- Content bounds analysis
- Device auto-selection logic

#### 3.3 `services/consoleDefaults.ts`
- Console-specific initialization
- Screen setup for different consoles
- Default control configurations

### Phase 4: Simplified Data Flow

1. **Single Source of Truth**: ProjectContext becomes the definitive state
2. **Remove Redundant Syncing**: Eliminate complex useEffects that sync state back and forth
3. **Cleaner Auto-Creation**: Simplify project initialization logic
4. **Predictable Loading**: Clear, linear project loading without complex conditions

## Expected Benefits

### Code Quality:
- **Reduced Complexity**: Editor.tsx from ~1860 lines to ~300-400 lines
- **Better Separation of Concerns**: Each hook/component has a single responsibility  
- **Improved Testability**: Smaller, focused units can be tested independently
- **Easier Debugging**: Clear data flow without complex synchronization
- **Simplified Image Handling**: Remove R2 complexity, use only local storage

### Developer Experience:
- **Faster Development**: Changes are isolated to specific areas
- **Reduced Bugs**: Fewer race conditions and state synchronization issues
- **Better Performance**: Fewer unnecessary re-renders
- **Clearer Intent**: Code structure matches mental model

### Maintainability:
- **Modular Architecture**: Easy to add/remove features
- **Reusable Hooks**: Logic can be shared across components
- **Service Layer**: Business logic separated from UI concerns
- **Clear Interfaces**: Well-defined boundaries between modules

## Implementation Plan

### Timeline: 
- **Phase 1**: 2-3 days (Custom hooks)
- **Phase 2**: 2-3 days (Component extraction) 
- **Phase 3**: 1-2 days (Services)
- **Phase 4**: 1 day (Final integration)
- **Total**: ~1 week

### Risk Mitigation:
- Incremental refactoring to maintain functionality
- TypeScript ensures interface compatibility
- Hot module reload for immediate feedback
- Can pause/rollback at any phase boundary

## Alternative Approaches Considered

### Option A: Keep Current Structure
**Pros**: No refactoring needed
**Cons**: Technical debt continues to accumulate, harder to maintain

### Option B: Complete Rewrite
**Pros**: Clean slate architecture
**Cons**: High risk, long timeline, potential for regression

### Option C: Proposed Gradual Refactoring ✅
**Pros**: Lower risk, incremental improvement, maintains functionality
**Cons**: Requires some initial investment

## Decision Required

Should we proceed with this refactoring approach? The current complexity is making it difficult to:
- Add new features reliably
- Debug issues effectively  
- Onboard new developers
- Maintain code quality

This refactoring would establish a solid foundation for future development while immediately improving code maintainability.