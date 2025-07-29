# Next Steps

## Immediate Priorities (Next Session)

### 1. Polish Header UI
- **Purpose**: Complete the header reorganization
- **Implementation**:
  - Add hover effects to edit button
  - Consider adding skin identifier subtitle below name
  - Add visual feedback when edit panel is open
  - Ensure responsive behavior on mobile devices

### 2. Landscape Orientation Support
- **Purpose**: Enable skin creation for landscape mode
- **Implementation**:
  - Add orientation selector in device panel or edit panel
  - Swap width/height when landscape selected
  - Update canvas dimensions appropriately
  - Ensure controls/screens adapt to rotated view
  - Update export to include orientation in JSON

### 3. Undo/Redo Functionality
- **Purpose**: Allow users to undo mistakes and redo actions
- **Implementation**:
  - Create history stack for all actions
  - Track control/screen changes
  - Add keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
  - Visual undo/redo buttons in toolbar
  - Limit history to reasonable number of states

### 4. Keyboard Shortcuts
- **Purpose**: Improve productivity for power users
- **Implementation**:
  - Delete key for removing selected items
  - Arrow keys for fine positioning
  - Cmd/Ctrl+C/V for copy/paste
  - Cmd/Ctrl+S for quick save
  - Escape to deselect

## Completed Features (Reference)

### 1. ✅ Import Functionality for Existing Skins [COMPLETED]
- **Purpose**: Allow users to load and edit existing .deltaskin/.gammaskin files
- **Implementation**:
  - ✅ Added ImportButton component to Editor and Home pages
  - ✅ Uses JSZip to parse uploaded skin files
  - ✅ Extracts info.json and parses controls/screens
  - ✅ Loads background images from ZIP
  - ✅ Handles format differences (standard/edgeToEdge representations)
  - ✅ Validates imported data before loading
  - ✅ Auto-detects device model from mappingSize
  - ✅ Maps console identifiers to internal shortnames
- **Completed**: Import button now available on both Home and Editor pages

### 2. ✅ Complete Custom Button Creator [COMPLETED]
- **Current State**: Fully functional custom button creator
- **Implemented**:
  - ✅ Custom buttons created with unique IDs and labels
  - ✅ Multi-input arrays supported (e.g., ["a", "b"] for A+B)
  - ✅ Custom labels display in Canvas
  - ✅ Labels editable in ControlPropertiesPanel
  - ✅ Buttons persist with projects and export correctly
- **Completed**: Custom buttons now fully operational

### 3. ✅ Menu Insets Panel [COMPLETED]
- **Purpose**: Allow configuration of system UI safe areas
- **Implemented**:
  - ✅ Created MenuInsetsPanel component with toggle and slider
  - ✅ Bottom value configurable from 0-100%
  - ✅ Visual overlay on canvas showing inset area
  - ✅ JSON structure includes menuInsets after extendedEdges
  - ✅ Real-time preview updates
- **Completed**: Menu insets fully operational for iPhone home indicator

### 4. ✅ Thumbstick Support [COMPLETED]
- **Purpose**: Support custom thumbstick images for N64, NDS, and SG
- **Implemented**:
  - ✅ Added thumbstick property to ControlMapping type
  - ✅ Image upload in ControlPropertiesPanel
  - ✅ Width/height dimension controls
  - ✅ Canvas renders thumbstick images centered
  - ✅ JSON includes thumbstick data before inputs
  - ✅ Thumbstick images included in exports
  - ✅ Proper input mapping to analogStick directions
- **Completed**: Full thumbstick support with custom images

### 5. ✅ Touch Support for Mobile Devices [COMPLETED]
- **Purpose**: Enable skin editing on iPads and other touch devices
- **Implementation**:
  - ✅ Added touch event handlers (touchstart, touchmove, touchend)
  - ✅ Parallel implementation to mouse events
  - ✅ Fixed passive event listener errors with CSS approach
  - ✅ Added touch-interactive CSS class for proper touch handling
  - ✅ Full drag and resize support on touch devices
  - ✅ Maintains all existing mouse functionality
- **Completed**: Full touch support for all canvas interactions

### 6. Landscape Orientation Support
- **Purpose**: Many skins need both portrait and landscape layouts
- **Implementation**:
  - Add orientation toggle in Editor
  - Duplicate controls/screens for landscape
  - Update Canvas to handle orientation switching
  - Modify export to include both orientations in JSON
  - Consider auto-rotate functionality
- **Time Estimate**: 3-4 hours

## Secondary Priorities

### 4. Keyboard Shortcuts
- Cmd/Ctrl+S: Save current project
- Cmd/Ctrl+E: Export skin
- Cmd/Ctrl+Z: Undo (requires history implementation)
- Cmd/Ctrl+Shift+Z: Redo
- Arrow keys: Nudge selected item by 1px (10px with Shift)
- Escape: Deselect current item

### 5. Control Alignment Tools
- Align selected controls (left, right, center, top, bottom, middle)
- Distribute controls evenly (horizontal/vertical spacing)
- Match sizes (width, height, both)
- Visual guides when dragging near other controls

### 6. Improved Visual Feedback
- Loading states for async operations
- Success/error toasts instead of alerts
- Progress indicator for export process
- Hover states for all interactive elements

## Nice-to-Have Features

### 7. Template System
- Pre-made layouts for common configurations
- Save current layout as reusable template
- Share templates between projects

### 8. Advanced Grid Options
- Different grid sizes for X and Y axes
- Grid offset controls
- Hex grid option for certain button layouts

### 9. Batch Operations
- Select multiple controls (with Shift+click or drag selection)
- Move/resize multiple controls together
- Copy/paste controls between projects

### 10. Export Previews
- Show how the skin will look in the emulator
- Simulate button presses
- Preview both orientations side-by-side

## Technical Improvements

### 11. Performance Optimizations
- Virtualize control/screen lists for large numbers of items
- Debounce project saves more intelligently
- Lazy load large images
- Use Web Workers for ZIP generation

### 12. Testing Infrastructure
- Unit tests for utility functions
- Integration tests for critical workflows
- E2E tests for export functionality
- Visual regression tests for Canvas

### 13. Accessibility
- Keyboard navigation for all features
- Screen reader support
- High contrast mode
- Focus indicators

## Long-Term Vision

### 14. Cloud Features
- User accounts with cloud storage
- Share skins publicly
- Browse community creations
- Version control for skins

### 15. Advanced Editing
- Layers system for complex layouts
- Control grouping
- Advanced animation support
- Conditional visibility based on orientation

### 16. Platform Expansion
- iPad skin support
- Export to other emulator formats
- Native app versions
- CLI tool for batch processing

## Recommended Next Session Plan

1. **Add Thumbstick Image Storage to IndexedDB** - Store thumbstick images alongside background images for project persistence
2. **Add Landscape Orientation Support** - Essential for many games that require landscape layouts
3. **Add Basic Keyboard Shortcuts** - Improves workflow significantly with minimal effort
4. **Implement Success/Error Toasts** - Better UX than current alert() calls
5. **Add Undo/Redo Functionality** - Critical for a visual editor
6. **Control Alignment Tools** - Help users create precise layouts

These priorities focus on completing the thumbstick feature and adding essential editor functionality.