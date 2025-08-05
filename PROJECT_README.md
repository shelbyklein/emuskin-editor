# Emulator Skin Generator

A web application for creating custom emulator skin files (.deltaskin/.gammaskin) with visual control mapping.

## Features

- 🎮 Support for multiple console systems (GBC, GBA, NDS, NES, SNES, N64, Genesis, PS1)
- 📱 Device-specific layouts for all iPhone models
- 🎨 Visual drag-and-drop control positioning
- 🔄 Portrait and landscape orientation support
- 💾 Cloud sync across devices
- 🧪 Interactive skin testing mode
- 📤 Export as .deltaskin/.gammaskin files

## Quick Start

### Frontend Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### API Development

The app includes integrated API functions for cross-device synchronization:

```bash
# API functions are located in /api directory
# They run as Vercel Functions during deployment
# For local development, they're served alongside the frontend
```

## Deployment

### Vercel (Full-Stack)

1. Deploy to Vercel: `vercel`
2. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `ALLOWED_ORIGINS`: CORS allowed origins
   - Other frontend environment variables as needed

The API functions deploy automatically as Vercel Functions alongside the frontend.

## Architecture

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Local storage for offline use
- R2/Cloudflare for image storage

### API (Vercel Functions)
- Serverless functions in /api directory
- MongoDB for data persistence
- JWT authentication (WordPress integration)
- RESTful endpoints for CRUD operations

## Authentication

Uses WordPress JWT authentication via Simple JWT Login plugin:
- Users log in with Playcase.gg credentials
- JWT tokens validated by backend
- Projects tied to user email

## Project Structure

```
emuskin-generator/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── api/                   # Vercel Functions
│   ├── projects.js       # Projects CRUD endpoints
│   └── health.js         # Health check endpoint
├── assets/               # Static assets
└── claude_docs/          # Development documentation
```

## Environment Variables

### Frontend
- `VITE_WORDPRESS_URL`: WordPress site URL
- `VITE_R2_PUBLIC_URL`: R2 bucket URL
- `VITE_ENABLE_AUTH`: Enable authentication features
- `VITE_ENABLE_CLOUD_SYNC`: Enable cloud synchronization

### API (Vercel Functions)
- `MONGODB_URI`: MongoDB connection string
- `ALLOWED_ORIGINS`: Comma-separated CORS origins

## Cross-Device Sync

With the integrated API functions:
1. Projects automatically sync on login
2. All changes save to both local storage and cloud
3. Access your projects from any device
4. Offline changes sync when reconnected

## Contributing

1. Read documentation in `claude_docs/`
2. Follow existing code patterns
3. Test thoroughly before submitting PRs
4. Update documentation as needed

## License

This project is proprietary software. All rights reserved.