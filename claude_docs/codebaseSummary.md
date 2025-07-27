# Codebase Summary

## Project Structure Overview
This is a mobile-first web application for creating custom emulator skin files. The project is currently in the planning/setup phase.

## Key Components and Their Interactions

### Current Structure
```
emuskin-generator/
├── assets/              # Configuration data files
├── claude_docs/         # Project documentation
├── plan.md             # Detailed project plan
├── CLAUDE.md           # AI assistant instructions
└── README.md           # Project readme
```

### Planned Component Structure
- **Editor Components**
  - ControlMapper: Main visual editing interface
  - ImageUploader: Handles skin image uploads
  - JsonPreview: Toggle between visual and JSON view
  - Toolbar: Control selection and tools
  
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

### Planned Dependencies
- Frontend framework (TBD)
- JSZip for file generation
- Canvas/SVG library for rendering
- Touch gesture library

## Recent Significant Changes
- Initial project setup completed
- Documentation structure established
- Asset files configured
- GitHub repository connected
- CLAUDE.md updated with project-specific instructions

## User Feedback Integration
- No user feedback yet (pre-development phase)
- Future feedback will be tracked in this section

## Additional Documentation
- `plan.md`: Comprehensive development plan
- `CLAUDE.md`: Contains project-specific instructions and JSON structure details