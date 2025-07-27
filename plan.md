# Skin Generator App - Project Plan

## Overview
A web application that allows users to create custom skin files (.deltaskin/.gammaskin) by defining JSON metadata and uploading images. The final output is a .zip file with a custom extension containing the JSON configuration and associated image assets.

### Core Concept
- **Images**: Provide the visual appearance and look/feel of the skin
- **Button Data**: Define the control mapping and interaction zones (not visual appearance)
- **System Selection**: Users choose which console system the skin is designed for
- **Device Selection**: Users select target iPhone model to define skin dimensions
- **JSON Output**: Contains system identifier, device specs, button definitions, and metadata for the emulator to interpret

### Key Features (MVP)
- **WYSIWYG JSON Editor**: Visual editor that allows users to create button mappings without writing JSON directly
- **Mobile-First Design**: The application is designed primarily for mobile devices with responsive layouts
- **Button Control Mapping**: 
  - Define control zones and button mappings visually
  - Use predefined button templates (D-pad, action buttons, etc.)
  - Create custom control mappings with precise positioning
  - Define custom composite buttons (e.g., A+B simultaneous press)
  - Button data includes position, size, and control type (not visual styling)

## MVP Features

### 1. Core Functionality
- **System Selection**: Choose target console system
  - Dropdown with supported systems:
    - GameBoy (Color)
    - GameBoy Advance
    - Nintendo DS
    - Nintendo Entertainment System
    - Super Nintendo Entertainment System
    - Nintendo 64
    - Sega Genesis (Beta)
    - Sony PlayStation
  - Auto-loads appropriate control templates for selected system
  - Sets gameTypeIdentifier in JSON output

- **Device Selection**: Choose target iPhone model
  - Dropdown with iPhone models (16 Pro Max down to iPhone X)
  - Sets skin dimensions based on selected device:
    - Logical dimensions (points)
    - Physical dimensions (pixels)
    - PPI (pixels per inch)
  - Canvas adjusts to match device specifications
  - Ensures pixel-perfect control placement

- **WYSIWYG Control Mapper**: Visual interface to define button control zones
  - **Control Zone Definition**
    - Visual overlay on uploaded skin image
    - Drag-and-drop to position control zones
    - Resize handles for precise zone sizing
    - Transparent overlays showing hit areas
    - Grid snapping for alignment
  - **Button Data Configuration**
    - System-specific buttons loaded from available_buttons.json
    - Core controls (a, b, start, etc.) based on console
    - Emulator controls (quickSave, fastForward, menu)
    - Special controls (thumbstick for NDS/N64/Genesis)
    - D-Pad options: composite control or individual directional buttons
    - **Custom Button Creation**:
      - Define custom button with unique identifier
      - Assign multiple simultaneous actions (e.g., A+B, L+R+Start)
      - Set custom button label for display
      - Configure timing (simultaneous vs. sequence)
    - Hit area definition (rectangle, circle, custom shape)
    - Multi-touch support configuration
  - Toggle to raw JSON view for advanced users
  - Live JSON generation from visual input
  - JSON validation in background

- **Image Management**
  - Upload skin images sized for selected device
  - Support common formats (PNG, JPG, JPEG, GIF)
  - Auto-resize warning if image doesn't match device dimensions
  - Image preview with device frame overlay
  - Delete/replace uploaded images
  - Image naming/renaming capability

- **File Generation**
  - Package JSON + images into .zip
  - Rename .zip to .deltaskin or .gammaskin
  - Download generated file
  - Option to choose output extension (.deltaskin vs .gammaskin)

### 2. User Interface
- **Project Management**
  - New project creation
  - Save/load project to local storage
  - Export/import project files
  - Clear/reset current project

- **Editor Layout**
  - Mobile-first responsive design
  - Skin image with control overlay as main focus
  - Collapsible panels for control properties and image manager
  - Bottom toolbar for control tools
  - Touch-optimized controls and gestures
  - Zoom/pan for precise control placement

- **Validation & Feedback**
  - Real-time JSON validation
  - Error messages for invalid configurations
  - Success notifications
  - Progress indicators during file generation

### 3. Technical Requirements (MVP)
- **Frontend Only**
  - React/Vue/Angular for UI framework
  - Mobile-first CSS framework (e.g., Tailwind CSS)
  - Touch gesture library for mobile interactions
  - Canvas/SVG for control overlay rendering
  - File upload handling with drag-and-drop
  - ZIP file generation in browser (JSZip)
  
- **Data Storage**
  - LocalStorage for project persistence
  - IndexedDB for larger file storage
  - Browser-based state management
  
- **File Handling**
  - Client-side image processing
  - Client-side ZIP generation
  - JSON export/import
  - No server dependencies for MVP

## Phase 1: MVP Development (Weeks 1-4)

### Week 1: Setup & Basic Structure
- [ ] Initialize project with chosen framework
- [ ] Set up development environment
- [ ] Create basic UI layout with mobile-first approach
- [ ] Implement local storage setup
- [ ] Design responsive layout structure

### Week 2: Device Selection & Image Upload
- [ ] Implement device selection dropdown
- [ ] Load iPhone model specifications
- [ ] Build image upload interface
- [ ] Implement drag-and-drop functionality
- [ ] Create image preview with device frame
- [ ] Add dimension validation
- [ ] Set up canvas matching device specs

### Week 3: Control Mapping System
- [ ] Build control zone overlay system
- [ ] Implement drag-and-drop control placement
- [ ] Create control templates (D-pad, buttons, etc.)
- [ ] Add resize and position tools
- [ ] Implement control property editor
- [ ] Build custom button creator interface
- [ ] Add multi-action button support

### Week 4: JSON Generation & Export
- [ ] Implement JSON generation from visual data
- [ ] Create JSON preview/editor toggle
- [ ] Build ZIP file generation
- [ ] Add download with custom extensions
- [ ] Implement project save/load
- [ ] Testing and mobile optimization

## Phase 2: Enhanced Features (Post-MVP)

### Potential Enhancements
1. **User Accounts & Cloud Storage**
   - User registration and authentication
   - Cloud-based project storage
   - Project sharing and collaboration
   - Sync across devices

2. **Templates & Presets**
   - Pre-built control mapping templates
   - Community template sharing
   - Template marketplace

3. **Advanced Editor Features**
   - Custom control shapes (polygons)
   - Advanced multi-touch gestures
   - Analog stick dead zones
   - Haptic feedback configuration

4. **Import/Export**
   - Import existing .deltaskin/.gammaskin files
   - Export to different emulator formats
   - Batch processing
   - Version control

5. **Testing & Preview**
   - Live preview with touch simulation
   - Device-specific testing modes
   - Performance optimization suggestions

## Mobile-First UI/UX Considerations

### Touch Interactions
- **Control Zone Editor**
  - Pinch to zoom for precise positioning
  - Touch and drag to move control zones
  - Long press to access control properties
  - Double tap to quick-select control type
  
- **Gesture Support**
  - Swipe between editor panels
  - Two-finger pan to navigate large skins
  - Tap outside zone to deselect
  - Multi-select with two-finger tap

### Responsive Layouts
- **Phone (< 768px)**
  - Single column layout
  - Full-screen modals for editors
  - Bottom sheet for tool panels
  - Floating action button for primary actions
  
- **Tablet (768px - 1024px)**
  - Split view with collapsible panels
  - Side drawer for navigation
  - Larger touch targets (min 44px)
  
### Performance Optimization
- Lazy loading for project cards
- Image compression and caching
- Debounced auto-save
- Offline mode support with sync

## Control Mapping System Details

### Control Zone Properties
- **Position & Size**
  - X/Y coordinates (pixel-based)
  - Width/Height dimensions
  - Hit area shape (rectangle, circle, custom)
  - Z-index for overlapping controls
  
- **Control Types**
  - Button (single press) - for a, b, x, y, start, select, etc.
  - D-Pad (composite 4/8 directions OR individual directional buttons)
  - Thumbstick (analog input with dead zone) - NDS, N64, Genesis, PS1
  - Shoulder buttons (L, R, L2, R2, L3, R3, Z)
  - C-Buttons (N64 specific - cUp, cDown, cLeft, cRight)
  - Emulator controls (quickSave, quickLoad, fastForward, toggleFastForward, menu)
  - **Custom Composite Buttons**:
    - Multi-action buttons (e.g., A+B simultaneous)
    - Macro buttons (e.g., quick combo sequences)
    - User-defined with custom identifiers and labels
  
- **Mapping Data**
  - Control identifier (A, B, X, Y, L1, R1, etc.)
  - Input type (tap, hold, swipe)
  - Multi-touch support flag
  - Pressure sensitivity (if supported)

### Available Buttons (System-Specific)
Based on available_buttons.json, each system supports:

1. **GameBoy Color (gbc)**
   - Core: a, b, select, start
   - D-Pad: dpad (composite) OR up, down, left, right (individual)
   - Emulator: menu, quickSave, quickLoad, fastForward, toggleFastForward
   
2. **GameBoy Advance (gba)**
   - Core: a, b, l, r, select, start
   - D-Pad: dpad (composite) OR up, down, left, right (individual)
   - Emulator: quickSave, quickLoad, fastForward, toggleFastForward
   
3. **Nintendo DS (nds)**
   - Core: a, b, x, y, l, r, select, start
   - D-Pad: dpad (composite) OR up, down, left, right (individual)
   - Special: thumbstick
   - Emulator: quickSave, quickLoad, fastForward, toggleFastForward
   
4. **NES (nes)**
   - Core: a, b, select, start
   - D-Pad: dpad (composite) OR up, down, left, right (individual)
   - Emulator: quickSave, quickLoad, fastForward, toggleFastForward
   
5. **SNES (snes)**
   - Core: a, b, x, y, l, r, select, start
   - D-Pad: dpad (composite) OR up, down, left, right (individual)
   - Emulator: quickSave, quickLoad, fastForward, toggleFastForward
   
6. **Nintendo 64 (n64)**
   - Core: a, b, l, r, z, start
   - D-Pad: dpad (composite) OR up, down, left, right (individual)
   - C-Buttons: cUp, cDown, cLeft, cRight
   - Special: thumbstick
   - Emulator: quickSave, quickLoad, fastForward, toggleFastForward
   
7. **Sega Genesis (sg)**
   - Core: a, b, c, x, y, z, start, select, mode
   - D-Pad: up, down, left, right (individual only)
   - Special: thumbstick
   - Emulator: quickSave, quickLoad, fastForward, toggleFastForward
   
8. **PlayStation (ps1)**
   - Core: a, b, x, y, l, l2, l3, r, r2, r3, select, start
   - D-Pad: dpad (composite) OR up, down, left, right (individual)
   - Emulator: quickSave, quickLoad, fastForward, toggleFastForward

**Note**: D-Pad can be implemented as either a single composite control or individual directional buttons

### Custom Button Examples
- **Fighting Game Combos**: Single button for special moves (e.g., "Hadouken" = Down, Down-Forward, Forward + Punch)
- **Speed Run Tricks**: A+B simultaneous for specific glitches/techniques
- **Convenience Buttons**: L+R+Start+Select for soft reset
- **Accessibility**: Larger buttons that trigger commonly used combinations

## Technical Architecture

### Frontend Structure (MVP)
```
src/
├── components/
│   ├── Editor/
│   │   ├── ControlMapper/
│   │   │   ├── ControlCanvas/
│   │   │   ├── ControlProperties/
│   │   │   ├── ControlTemplates/
│   │   │   └── ButtonLibrary/
│   │   ├── ImageUploader/
│   │   ├── JsonPreview/
│   │   └── Toolbar/
│   ├── FileManager/
│   │   ├── ProjectSaver/
│   │   └── ExportGenerator/
│   └── Common/
│       ├── MobileNav/
│       └── TouchControls/
├── utils/
│   ├── controlMapping.js
│   ├── jsonGenerator.js
│   ├── validation.js
│   ├── fileHandling.js
│   ├── localStorage.js
│   ├── systemTemplates.js
│   ├── deviceSpecs.js
│   └── buttonConfig.js
├── styles/
│   └── mobile-first.css
└── App.js
```

### Data Flow (MVP)
1. User opens the web application
2. User selects target console system
3. User selects target iPhone model
4. System sets canvas dimensions based on device specs
5. User uploads skin image(s)
6. System validates image dimensions against selected device
7. System loads appropriate control templates for selected console
8. User visually defines control zones on the image
   - Drag to create control areas
   - Select from system-specific controls
   - Adjust size and position
9. System generates JSON with:
   - gameTypeIdentifier
   - Device dimensions (logical and physical)
   - Control mappings with pixel-perfect coordinates
10. User can toggle between visual and JSON view
11. User saves project locally (browser storage)
12. User triggers export
13. System creates ZIP with JSON + images
14. ZIP is renamed to .deltaskin/.gammaskin based on system
15. File is downloaded to user's device


## Success Metrics
- File generation success rate
- Average time to create a skin
- User retention (returning users)
- Number of skins created
- Error/validation failure rates

## Risks & Mitigation
- **Large file sizes**: Implement file size limits and compression
- **Browser compatibility**: Test across major browsers, provide fallbacks
- **Data loss**: Auto-save drafts, warning before clearing
- **Invalid files**: Strict validation, clear error messages

## Next Steps
1. Choose frontend framework
2. Set up project repository
3. Create UI mockups/wireframes
4. Define JSON schema structure
5. Begin Week 1 development tasks