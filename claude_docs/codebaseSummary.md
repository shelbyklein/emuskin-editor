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
│   │   ├── Canvas.tsx      # Visual editing canvas
│   │   ├── ControlPalette.tsx  # Button selection palette
│   │   ├── ImageUploader.tsx   # Background image upload
│   │   ├── JsonPreview.tsx      # JSON output display
│   │   ├── DeviceInfo.tsx       # Device metrics display
│   │   └── Layout.tsx          # Main app layout
│   ├── pages/          # Page components
│   │   ├── Editor.tsx  # Main editor interface
│   │   ├── Settings.tsx
│   │   └── About.tsx
│   ├── types/          # TypeScript definitions
│   │   └── index.ts    # Core type interfaces
│   ├── hooks/          # Custom React hooks (empty)
│   ├── utils/          # Helper functions (empty)
│   ├── contexts/       # React contexts
│   │   ├── AppContext.tsx    # Global app state
│   │   └── CanvasContext.tsx # Canvas-specific state
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
  - ImageUploader: Drag-and-drop image upload with validation
  - ControlPalette: Dynamic button palette based on console selection
  - JsonPreview: Collapsible JSON output with copy functionality
  - DeviceInfo: Display device dimensions and pixel perfect status
  - Layout: Main app structure with responsive navigation
  
- **File Management**
  - ProjectSaver: Local storage management
  - ExportGenerator: ZIP file creation
  
- **Common Components**
  - MobileNav: Mobile navigation
  - TouchControls: Touch gesture handlers

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

## User Feedback Integration
- No user feedback yet (pre-development phase)
- Future feedback will be tracked in this section

## Additional Documentation
- `plan.md`: Comprehensive development plan
- `CLAUDE.md`: Contains project-specific instructions and JSON structure details