# Codebase Summary

## Project Structure Overview
This is a mobile-first web application for creating custom emulator skin files. The project is now in active development with React + TypeScript + Vite.

## Key Components and Their Interactions

### Current Structure
```
emuskin-generator/
├── public/              
│   ├── assets/         # JSON configuration files
│   │   ├── templates/  # Pre-configured console templates
│   │   └── ...        # Other asset files
│   └── vite.svg
├── api/                # Vercel Functions (integrated API)
│   ├── health.js       # Health check endpoint
│   ├── projects/       # Project CRUD endpoints
│   └── lib/           # API utilities
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── Canvas.tsx           # Visual editing canvas with drag/resize for controls and screens
│   │   ├── AuthButton.tsx       # Login/logout button with WordPress integration
│   │   ├── ConsoleIcon.tsx      # Console system icon component
│   │   ├── ControlList.tsx      # Control list panel with delete confirmations
│   │   ├── ControlPalette.tsx   # Button selection palette
│   │   ├── ControlPropertiesPanel.tsx # Bottom-sliding properties editor for controls
│   │   ├── CustomButtonModal.tsx # Custom button creation dialog
│   │   ├── DatabaseDebugger.tsx # Debug component to visualize user database
│   │   ├── LoginModal.tsx       # Email/password login modal for JWT auth
│   │   ├── MigrationDialog.tsx  # Dialog for migrating local projects to cloud
│   │   ├── MenuInsetsPanel.tsx  # Menu insets configuration
│   │   ├── DeviceInfo.tsx       # Device metrics display
│   │   ├── ExportButton.tsx     # Export to .deltaskin/.gammaskin with validation
│   │   ├── GridControls.tsx     # Grid snapping controls
│   │   ├── ImageUploader.tsx    # Background image upload
│   │   ├── ImportButton.tsx     # Import existing .deltaskin/.gammaskin files
│   │   ├── JsonPreview.tsx      # JSON output display with screens support
│   │   ├── Layout.tsx           # Main app layout with ID system
│   │   ├── OrientationManager.tsx # Portrait/landscape orientation switcher
│   │   ├── ProjectManager.tsx   # Project save/load management
│   │   ├── ScreenList.tsx       # Screen list panel with clickable pills
│   │   ├── ScreenPalette.tsx    # Screen selection for game display
│   │   ├── ScreenPropertiesPanel.tsx # Bottom-sliding editor for screens
│   │   └── SkinEditPanel.tsx    # Slide-out panel for skin configuration
│   ├── pages/          # Page components
│   │   ├── Home.tsx    # Project cards view and landing page
│   │   ├── Editor.tsx  # Main editor interface
│   │   ├── Settings.tsx
│   │   ├── About.tsx
│   │   └── TestSkin.tsx # Fullscreen skin testing interface
│   ├── types/          # TypeScript definitions
│   │   └── index.ts    # Core type interfaces (includes ScreenMapping)
│   ├── hooks/          # Custom React hooks
│   │   └── useLocalStorage.tsx # LocalStorage with JSON parsing
│   ├── utils/          # Helper functions
│   │   ├── indexedDB.ts # IndexedDB manager for large file storage
│   │   ├── api.ts      # API utilities for WordPress authentication
│   │   ├── localStorageProjects.ts # localStorage utilities for non-authenticated users
│   │   └── userDatabase.ts # User database for tracking logins and projects
│   ├── contexts/       # React contexts
│   │   ├── AuthContext.tsx    # WordPress user authentication state
│   │   ├── EditorContext.tsx  # Editor settings (grid, etc) with persistence
│   │   ├── ProjectContextHybrid.tsx # Hybrid project management (API + localStorage)
│   │   ├── ProjectContextV3.tsx # API-only project management (deprecated)
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
- JSZip for file generation
- react-dnd for drag-and-drop
- @use-gesture/react for touch support

### API Dependencies
- Vercel Functions (integrated with frontend)
- MongoDB database (DigitalOcean managed instance)
- JWT token validation

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
- ✅ Menu insets panel with visual overlay and JSON export support
- ✅ Keyboard shortcuts implementation with centralized hook
  - Arrow keys for nudging (1px/10px with Shift)
  - Escape to deselect, Tab to cycle controls
  - Delete/Backspace for deletion (with tooltips)
- ✅ Toast notification system replacing alert() dialogs
  - Toast component with auto-dismiss and animations
  - ToastContext for global notification management
  - Four types: success, error, warning, info
  - Non-blocking, stackable notifications
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
- ✅ Fixed Nintendo DS screen management bug - screens cannot be deleted
- ✅ Fixed all TypeScript build errors - clean production build
- ✅ Verified thumbstick image persistence works correctly
- ✅ Added copy layout between orientations feature with confirmation
- ✅ Switched from OAuth to JWT authentication with Simple JWT Login
- ✅ Fixed WordPress REST API endpoint format (?rest_route=)
- ✅ Implemented JWT token decoding for user data extraction
- ✅ Created LoginModal component for email/password authentication
- ✅ Removed OAuth callback complexity in favor of direct login
- ✅ Implemented user authentication gate on Home page
- ✅ Projects are now tied to user accounts with userId and createdAt fields
- ✅ Non-authenticated users see login prompt with benefits
- ✅ Added user profile section showing project count
- ✅ AuthButton added to mobile menu for full mobile support
- ✅ Implemented lock feature for controls and screens preventing accidental movement
- ✅ Implemented undo/redo functionality with 50-state history and keyboard shortcuts
- ✅ Fixed JWT authentication 400 error by implementing local token validation
- ✅ Fixed lock button functionality - now properly prevents drag/drop with visual feedback
- ✅ Added screen clearing when console changes to prevent invalid configurations
- ✅ Fixed save functionality by replacing autosave with explicit saves on all actions
- ✅ Implemented user database for tracking logins and project ownership
- ✅ Home page now filters projects based on user database array (single source of truth)
- ✅ Added automatic migration for existing projects to user database on login
- ✅ Updated R2 storage structure to organize files by user email
- ✅ Simplified R2 paths: [email]/[project]/[orientation].png (no timestamps)
- ✅ Improved OrientationManager UI with full-width buttons, borders, and hover effects
- ✅ Added comprehensive IDs to all OrientationManager child elements for better testability
- ✅ Reorganized editor UI layout: reordered left column and moved orientation manager to canvas toolbar
- ✅ Updated control palette to use 4-column CSS Grid layout for better organization
- ✅ Enhanced OrientationManager visual design with portrait/landscape representations
- ✅ Replaced text pills with visual 9:16 and 16:9 aspect ratio icons
- ✅ Fixed DOM nesting error by restructuring orientation buttons
- ✅ Moved GridControls into canvas toolbar for better organization
- ✅ Deployed Cloudflare Worker with user-based R2 storage structure
- ✅ Added logout redirect to home page for better UX
- ✅ Fixed grid size dropdown text visibility in dark mode
- ✅ Implemented template selection feature on home page
  - Created 8 pre-configured console templates in /public/assets/templates/
  - Templates provide quick start for new projects with default control layouts
  - Integrated template loading into Editor component
- ✅ Reorganized Import/Export buttons to editor header
  - Moved from bottom canvas actions to header for better accessibility
  - Updated to icon-only format consistent with project manager buttons
  - Maintains dropdown functionality for export format selection
- ✅ Implemented custom SVG icons throughout UI
  - Added 9 custom SVG icons to assets/icons directory
  - Import/Export buttons use custom icons instead of inline SVGs
  - ScreenPropertiesPanel alignment buttons use icon set
  - All icons support dark mode with proper inversion
  - Icons copied to public/assets/icons for runtime access
- ✅ Fixed device selection auto-matching on skin load
  - Added findDeviceByDimensions helper function in Editor.tsx
  - Projects now auto-select correct device based on mappingSize from JSON preview
  - Toast notification shows when device is automatically changed
  - Prevents all skins from defaulting to iPhone 16 Pro Max
- ✅ Fixed template visibility for new users
  - Templates now show for all authenticated users regardless of project count
  - Restructured conditional rendering in Home.tsx
  - Template section moved outside userProjects.length === 0 condition
  - New users immediately see templates after signing in
  - Empty state message updated to reference templates above
- ✅ Implemented skin testing feature
  - Added TestSkin component for fullscreen interactive testing
  - Test button on all project cards navigates to /test/:projectId
  - Visual feedback on control press (opacity and scale changes)
  - Active button display shows pressed buttons on game screen
  - Multi-touch support for simultaneous button presses
  - Fullscreen mode, orientation switching, and exit controls
  - Uses existing Canvas rendering logic in read-only mode
- ✅ Fixed missing save button for template-based projects
  - Fixed race condition in handleTemplateSelect
  - Added await loadProject() after createProject()
  - Ensures currentProject is set before navigation
- ✅ Fixed controls disappearing after saving templates
  - Added missing menuInsetsLeft and menuInsetsRight to save data
  - Fixed missing dependency in template loading effect
- ✅ Fixed TestSkin component crashes
  - Updated to use screen.outputFrame instead of screen.frame
  - Added safety checks for screen data
  - Moved button display inside game screen area
- ✅ Backend API ready for deployment
  - Created Express.js API with MongoDB integration
  - JWT authentication from WordPress tokens
  - Full CRUD endpoints for project synchronization
  - Deployment configuration for Vercel serverless
- ✅ Fixed Vercel deployment configuration errors
  - Resolved "builds and functions cannot be used together" error
  - Created api/serverless.js entry point for Vercel
  - Added .vercelignore to exclude development files
  - Configured for API-only deployment without frontend build
- ✅ Fixed undefined project ID errors
  - Normalized project objects to ensure both 'id' and '_id' fields exist
  - Added defensive checks in saveProject to handle missing IDs
  - Fixed createProject to return normalized ID
  - Projects now properly save and load without ID errors
- ✅ Consolidated API deployment
  - Removed redundant separate API deployment code
  - Deleted old ProjectContextV2.tsx with external API logic
  - Removed VITE_API_URL environment variable throughout codebase
  - Updated all documentation to reflect integrated Vercel Functions
  - API now runs at `/api/*` paths as part of single deployment
- ✅ Implemented localStorage support for non-authenticated users
  - Created ProjectContextHybrid with automatic storage switching
  - Added comprehensive localStorage utilities
  - Non-authenticated users can create and save projects locally
  - Visual indicators show storage type (Local/Cloud)
  - Migration dialog helps users move local projects to cloud when signing in
- ✅ Fixed excessive auto-saving issues
  - Removed all automatic saves from drag/resize operations
  - Removed saves from control/screen addition, menu insets, image operations
  - Removed saves from template loading and orientation copying
  - Only manual save button or Cmd/Ctrl+S triggers saves
  - Dramatically improved performance by eliminating constant save operations
  - Users have complete control over when their work is persisted

## API Structure (Vercel Functions)
```
api/
├── health.js           # Health check endpoint
├── projects/
│   ├── index.js       # Projects CRUD endpoints
│   └── [id].js        # Single project operations
└── lib/
    ├── auth.js        # JWT authentication
    ├── mongodb.js     # Database connection
    └── models/
        └── Project.js # MongoDB schema
```

The API is built using Vercel Functions (serverless) integrated directly with the frontend deployment. API endpoints are available at `/api/*` paths and require MongoDB to be configured via environment variables.

## User Feedback Integration
- No user feedback yet (pre-development phase)
- Future feedback will be tracked in this section

## Debugging Tools
- DatabaseDebugger: Comprehensive debugging interface for all data sources
  - Tabbed interface: Overview, User Database, LocalStorage views
  - Shows MongoDB status, userDatabase structure, localStorage projects
  - Complete reset functionality for both MongoDB and localStorage
  - Clear project references without deleting actual projects
  - Displays user login counts, project counts, and all emuskin localStorage keys
  - Temporary reset API endpoint at /api/reset.js (should be deleted after use)

## Additional Documentation
- `plan.md`: Comprehensive development plan
- `CLAUDE.md`: Contains project-specific instructions and JSON structure details