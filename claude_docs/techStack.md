# Tech Stack

## Frontend Framework
- **Chosen**: React with TypeScript
- **Justification**: Component flexibility for complex UI, strong TypeScript support, extensive ecosystem for touch/gesture libraries

## Styling
- **CSS Framework**: Mobile-first framework (e.g., Tailwind CSS)
- **Justification**: Rapid responsive development, utility-first approach

## Core Technologies
- **Language**: TypeScript
- **Build Tool**: Vite (fast HMR, TypeScript support out of box)
- **Package Manager**: npm

## UI Libraries
- **Canvas/SVG**: React + Canvas API for control overlay rendering
- **Touch Gestures**: react-use-gesture for mobile interactions
- **Drag & Drop**: react-dnd with touch backend

## Data Management
- **State Management**: React Context API + useReducer (sufficient for MVP)
- **Storage**: LocalStorage for settings, IndexedDB for projects and images
- **File Handling**: JSZip for generating skin files

## Authentication
- **WordPress Integration**: Simple JWT Login plugin (free)
- **Auth Method**: JWT tokens with email/password login
- **Token Storage**: LocalStorage with JWT decoding for user data
- **API Format**: WordPress REST API with ?rest_route= parameter
- **User Database**: Local tracking of users and projects by email

## Cloud Storage
- **Image Storage**: Cloudflare R2 with Worker
- **Folder Structure**: [userEmail]/[projectId]/[orientation].png
- **Authentication**: User must be logged in to upload
- **Benefits**: Organized by user, automatic replacement, clean URLs

## Development Tools
- **Version Control**: Git with GitHub
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier
- **Development Server**: Vite dev server with HMR

## Architecture Decisions
- **Frontend-Only MVP**: No backend required initially
- **Client-Side Processing**: All JSON generation and file handling in browser
- **Component Structure**: Modular components for reusability
- **Mobile-First**: Touch-optimized interactions, responsive design

## Asset Management
- **Static Assets**: JSON configuration files in assets/ directory
- **Image Handling**: Canvas API for image processing
- **Icon Library**: To be decided based on design needs