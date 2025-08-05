# Tech Stack

## Frontend Framework
- **Chosen**: React with TypeScript
- **Justification**: Component flexibility for complex UI, strong TypeScript support, extensive ecosystem for touch/gesture libraries

## Backend API
- **Framework**: Vercel Functions (integrated with frontend)
- **Database**: MongoDB (DigitalOcean managed instance)
- **Hosting**: Same Vercel deployment as frontend
- **Endpoints**: Available at `/api/*` paths

## Styling
- **CSS Framework**: Tailwind CSS (mobile-first)
- **Justification**: Rapid responsive development, utility-first approach
- **Dark Mode**: Built-in dark mode support

## Core Technologies
- **Language**: TypeScript (frontend and backend)
- **Build Tool**: Vite (fast HMR, TypeScript support out of box)
- **Package Manager**: npm

## UI Libraries
- **Canvas/SVG**: React + Canvas API for control overlay rendering
- **Touch Gestures**: Native touch events with multi-touch support
- **Drag & Drop**: Custom implementation with touch/mouse support
- **Icons**: Custom SVG icons from assets/icons/

## Data Management
- **State Management**: React Context API + useReducer
- **Frontend Storage**: LocalStorage for offline capability
- **Backend Storage**: MongoDB for cloud sync
- **Sync Strategy**: API calls with localStorage fallback
- **File Handling**: JSZip for generating skin files

## Authentication
- **WordPress Integration**: Simple JWT Login plugin (free)
- **Auth Method**: JWT tokens with email/password login
- **Token Storage**: LocalStorage with JWT decoding for user data
- **API Format**: WordPress REST API with ?rest_route= parameter
- **Backend Validation**: JWT token validation on all API endpoints

## Cloud Storage & Database
- **Image Storage**: Cloudflare R2 with Worker
- **Database**: DigitalOcean Managed MongoDB ($15/month)
- **Project Storage**: MongoDB with full orientation data
- **Folder Structure**: [userEmail]/[projectId]/[orientation].png
- **Benefits**: Cross-device sync, automatic backups, high availability

## Infrastructure
- **Hosting**: Vercel (single deployment for frontend + API)
- **Database**: DigitalOcean Managed MongoDB
- **CDN**: Vercel Edge Network + Cloudflare R2
- **SSL**: Automatic HTTPS via Vercel

## Development Tools
- **Version Control**: Git with GitHub
- **Testing**: Custom test scripts for API and DB
- **Linting**: ESLint + TypeScript strict mode
- **Development Server**: Vite with integrated API proxy
- **Deployment**: Vercel CLI

## Architecture Decisions
- **API-First Architecture**: Database-backed storage for all projects
- **Client-Side Processing**: JSON generation and file handling in browser
- **API Design**: RESTful endpoints with JWT authentication via Vercel Functions
- **Component Structure**: Modular components for reusability
- **Mobile-First**: Touch-optimized interactions, responsive design
- **Database Required**: MongoDB must be configured for project storage
- **No Local Storage**: Projects are only stored in the cloud database

## Production Stack Summary
- **Application**: React + TypeScript + Vite → Vercel
- **API**: Vercel Functions (integrated) → Same deployment
- **Database**: DigitalOcean Managed MongoDB
- **Images**: Cloudflare R2
- **Auth**: WordPress JWT
- **Total Cost**: ~$15/month (MongoDB only)