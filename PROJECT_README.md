# Emulator Skin Generator

A web application for creating custom emulator skin files (.deltaskin/.gammaskin) with visual control mapping.

## Features

- 🎮 Support for multiple console systems (GBC, GBA, NDS, NES, SNES, N64, Genesis, PS1)
- 📱 Device-specific layouts for all iPhone models
- 🎨 Visual drag-and-drop control positioning
- 🔄 Portrait and landscape orientation support
- 💾 Cloud sync across devices (when API is deployed)
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

### Backend API Setup

The app includes a backend API for cross-device synchronization:

```bash
# Navigate to API directory
cd api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string

# Run development server
npm run dev
```

## Deployment

### Frontend (Vercel)

1. Deploy to Vercel: `vercel`
2. Set environment variable: `VITE_API_URL=https://your-api-url.vercel.app`

### Backend API

See [api/README.md](api/README.md) for detailed deployment instructions:
- **Vercel**: Best for serverless deployment
- **Railway**: Includes MongoDB hosting
- **Render**: Free tier available

## Architecture

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Local storage for offline use
- R2/Cloudflare for image storage

### Backend API
- Express.js server
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
├── api/                   # Backend API
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Database models
│   │   └── routes/       # API routes
│   └── server.js         # Entry point
├── assets/               # Static assets
└── claude_docs/          # Development documentation
```

## Environment Variables

### Frontend
- `VITE_API_URL`: Backend API URL
- `VITE_WORDPRESS_URL`: WordPress site URL
- `VITE_R2_PUBLIC_URL`: R2 bucket URL

### Backend
- `MONGODB_URI`: MongoDB connection string
- `ALLOWED_ORIGINS`: Comma-separated CORS origins
- `PORT`: Server port (default: 3001)

## Cross-Device Sync

When the backend API is deployed and configured:
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