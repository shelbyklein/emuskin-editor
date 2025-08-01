# Next Steps

## Immediate Priorities (Next Session)

### 0. Deploy Updated Cloudflare Worker (URGENT)
- **Purpose**: Fix R2 storage to use new user-based folder structure
- **Issue**: Worker is still using old path structure (projects/[id]/background/[orientation]/)
- **Solution**: Deploy the already-updated code that uses [email]/[project]/[orientation].png
- **Implementation**:
  - cd cloudflare-worker
  - wrangler deploy
  - Verify new uploads use correct path structure

### 1. Keyboard Shortcuts for Common Actions
- **Purpose**: Improve productivity and accessibility
- **Implementation**:
  - Delete/Backspace: Delete selected control/screen
  - Arrow keys: Nudge selected item by 1px (10px with Shift)
  - Cmd/Ctrl+E: Export skin
  - Escape: Deselect current item
  - Cmd/Ctrl+D: Duplicate selected control
  - Tab/Shift+Tab: Cycle through controls

### 2. Toast Notifications
- **Purpose**: Better UX than alert() dialogs
- **Implementation**:
  - Create Toast component with auto-dismiss
  - Replace all alert() calls with toasts
  - Different styles for success/error/info
  - Stack multiple toasts if needed
  - Non-blocking user experience

### 3. Control Alignment Tools
- **Purpose**: Precise control positioning
- **Implementation**:
  - Align selected controls (left, right, center, top, bottom)
  - Distribute controls evenly
  - Match sizes between controls
  - Visual alignment guides when dragging
  - Multi-select with Shift+click

### 4. Performance Optimizations
- **Purpose**: Better performance with many controls
- **Implementation**:
  - Consider migrating all project data to IndexedDB
  - Optimize Canvas rendering for large numbers of controls
  - Add loading states for async operations
  - Implement virtualization for control lists

### 5. Backend API Development
- **Purpose**: Enable cloud sync and multi-device access
- **Implementation**:
  - Set up Node.js/Express backend with JWT validation
  - Migrate user database structure to backend
  - Create database schema for users, projects, and images
  - Implement project CRUD endpoints with user ownership
  - Add image upload/storage endpoints (R2 already configured)
  - Deploy to cloud platform (Heroku, AWS, etc.)
  - Update ProjectContext to sync with API when authenticated
  - Maintain local database as offline cache

## Completed Features (Recent)

### ✅ Lock Button Functionality Fix [COMPLETED]
- **Implemented**:
  - Fixed controls checking wrong variable (isLocked vs control.locked)
  - Added proper event handler prevention for locked elements
  - Visual feedback: purple for locked controls, gray for locked screens
  - Resize handles properly hide when locked
  - Cursor shows 'default' instead of 'move' for locked elements
- **Status**: Lock feature now fully functional

### ✅ Console Change Screen Clearing [COMPLETED]
- **Implemented**:
  - Screens automatically clear when switching consoles
  - Nintendo DS automatically creates required dual screens
  - Prevents incompatible screen configurations
  - Added to history for undo/redo support
- **Status**: Console switching now properly manages screens

### ✅ Save Functionality Fix [COMPLETED]
- **Implemented**:
  - Removed constantly-running autosave causing performance issues
  - Added explicit saves after all user actions
  - Fixed autosave cleanup dependencies
  - Comprehensive debug logging for save operations
  - All changes save immediately without timers
- **Status**: Save functionality now reliable and performant

### ✅ JWT Authentication Fix [COMPLETED]
- **Implemented**:
  - Fixed 400 error on reload by removing broken validate endpoint
  - Local JWT validation by decoding token client-side
  - Proper token expiration checking
  - Better error handling and auth state cleanup
- **Status**: Authentication now persists correctly

### ✅ Undo/Redo Functionality [COMPLETED] 
- **Implemented**:
  - 50-state history stack with automatic cleanup
  - Visual buttons in canvas toolbar
  - Keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
  - Tracks all control/screen modifications
  - Memory-efficient debounced implementation
- **Status**: Fully functional

### ✅ WordPress JWT Authentication [COMPLETED]
- **Implemented**:
  - Switched from OAuth to JWT for simplicity
  - LoginModal with email/password authentication
  - JWT token decoding for user data
  - Fixed WordPress REST API endpoint format (?rest_route=)
  - Works with Simple JWT Login plugin
- **Status**: Fully functional with playcase.gg credentials

### ✅ User Database Implementation [COMPLETED]
- **Implemented**:
  - Created userDatabase utility tracking users by email
  - Structure: email -> { loginCount, firstLogin, lastLogin, projects: [...] }
  - AuthContext records logins and migrates existing projects
  - ProjectContext adds/removes projects from database
  - Home page filters projects based on database array
  - DatabaseDebugger component for visualization
  - Automatic migration for existing projects on login
- **Status**: User database serves as single source of truth for project ownership

### ✅ R2 Storage Organization by User [COMPLETED]
- **Implemented**:
  - Updated folder structure: [userEmail]/[projectId]/[orientation].png
  - Thumbstick images: [userEmail]/[projectId]/thumbstick-[controlId].png
  - Removed timestamps for cleaner URLs and automatic replacement
  - Modified Cloudflare worker to accept and use user email
  - Updated r2Client and Editor to pass user email with uploads
  - Added authentication check before allowing uploads
- **Status**: All user images now organized under their email address

### ✅ Touch Support [COMPLETED]
- **Implemented**:
  - Full touch event handling for mobile devices
  - Works on iPads and touch screens
  - Drag and resize with touch gestures
- **Status**: Fully touch-enabled

## Secondary Priorities

### Project Templates
- Pre-made layouts for common configurations
- Save current layout as template
- Template marketplace/sharing

### Batch Operations
- Multi-select controls with Shift+click
- Group move/resize operations
- Bulk property editing

### Advanced Export Options
- Preview skin in mock emulator
- Export statistics and validation report
- Batch export for multiple devices

### Accessibility Improvements
- Full keyboard navigation
- Screen reader support
- High contrast mode
- Focus management

## Long-Term Vision

### Cloud Features
- Project sharing and collaboration
- Version history
- Team workspaces
- Public skin gallery

### Platform Expansion
- Native desktop app (Electron)
- iPad-specific features
- CLI tools for automation
- Plugin system for extensions

### Advanced Editing
- Layers system
- Masking and clipping
- Animation keyframes
- Conditional logic

## Recommended Next Session Plan

1. **Keyboard Shortcuts** - Quick win for productivity
2. **Toast Notifications** - Better UX improvement
3. **Control Alignment Tools** - Precision editing
4. **Performance Optimizations** - Prepare for scale
5. **Backend API** - Enable cloud features

Focus on keyboard shortcuts first as they're the most requested feature and relatively quick to implement, then move to UX improvements with toasts.