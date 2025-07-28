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
│   │   ├── Canvas.tsx           # Visual editing canvas with drag/resize
│   │   ├── ControlPalette.tsx   # Button selection palette
│   │   ├── ControlPropertiesPanel.tsx # Bottom-sliding properties editor
│   │   ├── CustomButtonModal.tsx # Custom button creation dialog
│   │   ├── DeviceInfo.tsx       # Device metrics display
│   │   ├── ExportButton.tsx     # Export to .deltaskin functionality
│   │   ├── GridControls.tsx     # Grid snapping controls
│   │   ├── ImageUploader.tsx    # Background image upload
│   │   ├── JsonPreview.tsx      # JSON output display
│   │   ├── Layout.tsx           # Main app layout
│   │   └── ProjectManager.tsx   # Project save/load management
│   ├── pages/          # Page components
│   │   ├── Editor.tsx  # Main editor interface
│   │   ├── Settings.tsx
│   │   └── About.tsx
│   ├── types/          # TypeScript definitions
│   │   └── index.ts    # Core type interfaces
│   ├── hooks/          # Custom React hooks (empty)
│   ├── utils/          # Helper functions (empty)
│   ├── contexts/       # React contexts
│   │   ├── EditorContext.tsx  # Editor settings (grid, etc)
│   │   ├── ProjectContext.tsx # Project management state
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
- ✅ ExportButton generates proper .deltaskin files
- ✅ ProjectManager handles multiple projects with localStorage

## User Feedback Integration
- No user feedback yet (pre-development phase)
- Future feedback will be tracked in this section

## Additional Documentation
- `plan.md`: Comprehensive development plan
- `CLAUDE.md`: Contains project-specific instructions and JSON structure details