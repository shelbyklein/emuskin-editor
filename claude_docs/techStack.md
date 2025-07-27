# Tech Stack

## Frontend Framework
- **To be decided**: React, Vue, or Angular
- **Justification**: Need modern component-based architecture for complex UI interactions

## Styling
- **CSS Framework**: Mobile-first framework (e.g., Tailwind CSS)
- **Justification**: Rapid responsive development, utility-first approach

## Core Technologies
- **Language**: JavaScript/TypeScript
- **Build Tool**: Vite or Create React App (depending on framework choice)
- **Package Manager**: npm or yarn

## UI Libraries
- **Canvas/SVG**: For control overlay rendering
- **Touch Gestures**: Library for mobile interactions (e.g., Hammer.js)
- **Drag & Drop**: Native HTML5 or react-dnd/vue-draggable

## Data Management
- **State Management**: Context API/Redux (React), Vuex (Vue), or NgRx (Angular)
- **Storage**: LocalStorage for settings, IndexedDB for projects and images
- **File Handling**: JSZip for generating skin files

## Development Tools
- **Version Control**: Git with GitHub
- **Testing**: Jest + Testing Library (framework-specific)
- **Linting**: ESLint + Prettier
- **Development Server**: Hot module replacement

## Architecture Decisions
- **Frontend-Only MVP**: No backend required initially
- **Client-Side Processing**: All JSON generation and file handling in browser
- **Component Structure**: Modular components for reusability
- **Mobile-First**: Touch-optimized interactions, responsive design

## Asset Management
- **Static Assets**: JSON configuration files in assets/ directory
- **Image Handling**: Canvas API for image processing
- **Icon Library**: To be decided based on design needs