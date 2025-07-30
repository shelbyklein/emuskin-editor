# Codebase Summary

## Project Structure Overview
This is a mobile-first web application for creating custom emulator skin files. The project is now in active development with React + TypeScript + Vite.

## Key Components and Their Interactions

### Current Structure
```
emuskin-generator/
├── public/              
│   ├── assets/         # JSON configuration files
│   └── vite.svg
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── Canvas.tsx           # Visual editing canvas with drag/resize for controls and screens
│   │   ├── ConsoleIcon.tsx      # Console system icon component
│   │   ├── ControlList.tsx      # Control list panel with delete confirmations
│   │   ├── ControlPalette.tsx   # Button selection palette
│   │   ├── ControlPropertiesPanel.tsx # Bottom-sliding properties editor for controls
│   │   ├── CustomButtonModal.tsx # Custom button creation dialog
│   │   ├── MenuInsetsPanel.tsx  # Menu insets configuration
│   │   ├── DeviceInfo.tsx       # Device metrics display
│   │   ├── ExportButton.tsx     # Export to .deltaskin/.gammaskin with validation
│   │   ├── GridControls.tsx     # Grid snapping controls
│   │   ├── ImageUploader.tsx    # Background image upload
│   │   ├── ImportButton.tsx     # Import existing .deltaskin/.gammaskin files
│   │   ├── JsonPreview.tsx      # JSON output display with screens support
│   │   ├── Layout.tsx           # Main app layout with ID system
│   │   ├── ProjectManager.tsx   # Project save/load management
│   │   ├── ScreenList.tsx       # Screen list panel with clickable pills
│   │   ├── ScreenPalette.tsx    # Screen selection for game display
│   │   ├── ScreenPropertiesPanel.tsx # Bottom-sliding editor for screens
│   │   └── SkinEditPanel.tsx    # Slide-out panel for skin configuration
│   ├── pages/          # Page components
│   │   ├── Home.tsx    # Project cards view and landing page
│   │   ├── Editor.tsx  # Main editor interface
│   │   ├── Settings.tsx
│   │   └── About.tsx
│   ├── types/          # TypeScript definitions
│   │   └── index.ts    # Core type interfaces (includes ScreenMapping)
│   ├── hooks/          # Custom React hooks
│   │   └── useLocalStorage.tsx # LocalStorage with JSON parsing
│   ├── utils/          # Helper functions
│   │   └── indexedDB.ts # IndexedDB manager for large file storage
│   ├── contexts/       # React contexts
│   │   ├── EditorContext.tsx  # Editor settings (grid, etc) with persistence
│   │   ├── ProjectContext.tsx # Project management state with screens
│   │   └── ThemeContext.tsx   # Dark/light theme state
│   ├── App.tsx         # Main app with routing
│   ├── main.tsx        # Entry point
│   └── index.css       # Tailwind CSS directives
├── assets/              # Original configuration files
├── claude_docs/         # Project documentation
├── plan.md             # Detailed project plan
├── CLAUDE.md           # AI assistant instructions
├── README.md           # Project readme
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # Tailwind configuration
├── postcss.config.js   # PostCSS configuration
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript configuration
```

### Implemented Component Structure
- **Editor Components**
  - Canvas: 1:1 pixel perfect editing surface with drag-and-drop and resize
  - ControlPropertiesPanel: Bottom-sliding panel for control editing
  - ControlPalette: Dynamic button palette with custom button support
  - CustomButtonModal: Modal for creating custom multi-button controls
  - GridControls: Toggle and adjust grid snapping settings
  - ImageUploader: Drag-and-drop image upload with validation
  - JsonPreview: Collapsible JSON output with copy functionality
  - DeviceInfo: Display device dimensions and pixel perfect status
  
- **File Management**
  - ProjectManager: Project save/load with localStorage
  - ExportButton: Generate and download .deltaskin files
  
- **Layout Components**
  - Layout: Main app structure with responsive navigation
  - Two-column desktop layout (controls left, canvas right)
  - Comprehensive ID system for all UI elements

## Data Flow

### Input Flow
1. User selects console system → Loads available buttons
2. User selects iPhone model → Sets canvas dimensions
3. User uploads image → Validates against device dimensions
4. User places controls → Updates internal state

### Output Flow
1. Control placement → JSON generation
2. JSON + Images → ZIP packaging
3. ZIP → Renamed to .deltaskin/.gammaskin
4. Final file → Download to user device

## External Dependencies

### Configuration Files
- `gameTypeIdentifiers.json`: Console system definitions
- `iphone-sizes.json`: Device specifications
- `available_buttons.json`: System-specific button mappings
- `console-aspect-ratios.json`: Display ratios
- `console-screens.json`: Screen specifications for each console
- `default_config.json`: JSON template structure

### Installed Dependencies
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- JSZip for file generation (installed)
- react-dnd for drag-and-drop (installed)
- @use-gesture/react for touch support (installed)

## Recent Significant Changes
- Initial project setup completed
- Documentation structure established
- Asset files configured
- GitHub repository connected
- CLAUDE.md updated with project-specific instructions
- Technology stack finalized: React + TypeScript + Vite
- Detailed 6-week development plan created
- All claude_docs updated to current state
- ✅ React project initialized with Vite and TypeScript
- ✅ Core dependencies installed (Tailwind CSS, React Router, JSZip, react-dnd, use-gesture)
- ✅ Project folder structure created
- ✅ Basic routing implemented with React Router
- ✅ Layout component with mobile navigation created
- ✅ Editor page with console/device selection implemented
- ✅ Type definitions for core data structures added
- ✅ JSON assets moved to public folder for runtime access
- ✅ Canvas component renders with device-specific dimensions
- ✅ ImageUploader supports drag-and-drop with file validation
- ✅ ControlPalette dynamically loads system-specific buttons
- ✅ Basic control visualization on canvas implemented
- ✅ Controls can be added to canvas from palette
- ✅ Control selection functionality working
- ✅ Canvas renders controls with proper scaling and labels
- ✅ Debug logging added for data verification
- ✅ Improved type safety in components
- ✅ AppContext created for global state management (console/device selection)
- ✅ CanvasContext implemented for canvas-specific state (controls, image)
- ✅ All components updated to use context-based state
- ✅ State management centralized for better data flow
- ✅ Canvas rewritten with HTML elements for interactive controls
- ✅ Drag-and-drop repositioning implemented with boundary constraints
- ✅ 8-point resize handles added with minimum size constraints
- ✅ Control deletion via Delete key and X button
- ✅ JSON preview panel shows live configuration updates
- ✅ Visual feedback for selected/hovered controls
- ✅ Canvas displays 1:1 pixel representation of device screen
- ✅ Removed all scaling logic for true pixel-perfect editing
- ✅ Canvas container adapts to device dimensions automatically
- ✅ Added DeviceInfo component for device metrics display
- ✅ Improved drag/resize calculations for 1:1 display
- ✅ Grid snapping system with visual grid overlay
- ✅ GridControls component for toggling grid display and adjusting size
- ✅ Custom button creator modal for multi-button combinations
- ✅ Control properties panel with position/size/extended edges editing
- ✅ Implemented EditorContext for managing grid settings
- ✅ ProjectContext for project save/load functionality
- ✅ ThemeContext for dark/light mode support
- ✅ Added comprehensive IDs to all UI elements for debugging
- ✅ Restructured to two-column desktop layout
- ✅ Properties panel converted to fixed bottom-sliding panel
- ✅ ExportButton generates proper .deltaskin/.gammaskin files with validation
- ✅ ProjectManager handles multiple projects with localStorage
- ✅ IndexedDB integration for large image storage
- ✅ Fixed control properties apply button functionality
- ✅ Prevented properties panel from opening after drag
- ✅ Made grid more subtle in dark mode
- ✅ Extended edges always visible on canvas
- ✅ localStorage persistence for editor settings
- ✅ Fixed dragging performance when grid snapping disabled
- ✅ Complete screen support system implemented
- ✅ ScreenPalette and ScreenPropertiesPanel components
- ✅ Automatic dual-screen setup for Nintendo DS
- ✅ Screens included in JSON export with validation
- ✅ Green theme for screens vs blue for controls
- ✅ Fixed resizing lag with requestAnimationFrame throttling
- ✅ Added settings cog icons to controls and screens
- ✅ Implemented aspect ratio maintenance for screen resizing
- ✅ Created screen alignment panel with positioning buttons
- ✅ Fixed stale closure issues using refs in Canvas
- ✅ Made settings cog only visible on hover
- ✅ Updated assets format to use object with "medium" key
- ✅ Added "control" class to all control elements for better CSS targeting
- ✅ Fixed "0" appearing in controls by using ternary operator with null
- ✅ Widened grid size dropdown to accommodate caret with pr-8
- ✅ Fixed console selection by converting from datalist to select dropdown
- ✅ Created Home page with project cards view
- ✅ Implemented import functionality for existing skin files
- ✅ Completed custom button creator with multi-action support
- ✅ Added menu insets panel with visual overlay
- ✅ Implemented comprehensive thumbstick support with custom images
- ✅ Fixed control click behavior to open properties panel
- ✅ Fixed property panel trigger - now only opens on settings button click
- ✅ Fixed missing indexedDBManager import error in Editor component
- ✅ Implemented full touch support for mobile devices and tablets
- ✅ Reorganized UI to display skin title in header with console icon
- ✅ Created SkinEditPanel component for skin configuration
- ✅ Added ConsoleIcon component using actual console image assets
- ✅ Created ControlList component for visual control management
- ✅ Created ScreenList component for clickable screen pills
- ✅ Updated Canvas to support external screen selection
- ✅ Implemented landscape orientation support with separate data storage
- ✅ Added orientation toggle button with real-time switching
- ✅ Updated ProjectContext to support orientation-specific data
- ✅ Modified Canvas to swap dimensions based on orientation
- ✅ Updated JSON export to include both portrait and landscape data
- ✅ Enhanced import to handle legacy single-orientation files
- ✅ Fixed uploaded images disappearing after upload issue
- ✅ Changed "Change Image" to "Remove Image" button
- ✅ Implemented lock feature for controls and screens preventing movement
- 🐛 Identified Nintendo DS screen management bug (BUG-001)
- 🐛 TypeScript build errors need fixing

## User Feedback Integration
- No user feedback yet (pre-development phase)
- Future feedback will be tracked in this section

## Additional Documentation
- `plan.md`: Comprehensive development plan
- `CLAUDE.md`: Contains project-specific instructions and JSON structure details