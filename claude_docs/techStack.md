# Tech Stack

## Frontend Framework
- **Chosen**: React with TypeScript
- **Justification**: Component flexibility for complex UI, strong TypeScript support, extensive ecosystem for touch/gesture libraries

## Backend API
- **Framework**: Express.js with Node.js 18+
- **Database**: MongoDB with Mongoose ODM
- **Hosting**: Vercel serverless functions
- **Security**: Helmet.js, CORS, express-rate-limit

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
- **Frontend Hosting**: Vercel (free tier)
- **API Hosting**: Vercel serverless (free tier)
- **Database**: DigitalOcean Managed MongoDB
- **CDN**: Vercel Edge Network + Cloudflare R2
- **SSL**: Automatic HTTPS via Vercel

## Development Tools
- **Version Control**: Git with GitHub
- **Testing**: Custom test scripts for API and DB
- **Linting**: ESLint + TypeScript strict mode
- **Development Server**: Vite (frontend) + Nodemon (backend)
- **Deployment**: Vercel CLI for both frontend and API

## Architecture Decisions
- **Hybrid Architecture**: Local-first with cloud sync
- **Client-Side Processing**: JSON generation and file handling in browser
- **API Design**: RESTful endpoints with JWT authentication
- **Component Structure**: Modular components for reusability
- **Mobile-First**: Touch-optimized interactions, responsive design
- **Offline Support**: Full functionality without internet, sync when online

## Production Stack Summary
- **Frontend**: React + TypeScript + Vite → Vercel
- **Backend**: Express + MongoDB → Vercel Serverless
- **Database**: DigitalOcean Managed MongoDB
- **Images**: Cloudflare R2
- **Auth**: WordPress JWT
- **Total Cost**: ~$15/month (MongoDB only)